import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_PIPELINE_ALERT_THRESHOLDS,
  evaluatePipelineAlerts,
  resolvePipelineAlertThresholds,
} from '../services/pipelineAlertService.js';

const now = new Date('2026-09-24T12:00:00.000Z');

const run = (overrides = {}) => ({
  runId: overrides.runId || 'run',
  model: overrides.model || 'WW3',
  outcome: overrides.outcome || 'READY',
  completedAt: overrides.completedAt || '2026-09-24T10:00:00.000Z',
  eventAt: overrides.eventAt || overrides.completedAt || '2026-09-24T10:00:00.000Z',
  durationSeconds: overrides.durationSeconds ?? 1200,
});

test('returns no degradation alerts for fresh successful telemetry', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-24T10:00:00.000Z',
        invalidRecords: 0,
        recentRuns: [run()],
      },
      models: [{ code: 'WW3', label: 'WW3', state: 'READY' }],
    },
    { thresholds: DEFAULT_PIPELINE_ALERT_THRESHOLDS, now }
  );

  assert.equal(result.active, false);
  assert.equal(result.critical, 0);
  assert.equal(result.warning, 0);
  assert.deepEqual(result.alerts, []);
});

test('alerts after configured consecutive failed runs for the same model', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-24T11:00:00.000Z',
        invalidRecords: 0,
        recentRuns: [
          run({
            runId: 'failed-2',
            outcome: 'FAILED',
            completedAt: '2026-09-24T11:00:00.000Z',
          }),
          run({
            runId: 'failed-1',
            outcome: 'FAILED',
            completedAt: '2026-09-24T10:00:00.000Z',
          }),
          run({
            runId: 'previous-ready',
            outcome: 'READY',
            completedAt: '2026-09-23T10:00:00.000Z',
          }),
        ],
      },
      models: [],
    },
    { thresholds: DEFAULT_PIPELINE_ALERT_THRESHOLDS, now }
  );

  const alert = result.alerts.find((item) => item.type === 'consecutive_failures');
  assert.equal(alert.model, 'WW3');
  assert.equal(alert.value, 2);
  assert.equal(alert.severity, 'critical');
});

test('does not count older failures past the latest successful run as consecutive', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-24T11:00:00.000Z',
        invalidRecords: 0,
        recentRuns: [
          run({
            runId: 'latest-ready',
            outcome: 'READY',
            completedAt: '2026-09-24T11:00:00.000Z',
          }),
          run({
            runId: 'older-failed-2',
            outcome: 'FAILED',
            completedAt: '2026-09-24T10:00:00.000Z',
          }),
          run({
            runId: 'older-failed-1',
            outcome: 'FAILED',
            completedAt: '2026-09-24T09:00:00.000Z',
          }),
        ],
      },
      models: [],
    },
    { thresholds: DEFAULT_PIPELINE_ALERT_THRESHOLDS, now }
  );

  assert.equal(
    result.alerts.some((item) => item.type === 'consecutive_failures'),
    false
  );
});

test('alerts when telemetry is stale', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-22T00:00:00.000Z',
        invalidRecords: 0,
        recentRuns: [],
      },
      models: [],
    },
    { thresholds: { ...DEFAULT_PIPELINE_ALERT_THRESHOLDS, staleRunHours: 24 }, now }
  );

  const alert = result.alerts.find((item) => item.type === 'stale_pipeline_run');
  assert.equal(alert.severity, 'critical');
  assert.ok(alert.value > 24);
});

test('alerts on malformed telemetry and current failed model state', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-24T11:00:00.000Z',
        invalidRecords: 2,
        recentRuns: [run()],
      },
      models: [{ code: 'CUSTOM_A', label: 'Custom A', state: 'FAILED' }],
    },
    { thresholds: DEFAULT_PIPELINE_ALERT_THRESHOLDS, now }
  );

  assert.equal(
    result.alerts.some((item) => item.type === 'telemetry_integrity'),
    true
  );
  assert.equal(
    result.alerts.some((item) => item.type === 'current_failed_state'),
    true
  );
});

test('slow-run evaluation considers only each model latest run', () => {
  const result = evaluatePipelineAlerts(
    {
      history: {
        latestRunAt: '2026-09-24T11:00:00.000Z',
        invalidRecords: 0,
        recentRuns: [
          run({
            runId: 'latest-fast',
            model: 'WW3',
            durationSeconds: 900,
            completedAt: '2026-09-24T11:00:00.000Z',
          }),
          run({
            runId: 'older-slow',
            model: 'WW3',
            durationSeconds: 10000,
            completedAt: '2026-09-24T10:00:00.000Z',
          }),
          run({
            runId: 'latest-slow-other',
            model: 'ECWAM',
            durationSeconds: 8000,
            completedAt: '2026-09-24T10:30:00.000Z',
          }),
        ],
      },
      models: [],
    },
    { thresholds: DEFAULT_PIPELINE_ALERT_THRESHOLDS, now }
  );

  assert.equal(
    result.alerts.some((item) => item.id === 'slow-run:older-slow'),
    false
  );
  assert.equal(
    result.alerts.some((item) => item.id === 'slow-run:latest-slow-other'),
    true
  );
});

test('resolves configurable thresholds with safe defaults', () => {
  assert.deepEqual(
    resolvePipelineAlertThresholds({
      PIPELINE_CONSECUTIVE_FAILURE_THRESHOLD: '3',
      PIPELINE_MAX_RUN_AGE_HOURS: '48',
      PIPELINE_MAX_RUN_DURATION_SECONDS: '5400',
      PIPELINE_MALFORMED_RECORD_THRESHOLD: '2',
    }),
    {
      consecutiveFailures: 3,
      staleRunHours: 48,
      maxRunDurationSeconds: 5400,
      malformedRecords: 2,
    }
  );

  assert.deepEqual(resolvePipelineAlertThresholds({}), DEFAULT_PIPELINE_ALERT_THRESHOLDS);
});
