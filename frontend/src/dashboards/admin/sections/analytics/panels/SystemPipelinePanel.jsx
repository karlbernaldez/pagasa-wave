import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { formatDateTime } from '../analyticsPresentation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function SystemPipelinePanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const models = payload.models || [];
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
        Current operational telemetry only. Historical reliability, retry frequency, and
        build-duration trends remain intentionally absent until persisted pipeline-run history
        exists.
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
          Live wave-pipeline status is unavailable. No historical results were fabricated.
        </div>
      ) : null}

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
    </div>
  );
}
