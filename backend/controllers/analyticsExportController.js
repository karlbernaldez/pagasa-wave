import ForecastPackage from '../models/ForecastPackage.js';
import User from '../models/User.js';
import {
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from '../services/operationalAnalyticsService.js';
import { formatManilaDateKey } from '../services/publishedChartViewService.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';
import {
  buildUserAnalyticsExportRows,
  USER_ANALYTICS_EXPORT_HEADERS,
} from '../utils/analyticsSanitizers.js';
import { toCsv } from '../utils/csv.js';

const ANALYTICS_PACKAGE_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const sendCsv = (res, filename, headers, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(`\uFEFF${toCsv(headers, rows)}\n`);
};

const filenameFor = (section, range) =>
  `wavelab-${section}-analytics-${range.start}-to-${range.end}.csv`;

export const exportForecastAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const match = {
      status: { $in: ANALYTICS_PACKAGE_STATUSES },
      ...buildDateMatch('forecastDate', range),
    };
    const rows = await ForecastPackage.aggregate([
      { $match: match },
      { $sort: { forecastDate: -1, _id: -1 } },
      { $limit: 1000 },
      {
        $project: {
          _id: 1,
          name: 1,
          forecastDate: 1,
          status: 1,
          submittedAt: 1,
          reviewedAt: 1,
          publishedAt: 1,
        },
      },
    ]);

    return sendCsv(
      res,
      filenameFor('forecast', range),
      [
        'package_id',
        'name',
        'forecast_date',
        'status',
        'submitted_at',
        'reviewed_at',
        'published_at',
      ],
      rows.map((row) => [
        row._id,
        row.name,
        row.forecastDate,
        row.status,
        row.submittedAt,
        row.reviewedAt,
        row.publishedAt,
      ])
    );
  } catch (error) {
    return next(error);
  }
};

export const exportUserAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const match = {
      deletedAt: null,
      ...buildDateMatch('createdAt', range),
    };
    const [total, statusRows, roleRows, contributions] = await Promise.all([
      User.countDocuments(match),
      User.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      User.aggregate([
        { $match: match },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      loadUserContributionAnalytics(range),
    ]);

    return sendCsv(
      res,
      filenameFor('users', range),
      USER_ANALYTICS_EXPORT_HEADERS,
      buildUserAnalyticsExportRows({ total, statusRows, roleRows, contributions })
    );
  } catch (error) {
    return next(error);
  }
};

export const exportSystemAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const userMatch = { deletedAt: null, ...buildDateMatch('createdAt', range) };
    const packageMatch = {
      status: { $in: ANALYTICS_PACKAGE_STATUSES },
      ...buildDateMatch('forecastDate', range),
    };

    const [
      totalUsers,
      activeUsers,
      totalPackages,
      packageRows,
      userRows,
      publishedChartViews,
    ] = await Promise.all([
      User.countDocuments(userMatch),
      User.countDocuments({ ...userMatch, status: 'active' }),
      ForecastPackage.countDocuments(packageMatch),
      ForecastPackage.aggregate([
        { $match: packageMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: userMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      loadPublishedChartViewAnalytics(range, { currentDateKey: formatManilaDateKey() }),
    ]);

    const rows = [
      ['users.total', totalUsers],
      ['users.active', activeUsers],
      ['forecast_packages.total', totalPackages],
      ['published_chart_views.period', publishedChartViews.totalViews],
      ['published_chart_views.today', publishedChartViews.viewsToday],
      ...userRows.map((row) => [`users.status.${row._id || 'unknown'}`, row.count || 0]),
      ...packageRows.map((row) => [
        `forecast_packages.status.${row._id || 'unknown'}`,
        row.count || 0,
      ]),
      ...publishedChartViews.trend.map((row) => [
        `published_chart_views.daily.${row.date}`,
        row.views,
      ]),
      ...publishedChartViews.topCharts.map((row) => [
        `published_chart_views.chart.${row.projectId}`,
        row.views,
      ]),
    ];

    return sendCsv(res, filenameFor('system', range), ['metric', 'value'], rows);
  } catch (error) {
    return next(error);
  }
};
