import express from 'express';
import rateLimit from 'express-rate-limit';

import { listWaveModelCatalog } from '../controllers/waveModelController.js';

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
  listWaveModelCatalog
);

export default router;
