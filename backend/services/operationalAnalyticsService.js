import ForecastPackage from '../models/ForecastPackage.js';
import PublishedChartView from '../models/PublishedChartView.js';
import { buildDateMatch } from '../utils/analyticsDateRange.js';

export const CONTRIBUTION_ACTIONS = Object.freeze([
  'chart_claimed',
  'chart_completion_updated',
  'submitted',
  'review_started',
  'revision_requested',
  'approved',
  'rejected',
  'published',
]);

const CONTRIBUTION_LABELS = Object.freeze({
  chart_claimed: 'Chart claimed',
  chart_completion_updated: 'Chart completion updated',
  submitted: 'Package submitted',
  review_started: 'Review started',
  revision_requested: 'Revision requested',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
});

const TIME_ZONE = 'Asia/Manila';

const serializeCount = (value) => Number(value) || 0;

export async function loadUserContributionAnalytics(
  range,
  { ForecastPackageModel = ForecastPackage } = {}
) {
  const rows = await ForecastPackageModel.aggregate([
    { $unwind: '$auditLogs' },
    {
      $match: {
        'auditLogs.action': { $in: CONTRIBUTION_ACTIONS },
        ...buildDateMatch('auditLogs.timestamp', range),
      },
    },
    {
      $facet: {
        totals: [{ $count: 'count' }],
        contributors: [
          { $group: { _id: '$auditLogs.performedBy' } },
          { $count: 'count' },
        ],
        byAction: [
          { $group: { _id: '$auditLogs.action', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        byDay: [
          {
            $project: {
              action: '$auditLogs.action',
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$auditLogs.timestamp',
                  timezone: TIME_ZONE,
                },
              },
            },
          },
          {
            $group: {
              _id: { date: '$date', action: '$action' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1, '_id.action': 1 } },
        ],
      },
    },
  ]);

  const result = rows[0] || {};
  const actionMix = (result.byAction || []).map((row) => ({
    action: String(row._id || 'unknown'),
    label: CONTRIBUTION_LABELS[row._id] || String(row._id || 'Unknown'),
    count: serializeCount(row.count),
  }));

  const trendByDate = new Map();
  for (const row of result.byDay || []) {
    const date = row?._id?.date;
    const action = row?._id?.action;
    if (!date || !action) continue;
    const point = trendByDate.get(date) || { date, total: 0, actions: {} };
    const count = serializeCount(row.count);
    point.total += count;
    point.actions[action] = count;
    trendByDate.set(date, point);
  }

  return {
    totalEvents: serializeCount(result.totals?.[0]?.count),
    activeContributors: serializeCount(result.contributors?.[0]?.count),
    actionMix,
    trend: [...trendByDate.values()],
  };
}

export async function loadPublishedChartViewAnalytics(
  range,
  { PublishedChartViewModel = PublishedChartView, currentDateKey = null, topLimit = 5 } = {}
) {
  const periodMatch = buildDateMatch('viewedAt', range);
  const rows = await PublishedChartViewModel.aggregate([
    {
      $facet: {
        totals: [{ $match: periodMatch }, { $count: 'count' }],
        today: currentDateKey
          ? [{ $match: { dateKey: currentDateKey } }, { $count: 'count' }]
          : [{ $match: { _id: { $exists: false } } }, { $count: 'count' }],
        byDay: [
          { $match: periodMatch },
          { $group: { _id: '$dateKey', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        topCharts: [
          { $match: periodMatch },
          {
            $group: {
              _id: '$project',
              count: { $sum: 1 },
              lastViewedAt: { $max: '$viewedAt' },
            },
          },
          {
            $lookup: {
              from: 'projects',
              localField: '_id',
              foreignField: '_id',
              as: 'project',
              pipeline: [
                { $match: { status: 'Published' } },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    chartType: 1,
                    forecastDate: 1,
                    publishedAt: 1,
                  },
                },
              ],
            },
          },
          { $unwind: '$project' },
          { $sort: { count: -1, lastViewedAt: -1, _id: 1 } },
          { $limit: Math.max(1, Math.min(Number(topLimit) || 5, 20)) },
          {
            $project: {
              _id: 0,
              projectId: '$project._id',
              name: '$project.name',
              chartType: '$project.chartType',
              forecastDate: '$project.forecastDate',
              publishedAt: '$project.publishedAt',
              views: '$count',
            },
          },
        ],
      },
    },
  ]);

  const result = rows[0] || {};
  return {
    totalViews: serializeCount(result.totals?.[0]?.count),
    viewsToday: serializeCount(result.today?.[0]?.count),
    trend: (result.byDay || []).map((row) => ({
      date: String(row._id),
      views: serializeCount(row.count),
    })),
    topCharts: (result.topCharts || []).map((row) => ({
      projectId: String(row.projectId),
      name: row.name,
      chartType: row.chartType,
      forecastDate: row.forecastDate,
      publishedAt: row.publishedAt,
      views: serializeCount(row.views),
    })),
  };
}
