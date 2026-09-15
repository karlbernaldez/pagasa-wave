import ForecastPackage from '../models/ForecastPackage.js';
import User from '../models/User.js';
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

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const toCsv = (headers, rows) =>
  [headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(','))
    .join('\n');

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
      ['package_id', 'name', 'forecast_date', 'status', 'submitted_at', 'reviewed_at', 'published_at'],
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
    const rows = await User.find({
      deletedAt: null,
      ...buildDateMatch('createdAt', range),
    })
      .select('_id role status createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .limit(5000)
      .lean();

    return sendCsv(
      res,
      filenameFor('users', range),
      ['user_id', 'user_type', 'status', 'created_at'],
      rows.map((row) => [row._id, row.role, row.status, row.createdAt])
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

    const [totalUsers, activeUsers, totalPackages, packageRows, userRows] = await Promise.all([
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
    ]);

    const rows = [
      ['users.total', totalUsers],
      ['users.active', activeUsers],
      ['forecast_packages.total', totalPackages],
      ...userRows.map((row) => [`users.status.${row._id || 'unknown'}`, row.count || 0]),
      ...packageRows.map((row) => [
        `forecast_packages.status.${row._id || 'unknown'}`,
        row.count || 0,
      ]),
    ];

    return sendCsv(res, filenameFor('system', range), ['metric', 'value'], rows);
  } catch (error) {
    return next(error);
  }
};
