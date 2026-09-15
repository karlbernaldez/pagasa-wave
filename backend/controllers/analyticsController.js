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

export const getForecastAnalytics = async (_req, res, next) => {
  try {
    const packages = await ForecastPackage.find({
      status: { $in: ANALYTICS_PACKAGE_STATUSES },
    })
      .select(
        '_id name forecastDate status charts chartCompletion submittedAt reviewedAt publishedAt createdAt updatedAt'
      )
      .populate({ path: 'charts.project', select: ANALYTICS_PROJECT_FIELDS })
      .sort({ forecastDate: -1, updatedAt: -1, _id: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      packages,
      total: packages.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserAnalytics = async (_req, res, next) => {
  try {
    const users = await User.find({ deletedAt: null })
      .select('_id role status')
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      data: users.map(serializeUserAnalytics),
      total: users.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSystemAnalytics = async (_req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalPackages] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, status: 'active' }),
      ForecastPackage.countDocuments({ status: { $in: ANALYTICS_PACKAGE_STATUSES } }),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      forecastPackages: {
        total: totalPackages,
      },
    });
  } catch (error) {
    return next(error);
  }
};
