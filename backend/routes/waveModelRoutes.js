import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  addWaveModel,
  deleteWaveModelConfiguration,
  listWaveModels,
  removeWaveModelPackage,
  runWaveModelBuilder,
  updateWaveModelAvailability,
  updateWaveModelRuntimeProfile,
} from '../controllers/waveModelController.js';

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
router.get('/', listWaveModels);
router.post('/', addWaveModel);
router.patch('/:code/availability', updateWaveModelAvailability);
router.patch('/:code/runtime-profile', updateWaveModelRuntimeProfile);
router.post('/:code/run-builder', builderTriggerLimiter, runWaveModelBuilder);
router.delete('/:code/packages/:packageTag', removeWaveModelPackage);
router.delete('/:code', deleteWaveModelConfiguration);

export default router;
