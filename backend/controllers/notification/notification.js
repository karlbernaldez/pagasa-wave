import mongoose from 'mongoose';

import { fetchNotifications, countUnread } from '#queries/notification/notificationQueries';
import { markOneAsRead, markAllAsRead    } from '#services/notification/notificationService';
import { logger                          } from '#utils/logger';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a query-string value into a non-negative integer, falling back to `fallback`. */
const parseNonNegativeInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Thin wrapper so controllers stay DRY on 500 responses. */
const serverError = (res, label, err) => {
  logger.error(`[${label}]`, { error: err.message });
  return res.status(500).json({ message: 'Server error.' });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/notifications
 * Returns paginated notifications and the total unread count for the caller.
 */
export const getNotifications = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    const limit = Math.min(parseNonNegativeInt(req.query.limit, 20), 100);
    const skip  = parseNonNegativeInt(req.query.skip, 0);

    const [notifications, unreadCount] = await Promise.all([
      fetchNotifications(userId, role, { limit, skip }),
      countUnread(userId, role),
    ]);

    // Annotate each notification with a per-user `unread` flag
    const items = notifications.map((n) => ({
      ...n,
      unread: !n.readBy.some((id) => id.equals(userId)),
    }));

    return res.status(200).json({ notifications: items, unreadCount });
  } catch (err) {
    return serverError(res, 'getNotifications', err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read for the caller.
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid notification id.' });
    }

    const updated = await markOneAsRead(id, userId, role);
    if (!updated) return res.status(404).json({ message: 'Notification not found.' });

    return res.status(200).json({ message: 'Marked as read.' });
  } catch (err) {
    return serverError(res, 'markNotificationRead', err);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks every visible unread notification as read for the caller.
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    const modifiedCount = await markAllAsRead(userId, role);

    return res.status(200).json({ message: 'All notifications marked as read.', modifiedCount });
  } catch (err) {
    return serverError(res, 'markAllNotificationsRead', err);
  }
};