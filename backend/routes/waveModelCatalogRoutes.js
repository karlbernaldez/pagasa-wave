import express from 'express';
import rateLimit from 'express-rate-limit';

import { listWaveModels } from '../controllers/waveModelController.js';

const router = express.Router();

router.get(
  '/',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many wave model catalog requests. Try again shortly.' },
  }),
  listWaveModels
);

export default router;
