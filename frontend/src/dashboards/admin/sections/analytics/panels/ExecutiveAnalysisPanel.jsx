import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import {
  buildBottleneckStageRows,
  buildChartTypePerformanceRows,
  buildTimingRows,
  contributionMixRows,
  entriesByCount,
  formatComparisonDelta,
  publishedChartRows,
} from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend, formatHours } from '../analyticsPresentation';

const percent = (value) => (value == null ? '—' : `${value}%`);

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
  const bottleneckRows = forecast ? buildBottleneckStageRows(forecast.bottlenecks) : [];
  const chartTypeRows = forecast ? buildChartTypePerformanceRows(forecast.chartTypes) : [];
  const efficiency = forecast?.efficiency || {};

  const items = [
    forecast
      ? {
          label: 'Submitted',
          value: forecast.summary?.submitted ?? 0,
          delta: formatComparisonDelta(forecast.comparison?.submitted),
          helper: 'Vs previous equal-length period',
        }
      : null,
    forecast
      ? {
          label: 'Published',
          value: forecast.summary?.publishedEvents ?? 0,
          delta: formatComparisonDelta(forecast.comparison?.published),
          helper: 'Vs previous equal-length period',
        }
      : null,
    forecast
      ? {
          label: 'Completion rate',
          value: percent(forecast.summary?.completionRate),
          delta: formatComparisonDelta(forecast.comparison?.completionRate, {
            percentagePoints: true,
          }),
          helper: 'Completed among decided outcomes',
        }
      : null,
    forecast
      ? {
          label: 'First-pass approval',
          value: percent(efficiency.firstPassApprovalRate),
          delta: formatComparisonDelta(forecast.comparison?.firstPassApprovalRate, {
            percentagePoints: true,
          }),
          helper: 'Completed without revision',
        }
      : null,
    publicReach
      ? {
          label: 'Public views',
          value: publicReach.summary?.periodViews ?? 0,
          helper: `${publicReach.summary?.publishedChartsViewed ?? 0} charts reached`,
        }
      : null,
    users
      ? {
          label: 'Contributors',
          value: users.summary?.activeContributors ?? 0,
          helper: `${users.summary?.contributionEvents ?? 0} workflow events`,
        }
      : null,
  ].filter(Boolean);

  const operationalMatrix = [
    forecast
      ? [
          'Forecast workflow',
          forecast.summary?.submitted ?? 0,
          forecast.summary?.publishedEvents ?? 0,
          percent(forecast.summary?.returnRate),
          percent(efficiency.firstPassApprovalRate),
          formatHours(forecast.timing?.reviewDuration?.p90Hours),
          forecast.bottlenecks?.openAging?.total ?? 0,
        ]
      : null,
    publicReach
      ? [
          'Public reach',
          publicReach.summary?.periodViews ?? 0,
          publicReach.summary?.publishedChartsViewed ?? 0,
          publicReach.summary?.viewsToday ?? 0,
          publicReach.summary?.viewsYesterday ?? 0,
          publicReach.summary?.dayOverDay?.percent == null
            ? '—'
            : `${publicReach.summary.dayOverDay.percent}%`,
          publicReach.summary?.allTimeViews ?? 0,
        ]
      : null,
    users
      ? [
          'Collaboration',
          users.summary?.totalAccounts ?? 0,
          users.summary?.activeAccounts ?? 0,
          users.summary?.activeContributors ?? 0,
          users.summary?.contributionEvents ?? 0,
          users.summary?.pendingAccounts ?? 0,
          users.summary?.restrictedAccounts ?? 0,
        ]
      : null,
    system
      ? [
          'Pipeline',
          system.summary?.models ?? 0,
          system.summary?.readyModels ?? 0,
          system.summary?.packagesAvailable ?? 0,
          system.summary?.currentForecastCycle || '—',
          system.summary?.pipelineHealth || '—',
          system.packageDate || '—',
        ]
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {payload.partial ? (
        <div
          className={
            isDarkMode
              ? 'rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-100'
              : 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800'
          }
          role="status"
        >
          Some analytics sources are unavailable. Available sections remain usable.
        </div>
      ) : null}

      <AnalyticsMetricStrip items={items} isDarkMode={isDarkMode} />

      {forecast ? (
        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.7fr)_minmax(21rem,0.7fr)]">
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
            title="Workflow State Mix"
            description="Current package states inside the selected analytical cohort."
            rows={entriesByCount(forecast.statusCounts)}
            isDarkMode={isDarkMode}
          />
        </section>
      ) : null}

      <AnalyticsTable
        title="Cross-Domain Operations Matrix"
        description="A compact comparison of the real operational evidence currently available to your permissions."
        isDarkMode={isDarkMode}
        headers={[
          'Domain',
          'Measure 1',
          'Measure 2',
          'Measure 3',
          'Measure 4',
          'Measure 5',
          'Measure 6',
        ]}
        rows={operationalMatrix}
      />

      {forecast ? (
        <section className="grid gap-4 2xl:grid-cols-2">
          <AnalyticsTable
            title="Workflow Timing Distribution"
            description="Median and tail latency. Sample size excludes incomplete historical records."
            isDarkMode={isDarkMode}
            headers={['Stage', 'Median', 'P75', 'P90', 'Sample', 'Definition']}
            rows={timingRows.map((row) => [
              row.stage,
              formatHours(row.medianHours),
              formatHours(row.p75Hours),
              formatHours(row.p90Hours),
              row.sampleSize,
              row.definition,
            ])}
          />
          <AnalyticsTable
            title="Bottleneck Ranking"
            description="Workflow stages ranked by observed tail duration."
            isDarkMode={isDarkMode}
            headers={['Stage', 'Median', 'P75', 'P90', 'Sample']}
            rows={bottleneckRows.map((row) => [
              row.label,
              formatHours(row.medianHours),
              formatHours(row.p75Hours),
              formatHours(row.p90Hours),
              row.sampleSize,
            ])}
          />
        </section>
      ) : null}

      {forecast && chartTypeRows.length ? (
        <AnalyticsTable
          title="Forecast Horizon Performance Matrix"
          description="Per-chart operational efficiency from persisted chart-project workflow evidence."
          isDarkMode={isDarkMode}
          headers={[
            'Chart / horizon',
            'Projects',
            'Submitted',
            'Published',
            'Revision rate',
            'First-pass',
            'Median review',
            'P90 review',
            'Median turnaround',
            'P90 turnaround',
          ]}
          rows={chartTypeRows.map((row) => [
            row.horizonHours === 0
              ? `${row.label} · Analysis`
              : `${row.label} · T+${row.horizonHours}`,
            row.projects,
            row.submitted,
            row.published,
            percent(row.revisionRate),
            percent(row.firstPassPublicationRate),
            formatHours(row.reviewMedianHours),
            formatHours(row.reviewP90Hours),
            formatHours(row.turnaroundMedianHours),
            formatHours(row.turnaroundP90Hours),
          ])}
        />
      ) : null}

      <section className="grid gap-4 2xl:grid-cols-2">
        {publicReach ? (
          <BarChartCard
            title="Highest-Reach Published Charts"
            description="Published charts ranked by deduplicated views in the selected period."
            rows={publishedChartRows(publicReach)}
            isDarkMode={isDarkMode}
          />
        ) : null}
        {users ? (
          <BarChartCard
            title="Operational Event Mix"
            description="Aggregate collaboration events by workflow action."
            rows={contributionMixRows(users.contributions)}
            isDarkMode={isDarkMode}
          />
        ) : null}
      </section>
    </div>
  );
}
