import express from 'express';

import {
  getForecastAnalytics,
  getSystemAnalytics,
  getUserAnalytics,
} from '../controllers/analyticsController.js';
import authenticate from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/forecast', requirePermission('analytics_forecast.view'), getForecastAnalytics);
router.get('/users', requirePermission('analytics_users.view'), getUserAnalytics);
router.get('/system', requirePermission('analytics_system.view'), getSystemAnalytics);

export default router;
