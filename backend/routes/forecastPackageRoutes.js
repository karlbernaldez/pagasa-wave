import express from 'express';

import {
  approveForecastPackage,
  createForecastPackage,
  getAdminForecastPackages,
  getCurrentForecastPackage,
  getForecastPackageById,
  getUserForecastPackages,
  publishForecastPackage,
  requestForecastPackageRevision,
  startForecastPackageReview,
  submitForecastPackage,
  updateForecastChartCompletion,
} from '../controllers/forecastPackageController.js';
import protect from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/admin/packages', isAdmin, getAdminForecastPackages);
router.patch('/:id/start-review', isAdmin, startForecastPackageReview);
router.patch('/:id/request-revision', isAdmin, requestForecastPackageRevision);
router.patch('/:id/approve', isAdmin, approveForecastPackage);
router.patch('/:id/publish', isAdmin, publishForecastPackage);

router.post('/', createForecastPackage);
router.get('/', getUserForecastPackages);
router.get('/current', getCurrentForecastPackage);
router.get('/:id', getForecastPackageById);
router.patch('/:id/charts/:chartType/completion', updateForecastChartCompletion);
router.patch('/:id/submit', submitForecastPackage);

export default router;
