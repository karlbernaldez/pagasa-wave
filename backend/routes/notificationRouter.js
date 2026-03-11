import { Router } from 'express';

import protect from '#middleware/authMiddleware';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '#controllers/notification/notification';

const router = Router();

// All notification routes require an authenticated session
router.use(protect);

router.get('/',            getNotifications);
router.patch('/read-all',  markAllNotificationsRead); // must come before /:id/read
router.patch('/:id/read',  markNotificationRead);

export default router;