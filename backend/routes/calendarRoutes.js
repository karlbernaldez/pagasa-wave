import express from 'express';

import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from '../controllers/calendarController.js';
import protect from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('calendar.view'), listCalendarEvents);
router.post('/', csrfProtection, requirePermission('calendar.create'), createCalendarEvent);
router.patch('/:id', csrfProtection, requirePermission('calendar.edit'), updateCalendarEvent);
router.delete('/:id', csrfProtection, requirePermission('calendar.delete'), deleteCalendarEvent);

export default router;
