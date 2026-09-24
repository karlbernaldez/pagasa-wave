import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WAVETILES_ROOT = process.env.WAVETILES_ROOT || path.join(PROJECT_ROOT, 'wavetiles');
const HISTORY_ROOT =
  process.env.WAVE_PIPELINE_HISTORY_ROOT ||
  path.join(WAVETILES_ROOT, '.normalized-product-stage', '.history');

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const percentile = (values, ratio) => {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const rank = (clean.length - 1) * ratio;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return clean[lower];
  return clean[lower] + (clean[upper] - clean[lower]) * (rank - lower);
};

const manilaDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const inRange = (value, range) => {
  const time = new Date(value).getTime();
  return (
    Number.isFinite(time) &&
    time >= range.startAt.getTime() &&
    time < range.endExclusive.getTime()
  );
};

const parseHistoryLine = (line, filename) => {
  if (!line.trim()) return null;
  try {
    const row = JSON.parse(line);
    if (row?.eventType !== 'pipeline_run' || !row?.runId || !row?.model || !row?.outcome) {
      return null;
    }
    return row;
  } catch {
    return {
      invalid: true,
      source: filename,
    };
  }
};

export async function readWavePipelineRunHistory(range, { historyRoot = HISTORY_ROOT } = {}) {
  let entries;
  try {
    entries = await fs.readdir(historyRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        available: true,
        collectingSince: null,
        runs: [],
        invalidRecords: 0,
      };
    }
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map((entry) => entry.name)
    .sort();

  const rows = [];
  let invalidRecords = 0;
  let collectingSince = null;

  for (const filename of files) {
    const target = path.join(historyRoot, filename);
    const raw = await fs.readFile(target, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const parsed = parseHistoryLine(line, filename);
      if (!parsed) continue;
      if (parsed.invalid) {
        invalidRecords += 1;
        continue;
      }

      const eventAt = parsed.completedAt || parsed.recordedAt;
      const eventMs = new Date(eventAt).getTime();
      if (Number.isFinite(eventMs)) {
        if (!collectingSince || eventMs < new Date(collectingSince).getTime()) {
          collectingSince = eventAt;
        }
      }
      if (!inRange(eventAt, range)) continue;

      rows.push({
        runId: String(parsed.runId),
        model: String(parsed.model),
        outcome: String(parsed.outcome),
        packageDate: parsed.packageDate || null,
        packageTag: parsed.packageTag || null,
        requiredSourceCycle: parsed.requiredSourceCycle || null,
        sourceCycle: parsed.sourceCycle || null,
        inputMode: parsed.inputMode || null,
        frameCount: Number(parsed.frameCount) || 0,
        expectedFrameCount: Number(parsed.expectedFrameCount) || 0,
        published: Boolean(parsed.published),
        startedAt: parsed.startedAt || null,
        completedAt: parsed.completedAt || null,
        recordedAt: parsed.recordedAt || null,
        eventAt,
        durationSeconds:
          parsed.durationSeconds == null || !Number.isFinite(Number(parsed.durationSeconds))
            ? null
            : Number(parsed.durationSeconds),
        error: parsed.error || null,
      });
    }
  }

  rows.sort((a, b) => new Date(b.eventAt) - new Date(a.eventAt));
  return { available: true, collectingSince, runs: rows, invalidRecords };
}

export function summarizeWavePipelineRunHistory(history = {}) {
  const runs = history.runs || [];
  const successes = runs.filter((run) => run.outcome === 'READY');
  const failures = runs.filter((run) => run.outcome === 'FAILED');
  const durations = runs.map((run) => run.durationSeconds).filter(Number.isFinite);
  const groups = new Map();
  const daily = new Map();
  const modelMap = new Map();

  for (const run of runs) {
    const attemptKey = [
      run.model,
      run.packageDate || '',
      run.requiredSourceCycle || run.sourceCycle || '',
    ].join(':');
    groups.set(attemptKey, (groups.get(attemptKey) || 0) + 1);

    const day = manilaDateKey(run.eventAt);
    if (day) {
      const point = daily.get(day) || { date: day, successful: 0, failed: 0, runs: 0 };
      point.runs += 1;
      if (run.outcome === 'READY') point.successful += 1;
      if (run.outcome === 'FAILED') point.failed += 1;
      daily.set(day, point);
    }

    const model = modelMap.get(run.model) || {
      model: run.model,
      runs: 0,
      successful: 0,
      failed: 0,
      retryAttempts: 0,
      durations: [],
    };
    model.runs += 1;
    if (run.outcome === 'READY') model.successful += 1;
    if (run.outcome === 'FAILED') model.failed += 1;
    if (Number.isFinite(run.durationSeconds)) model.durations.push(run.durationSeconds);
    modelMap.set(run.model, model);
  }

  let retryAttempts = 0;
  for (const [attemptKey, attempts] of groups.entries()) {
    const retries = Math.max(0, attempts - 1);
    retryAttempts += retries;
    if (!retries) continue;
    const modelCode = attemptKey.split(':', 1)[0];
    const model = modelMap.get(modelCode);
    if (model) model.retryAttempts += retries;
  }

  return {
    available: history.available !== false,
    collectingSince: history.collectingSince || null,
    invalidRecords: Number(history.invalidRecords) || 0,
    summary: {
      runs: runs.length,
      successful: successes.length,
      failed: failures.length,
      retryAttempts,
      successRate: runs.length ? round((successes.length / runs.length) * 100) : null,
      failureRate: runs.length ? round((failures.length / runs.length) * 100) : null,
      medianDurationSeconds: round(percentile(durations, 0.5)),
      p90DurationSeconds: round(percentile(durations, 0.9)),
      durationSampleSize: durations.length,
    },
    trend: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
    models: [...modelMap.values()]
      .map((model) => ({
        model: model.model,
        runs: model.runs,
        successful: model.successful,
        failed: model.failed,
        retryAttempts: model.retryAttempts,
        successRate: model.runs ? round((model.successful / model.runs) * 100) : null,
        medianDurationSeconds: round(percentile(model.durations, 0.5)),
        p90DurationSeconds: round(percentile(model.durations, 0.9)),
        durationSampleSize: model.durations.length,
      }))
      .sort((a, b) => a.model.localeCompare(b.model)),
    recentRuns: runs.slice(0, 50),
  };
}

export async function loadWavePipelineRunAnalytics(range, dependencies = {}) {
  const history = await readWavePipelineRunHistory(range, dependencies);
  return summarizeWavePipelineRunHistory(history);
}
