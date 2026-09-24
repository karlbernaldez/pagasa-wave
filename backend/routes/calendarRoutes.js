import express from 'express';

import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from '../controllers/calendarController.js';
import protect from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('calendar.view'), listCalendarEvents);
router.post('/', requirePermission('calendar.create'), createCalendarEvent);
router.patch('/:id', requirePermission('calendar.edit'), updateCalendarEvent);
router.delete('/:id', requirePermission('calendar.delete'), deleteCalendarEvent);

export default router;
