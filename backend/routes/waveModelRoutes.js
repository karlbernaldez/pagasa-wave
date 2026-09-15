import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  addWaveModel,
  deleteWaveModelConfiguration,
  getWaveModelSourceCyclePolicy,
  listWaveModels,
  removeWaveModelPackage,
  runWaveModelBuilder,
  updateWaveModelAvailability,
  updateWaveModelRuntimeProfile,
  updateWaveModelSourceCyclePolicy,
} from '../controllers/waveModelController.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

const managementLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many wave model management requests. Try again shortly.' },
});

const builderTriggerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many manual builder requests. Try again later.' },
});

router.use(managementLimiter);
router.get('/', requirePermission('wave_models.view'), listWaveModels);
router.post('/', requirePermission('wave_models.manage'), addWaveModel);
router.patch(
  '/:code/availability',
  requirePermission('wave_models.manage'),
  updateWaveModelAvailability
);
router.patch(
  '/:code/runtime-profile',
  requirePermission('wave_models.manage'),
  updateWaveModelRuntimeProfile
);
router.get(
  '/:code/source-cycle-policy',
  requirePermission('wave_models.view'),
  getWaveModelSourceCyclePolicy
);
router.patch(
  '/:code/source-cycle-policy',
  requirePermission('wave_models.manage'),
  updateWaveModelSourceCyclePolicy
);
router.post(
  '/:code/run-builder',
  requirePermission('wave_models.run_builder'),
  builderTriggerLimiter,
  runWaveModelBuilder
);
router.delete(
  '/:code/packages/:packageTag',
  requirePermission('wave_models.delete_package'),
  removeWaveModelPackage
);
router.delete('/:code', requirePermission('wave_models.manage'), deleteWaveModelConfiguration);

export default router;
