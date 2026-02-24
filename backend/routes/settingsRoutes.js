import express from 'express';
import rateLimit from 'express-rate-limit';

import { getSettings, saveSettings } from '../controllers/settingsController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

/* ======================================================
   RATE LIMITERS
====================================================== */

// Public read limiter (per IP)
const publicSettingsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many settings requests. Please slow down." }
});

// Admin write limiter (stricter)
const adminSettingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many settings updates. Try again later." }
});


/* ======================================================
   ROUTES
====================================================== */

/**
 * PUBLIC: read settings (rate-limited)
 */
router.get('/:page', publicSettingsLimiter, getSettings);

/**
 * ADMIN ONLY: update settings (rate-limited + auth)
 */
router.put(
  '/:page',
  adminSettingsLimiter,
  protect,
  authenticateToken,
  isAdmin,
  saveSettings
);

export default router;