import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WAVETILES_ROOT = process.env.WAVETILES_ROOT || path.join(PROJECT_ROOT, 'wavetiles');
const STATUS_ROOT =
  process.env.WAVE_PIPELINE_STATUS_ROOT ||
  path.join(WAVETILES_ROOT, '.normalized-product-stage', '.status');
const WW3_STATE_ROOT = process.env.WW3_STATE_ROOT || '/var/lib/wavelab-ww3';
const MODELS = ['WW3', 'ECWAM'];
const EXPECTED_FORECAST_HOURS = Array.from({ length: 21 }, (_, index) => index * 3);
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const TRANSIENT_STATES = new Set(['NORMALIZING', 'BUILDING', 'VALIDATING', 'PUBLISHING', 'FAILED']);

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

export function requiredSourceCycle(packageDate) {
  const [year, month, day] = packageDate.split('-').map(Number);
  const previousUtc = new Date(Date.UTC(year, month - 1, day - 1, 18, 0, 0));
  return `${previousUtc.getUTCFullYear()}${String(previousUtc.getUTCMonth() + 1).padStart(2, '0')}${String(previousUtc.getUTCDate()).padStart(2, '0')}18`;
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

function isCompleteMetadata(metadata, packageDate, sourceCycle) {
  if (!metadata) return false;
  if (metadata.packageDate !== packageDate || metadata.sourceCycle !== sourceCycle) return false;
  const hours = metadata.requiredForecastHours;
  return (
    Array.isArray(hours) &&
    hours.length === EXPECTED_FORECAST_HOURS.length &&
    hours.every((hour, index) => hour === EXPECTED_FORECAST_HOURS[index])
  );
}

async function publishedSnapshot(model, packageDate, sourceCycle) {
  const tag = packageTag(packageDate);
  const contourRoot = path.join(WAVETILES_ROOT, 'tiles', model, 'contours', tag);
  const metadata = await readJson(path.join(contourRoot, 'package.json'));
  if (!isCompleteMetadata(metadata, packageDate, sourceCycle)) return null;

  const inputMarker = await readText(path.join(contourRoot, '.product-input'));
  const ww3Marker = model === 'WW3' ? await readWw3Marker(packageDate) : null;
  const markerMatches =
    ww3Marker?.package_date === packageDate && ww3Marker?.source_cycle === sourceCycle;

  return {
    schemaVersion: 1,
    model,
    state: 'READY',
    message: 'Wave package is published and ready for Studio.',
    packageDate,
    packageTag: tag,
    requiredSourceCycle: sourceCycle,
    sourceCycle: metadata.sourceCycle,
    inputMode: inputMarker || (markerMatches ? ww3Marker.product_input || null : null),
    frameCount: EXPECTED_FORECAST_HOURS.length,
    expectedFrameCount: EXPECTED_FORECAST_HOURS.length,
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
        : EXPECTED_FORECAST_HOURS.length,
  };
}

async function readRuntimeSnapshot(model) {
  return readJson(path.join(STATUS_ROOT, `${model}.json`));
}

export async function getWavePipelineStatus(now = new Date()) {
  const packageDate = currentPackageDate(now);
  const sourceCycle = requiredSourceCycle(packageDate);

  const models = await Promise.all(
    MODELS.map(async (model) => {
      const runtime = await readRuntimeSnapshot(model);
      const runtimeMatchesToday =
        runtime?.packageDate === packageDate && runtime?.requiredSourceCycle === sourceCycle;

      if (runtimeMatchesToday && TRANSIENT_STATES.has(runtime.state)) {
        return runtime;
      }

      const published = await publishedSnapshot(model, packageDate, sourceCycle);
      if (published) {
        return {
          ...published,
          inputMode: published.inputMode || runtime?.inputMode || null,
          lastCheckAt: runtimeMatchesToday ? runtime?.lastCheckAt || null : null,
          completedAt:
            published.completedAt || (runtimeMatchesToday ? runtime?.completedAt || null : null),
        };
      }

      return {
        schemaVersion: 1,
        model,
        state: 'WAITING_FOR_SOURCE',
        message: 'Waiting for the required previous-day 18Z source cycle to become complete.',
        packageDate,
        requiredSourceCycle: sourceCycle,
        sourceCycle: null,
        inputMode: runtime?.inputMode || null,
        frameCount: 0,
        expectedFrameCount: EXPECTED_FORECAST_HOURS.length,
        published: false,
        lastCheckAt: runtimeMatchesToday ? runtime?.lastCheckAt || null : null,
      };
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    packageDate,
    models,
  };
}
