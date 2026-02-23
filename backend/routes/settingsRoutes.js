import express from 'express';
import { getSettings, saveSettings } from '../controllers/settingsController.js';

const router = express.Router();

// GET settings for a page
router.get('/:page', getSettings);

// SAVE settings for a page
router.put('/:page', saveSettings);

export default router;