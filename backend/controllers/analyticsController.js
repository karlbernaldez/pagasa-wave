import ForecastPackage from '../models/ForecastPackage.js';
import User from '../models/User.js';

const ANALYTICS_PACKAGE_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const ANALYTICS_PROJECT_FIELDS = [
  '_id',
  'name',
  'chartType',
  'status',
  'submittedAt',
  'reviewedAt',
  'publishedAt',
  'createdAt',
  'updatedAt',
  'auditLogs.action',
  'auditLogs.timestamp',
  'versions.createdAt',
].join(' ');

const serializeUserAnalytics = (user) => ({
  id: String(user._id),
  role: user.role,
  status: user.status,
});

const rowsToCountObject = (rows = [], key = '_id') =>
  Object.fromEntries(rows.map((row) => [String(row[key] || 'unknown'), row.count || 0]));

export const getForecastAnalytics = async (_req, res, next) => {
  try {
    const match = { status: { $in: ANALYTICS_PACKAGE_STATUSES } };
    const [packages, total, statusRows] = await Promise.all([
      ForecastPackage.find(match)
        .select(
          '_id name forecastDate status charts chartCompletion submittedAt reviewedAt publishedAt createdAt updatedAt'
        )
        .populate({ path: 'charts.project', select: ANALYTICS_PROJECT_FIELDS })
        .sort({ forecastDate: -1, updatedAt: -1, _id: -1 })
        .limit(100)
        .lean(),
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
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserAnalytics = async (_req, res, next) => {
  try {
    const match = { deletedAt: null };
    const [users, statusRows, roleRows] = await Promise.all([
      User.find(match).select('_id role status').sort({ createdAt: -1, _id: -1 }).lean(),
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
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSystemAnalytics = async (_req, res, next) => {
  try {
    const packageMatch = { status: { $in: ANALYTICS_PACKAGE_STATUSES } };
    const [totalUsers, activeUsers, totalPackages, packageStatusRows, userStatusRows] =
      await Promise.all([
        User.countDocuments({ deletedAt: null }),
        User.countDocuments({ deletedAt: null, status: 'active' }),
        ForecastPackage.countDocuments(packageMatch),
        ForecastPackage.aggregate([
          { $match: packageMatch },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        User.aggregate([
          { $match: { deletedAt: null } },
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
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
