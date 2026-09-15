export const USER_ANALYTICS_SELECT = '_id role status createdAt';

export const serializeUserAnalytics = (user = {}) => ({
  id: String(user._id || user.id || ''),
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

export const serializeUserExportRow = (user = {}) => [
  user._id || user.id || '',
  user.role,
  user.status,
  user.createdAt,
];

export const USER_ANALYTICS_ALLOWED_KEYS = Object.freeze([
  'id',
  'role',
  'status',
  'createdAt',
]);

export const USER_ANALYTICS_EXPORT_HEADERS = Object.freeze([
  'user_id',
  'user_type',
  'status',
  'created_at',
]);
