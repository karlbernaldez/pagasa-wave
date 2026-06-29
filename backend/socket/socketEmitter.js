import { roomFor } from './index.js';

export const setIo = (io) => {
  globalThis.__socketIo = io;
};

const getIo = () => globalThis.__socketIo ?? null;

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) return String(value.toString());
  return '';
};

const getPackageProjectIds = (forecastPackage) => (
  Array.isArray(forecastPackage?.charts) ? forecastPackage.charts : []
)
  .map((chart) => getId(chart?.project))
  .filter(Boolean);

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_ALL_READ: 'notification:all_read',
  FORECAST_CHART_UPDATED: 'forecast-chart:updated',
  FORECAST_PACKAGE_UPDATED: 'forecast-package:updated',
};

export const emitNewNotification = (notification) => {
  const _io = getIo();
  if (!_io) return;

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

export const emitForecastChartUpdated = (projectId, payload = {}) => {
  const _io = getIo();
  if (!_io || !projectId) return;

  _io.to(roomFor.forecastChartProject(String(projectId))).emit(SOCKET_EVENTS.FORECAST_CHART_UPDATED, {
    projectId: String(projectId),
    updatedAt: new Date().toISOString(),
    ...payload,
  });
};

export const emitForecastPackageUpdated = (forecastPackage, payload = {}) => {
  const _io = getIo();
  const packageId = getId(forecastPackage);
  if (!_io || !packageId) return;

  const ownerId = getId(forecastPackage?.owner);
  const projectIds = getPackageProjectIds(forecastPackage);
  const eventPayload = {
    packageId,
    status: forecastPackage?.status,
    projectIds,
    updatedAt: new Date().toISOString(),
    ...payload,
  };

  _io.to(roomFor.role('admin')).emit(SOCKET_EVENTS.FORECAST_PACKAGE_UPDATED, eventPayload);
  _io.to(roomFor.role('user')).emit(SOCKET_EVENTS.FORECAST_PACKAGE_UPDATED, eventPayload);

  if (ownerId) {
    _io.to(roomFor.user(ownerId)).emit(SOCKET_EVENTS.FORECAST_PACKAGE_UPDATED, eventPayload);
  }

  projectIds.forEach((projectId) => {
    _io.to(roomFor.forecastChartProject(projectId)).emit(SOCKET_EVENTS.FORECAST_PACKAGE_UPDATED, eventPayload);
  });
};
