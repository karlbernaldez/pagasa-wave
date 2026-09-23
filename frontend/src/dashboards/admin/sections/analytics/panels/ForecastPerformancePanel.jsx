import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import {
  buildPackagePerformanceRows,
  buildTimingRows,
  buildWorkflowFunnel,
  entriesByCount,
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

  return (
    <div className="space-y-5">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          {
            label: 'Submitted',
            value: summary.submitted ?? 0,
            helper: 'Submission events in range',
          },
          {
            label: 'Published',
            value: summary.publishedEvents ?? 0,
            helper: 'Publication events in range',
          },
          {
            label: 'Revision requests',
            value: summary.revisionRequests ?? 0,
            helper: 'Returned for revision',
          },
          {
            label: 'Completion rate',
            value: summary.completionRate == null ? '—' : `${summary.completionRate}%`,
            helper: 'Completed among decided outcomes',
          },
          {
            label: 'Return rate',
            value: summary.returnRate == null ? '—' : `${summary.returnRate}%`,
            helper: 'Revision/rejection among decisions',
          },
          {
            label: 'Package sample',
            value: payload.sampleSize ?? payload.total ?? 0,
            helper: 'Packages used for analysis',
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
          headers={['Stage', 'Median', 'Sample', 'Definition']}
          rows={timingRows.map((row) => [
            row.stage,
            formatHours(row.medianHours),
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
          'Published',
        ]}
        rows={packageRows.slice(0, 100).map((item) => [
          formatDate(item.forecastDate),
          item.name,
          item.status,
          formatDateTime(item.submittedAt),
          formatDateTime(item.reviewedAt),
          formatHours(item.reviewDurationHours),
          formatDateTime(item.publishedAt),
        ])}
      />
    </div>
  );
}
