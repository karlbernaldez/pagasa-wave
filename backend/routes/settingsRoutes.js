import express from 'express';
import rateLimit from 'express-rate-limit';

import { getSettings, saveSettings } from '../controllers/settingsController.js';
import authenticate from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

const publicSettingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many settings requests. Please slow down.' },
});

const adminSettingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many settings updates. Try again later.' },
});

router.get('/:page', publicSettingsLimiter, getSettings);
router.put('/:page', adminSettingsLimiter, authenticate, isAdmin, saveSettings);

export default router;
