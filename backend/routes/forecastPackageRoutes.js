import express from 'express';

import ForecastPackage from '../models/ForecastPackage.js';
import {
  approveForecastPackage,
  createForecastPackage,
  getForecastPackageById,
  getUserForecastPackages,
  publishForecastPackage,
  requestForecastPackageRevision,
  startForecastPackageReview,
  submitForecastPackage,
  updateForecastChartCompletion,
} from '../controllers/forecastPackageController.js';
import { getCurrentForecastPackage } from '../controllers/currentForecastPackageController.js';
import {
  getForecastPackageChartContextByProject,
  joinForecastPackageChartEditingByProject,
  releaseForecastPackageChartEditingByProject,
  updateForecastChartCompletionByProject,
} from '../controllers/forecastPackageEditingController.js';
import protect from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import {
  ADMIN_DRAFT_PACKAGE_LABEL,
  FORECAST_PACKAGE_STATUS,
  deriveForecastPackageStatusFromCharts,
  getForecastPackageDisplayStatus,
} from '../utils/forecastPackage.js';

const router = express.Router();

const ADMIN_PACKAGE_STATUSES = Object.freeze([
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.SUBMITTED,
  FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
  FORECAST_PACKAGE_STATUS.APPROVED,
  FORECAST_PACKAGE_STATUS.PUBLISHED,
  FORECAST_PACKAGE_STATUS.REJECTED,
  FORECAST_PACKAGE_STATUS.ARCHIVED,
]);

const STATUS_FILTER_ALIASES = Object.freeze({
  [ADMIN_DRAFT_PACKAGE_LABEL]: FORECAST_PACKAGE_STATUS.DRAFT,
  'Not Yet Ready': FORECAST_PACKAGE_STATUS.DRAFT,
});

function clampInt(value, min, max, fallback) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeStatusFilter(value) {
  const status = String(value || '').trim();
  if (!status || status === 'All') return '';
  return STATUS_FILTER_ALIASES[status] || status;
}

function serializeAdminPackage(forecastPackage) {
  return {
    ...forecastPackage,
    displayStatus: getForecastPackageDisplayStatus(forecastPackage.status),
  };
}

async function syncPackageStatusFromCharts(forecastPackage, userId) {
  const nextStatus = deriveForecastPackageStatusFromCharts(forecastPackage);
  if (!nextStatus || nextStatus === forecastPackage?.status) return forecastPackage;

  const update = {
    $set: {
      status: nextStatus,
    },
    $push: {
      auditLogs: {
        action: nextStatus === FORECAST_PACKAGE_STATUS.APPROVED ? 'approved' : 'chart_completion_updated',
        performedBy: userId,
        previousStatus: forecastPackage.status,
        newStatus: nextStatus,
        comment: 'Forecast Package status synced from chart project statuses',
      },
    },
  };

  if (nextStatus === FORECAST_PACKAGE_STATUS.UNDER_REVIEW && !forecastPackage.reviewStartedAt) {
    update.$set.reviewStartedAt = new Date();
    update.$set.reviewStartedBy = userId;
  }

  if (nextStatus === FORECAST_PACKAGE_STATUS.APPROVED) {
    update.$set.reviewedAt = new Date();
    update.$set.approvedBy = userId;
  }

  const updatedPackage = await ForecastPackage.findByIdAndUpdate(
    forecastPackage._id,
    update,
    { new: true },
  )
    .populate('owner', 'firstName lastName email username')
    .populate('charts.project')
    .lean();

  return updatedPackage || { ...forecastPackage, status: nextStatus };
}

async function getAdminForecastPackages(req, res, next) {
  try {
    const pageNumber = clampInt(req.query.page, 1, Number.MAX_SAFE_INTEGER, 1);
    const limitNumber = clampInt(req.query.limit, 1, 100, 12);
    const status = normalizeStatusFilter(req.query.status);

    if (status && !ADMIN_PACKAGE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid or unauthorized package status filter' });
    }

    const allPackages = await ForecastPackage.find({ status: { $in: ADMIN_PACKAGE_STATUSES } })
      .populate('owner', 'firstName lastName email username')
      .populate('charts.project')
      .sort({ forecastDate: -1, updatedAt: -1, _id: -1 })
      .lean();

    const syncedPackages = await Promise.all(
      allPackages.map((forecastPackage) => syncPackageStatusFromCharts(forecastPackage, req.user.id)),
    );
    const filteredPackages = status
      ? syncedPackages.filter((forecastPackage) => forecastPackage.status === status)
      : syncedPackages;
    const total = filteredPackages.length;
    const skip = (pageNumber - 1) * limitNumber;
    const packages = filteredPackages
      .slice(skip, skip + limitNumber)
      .map(serializeAdminPackage);

    res.json({
      packages,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.max(1, Math.ceil(total / limitNumber)),
    });
  } catch (error) {
    next(error);
  }
}

router.use(protect);

router.get('/admin/packages', isAdmin, getAdminForecastPackages);
router.patch('/:id/start-review', isAdmin, startForecastPackageReview);
router.patch('/:id/request-revision', isAdmin, requestForecastPackageRevision);
router.patch('/:id/approve', isAdmin, approveForecastPackage);
router.patch('/:id/publish', isAdmin, publishForecastPackage);

router.post('/', createForecastPackage);
router.get('/', getUserForecastPackages);
router.get('/current', getCurrentForecastPackage);
router.get('/charts/project/:projectId/context', getForecastPackageChartContextByProject);
router.patch('/charts/project/:projectId/claim', joinForecastPackageChartEditingByProject);
router.patch('/charts/project/:projectId/release', releaseForecastPackageChartEditingByProject);
router.patch('/charts/project/:projectId/completion', updateForecastChartCompletionByProject);
router.get('/:id', getForecastPackageById);
router.patch('/:id/charts/:chartType/completion', updateForecastChartCompletion);
router.patch('/:id/submit', submitForecastPackage);

export default router;
