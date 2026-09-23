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

export const ANALYTICS_ROUTE_ACCESS = Object.freeze([
  {
    path: '/forecast',
    permissions: Object.freeze(['analytics_forecast.view']),
    handler: getForecastAnalytics,
  },
  {
    path: '/forecast/export',
    permissions: Object.freeze(['analytics_forecast.view', 'analytics.export']),
    handler: exportForecastAnalytics,
  },
  {
    path: '/users',
    permissions: Object.freeze(['analytics_users.view']),
    handler: getUserAnalytics,
  },
  {
    path: '/users/export',
    permissions: Object.freeze(['analytics_users.view', 'analytics.export']),
    handler: exportUserAnalytics,
  },
  {
    path: '/system',
    permissions: Object.freeze(['analytics_system.view']),
    handler: getSystemAnalytics,
  },
  {
    path: '/system/export',
    permissions: Object.freeze(['analytics_system.view', 'analytics.export']),
    handler: exportSystemAnalytics,
  },
]);

router.use(authenticate);

for (const route of ANALYTICS_ROUTE_ACCESS) {
  router.get(route.path, ...route.permissions.map(requirePermission), route.handler);
}

export default router;
