export const PERMISSION_CATALOG = Object.freeze({
  dashboard: ['view'],
  studio: ['view', 'edit', 'edit_any_annotation'],
  projects: [
    'view',
    'view_own',
    'view_all',
    'create',
    'edit',
    'submit',
    'review',
    'approve',
    'publish',
  ],
  wave_models: ['view', 'manage', 'run_builder', 'delete_package'],
  wave_pipeline: ['view'],
  model_onboarding: ['view', 'manage'],
  users: ['view', 'create', 'edit', 'change_status', 'delete'],
  roles: ['view', 'create', 'edit', 'delete'],
  analytics: ['view', 'export'],
  reports: ['view', 'create', 'approve'],
  settings: ['view', 'manage'],
  chat: ['use_internal', 'forecaster_knowledge', 'admin_knowledge'],
});

export const PERMISSION_KEYS = Object.freeze(
  Object.entries(PERMISSION_CATALOG).flatMap(([feature, actions]) =>
    actions.map((action) => `${feature}.${action}`)
  )
);

const PERMISSION_SET = new Set(PERMISSION_KEYS);

export const normalizePermissionKeys = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    const error = new Error('permissions must be an array.');
    error.status = 400;
    throw error;
  }

  const normalized = [...new Set(permissions.map((value) => String(value || '').trim()))].filter(
    Boolean
  );
  const unknown = normalized.filter((permission) => !PERMISSION_SET.has(permission));

  if (unknown.length) {
    const error = new Error(`Unknown permission keys: ${unknown.join(', ')}`);
    error.status = 400;
    throw error;
  }

  return normalized.sort();
};

export const DEFAULT_ROLE_DEFINITIONS = Object.freeze([
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Full WaveLab administration and operational management access.',
    permissions: [...PERMISSION_KEYS],
    system: true,
    enabled: true,
  },
  {
    key: 'forecaster',
    name: 'Forecaster',
    description:
      'Operational forecasting access for Studio, forecast projects, and wave-model use.',
    permissions: [
      'dashboard.view',
      'studio.view',
      'studio.edit',
      'projects.view',
      'projects.view_own',
      'projects.create',
      'projects.edit',
      'projects.submit',
      'wave_models.view',
      'wave_models.run_builder',
      'analytics.view',
      'reports.view',
      'reports.create',
      'chat.use_internal',
      'chat.forecaster_knowledge',
    ],
    system: true,
    enabled: true,
  },
  {
    key: 'user',
    name: 'Registered User',
    description: 'Basic authenticated account access retained for backward compatibility.',
    permissions: [],
    system: true,
    enabled: true,
  },
]);
