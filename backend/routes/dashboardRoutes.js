import express from 'express';
import rateLimit from 'express-rate-limit';

import { requirePermission } from '../middleware/permissionMiddleware.js';
import { getDashboardOverview } from '../services/dashboardOverviewOperationalService.js';

const router = express.Router();

router.get(
  '/overview',
  requirePermission('dashboard.view'),
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many dashboard requests. Try again shortly.' },
  }),
  async (req, res, next) => {
    try {
      const payload = await getDashboardOverview({
        permissions: req.permissions || [],
        query: req.query || {},
      });
      res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
