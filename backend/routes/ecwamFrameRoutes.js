import express from 'express';
import rateLimit from 'express-rate-limit';

import { getEcwamFrame, requestEcwamFrame } from '../controllers/ecwamFrameController.js';

const router = express.Router();

const frameRequestLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    state: 'rate_limited',
    message: 'Too many ECWAM frame requests. Please try again shortly.',
  },
});

router.get('/:packageDate/:forecastHour', getEcwamFrame);
router.post('/:packageDate/:forecastHour', frameRequestLimiter, requestEcwamFrame);

export default router;
