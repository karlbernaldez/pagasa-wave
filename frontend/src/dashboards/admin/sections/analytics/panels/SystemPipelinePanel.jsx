import { TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { bucketLabel, buildTrend, formatDateTime } from '../analyticsPresentation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatDuration = (seconds) => {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
  const value = Number(seconds);
  if (value < 60) return `${Math.round(value)}s`;
  if (value < 3600) return `${Math.round((value / 60) * 10) / 10}m`;
  return `${Math.round((value / 3600) * 10) / 10}h`;
};

const formatBytes = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round((value / 1024) * 10) / 10} KB`;
  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
};

export default function SystemPipelinePanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const models = payload.models || [];
  const history = payload.history || {};
  const historySummary = history.summary || {};
  const alertState = payload.alerts || {
    active: false,
    critical: 0,
    warning: 0,
    alerts: [],
  };
  const historyTrend = buildTrend(history.trend, payload.range, ['successful', 'failed']);
  const readyRate = summary.models
    ? Math.round(((summary.readyModels || 0) / summary.models) * 1000) / 10
    : null;
  const packageCoverage = summary.models
    ? Math.round(((summary.packagesAvailable || 0) / summary.models) * 1000) / 10
    : null;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-xl border px-4 py-2.5 text-xs font-semibold leading-5',
          isDarkMode
            ? 'border-cyan-300/15 bg-cyan-400/5 text-slate-300'
            : 'border-cyan-200 bg-cyan-50/50 text-slate-700'
        )}
      >
        Pipeline history is append-only and begins with real runs recorded after telemetry
        deployment. No historical build outcomes are backfilled or inferred.
        {history.collectingSince
          ? ` Collection started ${formatDateTime(history.collectingSince)}.`
          : ''}
      </div>

      {!payload.available ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          role="status"
        >
          Live wave-pipeline status is unavailable. Persisted run history remains independent.
        </div>
      ) : null}

      {history.invalidRecords > 0 ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          role="status"
        >
          Pipeline telemetry contains {history.invalidRecords} malformed record
          {history.invalidRecords === 1 ? '' : 's'}. Valid records remain available.
        </div>
      ) : null}

      {!history.available ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          role="status"
        >
          Persisted pipeline history is temporarily unavailable. Current readiness remains usable.
        </div>
      ) : null}

      {alertState.active ? (
        <AnalyticsTable
          title="Active Degradation Alerts"
          description="Conditions currently meeting the configured production thresholds used by Analytics and the health monitor."
          isDarkMode={isDarkMode}
          headers={['Severity', 'Condition', 'Model', 'Observed', 'Threshold']}
          rows={(alertState.alerts || []).map((alert) => [
            String(alert.severity || 'warning').toUpperCase(),
            alert.message || alert.type || 'Pipeline degradation',
            alert.model || '—',
            alert.value == null ? '—' : alert.value,
            alert.threshold == null ? '—' : alert.threshold,
          ])}
        />
      ) : (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-emerald-300/15 bg-emerald-400/5 text-emerald-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
          role="status"
        >
          No active pipeline degradation alerts are meeting the configured thresholds.
        </div>
      )}

      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          {
            label: 'Models ready',
            value: `${summary.readyModels ?? 0} / ${summary.models ?? 0}`,
            helper: readyRate == null ? 'No operational models' : `${readyRate}% ready`,
          },
          {
            label: 'Forecast cycle',
            value: summary.currentForecastCycle || '—',
            helper: 'Required source cycle',
          },
          {
            label: 'Packages available',
            value: summary.packagesAvailable ?? 0,
            helper:
              packageCoverage == null ? 'No operational models' : `${packageCoverage}% coverage`,
          },
          {
            label: 'Pipeline health',
            value: String(summary.pipelineHealth || 'unavailable').replace(/^./, (value) =>
              value.toUpperCase()
            ),
            helper: 'Derived current state',
          },
          {
            label: 'Package date',
            value: payload.packageDate || '—',
            helper: 'Current package day',
          },
          {
            label: 'Deployment',
            value: payload.deployment?.status || payload.deployment?.state || '—',
            helper: 'Current deployment signal',
          },
        ]}
      />

      <AnalyticsTable
        title="Model Readiness Matrix"
        description="Dynamic operational models with source, package, and frame-level readiness evidence."
        isDarkMode={isDarkMode}
        headers={[
          'Model',
          'Required cycle',
          'Observed cycle',
          'Package',
          'State',
          'Published',
          'Frames',
          'Frame coverage',
          'Last check',
          'Completed',
        ]}
        rows={models.map((model) => [
          model.label || model.code,
          model.requiredSourceCycle || '—',
          model.sourceCycle || '—',
          model.packageTag || '—',
          model.state || '—',
          model.published ? 'Yes' : 'No',
          `${model.frameCount ?? 0} / ${model.expectedFrameCount ?? 0}`,
          model.expectedFrameCount
            ? `${Math.round(((model.frameCount || 0) / model.expectedFrameCount) * 1000) / 10}%`
            : '—',
          formatDateTime(model.lastCheckAt),
          formatDateTime(model.completedAt),
        ])}
      />

      <section className="grid gap-4 2xl:grid-cols-2">
        <AnalyticsTable
          title="Operational State Distribution"
          description="Current model counts by live pipeline state."
          isDarkMode={isDarkMode}
          headers={['State', 'Models', 'Share']}
          rows={Object.entries(
            models.reduce((accumulator, model) => {
              const key = model.state || 'Unknown';
              accumulator[key] = (accumulator[key] || 0) + 1;
              return accumulator;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([state, count]) => [
              state,
              count,
              models.length ? `${Math.round((count / models.length) * 1000) / 10}%` : '—',
            ])}
        />
        <AnalyticsTable
          title="Package Availability Matrix"
          description="Current publication coverage across dynamic operational models."
          isDarkMode={isDarkMode}
          headers={['Model', 'Package date', 'Package tag', 'Available', 'Frame completeness']}
          rows={models.map((model) => [
            model.label || model.code,
            model.packageDate || payload.packageDate || '—',
            model.packageTag || '—',
            model.published ? 'Available' : 'Unavailable',
            model.expectedFrameCount
              ? `${Math.round(((model.frameCount || 0) / model.expectedFrameCount) * 1000) / 10}%`
              : '—',
          ])}
        />
      </section>

      <AnalyticsTable
        title="Telemetry Storage Health"
        description="Operational evidence that Analytics can read the append-only builder history."
        isDarkMode={isDarkMode}
        headers={[
          'Collection started',
          'Latest run',
          'History files',
          'Storage',
          'Malformed records',
        ]}
        rows={[
          [
            formatDateTime(history.collectingSince),
            formatDateTime(history.latestRunAt),
            history.files ?? 0,
            formatBytes(history.totalBytes),
            history.invalidRecords ?? 0,
          ],
        ]}
      />

      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          {
            label: 'Recorded runs',
            value: historySummary.runs ?? 0,
            helper: 'Terminal builder attempts in range',
          },
          {
            label: 'Success rate',
            value: historySummary.successRate == null ? '—' : `${historySummary.successRate}%`,
            helper: `${historySummary.successful ?? 0} successful run(s)`,
          },
          {
            label: 'Failed runs',
            value: historySummary.failed ?? 0,
            helper: 'Persisted failed terminal outcomes',
          },
          {
            label: 'Retry attempts',
            value: historySummary.retryAttempts ?? 0,
            helper: 'Additional attempts for the same model/cycle',
          },
          {
            label: 'Median duration',
            value: formatDuration(historySummary.medianDurationSeconds),
            helper: `${historySummary.durationSampleSize ?? 0} complete timing sample(s)`,
          },
          {
            label: 'P90 duration',
            value: formatDuration(historySummary.p90DurationSeconds),
            helper: '90th percentile terminal run duration',
          },
        ]}
      />

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(24rem,0.8fr)]">
        <TrendCard
          title="Pipeline Run Outcomes"
          description="Persisted terminal outcomes by Asia/Manila operational day."
          rows={historyTrend}
          series={[
            { dataKey: 'successful', label: 'Successful', stroke: '#10b981' },
            { dataKey: 'failed', label: 'Failed', stroke: '#ef4444' },
          ]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <AnalyticsTable
          title="Model Reliability"
          description="Run reliability and timing from persisted terminal records."
          isDarkMode={isDarkMode}
          headers={[
            'Model',
            'Runs',
            'Success',
            'Failed',
            'Retries',
            'Success rate',
            'Median',
            'P90',
          ]}
          rows={(history.models || []).map((model) => [
            model.model,
            model.runs,
            model.successful,
            model.failed,
            model.retryAttempts,
            model.successRate == null ? '—' : `${model.successRate}%`,
            formatDuration(model.medianDurationSeconds),
            formatDuration(model.p90DurationSeconds),
          ])}
        />
      </section>

      <AnalyticsTable
        title="Recent Pipeline Runs"
        description="Append-only terminal run evidence. Failure messages are operational errors, not user data."
        isDarkMode={isDarkMode}
        headers={[
          'Completed',
          'Model',
          'Package date',
          'Source cycle',
          'Outcome',
          'Duration',
          'Frames',
          'Published',
          'Error',
        ]}
        rows={(history.recentRuns || []).map((run) => [
          formatDateTime(run.completedAt || run.recordedAt),
          run.model,
          run.packageDate || '—',
          run.sourceCycle || run.requiredSourceCycle || '—',
          run.outcome,
          formatDuration(run.durationSeconds),
          `${run.frameCount ?? 0} / ${run.expectedFrameCount ?? 0}`,
          run.published ? 'Yes' : 'No',
          run.error || '—',
        ])}
      />
    </div>
  );
}
