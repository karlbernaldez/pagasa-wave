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
import { FORECAST_PACKAGE_STATUS } from '../utils/forecastPackage.js';

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

function clampInt(value, min, max, fallback) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
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

    const [packages, total] = await Promise.all([
      ForecastPackage.find(query)
        .populate('owner', 'firstName lastName email username')
        .populate('charts.project')
        .sort({ forecastDate: -1, updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      ForecastPackage.countDocuments(query),
    ]);

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
