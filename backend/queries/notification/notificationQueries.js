import Notification from '../../models/Notification.js';

// ─── Visibility filter ────────────────────────────────────────────────────────

/**
 * Returns a Mongoose filter that matches every notification visible to a user:
 *  • addressed directly to them (`recipientUser`)
 *  • addressed to their role (`recipientRole`)
 *  • broadcast to everyone (`broadcast: true`)
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} role
 * @returns {object} Mongoose filter object
 */
export const visibilityFilter = (userId, role) => ({
  $or: [
    { recipientUser: userId },
    { recipientRole: role  },
    { broadcast:     true  },
  ],
});

// ─── Read queries ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications for a user, sorted newest-first.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} role
 * @param {{ limit?: number, skip?: number }} [opts]
 */
export const fetchNotifications = (userId, role, { limit = 20, skip = 0 } = {}) =>
  Notification
    .find(visibilityFilter(userId, role))
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

/**
 * Count unread notifications for a user (those whose `readBy` does NOT contain them).
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} role
 */
export const countUnread = (userId, role) =>
  Notification.countDocuments({
    ...visibilityFilter(userId, role),
    readBy: { $nin: [userId] },
  });