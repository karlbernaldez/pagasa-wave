import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { DEFAULT_WAVE_MODEL_SCHEDULE, normalizeWaveModelSchedule } from './waveModelSchedule.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const APP_ROOT = path.resolve(process.env.WAVELAB_APP_ROOT || REPO_ROOT);
const TILES_ROOT = path.resolve(
  process.env.WAVELAB_WAVE_TILES_ROOT || path.join(APP_ROOT, 'wavetiles', 'tiles')
);
const TRIGGER_ROOT = path.resolve(
  process.env.WAVELAB_WAVE_OPS_TRIGGER_ROOT || path.join(APP_ROOT, 'backend', 'tmp', 'wave-ops')
);

const SYSTEMCTL = process.env.WAVELAB_SYSTEMCTL_BIN || '/usr/bin/systemctl';
const DU = process.env.WAVELAB_DU_BIN || '/usr/bin/du';
const SUDO = process.env.WAVELAB_SUDO_BIN || '/usr/bin/sudo';
const OPERATIONS_HELPER =
  process.env.WAVELAB_WAVE_OPS_HELPER || '/usr/local/sbin/wavelab-wave-model-ops';
const CACHE_TTL_MS = 5_000;
const MANUAL_TRIGGER_COOLDOWN_MS = 60_000;

const OPERATIONAL_MODELS = {
  WW3: {
    serviceUnit: 'wavelab-ww3-package-builder.service',
    timerUnit: 'wavelab-ww3-package-builder.timer',
    pathUnit: 'wavelab-ww3-manual-build.path',
    triggerFile: 'ww3.trigger',
  },
  ECWAM: {
    serviceUnit: 'wavelab-ecwam-package-builder.service',
    timerUnit: 'wavelab-ecwam-package-builder.timer',
    pathUnit: 'wavelab-ecwam-manual-build.path',
    triggerFile: 'ecwam.trigger',
  },
};

const cache = new Map();

const normalizeModelCode = (rawModelCode) =>
  String(rawModelCode || '')
    .trim()
    .toUpperCase();

const requireOperationalModel = (rawModelCode) => {
  const modelCode = normalizeModelCode(rawModelCode);
  const config = OPERATIONAL_MODELS[modelCode];
  if (!config) {
    const error = new Error(
      `No operational builder is configured for ${modelCode || 'this model'}.`
    );
    error.status = 409;
    throw error;
  }
  return { modelCode, config };
};

const parseProperties = (stdout = '') =>
  Object.fromEntries(
    stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf('=');
        return separator === -1
          ? [line, '']
          : [line.slice(0, separator), line.slice(separator + 1)];
      })
  );

const readUnit = async (unit, properties) => {
  try {
    const { stdout } = await execFileAsync(
      SYSTEMCTL,
      ['show', unit, '--no-pager', `--property=${properties.join(',')}`],
      { timeout: 3_000, maxBuffer: 64 * 1024 }
    );
    return parseProperties(stdout);
  } catch (error) {
    return {
      LoadState: 'not-found',
      ActiveState: 'inactive',
      SubState: 'dead',
      Result: 'unknown',
      _error: error?.message || 'Unable to query systemd unit.',
    };
  }
};

const runOperationsHelper = async (action, modelCode, payload = null) => {
  const args = ['-n', OPERATIONS_HELPER, action, modelCode];
  if (payload != null) args.push(JSON.stringify(payload));
  try {
    const { stdout } = await execFileAsync(SUDO, args, {
      timeout: 10_000,
      maxBuffer: 64 * 1024,
    });
    return stdout.trim() ? JSON.parse(stdout.trim()) : {};
  } catch (error) {
    const wrapped = new Error(
      error?.stderr?.trim() || error?.message || 'Wave model operations helper failed.'
    );
    wrapped.status = 503;
    throw wrapped;
  }
};

const readScheduleState = async (modelCode) => {
  try {
    const result = await runOperationsHelper('status', modelCode);
    return {
      available: true,
      managed: Boolean(result.managed),
      schedule: result.schedule || DEFAULT_WAVE_MODEL_SCHEDULE,
    };
  } catch (error) {
    return {
      available: false,
      managed: false,
      schedule: DEFAULT_WAVE_MODEL_SCHEDULE,
      error: error.message,
    };
  }
};

const toInteger = (value) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const durationSeconds = (startValue, exitValue) => {
  const start = toInteger(startValue);
  const end = toInteger(exitValue);
  if (!start || !end || end < start) return null;
  return Math.round(((end - start) / 1_000_000) * 10) / 10;
};

const readDiskBytes = async (modelCode) => {
  const modelRoot = path.join(TILES_ROOT, modelCode);
  try {
    await fs.access(modelRoot);
    const { stdout } = await execFileAsync(DU, ['-sb', '--', modelRoot], {
      timeout: 8_000,
      maxBuffer: 64 * 1024,
    });
    const bytes = Number.parseInt(stdout.trim().split(/\s+/)[0], 10);
    return Number.isFinite(bytes) ? bytes : null;
  } catch {
    return null;
  }
};

const readLatestPackageMetadata = async (modelCode, packageTag) => {
  if (!packageTag) return { sourceCycle: null, packageBuiltAt: null };
  const metadataPath = path.join(TILES_ROOT, modelCode, 'contours', packageTag, 'package.json');
  try {
    const [raw, stat] = await Promise.all([
      fs.readFile(metadataPath, 'utf8'),
      fs.stat(metadataPath),
    ]);
    const metadata = JSON.parse(raw);
    return {
      sourceCycle: String(metadata?.sourceCycle || '') || null,
      packageBuiltAt: stat.mtime.toISOString(),
    };
  } catch {
    return { sourceCycle: null, packageBuiltAt: null };
  }
};

const buildLastError = (service) => {
  if (service.LoadState !== 'loaded') return 'Builder service is not installed.';
  if (service.ActiveState === 'failed') {
    return `Builder service is failed${service.Result ? ` (${service.Result})` : ''}.`;
  }
  const exitStatus = toInteger(service.ExecMainStatus);
  if (service.Result && !['success', ''].includes(service.Result)) {
    return `Last builder run result: ${service.Result}${exitStatus ? ` (exit ${exitStatus})` : ''}.`;
  }
  if (exitStatus !== 0) return `Last builder run exited with status ${exitStatus}.`;
  return null;
};

const isBuilderRunning = (service) =>
  service.ActiveState === 'active' || service.ActiveState === 'activating';

const getUncachedOperations = async (modelCode, latestPackage) => {
  const config = OPERATIONAL_MODELS[modelCode];
  if (!config) {
    return {
      supported: false,
      service: null,
      timer: null,
      schedule: null,
      manualRun: { available: false, reason: 'No operational builder is configured.' },
      sourceCycle: null,
      packageBuiltAt: null,
      diskBytes: null,
      lastError: null,
    };
  }

  const [service, timer, pathUnit, diskBytes, metadata, scheduleState] = await Promise.all([
    readUnit(config.serviceUnit, [
      'LoadState',
      'ActiveState',
      'SubState',
      'Result',
      'ExecMainStatus',
      'ExecMainStartTimestamp',
      'ExecMainExitTimestamp',
      'ExecMainStartTimestampMonotonic',
      'ExecMainExitTimestampMonotonic',
    ]),
    readUnit(config.timerUnit, [
      'LoadState',
      'ActiveState',
      'SubState',
      'UnitFileState',
      'LastTriggerUSec',
      'NextElapseUSecRealtime',
    ]),
    readUnit(config.pathUnit, ['LoadState', 'ActiveState', 'SubState']),
    readDiskBytes(modelCode),
    readLatestPackageMetadata(modelCode, latestPackage),
    readScheduleState(modelCode),
  ]);

  const serviceLoaded = service.LoadState === 'loaded';
  const timerLoaded = timer.LoadState === 'loaded';
  const pathLoaded = pathUnit.LoadState === 'loaded';
  const pathActive = pathUnit.ActiveState === 'active';
  const running = isBuilderRunning(service);

  return {
    supported: true,
    service: {
      installed: serviceLoaded,
      activeState: service.ActiveState || 'unknown',
      subState: service.SubState || 'unknown',
      running,
      result: service.Result || null,
      exitStatus: service.ExecMainStatus ? toInteger(service.ExecMainStatus) : null,
      lastStartedAt: service.ExecMainStartTimestamp || null,
      lastFinishedAt: service.ExecMainExitTimestamp || null,
      lastDurationSeconds: durationSeconds(
        service.ExecMainStartTimestampMonotonic,
        service.ExecMainExitTimestampMonotonic
      ),
    },
    timer: {
      installed: timerLoaded,
      active: timer.ActiveState === 'active',
      enabled: timer.UnitFileState === 'enabled',
      activeState: timer.ActiveState || 'unknown',
      subState: timer.SubState || 'unknown',
      lastTrigger: timer.LastTriggerUSec || null,
      nextRun: timer.NextElapseUSecRealtime || null,
    },
    schedule: scheduleState,
    manualRun: {
      available: pathLoaded && pathActive && !running,
      reason: !pathLoaded
        ? 'Manual-run trigger is not installed.'
        : !pathActive
          ? 'Manual-run trigger is not active.'
          : running
            ? 'Builder is already running.'
            : null,
    },
    sourceCycle: metadata.sourceCycle,
    packageBuiltAt: metadata.packageBuiltAt,
    diskBytes,
    lastError: buildLastError(service),
  };
};

export const getWaveModelOperations = async (modelCode, latestPackage = null) => {
  const key = `${modelCode}:${latestPackage || ''}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await getUncachedOperations(modelCode, latestPackage);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
};

export const setWaveModelSchedule = async (rawModelCode, rawSchedule) => {
  const { modelCode } = requireOperationalModel(rawModelCode);
  const schedule = normalizeWaveModelSchedule(rawSchedule);
  const result = await runOperationsHelper('set-schedule', modelCode, schedule);
  cache.clear();
  return { modelCode, schedule: result.schedule || schedule, managed: true };
};

export const setWaveModelScheduleEnabled = async (rawModelCode, enabled) => {
  const { modelCode } = requireOperationalModel(rawModelCode);
  if (typeof enabled !== 'boolean') {
    const error = new Error('enabled must be a boolean.');
    error.status = 400;
    throw error;
  }
  await runOperationsHelper(enabled ? 'enable' : 'disable', modelCode);
  cache.clear();
  return { modelCode, enabled };
};

export const restoreWaveModelSchedule = async (rawModelCode) => {
  const { modelCode } = requireOperationalModel(rawModelCode);
  const result = await runOperationsHelper('restore-schedule', modelCode);
  cache.clear();
  return {
    modelCode,
    managed: false,
    schedule: result.schedule || DEFAULT_WAVE_MODEL_SCHEDULE,
  };
};

export const triggerWaveModelBuilder = async (rawModelCode) => {
  const { modelCode, config } = requireOperationalModel(rawModelCode);
  const operations = await getUncachedOperations(modelCode, null);
  if (!operations.service?.installed) {
    const error = new Error(`${modelCode} builder service is not installed.`);
    error.status = 503;
    throw error;
  }
  if (operations.service.running) {
    const error = new Error(`${modelCode} builder is already running.`);
    error.status = 409;
    throw error;
  }
  if (!operations.manualRun.available) {
    const error = new Error(
      operations.manualRun.reason || 'Manual builder trigger is unavailable.'
    );
    error.status = 503;
    throw error;
  }

  await fs.mkdir(TRIGGER_ROOT, { recursive: true });
  const triggerPath = path.join(TRIGGER_ROOT, config.triggerFile);

  try {
    const stat = await fs.stat(triggerPath);
    if (Date.now() - stat.mtimeMs < MANUAL_TRIGGER_COOLDOWN_MS) {
      const error = new Error(
        `${modelCode} manual builder trigger was requested recently. Wait one minute before trying again.`
      );
      error.status = 429;
      throw error;
    }
  } catch (error) {
    if (error?.status) throw error;
    if (error?.code !== 'ENOENT') throw error;
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const requestedAt = new Date().toISOString();
  await fs.writeFile(
    triggerPath,
    `${JSON.stringify({ requestId, modelCode, requestedAt })}\n`,
    { mode: 0o640 }
  );

  cache.clear();
  return { modelCode, requestId, requestedAt };
};
