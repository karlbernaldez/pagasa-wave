import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_POLICY_PATH = path.join(
  PROJECT_ROOT,
  'wavetiles',
  '.runtime',
  'source-cycle-policy.json'
);

export const DEFAULT_SOURCE_CYCLE_HOUR_UTC = 18;
export const STANDARD_SOURCE_CYCLE_HOURS_UTC = [0, 6, 12, 18];
export const SOURCE_CYCLE_POLICY_PATH = path.resolve(
  process.env.WAVE_SOURCE_CYCLE_POLICY_PATH || DEFAULT_POLICY_PATH
);

const normalizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase();

const allowedHoursForModel = (code) =>
  ['WW3', 'ECWAM'].includes(code)
    ? STANDARD_SOURCE_CYCLE_HOURS_UTC
    : Array.from({ length: 24 }, (_, hour) => hour);

const assertHour = (code, value) => {
  const hour = Number(value);
  const allowedHoursUtc = allowedHoursForModel(code);
  if (!Number.isInteger(hour) || !allowedHoursUtc.includes(hour)) {
    const error = new Error(
      `${code} source cycle must be one of ${allowedHoursUtc.map((item) => `${String(item).padStart(2, '0')}Z`).join(', ')}.`
    );
    error.status = 400;
    throw error;
  }
  return hour;
};

async function readDocument() {
  try {
    const parsed = JSON.parse(await fs.readFile(SOURCE_CYCLE_POLICY_PATH, 'utf8'));
    if (!parsed || parsed.schemaVersion !== 1 || typeof parsed.models !== 'object') {
      throw new Error('Wave source cycle policy file has an unsupported format.');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { schemaVersion: 1, models: {} };
    }
    throw error;
  }
}

async function writeDocument(document) {
  const directory = path.dirname(SOURCE_CYCLE_POLICY_PATH);
  await fs.mkdir(directory, { recursive: true });
  const temp = path.join(
    directory,
    `.${path.basename(SOURCE_CYCLE_POLICY_PATH)}.${process.pid}.${Date.now()}.tmp`
  );
  const payload = `${JSON.stringify(document, null, 2)}\n`;
  try {
    await fs.writeFile(temp, payload, { encoding: 'utf8', mode: 0o640 });
    await fs.rename(temp, SOURCE_CYCLE_POLICY_PATH);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

export async function getWaveSourceCyclePolicy(rawCode) {
  const code = normalizeCode(rawCode);
  const document = await readDocument();
  const configured = document.models?.[code]?.preferredHourUtc;
  const allowedHoursUtc = allowedHoursForModel(code);
  const preferredHourUtc =
    Number.isInteger(configured) && allowedHoursUtc.includes(configured)
      ? configured
      : DEFAULT_SOURCE_CYCLE_HOUR_UTC;

  return {
    preferredHourUtc,
    allowedHoursUtc: [...allowedHoursUtc],
    fallbackEnabled: false,
  };
}

export async function setWaveSourceCycleHour(rawCode, value) {
  const code = normalizeCode(rawCode);
  const preferredHourUtc = assertHour(code, value);
  const document = await readDocument();
  const next = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    models: {
      ...document.models,
      [code]: { preferredHourUtc },
    },
  };
  await writeDocument(next);
  return getWaveSourceCyclePolicy(code);
}
