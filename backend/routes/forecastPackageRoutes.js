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
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHART_TYPES,
} from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const router = express.Router();

const ADMIN_PACKAGE_STATUSES = Object.freeze([
  FORECAST_PACKAGE_STATUS.SUBMITTED,
  FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
  FORECAST_PACKAGE_STATUS.APPROVED,
  FORECAST_PACKAGE_STATUS.PUBLISHED,
  FORECAST_PACKAGE_STATUS.REJECTED,
  FORECAST_PACKAGE_STATUS.ARCHIVED,
]);

const AUTO_APPROVE_SOURCE_STATUSES = Object.freeze([
  FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
]);

const APPROVED_PROJECT_STATUSES = Object.freeze([
  PROJECT_STATUS.APPROVED,
  PROJECT_STATUS.PUBLISHED,
]);

function clampInt(value, min, max, fallback) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function hasApprovedRequiredChartProjects(forecastPackage) {
  const charts = Array.isArray(forecastPackage?.charts) ? forecastPackage.charts : [];

  return REQUIRED_FORECAST_CHART_TYPES.every((chartType) => {
    const chart = charts.find((candidate) => candidate.chartType === chartType);
    return chart?.project && APPROVED_PROJECT_STATUSES.includes(chart.project.status);
  });
}

async function syncApprovedPackageStatus(forecastPackage, userId) {
  if (!AUTO_APPROVE_SOURCE_STATUSES.includes(forecastPackage?.status)) return forecastPackage;
  if (!hasApprovedRequiredChartProjects(forecastPackage)) return forecastPackage;

  const previousStatus = forecastPackage.status;
  const updatedPackage = await ForecastPackage.findByIdAndUpdate(
    forecastPackage._id,
    {
      $set: {
        status: FORECAST_PACKAGE_STATUS.APPROVED,
        reviewedAt: new Date(),
        approvedBy: userId,
      },
      $push: {
        auditLogs: {
          action: 'approved',
          performedBy: userId,
          previousStatus,
          newStatus: FORECAST_PACKAGE_STATUS.APPROVED,
          comment: 'Forecast Package auto-approved because all chart projects are approved',
        },
      },
    },
    { new: true },
  )
    .populate('owner', 'firstName lastName email username')
    .populate('charts.project')
    .lean();

  return updatedPackage || { ...forecastPackage, status: FORECAST_PACKAGE_STATUS.APPROVED };
}

async function getAdminForecastPackages(req, res, next) {
  try {
    const pageNumber = clampInt(req.query.page, 1, Number.MAX_SAFE_INTEGER, 1);
    const limitNumber = clampInt(req.query.limit, 1, 100, 12);
    const skip = (pageNumber - 1) * limitNumber;
    const status = String(req.query.status || '').trim();
    const query = { status: { $in: ADMIN_PACKAGE_STATUSES } };

    if (status && status !== 'All') {
      if (!ADMIN_PACKAGE_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid or unauthorized package status filter' });
      }
      query.status = status;
    }

    let [packages, total] = await Promise.all([
      ForecastPackage.find(query)
        .populate('owner', 'firstName lastName email username')
        .populate('charts.project')
        .sort({ forecastDate: -1, updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      ForecastPackage.countDocuments(query),
    ]);

    packages = await Promise.all(packages.map((forecastPackage) => syncApprovedPackageStatus(forecastPackage, req.user.id)));

    if (status && status !== 'All') {
      packages = packages.filter((forecastPackage) => forecastPackage.status === status);
      total = await ForecastPackage.countDocuments(query);
    }

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
