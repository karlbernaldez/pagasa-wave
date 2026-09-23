import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { formatDateTime } from '../analyticsPresentation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function SystemPipelinePanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};

  return (
    <div className="space-y-5">
      <div
        className={cn(
          'rounded-2xl border px-4 py-3 text-xs font-semibold leading-5',
          isDarkMode
            ? 'border-cyan-300/15 bg-cyan-400/5 text-slate-300'
            : 'border-cyan-200 bg-cyan-50/50 text-slate-700'
        )}
      >
        This section shows current pipeline evidence only. Historical reliability, retry, and
        duration analytics will be added only after those events are persistently recorded.
      </div>

      {!payload.available ? (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
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
            helper: 'Current READY state',
          },
          {
            label: 'Forecast cycle',
            value: summary.currentForecastCycle || '—',
            helper: 'Required source cycle',
          },
          {
            label: 'Packages available',
            value: summary.packagesAvailable ?? 0,
            helper: 'Published current packages',
          },
          {
            label: 'Pipeline health',
            value: String(summary.pipelineHealth || 'unavailable').replace(/^./, (value) =>
              value.toUpperCase()
            ),
            helper: 'Derived current state',
          },
          { label: 'Package date', value: payload.packageDate || '—', helper: 'Current package day' },
          {
            label: 'Telemetry mode',
            value: 'Snapshot',
            helper: 'Historical telemetry not persisted yet',
          },
        ]}
      />

      <AnalyticsTable
        title="Current Model Readiness"
        description="Dynamic operational models only; model names are not hard-coded into Analytics."
        isDarkMode={isDarkMode}
        headers={['Model', 'Source cycle', 'Package', 'State', 'Frames', 'Last updated']}
        rows={(payload.models || []).map((model) => [
          model.label || model.code,
          model.sourceCycle || model.requiredSourceCycle || '—',
          model.packageTag || (model.published ? 'Published' : '—'),
          model.state || '—',
          `${model.frameCount ?? 0} / ${model.expectedFrameCount ?? 0}`,
          formatDateTime(model.completedAt || model.lastCheckAt),
        ])}
      />
    </div>
  );
}
