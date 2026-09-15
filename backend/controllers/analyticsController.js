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

const serializeUserAnalytics = (user) => ({
  id: String(user._id),
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const rowsToCountObject = (rows = [], key = '_id') =>
  Object.fromEntries(rows.map((row) => [String(row[key] || 'unknown'), row.count || 0]));

const serializeRange = (range) => ({
  start: range.start,
  end: range.end,
  days: range.days,
  timezone: range.timezone,
});

export const getForecastAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const match = {
      status: { $in: ANALYTICS_PACKAGE_STATUSES },
      ...buildDateMatch('forecastDate', range),
    };
    const [packages, total, statusRows] = await Promise.all([
      ForecastPackage.aggregate([
        { $match: match },
        { $sort: { forecastDate: -1, updatedAt: -1, _id: -1 } },
        { $limit: 100 },
        {
          $project: {
            _id: 1,
            name: 1,
            forecastDate: 1,
            status: 1,
            submittedAt: 1,
            reviewedAt: 1,
            publishedAt: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      ForecastPackage.countDocuments(match),
      ForecastPackage.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      packages,
      total,
      sampleSize: packages.length,
      statusCounts: rowsToCountObject(statusRows),
      range: serializeRange(range),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const match = {
      deletedAt: null,
      ...buildDateMatch('createdAt', range),
    };
    const [users, statusRows, roleRows] = await Promise.all([
      User.find(match)
        .select('_id role status createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .limit(500)
        .lean(),
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
    ]);

    return res.status(200).json({
      data: users.map(serializeUserAnalytics),
      total: users.length,
      statusCounts: rowsToCountObject(statusRows),
      roleCounts: rowsToCountObject(roleRows),
      range: serializeRange(range),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSystemAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const userMatch = {
      deletedAt: null,
      ...buildDateMatch('createdAt', range),
    };
    const packageMatch = {
      status: { $in: ANALYTICS_PACKAGE_STATUSES },
      ...buildDateMatch('forecastDate', range),
    };
    const [totalUsers, activeUsers, totalPackages, packageStatusRows, userStatusRows] =
      await Promise.all([
        User.countDocuments(userMatch),
        User.countDocuments({ ...userMatch, status: 'active' }),
        ForecastPackage.countDocuments(packageMatch),
        ForecastPackage.aggregate([
          { $match: packageMatch },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        User.aggregate([
          { $match: userMatch },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
      ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
        statusCounts: rowsToCountObject(userStatusRows),
      },
      forecastPackages: {
        total: totalPackages,
        statusCounts: rowsToCountObject(packageStatusRows),
      },
      range: serializeRange(range),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
