import { BarChartCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsDataExplorer from '../components/AnalyticsDataExplorer';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { publishedChartRows } from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend, formatDate, formatDateTime } from '../analyticsPresentation';

export default function PublicReachPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.trend, payload.range, ['views']);
  const explorerRows = (payload.topCharts || []).map((item) => ({
    id: item.projectId,
    name: item.name || 'Published chart',
    chartType: item.chartType || 'Unknown',
    forecastDate: item.forecastDate || null,
    publishedAt: item.publishedAt || null,
    views: Number(item.views) || 0,
  }));

  return (
    <div className="space-y-4">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          {
            label: 'Views today',
            value: summary.viewsToday ?? 0,
            helper: 'Asia/Manila day',
          },
          {
            label: 'Yesterday',
            value: summary.viewsYesterday ?? 0,
            helper: 'Previous Manila day',
          },
          {
            label: 'Period views',
            value: summary.periodViews ?? 0,
            helper: 'Selected range',
          },
          {
            label: 'All-time views',
            value: summary.allTimeViews ?? 0,
            helper: 'Persisted total',
          },
          {
            label: 'Charts reached',
            value: summary.publishedChartsViewed ?? 0,
            helper: 'Distinct published charts',
          },
          {
            label: 'Day-over-day',
            value: summary.dayOverDay?.percent == null ? '—' : `${summary.dayOverDay.percent}%`,
            helper: summary.dayOverDay?.direction || 'No comparable movement',
          },
        ]}
      />

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,0.75fr)]">
        <TrendCard
          title="Published Chart Reach Over Time"
          description="Privacy-safe deduplicated public chart views across the selected period."
          rows={trend}
          series={[{ dataKey: 'views', label: 'Views', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Reach Concentration"
          description="Published charts ranked by deduplicated selected-period views."
          rows={publishedChartRows(payload)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Published Reach Matrix"
        description="Compact public-safe metadata for the highest-reach charts."
        isDarkMode={isDarkMode}
        headers={['Chart', 'Type', 'Forecast date', 'Published', 'Views', 'Share of period']}
        rows={(payload.topCharts || []).map((item) => [
          item.name || 'Published chart',
          item.chartType || '—',
          formatDate(item.forecastDate),
          formatDateTime(item.publishedAt),
          item.views ?? 0,
          summary.periodViews
            ? `${Math.round(((Number(item.views) || 0) / summary.periodViews) * 1000) / 10}%`
            : '—',
        ])}
      />

      <AnalyticsDataExplorer
        title="Published Reach Data Explorer"
        description="Search, sort, and inspect aggregate chart-level reach without exposing visitor identity."
        isDarkMode={isDarkMode}
        rows={explorerRows}
        searchFields={['name', 'chartType']}
        filters={[
          {
            key: 'chartType',
            label: 'chart types',
            options: [...new Set(explorerRows.map((row) => row.chartType))]
              .sort()
              .map((value) => ({ value, label: value })),
          },
        ]}
        columns={[
          { key: 'name', label: 'Chart' },
          { key: 'chartType', label: 'Type' },
          {
            key: 'forecastDate',
            label: 'Forecast date',
            render: (value) => formatDate(value),
          },
          {
            key: 'publishedAt',
            label: 'Published',
            render: (value) => formatDateTime(value),
          },
          { key: 'views', label: 'Views' },
        ]}
      />
    </div>
  );
}
