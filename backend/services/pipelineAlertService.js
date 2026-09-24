const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const DEFAULT_PIPELINE_ALERT_THRESHOLDS = Object.freeze({
  consecutiveFailures: 2,
  staleRunHours: 36,
  maxRunDurationSeconds: 7200,
  malformedRecords: 1,
});

export function resolvePipelineAlertThresholds(source = process.env) {
  return {
    consecutiveFailures: toPositiveNumber(
      source.PIPELINE_CONSECUTIVE_FAILURE_THRESHOLD,
      DEFAULT_PIPELINE_ALERT_THRESHOLDS.consecutiveFailures
    ),
    staleRunHours: toPositiveNumber(
      source.PIPELINE_MAX_RUN_AGE_HOURS,
      DEFAULT_PIPELINE_ALERT_THRESHOLDS.staleRunHours
    ),
    maxRunDurationSeconds: toPositiveNumber(
      source.PIPELINE_MAX_RUN_DURATION_SECONDS,
      DEFAULT_PIPELINE_ALERT_THRESHOLDS.maxRunDurationSeconds
    ),
    malformedRecords: toPositiveNumber(
      source.PIPELINE_MALFORMED_RECORD_THRESHOLD,
      DEFAULT_PIPELINE_ALERT_THRESHOLDS.malformedRecords
    ),
  };
}

const hoursSince = (value, now) => {
  const timestamp = new Date(value).getTime();
  const current = new Date(now).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(current) || current < timestamp) return null;
  return (current - timestamp) / 3600000;
};

const consecutiveFailuresByModel = (recentRuns = []) => {
  const byModel = new Map();
  for (const run of recentRuns) {
    if (!run?.model || byModel.get(run.model)?.closed) continue;
    const current = byModel.get(run.model) || { count: 0, closed: false, latestRun: run };
    if (run.outcome === 'FAILED') current.count += 1;
    else current.closed = true;
    byModel.set(run.model, current);
  }
  return byModel;
};

export function evaluatePipelineAlerts(
  { history = {}, models = [] } = {},
  { thresholds = resolvePipelineAlertThresholds(), now = new Date() } = {}
) {
  const alerts = [];
  const malformedRecords = Number(history.invalidRecords) || 0;

  if (malformedRecords >= thresholds.malformedRecords) {
    alerts.push({
      id: 'telemetry-malformed',
      severity: 'warning',
      type: 'telemetry_integrity',
      message: `Pipeline telemetry contains ${malformedRecords} malformed record${malformedRecords === 1 ? '' : 's'}.`,
      value: malformedRecords,
      threshold: thresholds.malformedRecords,
    });
  }

  if (history.latestRunAt) {
    const ageHours = hoursSince(history.latestRunAt, now);
    if (ageHours != null && ageHours >= thresholds.staleRunHours) {
      alerts.push({
        id: 'telemetry-stale',
        severity: 'critical',
        type: 'stale_pipeline_run',
        message: `No completed pipeline run has been recorded for ${Math.round(ageHours * 10) / 10} hours.`,
        value: Math.round(ageHours * 10) / 10,
        threshold: thresholds.staleRunHours,
        latestRunAt: history.latestRunAt,
      });
    }
  }

  const failureGroups = consecutiveFailuresByModel(history.recentRuns || []);
  for (const [model, state] of failureGroups.entries()) {
    if (state.count < thresholds.consecutiveFailures) continue;
    alerts.push({
      id: `consecutive-failures:${model}`,
      severity: 'critical',
      type: 'consecutive_failures',
      model,
      message: `${model} has ${state.count} consecutive failed pipeline runs.`,
      value: state.count,
      threshold: thresholds.consecutiveFailures,
      latestRunAt: state.latestRun?.eventAt || state.latestRun?.completedAt || null,
    });
  }

  const latestRunByModel = new Map();
  for (const run of history.recentRuns || []) {
    if (!run?.model || latestRunByModel.has(run.model)) continue;
    latestRunByModel.set(run.model, run);
  }
  for (const run of latestRunByModel.values()) {
    if (!Number.isFinite(Number(run.durationSeconds))) continue;
    if (Number(run.durationSeconds) < thresholds.maxRunDurationSeconds) continue;
    alerts.push({
      id: `slow-run:${run.runId || run.model}`,
      severity: 'warning',
      type: 'slow_run',
      model: run.model,
      message: `${run.model} latest completed run took ${Math.round(Number(run.durationSeconds) / 60)} minutes, above the configured duration threshold.`,
      value: Number(run.durationSeconds),
      threshold: thresholds.maxRunDurationSeconds,
      latestRunAt: run.eventAt || run.completedAt || null,
    });
  }

  for (const model of models || []) {
    if (model?.state !== 'FAILED') continue;
    alerts.push({
      id: `current-failed-state:${model.code || model.id || model.label}`,
      severity: 'critical',
      type: 'current_failed_state',
      model: model.code || model.label || null,
      message: `${model.label || model.code || 'A wave model'} is currently in FAILED pipeline state.`,
      latestRunAt: model.lastCheckAt || null,
    });
  }

  const severityRank = { critical: 0, warning: 1 };
  alerts.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));

  return {
    active: alerts.length > 0,
    critical: alerts.filter((alert) => alert.severity === 'critical').length,
    warning: alerts.filter((alert) => alert.severity === 'warning').length,
    thresholds,
    alerts,
  };
}
