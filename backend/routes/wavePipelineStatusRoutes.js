import express from 'express';

import { requirePermission } from '../middleware/permissionMiddleware.js';
import { getWavePipelineStatus } from '../services/wavePipelineStatus.js';

const router = express.Router();

router.get('/', requirePermission('wave_pipeline.view'), async (_req, res, next) => {
  try {
    const payload = await getWavePipelineStatus();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
