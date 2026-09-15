import express from 'express';

import { getForecastAnalytics, getUserAnalytics } from '../controllers/analyticsController.js';
import authenticate from '../middleware/authMiddleware.js';

const hasPermission = (req, permission) => new Set(req.permissions || []).has(permission);

export const forecastAnalyticsCompatibilityRouter = express.Router();
export const userAnalyticsCompatibilityRouter = express.Router();

forecastAnalyticsCompatibilityRouter.get('/admin/packages', authenticate, (req, res, next) => {
  if (hasPermission(req, 'analytics_forecast.view') && !hasPermission(req, 'projects.review')) {
    return getForecastAnalytics(req, res, next);
  }

  return next();
});

userAnalyticsCompatibilityRouter.get('/', authenticate, (req, res, next) => {
  if (hasPermission(req, 'analytics_users.view') && !hasPermission(req, 'users.view')) {
    return getUserAnalytics(req, res, next);
  }

  return next();
});
