import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const WAVETILES_ROOT = process.env.WAVETILES_ROOT || path.join(REPO_ROOT, 'wavetiles');
const ECWAM_OUTPUT_ROOT =
  process.env.ECWAM_OUTPUT_ROOT || path.join(WAVETILES_ROOT, 'tiles', 'ECWAM');
const ECWAM_INPUT_ROOT = process.env.ECWAM_INPUT_ROOT || '/home/darwin/ecmwf/ecwam';
const ECWAM_PYTHON =
  process.env.ECWAM_PYTHON || path.join(WAVETILES_ROOT, '.venv', 'bin', 'python');
const FRAME_BUILDER = path.join(WAVETILES_ROOT, 'scripts', 'build_ecwam_frame.sh');
const MAX_CONCURRENT_BUILDS = Math.max(
  1,
  Number.parseInt(process.env.ECWAM_FRAME_MAX_CONCURRENT || '1', 10) || 1
);
const FAILURE_TTL_MS = 15 * 60 * 1000;

const activeBuilds = new Map();
const recentFailures = new Map();

const MONTH_TOKENS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function parsePackageDate(packageDate) {
  const match = String(packageDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function validateFrameRequest(packageDate, forecastHour) {
  const date = parsePackageDate(packageDate);
  const hour = Number(forecastHour);

  if (!date) {
    return { valid: false, message: 'packageDate must use YYYY-MM-DD and be a valid date.' };
  }

  if (!Number.isInteger(hour) || hour < 0 || hour > 60 || hour % 3 !== 0) {
    return {
      valid: false,
      message: 'forecastHour must be from 0 through 60 in 3-hour increments.',
    };
  }

  return { valid: true, date, forecastHour: hour };
}

function packageTag(date) {
  return `${date.getUTCFullYear()}${MONTH_TOKENS[date.getUTCMonth()]}${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;
}

function runTag(date, forecastHour) {
  const validTime = new Date(date.getTime() + forecastHour * 60 * 60 * 1000);
  return [
    validTime.getUTCFullYear(),
    String(validTime.getUTCMonth() + 1).padStart(2, '0'),
    String(validTime.getUTCDate()).padStart(2, '0'),
    String(validTime.getUTCHours()).padStart(2, '0'),
  ].join('');
}

function fileIsNonEmpty(target) {
  try {
    return fs.statSync(target).isFile() && fs.statSync(target).size > 0;
  } catch {
    return false;
  }
}

function readPackageMetadata(tag) {
  const metadataPath = path.join(ECWAM_OUTPUT_ROOT, 'contours', tag, 'package.json');
  if (!fileIsNonEmpty(metadataPath)) return null;

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (!/^\d{10}$/.test(String(metadata?.sourceCycle || ''))) return null;
    return metadata;
  } catch {
    return null;
  }
}

function frameKey(packageDate, forecastHour) {
  return `${packageDate}:${forecastHour}`;
}

function framePaths(tag, validRunTag) {
  return {
    contour: path.join(ECWAM_OUTPUT_ROOT, 'contours', tag, validRunTag, 'contours.geojson'),
    lightLegend: path.join(ECWAM_OUTPUT_ROOT, 'light', tag, validRunTag, 'legend.json'),
    darkLegend: path.join(ECWAM_OUTPUT_ROOT, 'dark', tag, validRunTag, 'legend.json'),
  };
}

function isFrameReady(tag, validRunTag) {
  const targets = framePaths(tag, validRunTag);
  return (
    fileIsNonEmpty(targets.contour) &&
    fileIsNonEmpty(targets.lightLegend) &&
    fileIsNonEmpty(targets.darkLegend)
  );
}

function pruneFailures() {
  const now = Date.now();
  for (const [key, failure] of recentFailures.entries()) {
    if (now - failure.failedAtMs > FAILURE_TTL_MS) recentFailures.delete(key);
  }
}

export function getEcwamFrameStatus(packageDate, forecastHour) {
  const validation = validateFrameRequest(packageDate, forecastHour);
  if (!validation.valid) {
    return { state: 'invalid', message: validation.message };
  }

  pruneFailures();

  const tag = packageTag(validation.date);
  const validRunTag = runTag(validation.date, validation.forecastHour);
  const key = frameKey(packageDate, validation.forecastHour);

  if (isFrameReady(tag, validRunTag)) {
    recentFailures.delete(key);
    return {
      state: 'ready',
      packageDate,
      forecastHour: validation.forecastHour,
      packageTag: tag,
      runTag: validRunTag,
    };
  }

  const active = activeBuilds.get(key);
  if (active) {
    return {
      state: 'building',
      packageDate,
      forecastHour: validation.forecastHour,
      packageTag: tag,
      runTag: validRunTag,
      startedAt: active.startedAt,
    };
  }

  const metadata = readPackageMetadata(tag);
  if (!metadata) {
    return {
      state: 'unavailable',
      packageDate,
      forecastHour: validation.forecastHour,
      packageTag: tag,
      runTag: validRunTag,
      message: 'ECWAM package metadata is not available yet.',
    };
  }

  const failure = recentFailures.get(key);
  if (failure) {
    return {
      state: 'failed',
      packageDate,
      forecastHour: validation.forecastHour,
      packageTag: tag,
      runTag: validRunTag,
      sourceCycle: metadata.sourceCycle,
      failedAt: failure.failedAt,
      message: failure.message,
    };
  }

  return {
    state: 'available',
    packageDate,
    forecastHour: validation.forecastHour,
    packageTag: tag,
    runTag: validRunTag,
    sourceCycle: metadata.sourceCycle,
  };
}

function logChildStream(stream, level, context) {
  let pending = '';
  stream?.setEncoding('utf8');
  stream?.on('data', (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) logger[level](line.trim(), context);
    }
  });
  stream?.on('end', () => {
    if (pending.trim()) logger[level](pending.trim(), context);
  });
}

export function startEcwamFrameBuild(packageDate, forecastHour, requestedBy = null) {
  const status = getEcwamFrameStatus(packageDate, forecastHour);

  if (status.state === 'invalid' || status.state === 'unavailable') return status;
  if (status.state === 'ready' || status.state === 'building') return status;

  if (activeBuilds.size >= MAX_CONCURRENT_BUILDS) {
    const active = [...activeBuilds.values()][0];
    return {
      ...status,
      state: 'busy',
      message: 'Another ECWAM frame is currently being generated. Try again after it finishes.',
      activeFrame: active
        ? { packageDate: active.packageDate, forecastHour: active.forecastHour }
        : undefined,
    };
  }

  const metadata = readPackageMetadata(status.packageTag);
  if (!metadata) {
    return {
      ...status,
      state: 'unavailable',
      message: 'ECWAM package metadata is not available yet.',
    };
  }

  if (!fs.existsSync(FRAME_BUILDER) || !fs.existsSync(ECWAM_PYTHON)) {
    return {
      ...status,
      state: 'failed',
      message: 'ECWAM frame builder runtime is not available on this server.',
    };
  }

  const key = frameKey(packageDate, Number(forecastHour));
  recentFailures.delete(key);

  const args = [
    FRAME_BUILDER,
    packageDate,
    String(forecastHour),
    String(metadata.variable || process.env.ECWAM_VAR || 'swh'),
    String(metadata.sigma ?? process.env.ECWAM_SIGMA ?? '1.5'),
    '--source-cycle',
    String(metadata.sourceCycle),
  ];

  const context = {
    packageDate,
    forecastHour: Number(forecastHour),
    sourceCycle: metadata.sourceCycle,
    requestedBy: requestedBy ? String(requestedBy) : undefined,
  };

  const child = spawn('/usr/bin/bash', args, {
    cwd: WAVETILES_ROOT,
    env: {
      ...process.env,
      ECWAM_INPUT_ROOT,
      ECWAM_OUTPUT_ROOT,
      ECWAM_PYTHON,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const startedAt = new Date().toISOString();
  activeBuilds.set(key, {
    child,
    packageDate,
    forecastHour: Number(forecastHour),
    startedAt,
  });

  logger.info('ECWAM on-demand frame build started', context);
  logChildStream(child.stdout, 'info', context);
  logChildStream(child.stderr, 'warn', context);

  child.once('error', (error) => {
    activeBuilds.delete(key);
    recentFailures.set(key, {
      failedAt: new Date().toISOString(),
      failedAtMs: Date.now(),
      message: error.message || 'ECWAM frame builder failed to start.',
    });
    logger.error('ECWAM on-demand frame builder process error', {
      ...context,
      message: error.message,
      stack: error.stack,
    });
  });

  child.once('close', (code, signal) => {
    activeBuilds.delete(key);

    if (code === 0 && isFrameReady(status.packageTag, status.runTag)) {
      recentFailures.delete(key);
      logger.info('ECWAM on-demand frame build completed', context);
      return;
    }

    const message = `ECWAM frame build exited with code ${code ?? 'unknown'}${
      signal ? ` (${signal})` : ''
    }.`;
    recentFailures.set(key, {
      failedAt: new Date().toISOString(),
      failedAtMs: Date.now(),
      message,
    });
    logger.error('ECWAM on-demand frame build failed', {
      ...context,
      exitCode: code,
      signal,
    });
  });

  return {
    state: 'building',
    packageDate,
    forecastHour: Number(forecastHour),
    packageTag: status.packageTag,
    runTag: status.runTag,
    startedAt,
    sourceCycle: metadata.sourceCycle,
  };
}
