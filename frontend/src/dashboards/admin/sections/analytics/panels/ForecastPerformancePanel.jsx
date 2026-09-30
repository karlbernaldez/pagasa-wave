import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsDataExplorer from '../components/AnalyticsDataExplorer';
import AnalyticsFindings from '../components/AnalyticsFindings';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import ForecastAnalyticsFilters from '../components/ForecastAnalyticsFilters';
import AnalyticsTable from '../components/AnalyticsTable';
import {
  buildAgingDistributionRows,
  buildBottleneckStageRows,
  buildChartTypePerformanceRows,
  buildForecastExplorerFilters,
  buildForecastExplorerRows,
  buildForecastFindings,
  buildOpenAgingRows,
  buildSlowestPackageRows,
  buildTimingRows,
  buildWorkflowFunnel,
  entriesByCount,
  formatComparisonDelta,
} from '../analyticsWorkspaceModel';
import {
  bucketLabel,
  buildTrend,
  formatDate,
  formatDateTime,
  formatHours,
} from '../analyticsPresentation';

export default function ForecastPerformancePanel({
  payload,
  filters,
  onFiltersChange,
  filtersDisabled,
  isDarkMode,
}) {
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
  const explorerRows = buildForecastExplorerRows(payload.packages);
  const findings = buildForecastFindings(payload);
  const comparison = payload.comparison || {};
  const efficiency = payload.efficiency || {};
  const bottlenecks = payload.bottlenecks || {};
  const chartTypeRows = buildChartTypePerformanceRows(payload.chartTypes);
  const bottleneckStages = buildBottleneckStageRows(bottlenecks);
  const agingDistribution = buildAgingDistributionRows(bottlenecks.openAging);
  const slowestPackages = buildSlowestPackageRows(bottlenecks);
  const openAgingRows = buildOpenAgingRows(bottlenecks);
  const explorerFilters = buildForecastExplorerFilters(explorerRows);
  const analysisUnit = payload.filters?.unit === 'chart' ? 'chart' : 'package';
  const analysisUnitLabel = analysisUnit === 'chart' ? 'chart project' : 'Forecast Package';

  return (
    <div className="space-y-5">
      <ForecastAnalyticsFilters
        filters={filters}
        options={payload.filterOptions}
        onChange={onFiltersChange}
        disabled={filtersDisabled}
        isDarkMode={isDarkMode}
      />

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
            helper: `${efficiency.packagesWithRevision ?? 0} ${analysisUnit === 'chart' ? 'chart(s)' : 'package(s)'} required revision`,
          },
        ]}
      />

      <AnalyticsFindings findings={findings} isDarkMode={isDarkMode} />

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
          description={`Current workflow states for ${analysisUnitLabel}s in the selected analytical scope.`}
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Chart Type & Forecast Horizon Performance"
        description={
          analysisUnit === 'chart'
            ? 'Selected chart/horizon performance from persisted project audit events.'
            : 'Per-chart workflow performance derived from chart projects linked to the filtered Forecast Package cohort.'
        }
        isDarkMode={isDarkMode}
        headers={[
          'Chart / Horizon',
          'Projects',
          'Submitted',
          'Published',
          'Revision requests',
          'Revision rate',
          'First-pass publication',
          'Median review',
          'P90 review',
          'Median turnaround',
          'P90 turnaround',
          'Turnaround sample',
        ]}
        rows={chartTypeRows.map((row) => [
          row.horizonHours === 0
            ? `${row.label} · Analysis`
            : `${row.label} · T+${row.horizonHours}`,
          row.projects,
          row.submitted,
          row.published,
          row.revisionRequests,
          row.revisionRate == null ? '—' : `${row.revisionRate}%`,
          row.firstPassPublicationRate == null ? '—' : `${row.firstPassPublicationRate}%`,
          formatHours(row.reviewMedianHours),
          formatHours(row.reviewP90Hours),
          formatHours(row.turnaroundMedianHours),
          formatHours(row.turnaroundP90Hours),
          row.sampleSize,
        ])}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsTable
          title="Workflow Bottleneck Ranking"
          description="Stages ranked by P90 duration using complete timing samples only."
          isDarkMode={isDarkMode}
          headers={['Stage', 'Median', 'P75', 'P90', 'Sample']}
          rows={bottleneckStages.map((row) => [
            row.label,
            formatHours(row.medianHours),
            formatHours(row.p75Hours),
            formatHours(row.p90Hours),
            row.sampleSize,
          ])}
        />
        <BarChartCard
          title="Current Open-Item Aging"
          description={`Current open ${analysisUnitLabel} states within the selected analytical cohort.`}
          rows={agingDistribution}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AnalyticsTable
          title="Slowest Published Turnaround"
          description={`Submission-to-publication duration for ${analysisUnitLabel}s with complete persisted timestamps.`}
          isDarkMode={isDarkMode}
          headers={[
            'Forecast date',
            analysisUnit === 'chart' ? 'Chart project' : 'Package',
            'Status',
            'Turnaround',
            'Revision cycles',
          ]}
          rows={slowestPackages.map((item) => [
            formatDate(item.forecastDate),
            item.name,
            item.status,
            formatHours(item.turnaroundHours),
            item.revisionCycles,
          ])}
        />
        <AnalyticsTable
          title="Oldest Current Open Items"
          description={`Age is measured from the latest persisted event that established the ${analysisUnitLabel}'s current open state.`}
          isDarkMode={isDarkMode}
          headers={[
            'Forecast date',
            analysisUnit === 'chart' ? 'Chart project' : 'Package',
            'Status',
            'State since',
            'Age',
          ]}
          rows={openAgingRows.map((item) => [
            formatDate(item.forecastDate),
            item.name,
            item.status,
            formatDateTime(item.statusStartedAt),
            formatHours(item.ageHours),
          ])}
        />
      </section>

      <AnalyticsDataExplorer
        title={
          analysisUnit === 'chart'
            ? 'Forecast Chart Data Explorer'
            : 'Forecast Package Data Explorer'
        }
        description={`Search, filter, sort, and paginate ${analysisUnitLabel}-level operational evidence for investigation and reconciliation.`}
        isDarkMode={isDarkMode}
        rows={explorerRows}
        searchFields={['name', 'status']}
        filters={explorerFilters}
        columns={[
          {
            key: 'forecastDate',
            label: 'Forecast date',
            render: (value) => formatDate(value),
          },
          { key: 'name', label: analysisUnit === 'chart' ? 'Chart project' : 'Package' },
          { key: 'status', label: 'Status' },
          {
            key: 'submittedAt',
            label: 'Submitted',
            render: (value) => formatDateTime(value),
          },
          {
            key: 'reviewedAt',
            label: 'Reviewed',
            render: (value) => formatDateTime(value),
          },
          {
            key: 'reviewDurationHours',
            label: 'Review time',
            render: (value) => formatHours(value),
          },
          { key: 'revisionCycles', label: 'Revision cycles' },
          {
            key: 'publishedAt',
            label: 'Published',
            render: (value) => formatDateTime(value),
          },
        ]}
      />
    </div>
  );
}
