import express from 'express';

import {
  getForecastAnalytics,
  getSystemAnalytics,
  getUserAnalytics,
} from '../controllers/analyticsController.js';
import {
  exportForecastAnalytics,
  exportSystemAnalytics,
  exportUserAnalytics,
} from '../controllers/analyticsExportController.js';
import authenticate from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/forecast', requirePermission('analytics_forecast.view'), getForecastAnalytics);
router.get(
  '/forecast/export',
  requirePermission('analytics_forecast.view'),
  requirePermission('analytics.export'),
  exportForecastAnalytics
);
router.get('/users', requirePermission('analytics_users.view'), getUserAnalytics);
router.get(
  '/users/export',
  requirePermission('analytics_users.view'),
  requirePermission('analytics.export'),
  exportUserAnalytics
);
router.get('/system', requirePermission('analytics_system.view'), getSystemAnalytics);
router.get(
  '/system/export',
  requirePermission('analytics_system.view'),
  requirePermission('analytics.export'),
  exportSystemAnalytics
);

export default router;
