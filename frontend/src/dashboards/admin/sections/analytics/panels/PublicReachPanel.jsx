import { BarChartCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { publishedChartRows } from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend, formatDate, formatDateTime } from '../analyticsPresentation';

export default function PublicReachPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.trend, payload.range, ['views']);

  return (
    <div className="space-y-5">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          { label: 'Views today', value: summary.viewsToday ?? 0, helper: 'Asia/Manila day' },
          {
            label: 'Views yesterday',
            value: summary.viewsYesterday ?? 0,
            helper: 'Previous Manila day',
          },
          { label: 'Period views', value: summary.periodViews ?? 0, helper: 'Selected range' },
          { label: 'All-time views', value: summary.allTimeViews ?? 0, helper: 'Persisted total' },
          {
            label: 'Charts reached',
            value: summary.publishedChartsViewed ?? 0,
            helper: 'Distinct published charts',
          },
          {
            label: 'Day-over-day',
            value:
              summary.dayOverDay?.percent == null
                ? summary.dayOverDay?.direction || '—'
                : `${summary.dayOverDay.percent}%`,
            helper: 'Today compared with yesterday',
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
        <TrendCard
          title="Published Chart Reach Over Time"
          description="Privacy-safe deduplicated public chart views."
          rows={trend}
          series={[{ dataKey: 'views', label: 'Views', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Most Viewed Published Charts"
          description="Published charts ranked by deduplicated views for the selected period."
          rows={publishedChartRows(payload)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Published Reach Detail"
        description="Public-safe chart metadata only. No visitor identity or raw tracking token is exposed."
        isDarkMode={isDarkMode}
        headers={['Chart', 'Type', 'Forecast date', 'Published', 'Views']}
        rows={(payload.topCharts || []).map((item) => [
          item.name || 'Published chart',
          item.chartType || '—',
          formatDate(item.forecastDate),
          formatDateTime(item.publishedAt),
          item.views ?? 0,
        ])}
      />
    </div>
  );
}
