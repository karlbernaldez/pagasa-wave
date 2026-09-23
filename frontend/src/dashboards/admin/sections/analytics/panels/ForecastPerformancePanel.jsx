import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import {
  buildPackagePerformanceRows,
  buildTimingRows,
  buildWorkflowFunnel,
  entriesByCount,
  formatComparisonDelta,
} from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend, formatDate, formatDateTime, formatHours } from '../analyticsPresentation';

export default function ForecastPerformancePanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.throughput, payload.range, [
    'submitted',
    'completed',
    'returned',
  ]);
  const funnelRows = buildWorkflowFunnel(payload).map((row) => ({
    label: row.stage,
    value: row.value,
  }));
  const timingRows = buildTimingRows(payload.timing);
  const packageRows = buildPackagePerformanceRows(payload.packages);
  const comparison = payload.comparison || {};
  const efficiency = payload.efficiency || {};

  return (
    <div className="space-y-5">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          {
            label: 'Submitted',
            value: summary.submitted ?? 0,
            delta: formatComparisonDelta(comparison.submitted),
            helper: 'Vs previous equal-length period',
          },
          {
            label: 'Published',
            value: summary.publishedEvents ?? 0,
            delta: formatComparisonDelta(comparison.published),
            helper: 'Vs previous equal-length period',
          },
          {
            label: 'Revision requests',
            value: summary.revisionRequests ?? 0,
            delta: formatComparisonDelta(comparison.revisions),
            helper: 'Vs previous equal-length period',
          },
          {
            label: 'Completion rate',
            value: summary.completionRate == null ? '—' : `${summary.completionRate}%`,
            delta: formatComparisonDelta(comparison.completionRate, { percentagePoints: true }),
            helper: 'Completed among decided outcomes',
          },
          {
            label: 'First-pass approval',
            value:
              efficiency.firstPassApprovalRate == null
                ? '—'
                : `${efficiency.firstPassApprovalRate}%`,
            delta: formatComparisonDelta(comparison.firstPassApprovalRate, {
              percentagePoints: true,
            }),
            helper: 'Completed without revision request',
          },
          {
            label: 'Avg revision cycles',
            value: efficiency.averageRevisionCycles ?? 0,
            helper: `${efficiency.packagesWithRevision ?? 0} package(s) required revision`,
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
        <TrendCard
          title="Workflow Throughput"
          description="Submitted, completed, and returned events across the selected reporting period."
          rows={trend}
          series={[
            { dataKey: 'submitted', label: 'Submitted', stroke: '#0ea5e9' },
            { dataKey: 'completed', label: 'Completed', stroke: '#10b981' },
            { dataKey: 'returned', label: 'Returned', stroke: '#f59e0b' },
          ]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Workflow Funnel"
          description="Observed stage counts. These are not inferred beyond persisted workflow evidence."
          rows={funnelRows}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsTable
          title="Processing Time Evidence"
          description="Median timings with explicit sample sizes; incomplete samples remain blank."
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
        <DistributionCard
          title="Current Workflow State Distribution"
          description="Current package states for forecast packages in the selected period."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Package Performance Detail"
        description="Package-level operational evidence for drill-down and CSV reconciliation."
        isDarkMode={isDarkMode}
        headers={[
          'Forecast date',
          'Package',
          'Status',
          'Submitted',
          'Reviewed',
          'Review time',
          'Revision cycles',
          'Published',
        ]}
        rows={packageRows.slice(0, 100).map((item) => [
          formatDate(item.forecastDate),
          item.name,
          item.status,
          formatDateTime(item.submittedAt),
          formatDateTime(item.reviewedAt),
          formatHours(item.reviewDurationHours),
          item.revisionCycles,
          formatDateTime(item.publishedAt),
        ])}
      />
    </div>
  );
}
