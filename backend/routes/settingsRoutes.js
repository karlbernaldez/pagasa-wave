import express from 'express';
import rateLimit from 'express-rate-limit';

import { getSettings, saveSettings } from '../controllers/settingsController.js';
import authenticate from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

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

const SETTINGS_MANAGE_PERMISSION_BY_PAGE = Object.freeze({
  operations: 'settings_schedule.manage',
  forecasterworkspace: 'settings_workspace.manage',
  mapview: 'settings_map_view.manage',
  adminreview: 'settings_review_targets.manage',
  general: 'settings_public_general.manage',
  about: 'settings_public_about.manage',
  contact: 'settings_public_contact.manage',
});

function requireSettingsManagePermission(req, res, next) {
  const page = String(req.params.page || '')
    .trim()
    .toLowerCase();
  const permission = SETTINGS_MANAGE_PERMISSION_BY_PAGE[page];

  if (!permission) {
    return res.status(400).json({ message: `Unknown settings page: "${page}"` });
  }

  return requirePermission(permission)(req, res, next);
}

router.get('/:page', publicSettingsLimiter, getSettings);
router.put(
  '/:page',
  adminSettingsLimiter,
  authenticate,
  requireSettingsManagePermission,
  saveSettings
);

export default router;
