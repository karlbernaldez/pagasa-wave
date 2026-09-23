import { DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import {
  buildTimingRows,
  entriesByCount,
} from '../analyticsWorkspaceModel';
import {
  bucketLabel,
  buildTrend,
  formatHours,
} from '../analyticsPresentation';

export default function ExecutiveAnalysisPanel({ payload, isDarkMode }) {
  const forecast = payload.sections?.forecast;
  const users = payload.sections?.users;
  const publicReach = payload.sections?.public;
  const system = payload.sections?.system;
  const range = payload.range;
  const trend = forecast
    ? buildTrend(forecast.throughput, range, ['submitted', 'completed', 'returned'])
    : [];
  const timingRows = forecast ? buildTimingRows(forecast.timing) : [];

  const items = [
    forecast
      ? {
          label: 'Submitted',
          value: forecast.summary?.submitted ?? 0,
          helper: 'Forecast submissions',
        }
      : null,
    forecast
      ? {
          label: 'Published',
          value: forecast.summary?.publishedEvents ?? 0,
          helper: 'Publication events',
        }
      : null,
    forecast
      ? {
          label: 'Return rate',
          value:
            forecast.summary?.returnRate == null ? '—' : `${forecast.summary.returnRate}%`,
          helper: 'Revision/rejection pressure',
        }
      : null,
    publicReach
      ? {
          label: 'Public views',
          value: publicReach.summary?.periodViews ?? 0,
          helper: 'Selected reporting period',
        }
      : null,
    users
      ? {
          label: 'Contributors',
          value: users.summary?.activeContributors ?? 0,
          helper: 'Distinct operational participants',
        }
      : null,
    system
      ? {
          label: 'Models ready',
          value: `${system.summary?.readyModels ?? 0} / ${system.summary?.models ?? 0}`,
          helper: 'Current pipeline snapshot',
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {payload.partial ? (
        <div
          className={
            isDarkMode
              ? 'rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100'
              : 'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800'
          }
          role="status"
        >
          Some analytics sources are unavailable. Available sections remain usable.
        </div>
      ) : null}

      <AnalyticsMetricStrip items={items} isDarkMode={isDarkMode} />

      {forecast ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
          <TrendCard
            title="Forecast Workflow Trend"
            description="Operational throughput across the selected reporting period."
            rows={trend}
            series={[
              { dataKey: 'submitted', label: 'Submitted', stroke: '#0ea5e9' },
              { dataKey: 'completed', label: 'Completed', stroke: '#10b981' },
              { dataKey: 'returned', label: 'Returned', stroke: '#f59e0b' },
            ]}
            bucketLabel={bucketLabel(range?.days)}
            isDarkMode={isDarkMode}
          />
          <DistributionCard
            title="Current Workflow Distribution"
            description="Package states within the selected forecast period."
            rows={entriesByCount(forecast.statusCounts)}
            isDarkMode={isDarkMode}
          />
        </section>
      ) : null}

      {timingRows.length ? (
        <AnalyticsTable
          title="Timing Summary"
          description="Compact timing evidence for the selected period. Sample size is shown explicitly."
          isDarkMode={isDarkMode}
          headers={['Stage', 'Median', 'Sample', 'Definition']}
          rows={timingRows.map((row) => [
            row.stage,
            formatHours(row.medianHours),
            row.sampleSize,
            row.definition,
          ])}
        />
      ) : null}
    </div>
  );
}
