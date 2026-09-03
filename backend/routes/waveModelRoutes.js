import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  addWaveModel,
  deleteWaveModelConfiguration,
  listWaveModels,
  removeWaveModelPackage,
  updateWaveModelAvailability,
} from '../controllers/waveModelController.js';

const router = express.Router();

const managementLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many wave model management requests. Try again shortly.' },
});

router.use(managementLimiter);
router.get('/', listWaveModels);
router.post('/', addWaveModel);
router.patch('/:code/availability', updateWaveModelAvailability);
router.delete('/:code/packages/:packageTag', removeWaveModelPackage);
router.delete('/:code', deleteWaveModelConfiguration);

export default router;
