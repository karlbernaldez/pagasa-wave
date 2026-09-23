import express from 'express';

import {
  getAnalyticsOverview,
  getForecastAnalytics,
  getPublicReachAnalytics,
  getSystemAnalytics,
  getUserAnalytics,
} from '../controllers/analyticsController.js';
import {
  exportAnalyticsOverview,
  exportForecastAnalytics,
  exportPublicReachAnalytics,
  exportSystemAnalytics,
  exportUserAnalytics,
} from '../controllers/analyticsExportController.js';
import authenticate from '../middleware/authMiddleware.js';
import {
  requireAnyPermission,
  requirePermission,
} from '../middleware/permissionMiddleware.js';

const router = express.Router();

export const ANALYTICS_ROUTE_ACCESS = Object.freeze([
  { path: '/forecast', permissions: ['analytics_forecast.view'] },
  {
    path: '/forecast/export',
    permissions: ['analytics_forecast.view', 'analytics.export'],
  },
  { path: '/public', permissions: ['analytics_system.view'] },
  {
    path: '/public/export',
    permissions: ['analytics_system.view', 'analytics.export'],
  },
  { path: '/users', permissions: ['analytics_users.view'] },
  {
    path: '/users/export',
    permissions: ['analytics_users.view', 'analytics.export'],
  },
  { path: '/system', permissions: ['analytics_system.view'] },
  {
    path: '/system/export',
    permissions: ['analytics_system.view', 'analytics.export'],
  },
]);

router.use(authenticate);

router.get(
  '/overview',
  requireAnyPermission(
    'analytics_forecast.view',
    'analytics_users.view',
    'analytics_system.view'
  ),
  getAnalyticsOverview
);
router.get(
  '/overview/export',
  requireAnyPermission(
    'analytics_forecast.view',
    'analytics_users.view',
    'analytics_system.view'
  ),
  requirePermission('analytics.export'),
  exportAnalyticsOverview
);
router.get('/forecast', requirePermission('analytics_forecast.view'), getForecastAnalytics);
router.get(
  '/forecast/export',
  requirePermission('analytics_forecast.view'),
  requirePermission('analytics.export'),
  exportForecastAnalytics
);
router.get('/public', requirePermission('analytics_system.view'), getPublicReachAnalytics);
router.get(
  '/public/export',
  requirePermission('analytics_system.view'),
  requirePermission('analytics.export'),
  exportPublicReachAnalytics
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
