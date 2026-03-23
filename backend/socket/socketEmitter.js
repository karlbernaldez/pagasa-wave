import { roomFor } from './index.js';
import { logger }  from '#utils/logger';

// ── Use globalThis to guarantee ONE shared io instance ────────────────────────
// Node may load this module twice under different import paths (alias vs relative).
// globalThis survives that and ensures setIo() and the emit helpers always
// read/write the same reference.

export const setIo = (io) => {
  globalThis.__socketIo = io;
};

const getIo = () => globalThis.__socketIo ?? null;

// ─── Event names ──────────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  NOTIFICATION_NEW:      'notification:new',
  NOTIFICATION_READ:     'notification:read',
  NOTIFICATION_ALL_READ: 'notification:all_read',
};

// ─── Emit helpers ─────────────────────────────────────────────────────────────
export const emitNewNotification = (notification) => {
  const _io = getIo();

  if (!_io) {
    console.warn('[socketEmitter] _io is null — setIo() not yet called');
    return;
  }

  // Debug — remove after confirmed working
  const roleRoom = _io.sockets.adapter.rooms.get(roomFor.role(notification.recipientRole));
  console.log('[socketEmitter] emitNewNotification', {
    recipientRole:    notification.recipientRole,
    roleRoomSize:     roleRoom?.size ?? 0,
    totalConnections: _io.sockets.sockets.size,
  });

  const payload = { ...notification, unread: true };

  if (notification.broadcast) {
    _io.to(roomFor.broadcast()).emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
    return;
  }
  if (notification.recipientRole) {
    _io.to(roomFor.role(notification.recipientRole)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
  }
  if (notification.recipientUser) {
    _io.to(roomFor.user(String(notification.recipientUser))).emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
  }
};

export const emitNotificationRead = (userId, notificationId) => {
  const _io = getIo();
  if (!_io) return;
  _io.to(roomFor.user(String(userId))).emit(SOCKET_EVENTS.NOTIFICATION_READ, { _id: notificationId });
};

export const emitAllNotificationsRead = (userId) => {
  const _io = getIo();
  if (!_io) return;
  _io.to(roomFor.user(String(userId))).emit(SOCKET_EVENTS.NOTIFICATION_ALL_READ);
};