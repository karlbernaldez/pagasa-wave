import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  loadWavePipelineRunAnalytics,
  readWavePipelineRunHistory,
} from '../services/wavePipelineHistoryService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const range = parseAnalyticsDateRange(
  { start: '2026-09-01', end: '2026-09-30' },
  new Date('2026-10-01T00:00:00.000Z')
);

const row = (overrides = {}) => ({
  schemaVersion: 1,
  eventType: 'pipeline_run',
  runId: overrides.runId || 'run',
  model: overrides.model || 'WW3',
  outcome: overrides.outcome || 'READY',
  packageDate: overrides.packageDate || '2026-09-08',
  requiredSourceCycle: overrides.requiredSourceCycle || '2026090718',
  sourceCycle: overrides.sourceCycle || '2026090718',
  startedAt: overrides.startedAt || '2026-09-08T01:00:00Z',
  completedAt: overrides.completedAt || '2026-09-08T01:10:00Z',
  recordedAt: overrides.recordedAt || overrides.completedAt || '2026-09-08T01:10:00Z',
  durationSeconds: overrides.durationSeconds ?? 600,
  published: overrides.published ?? overrides.outcome !== 'FAILED',
  frameCount: overrides.frameCount ?? 21,
  expectedFrameCount: overrides.expectedFrameCount ?? 21,
  error: overrides.error || null,
});

test('pipeline run analytics preserve retries and aggregate real terminal outcomes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wavelab-pipeline-history-'));
  try {
    const ww3Rows = [
      row({
        runId: 'ww3-failed',
        outcome: 'FAILED',
        completedAt: '2026-09-08T01:10:00Z',
        recordedAt: '2026-09-08T01:10:00Z',
        durationSeconds: 600,
        published: false,
        error: 'renderer failed',
      }),
      row({
        runId: 'ww3-ready',
        outcome: 'READY',
        completedAt: '2026-09-08T01:35:00Z',
        recordedAt: '2026-09-08T01:35:00Z',
        durationSeconds: 1200,
        published: true,
      }),
      row({
        runId: 'ww3-ready-next',
        packageDate: '2026-09-09',
        requiredSourceCycle: '2026090818',
        sourceCycle: '2026090818',
        completedAt: '2026-09-09T01:20:00Z',
        recordedAt: '2026-09-09T01:20:00Z',
        durationSeconds: 900,
      }),
    ];
    const ecwamRows = [
      row({
        runId: 'ecwam-ready',
        model: 'ECWAM',
        completedAt: '2026-09-08T02:00:00Z',
        recordedAt: '2026-09-08T02:00:00Z',
        durationSeconds: 1800,
      }),
    ];

    await Promise.all([
      fs.writeFile(
        path.join(root, 'WW3.jsonl'),
        ww3Rows.map((item) => JSON.stringify(item)).join('\n') + '\n'
      ),
      fs.writeFile(
        path.join(root, 'ECWAM.jsonl'),
        ecwamRows.map((item) => JSON.stringify(item)).join('\n') + '\n'
      ),
    ]);

    const result = await loadWavePipelineRunAnalytics(range, { historyRoot: root });

    assert.equal(result.summary.runs, 4);
    assert.equal(result.summary.successful, 3);
    assert.equal(result.summary.failed, 1);
    assert.equal(result.summary.retryAttempts, 1);
    assert.equal(result.summary.successRate, 75);
    assert.equal(result.summary.failureRate, 25);
    assert.equal(result.summary.medianDurationSeconds, 1050);
    assert.equal(result.summary.p90DurationSeconds, 1620);
    assert.equal(result.summary.durationSampleSize, 4);
    assert.equal(result.files, 2);
    assert.ok(result.totalBytes > 0);
    assert.equal(result.latestRunAt, '2026-09-09T01:20:00Z');

    const ww3 = result.models.find((item) => item.model === 'WW3');
    const ecwam = result.models.find((item) => item.model === 'ECWAM');
    assert.equal(ww3.runs, 3);
    assert.equal(ww3.retryAttempts, 1);
    assert.equal(ww3.successful, 2);
    assert.equal(ecwam.runs, 1);
    assert.equal(ecwam.retryAttempts, 0);

    assert.deepEqual(result.trend, [
      { date: '2026-09-08', successful: 2, failed: 1, runs: 3 },
      { date: '2026-09-09', successful: 1, failed: 0, runs: 1 },
    ]);
    assert.equal(result.recentRuns[0].runId, 'ww3-ready-next');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('pipeline history ignores out-of-range runs and counts malformed records without failing analytics', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wavelab-pipeline-history-'));
  try {
    await fs.writeFile(
      path.join(root, 'WW3.jsonl'),
      [
        JSON.stringify(row({ runId: 'inside' })),
        '{not-json}',
        JSON.stringify(
          row({
            runId: 'outside',
            packageDate: '2026-08-01',
            completedAt: '2026-08-01T01:00:00Z',
            recordedAt: '2026-08-01T01:00:00Z',
          })
        ),
      ].join('\n') + '\n'
    );

    const history = await readWavePipelineRunHistory(range, { historyRoot: root });

    assert.equal(history.runs.length, 1);
    assert.equal(history.runs[0].runId, 'inside');
    assert.equal(history.invalidRecords, 1);
    assert.equal(history.collectingSince, '2026-08-01T01:00:00Z');
    assert.equal(history.latestRunAt, '2026-09-08T01:10:00Z');
    assert.equal(history.files, 1);
    assert.ok(history.totalBytes > 0);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('missing history directory returns an empty collecting state instead of an error', async () => {
  const root = path.join(os.tmpdir(), `wavelab-missing-history-${Date.now()}-${Math.random()}`);
  const result = await loadWavePipelineRunAnalytics(range, { historyRoot: root });

  assert.equal(result.available, true);
  assert.equal(result.collectingSince, null);
  assert.equal(result.latestRunAt, null);
  assert.equal(result.files, 0);
  assert.equal(result.totalBytes, 0);
  assert.equal(result.invalidRecords, 0);
  assert.equal(result.summary.runs, 0);
  assert.equal(result.summary.successRate, null);
  assert.deepEqual(result.trend, []);
  assert.deepEqual(result.models, []);
  assert.deepEqual(result.recentRuns, []);
});
