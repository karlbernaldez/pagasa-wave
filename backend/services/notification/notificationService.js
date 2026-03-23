import Notification from '../../models/Notification.js';
import { visibilityFilter } from '../../queries/notification/notificationQueries.js';
import {
  emitNewNotification,
  emitNotificationRead,
  emitAllNotificationsRead,
} from '#socket/socketEmitter';

export const createNotification = async (payload) => {
  const notification = await Notification.create(payload);
  // Emit to the correct room(s) immediately after persisting
  emitNewNotification(notification.toObject());
  return notification;
};

/**
 * Add `userId` to `readBy` (idempotent). Emits a targeted read event so the
 * sender's other open tabs/windows update without a page refresh.
 *
 * @param {string}                            notificationId
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string}                            role
 */
export const markOneAsRead = async (notificationId, userId, role) => {
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, ...visibilityFilter(userId, role) },
    { $addToSet: { readBy: userId } },
    { new: true },
  );

  if (updated) {
    emitNotificationRead(String(userId), notificationId);
  }

  return updated;
};

/**
 * Mark every unread visible notification as read. Emits a bulk-read event so
 * other tabs clear their badges instantly.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string}                            role
 * @returns {Promise<number>} Number of documents modified
 */
export const markAllAsRead = async (userId, role) => {
  const { modifiedCount } = await Notification.updateMany(
    {
      ...visibilityFilter(userId, role),
      readBy: { $nin: [userId] },
    },
    { $addToSet: { readBy: userId } },
  );

  if (modifiedCount > 0) {
    emitAllNotificationsRead(String(userId));
  }

  return modifiedCount;
};