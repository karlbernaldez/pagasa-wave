import { getDashboardOverview as getBaseDashboardOverview } from './dashboardOverviewService.js';
import { loadPublishedChartViewAnalytics } from './operationalAnalyticsService.js';
import { formatManilaDateKey } from './publishedChartViewService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const toPermissionSet = (permissions = []) =>
  permissions instanceof Set ? permissions : new Set(permissions || []);

export async function getDashboardOverview(
  { permissions = [], query = {}, now = new Date() } = {},
  {
    getBaseOverview = getBaseDashboardOverview,
    loadPublishedViews = loadPublishedChartViewAnalytics,
  } = {}
) {
  const permissionSet = toPermissionSet(permissions);
  const base = await getBaseOverview({ permissions: permissionSet, query, now });

  if (!permissionSet.has('analytics_system.view')) {
    return base;
  }

  const range = parseAnalyticsDateRange(query, now);

  try {
    const publishedChartViews = await loadPublishedViews(range, {
      currentDateKey: formatManilaDateKey(now),
    });

    return {
      ...base,
      summaryCards: [
        ...(base.summaryCards || []),
        {
          key: 'published_chart_views',
          label: 'Published Chart Views',
          value: Number(publishedChartViews.totalViews) || 0,
          format: 'integer',
          tone: 'info',
          icon: 'views',
        },
      ],
      publishedChartViews,
    };
  } catch (error) {
    return {
      ...base,
      meta: {
        ...(base.meta || {}),
        partial: true,
      },
      publishedChartViews: null,
      errors: [
        ...(base.errors || []),
        {
          source: 'published_chart_views',
          code: 'PUBLISHED_CHART_VIEWS_UNAVAILABLE',
          message: error.message || 'Published chart view analytics are temporarily unavailable.',
        },
      ],
    };
  }
}
