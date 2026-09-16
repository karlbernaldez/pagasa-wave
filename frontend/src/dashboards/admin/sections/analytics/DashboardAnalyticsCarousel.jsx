import {
  AnalyticsCarousel,
  BarChartCard,
  DistributionCard,
  TrendCard,
} from './AnalyticsVisuals';
import {
  adaptiveBucketDays,
  bucketDateSeries,
  contributionMixRows,
  entriesByCount,
  publishedChartRows,
} from './analyticsWorkspaceModel';

const bucketLabel = (days) => (adaptiveBucketDays(days) > 1 ? 'Weekly' : 'Daily');

export default function DashboardAnalyticsCarousel({
  forecastSlide,
  statusSlide,
  userAnalytics,
  systemAnalytics,
  range,
  selectedDays = 14,
  isDarkMode,
}) {
  const chartSlides = [];
  const distributionSlides = [];

  if (forecastSlide) {
    chartSlides.push({
      id: 'forecast-workflow',
      label: 'Forecast Workflow Trend',
      content: forecastSlide,
    });
  }

  if (statusSlide) {
    distributionSlides.push({
      id: 'package-status',
      label: 'Package Status Distribution',
      content: statusSlide,
    });
  }

  if (userAnalytics) {
    const contributionTrend = bucketDateSeries(userAnalytics.contributions?.trend || [], {
      start: range?.start,
      end: range?.end,
      valueFields: ['total'],
      dayCount: selectedDays,
    });

    chartSlides.push(
      {
        id: 'user-contribution-activity',
        label: 'Contribution Activity',
        content: (
          <TrendCard
            title="Contribution Activity"
            description="Meaningful operational participation from package and review audit events."
            rows={contributionTrend}
            series={[{ dataKey: 'total', label: 'Operational events', stroke: '#06b6d4' }]}
            bucketLabel={bucketLabel(selectedDays)}
            isDarkMode={isDarkMode}
          />
        ),
      },
      {
        id: 'user-contribution-mix',
        label: 'Contribution Mix',
        content: (
          <BarChartCard
            title="Contribution Mix"
            description="Aggregate operational events by action. This is not a productivity ranking."
            rows={contributionMixRows(userAnalytics.contributions)}
            isDarkMode={isDarkMode}
          />
        ),
      }
    );

    distributionSlides.push(
      {
        id: 'user-account-status',
        label: 'Account Status',
        content: (
          <DistributionCard
            title="Account Status"
            description="Operational account state without names, email addresses, or contact details."
            rows={entriesByCount(userAnalytics.statusCounts)}
            isDarkMode={isDarkMode}
          />
        ),
      },
      {
        id: 'user-type-distribution',
        label: 'User Type Distribution',
        content: (
          <DistributionCard
            title="User Type Distribution"
            description="Accounts created in the selected period by configured User Type key."
            rows={entriesByCount(userAnalytics.roleCounts)}
            isDarkMode={isDarkMode}
          />
        ),
      }
    );
  }

  if (systemAnalytics) {
    const publishedChartViews = systemAnalytics.publishedChartViews || {};
    const viewTrend = bucketDateSeries(publishedChartViews.trend || [], {
      start: range?.start,
      end: range?.end,
      valueFields: ['views'],
      dayCount: selectedDays,
    });

    chartSlides.push(
      {
        id: 'system-published-chart-views',
        label: 'Published Chart Views',
        content: (
          <TrendCard
            title="Published Chart Views"
            description="Privacy-safe public chart views recorded during the selected period."
            rows={viewTrend}
            series={[{ dataKey: 'views', label: 'Views', stroke: '#06b6d4' }]}
            bucketLabel={bucketLabel(selectedDays)}
            isDarkMode={isDarkMode}
          />
        ),
      },
      {
        id: 'system-top-viewed-charts',
        label: 'Top Viewed Published Charts',
        content: (
          <BarChartCard
            title="Top Viewed Published Charts"
            description="Current published charts with the most deduplicated views in the selected period."
            rows={publishedChartRows(publishedChartViews)}
            isDarkMode={isDarkMode}
          />
        ),
      }
    );

    distributionSlides.push(
      {
        id: 'system-forecast-package-health',
        label: 'Forecast Package Health',
        content: (
          <DistributionCard
            title="Forecast Package Health"
            description="Package state distribution within the selected period."
            rows={entriesByCount(systemAnalytics.forecastPackages?.statusCounts)}
            isDarkMode={isDarkMode}
          />
        ),
      },
      {
        id: 'system-new-account-health',
        label: 'New Account Health',
        content: (
          <DistributionCard
            title="New Account Health"
            description="Account state distribution for accounts created in the selected period."
            rows={entriesByCount(systemAnalytics.users?.statusCounts)}
            isDarkMode={isDarkMode}
          />
        ),
      }
    );
  }

  if (!chartSlides.length && !distributionSlides.length) return null;

  return (
    <section className="grid items-start gap-4 xl:grid-cols-[2fr_1fr]">
      <AnalyticsCarousel
        slides={chartSlides}
        isDarkMode={isDarkMode}
        ariaLabel="Dashboard trend and activity charts"
      />
      <AnalyticsCarousel
        slides={distributionSlides}
        isDarkMode={isDarkMode}
        ariaLabel="Dashboard distribution charts"
      />
    </section>
  );
}
