import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_SOURCE_CYCLE_DATE_MODE,
  getWaveSourceCyclePolicy,
} from './waveSourceCyclePolicy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WAVETILES_ROOT = process.env.WAVETILES_ROOT || path.join(PROJECT_ROOT, 'wavetiles');
const STATUS_ROOT =
  process.env.WAVE_PIPELINE_STATUS_ROOT ||
  path.join(WAVETILES_ROOT, '.normalized-product-stage', '.status');
const WW3_STATE_ROOT = process.env.WW3_STATE_ROOT || '/var/lib/wavelab-ww3';
const DEFAULT_FORECAST_CADENCE_HOURS = 3;
const DEFAULT_MAX_FORECAST_HOUR = 60;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const TRANSIENT_STATES = new Set([
  'READY_TO_BUILD',
  'NORMALIZING',
  'BUILDING',
  'VALIDATING',
  'PUBLISHING',
  'FAILED',
]);

function manilaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function currentPackageDate(now = new Date()) {
  const { year, month, day } = manilaParts(now);
  return `${year}-${month}-${day}`;
}

export function packageTag(packageDate) {
  const [year, month, day] = packageDate.split('-').map(Number);
  return `${year}${MONTHS[month - 1]}${String(day).padStart(2, '0')}`;
}

export function requiredSourceCycle(
  packageDate,
  preferredHourUtc = 18,
  cycleDateMode = DEFAULT_SOURCE_CYCLE_DATE_MODE
) {
  const [year, month, day] = packageDate.split('-').map(Number);
  const dayOffset =
    cycleDateMode === 'same_day'
      ? 0
      : cycleDateMode === 'previous_day'
        ? -1
        : preferredHourUtc === 0
          ? 0
          : -1;
  const cycleUtc = new Date(Date.UTC(year, month - 1, day + dayOffset, preferredHourUtc, 0, 0));
  return `${cycleUtc.getUTCFullYear()}${String(cycleUtc.getUTCMonth() + 1).padStart(2, '0')}${String(cycleUtc.getUTCDate()).padStart(2, '0')}${String(preferredHourUtc).padStart(2, '0')}`;
}

function expectedForecastHours(model) {
  const cadence = Number(model?.runtimeProfile?.forecastCadenceHours);
  const maxHour = Number(model?.runtimeProfile?.maxForecastHour);
  const forecastCadenceHours =
    Number.isInteger(cadence) && cadence > 0 ? cadence : DEFAULT_FORECAST_CADENCE_HOURS;
  const maxForecastHour =
    Number.isInteger(maxHour) && maxHour >= 0 ? maxHour : DEFAULT_MAX_FORECAST_HOUR;

  return Array.from(
    { length: Math.floor(maxForecastHour / forecastCadenceHours) + 1 },
    (_, index) => index * forecastCadenceHours
  );
}

async function listOperationalModels() {
  const [{ default: WaveModel }, { ensureDefaultWaveModels }] = await Promise.all([
    import('../models/WaveModel.js'),
    import('./waveModelService.js'),
  ]);

  await ensureDefaultWaveModels();
  return WaveModel.find({
    enabled: true,
    $or: [{ builderConfigured: true }, { runtimeProfile: { $ne: null } }],
  })
    .sort({ builtIn: -1, code: 1 })
    .lean();
}

async function readJson(target) {
  try {
    return JSON.parse(await fs.readFile(target, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function readText(target) {
  try {
    return (await fs.readFile(target, 'utf8')).trim();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES') return null;
    throw error;
  }
}

function parseKeyValueDocument(value) {
  if (!value) return null;
  const document = {};
  for (const line of value.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    document[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return document;
}

async function readWw3Marker(packageDate) {
  const raw = await readText(path.join(WW3_STATE_ROOT, 'built', packageDate));
  return parseKeyValueDocument(raw);
}

function isCompleteMetadata(metadata, packageDate, sourceCycle, requiredHours) {
  if (!metadata) return false;
  if (metadata.packageDate !== packageDate || metadata.sourceCycle !== sourceCycle) return false;
  const hours = metadata.requiredForecastHours;
  return (
    Array.isArray(hours) &&
    hours.length === requiredHours.length &&
    hours.every((hour, index) => hour === requiredHours[index])
  );
}

async function publishedSnapshot(model, packageDate, sourceCycle, requiredHours) {
  const code = model.code;
  const tag = packageTag(packageDate);
  const contourRoot = path.join(WAVETILES_ROOT, 'tiles', code, 'contours', tag);
  const metadata = await readJson(path.join(contourRoot, 'package.json'));
  if (!isCompleteMetadata(metadata, packageDate, sourceCycle, requiredHours)) return null;

  const inputMarker = await readText(path.join(contourRoot, '.product-input'));
  const ww3Marker = code === 'WW3' ? await readWw3Marker(packageDate) : null;
  const markerMatches =
    ww3Marker?.package_date === packageDate && ww3Marker?.source_cycle === sourceCycle;

  return {
    schemaVersion: 2,
    model: code,
    modelId: model._id,
    modelLabel: model.label || code,
    state: 'READY',
    message: 'Wave package is published and ready for Studio.',
    packageDate,
    packageTag: tag,
    requiredSourceCycle: sourceCycle,
    sourceCycle: metadata.sourceCycle,
    inputMode: inputMarker || (markerMatches ? ww3Marker.product_input || null : null),
    frameCount: requiredHours.length,
    expectedFrameCount: requiredHours.length,
    published: true,
    lastCheckAt: null,
    completedAt: markerMatches ? ww3Marker.built_utc || null : null,
    pngCount:
      markerMatches && Number.isFinite(Number(ww3Marker.png_count))
        ? Number(ww3Marker.png_count)
        : null,
    contourCount:
      markerMatches && Number.isFinite(Number(ww3Marker.contour_count))
        ? Number(ww3Marker.contour_count)
        : requiredHours.length,
  };
}

async function readRuntimeSnapshot(code) {
  return readJson(path.join(STATUS_ROOT, `${code}.json`));
}

export async function getWavePipelineStatus(now = new Date()) {
  const packageDate = currentPackageDate(now);
  const operationalModels = await listOperationalModels();

  const models = await Promise.all(
    operationalModels.map(async (model) => {
      const code = model.code;
      const requiredHours = expectedForecastHours(model);
      const policy = await getWaveSourceCyclePolicy(code);
      const sourceCycle = requiredSourceCycle(
        packageDate,
        policy.preferredHourUtc,
        policy.cycleDateMode
      );
      const runtime = await readRuntimeSnapshot(code);
      const runtimeMatchesToday =
        runtime?.packageDate === packageDate && runtime?.requiredSourceCycle === sourceCycle;

      if (runtimeMatchesToday && TRANSIENT_STATES.has(runtime.state)) {
        return {
          ...runtime,
          schemaVersion: 2,
          model: code,
          modelId: model._id,
          modelLabel: model.label || code,
          expectedFrameCount: runtime.expectedFrameCount || requiredHours.length,
          preferredSourceCycleHourUtc: policy.preferredHourUtc,
          sourceCycleDateMode: policy.cycleDateMode,
        };
      }

      const published = await publishedSnapshot(model, packageDate, sourceCycle, requiredHours);
      if (published) {
        return {
          ...published,
          preferredSourceCycleHourUtc: policy.preferredHourUtc,
          sourceCycleDateMode: policy.cycleDateMode,
          inputMode: published.inputMode || runtime?.inputMode || null,
          lastCheckAt: runtimeMatchesToday ? runtime?.lastCheckAt || null : null,
          completedAt:
            published.completedAt || (runtimeMatchesToday ? runtime?.completedAt || null : null),
        };
      }

      return {
        schemaVersion: 2,
        model: code,
        modelId: model._id,
        modelLabel: model.label || code,
        state: 'WAITING_FOR_SOURCE',
        message: `Waiting for the configured ${String(policy.preferredHourUtc).padStart(2, '0')}Z source cycle to become complete.`,
        packageDate,
        preferredSourceCycleHourUtc: policy.preferredHourUtc,
        sourceCycleDateMode: policy.cycleDateMode,
        requiredSourceCycle: sourceCycle,
        sourceCycle: null,
        inputMode: runtime?.inputMode || null,
        frameCount: 0,
        expectedFrameCount: requiredHours.length,
        published: false,
        lastCheckAt: runtimeMatchesToday ? runtime?.lastCheckAt || null : null,
      };
    })
  );

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    packageDate,
    models,
  };
}
