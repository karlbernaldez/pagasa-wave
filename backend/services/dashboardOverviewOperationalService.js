import ForecastPackage from '../models/ForecastPackage.js';
import User from '../models/User.js';
import { getDashboardOverview as getBaseDashboardOverview } from './dashboardOverviewService.js';
import {
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from './operationalAnalyticsService.js';
import { formatManilaDateKey } from './publishedChartViewService.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const ANALYTICS_PACKAGE_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const toPermissionSet = (permissions = []) =>
  permissions instanceof Set ? permissions : new Set(permissions || []);

const rowsToCountObject = (rows = []) =>
  Object.fromEntries(rows.map((row) => [String(row._id || 'unknown'), Number(row.count) || 0]));

export async function loadDashboardUserAnalytics(
  range,
  { UserModel = User, loadContributions = loadUserContributionAnalytics } = {}
) {
  const match = {
    deletedAt: null,
    ...buildDateMatch('createdAt', range),
  };

  const [total, statusRows, roleRows, contributions] = await Promise.all([
    UserModel.countDocuments(match),
    UserModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    UserModel.aggregate([
      { $match: match },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    loadContributions(range),
  ]);

  return {
    total: Number(total) || 0,
    statusCounts: rowsToCountObject(statusRows),
    roleCounts: rowsToCountObject(roleRows),
    contributions,
  };
}

export async function loadDashboardSystemAnalytics(
  range,
  {
    UserModel = User,
    ForecastPackageModel = ForecastPackage,
    loadPublishedViews = loadPublishedChartViewAnalytics,
    currentDateKey = formatManilaDateKey(),
  } = {}
) {
  const userMatch = {
    deletedAt: null,
    ...buildDateMatch('createdAt', range),
  };
  const packageMatch = {
    status: { $in: ANALYTICS_PACKAGE_STATUSES },
    ...buildDateMatch('forecastDate', range),
  };

  const [
    totalUsers,
    activeUsers,
    userStatusRows,
    totalPackages,
    packageStatusRows,
    publishedCharts,
    publishedChartViews,
  ] = await Promise.all([
    UserModel.countDocuments(userMatch),
    UserModel.countDocuments({ ...userMatch, status: 'active' }),
    UserModel.aggregate([
      { $match: userMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    ForecastPackageModel.countDocuments(packageMatch),
    ForecastPackageModel.aggregate([
      { $match: packageMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    ForecastPackageModel.countDocuments({ status: 'Published' }),
    loadPublishedViews(range, { currentDateKey }),
  ]);

  return {
    users: {
      total: Number(totalUsers) || 0,
      active: Number(activeUsers) || 0,
      statusCounts: rowsToCountObject(userStatusRows),
    },
    forecastPackages: {
      total: Number(totalPackages) || 0,
      statusCounts: rowsToCountObject(packageStatusRows),
      publishedCharts: Number(publishedCharts) || 0,
    },
    publishedChartViews,
  };
}

const buildHeadlineCards = ({ baseCards = [], systemAnalytics = null } = {}) => {
  const cardsByKey = new Map((baseCards || []).map((card) => [card.key, card]));
  const cards = [];

  if (systemAnalytics) {
    const publishedChartViews = systemAnalytics.publishedChartViews || {};
    cards.push(
      {
        key: 'published_chart_views',
        label: 'Published Chart Views',
        value: Number(publishedChartViews.totalViews) || 0,
        format: 'integer',
        tone: 'info',
        icon: 'views',
      },
      {
        key: 'published_charts',
        label: 'Published Charts',
        value: Number(systemAnalytics.forecastPackages?.publishedCharts) || 0,
        format: 'integer',
        tone: 'success',
        icon: 'publish',
      }
    );
  }

  for (const key of ['in_review', 'models_ready']) {
    const card = cardsByKey.get(key);
    if (card) cards.push(card);
  }

  return cards.slice(0, 4);
};

export async function getDashboardOverview(
  { permissions = [], query = {}, now = new Date() } = {},
  {
    getBaseOverview = getBaseDashboardOverview,
    loadUserAnalytics = loadDashboardUserAnalytics,
    loadSystemAnalytics = loadDashboardSystemAnalytics,
  } = {}
) {
  const permissionSet = toPermissionSet(permissions);
  const base = await getBaseOverview({ permissions: permissionSet, query, now });
  const range = parseAnalyticsDateRange(query, now);
  let result = {
    ...base,
    summaryCards: buildHeadlineCards({ baseCards: base.summaryCards }),
  };

  if (permissionSet.has('analytics_users.view')) {
    try {
      result = {
        ...result,
        userAnalytics: await loadUserAnalytics(range),
      };
    } catch (error) {
      result = {
        ...result,
        meta: { ...(result.meta || {}), partial: true },
        userAnalytics: null,
        errors: [
          ...(result.errors || []),
          {
            source: 'user_analytics',
            code: 'USER_ANALYTICS_UNAVAILABLE',
            message: error.message || 'User analytics are temporarily unavailable.',
          },
        ],
      };
    }
  }

  if (permissionSet.has('analytics_system.view')) {
    try {
      const systemAnalytics = await loadSystemAnalytics(range, {
        currentDateKey: formatManilaDateKey(now),
      });
      const publishedChartViews = systemAnalytics.publishedChartViews || {};
      result = {
        ...result,
        systemAnalytics,
        publishedChartViews,
        summaryCards: buildHeadlineCards({
          baseCards: base.summaryCards,
          systemAnalytics,
        }),
      };
    } catch (error) {
      result = {
        ...result,
        meta: { ...(result.meta || {}), partial: true },
        systemAnalytics: null,
        publishedChartViews: null,
        errors: [
          ...(result.errors || []),
          {
            source: 'system_analytics',
            code: 'SYSTEM_ANALYTICS_UNAVAILABLE',
            message: error.message || 'System analytics are temporarily unavailable.',
          },
        ],
      };
    }
  }

  return result;
}
