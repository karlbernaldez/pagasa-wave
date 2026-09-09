export const PERMISSION_CATALOG = Object.freeze({
  dashboard: ['view'],
  forecast: ['view', 'edit', 'submit', 'review', 'approve', 'publish', 'archive'],
  studio: ['view', 'edit', 'edit_any_annotation'],
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

// Legacy Project permissions remain valid only during the migration window.
// `view_own` and `view_all` are preserved as scope-specific compatibility
// permissions because collapsing them into forecast.view could broaden access to
// standalone legacy Project records before those routes are retired.
export const LEGACY_PROJECT_PERMISSION_ALIASES = Object.freeze({
  'projects.view': 'forecast.view',
  'projects.create': 'forecast.edit',
  'projects.edit': 'forecast.edit',
  'projects.submit': 'forecast.submit',
  'projects.review': 'forecast.review',
  'projects.approve': 'forecast.approve',
  'projects.publish': 'forecast.publish',
});

const LEGACY_PROJECT_SCOPE_PERMISSIONS = Object.freeze(['projects.view_own', 'projects.view_all']);
const LEGACY_PERMISSION_SET = new Set([
  ...Object.keys(LEGACY_PROJECT_PERMISSION_ALIASES),
  ...LEGACY_PROJECT_SCOPE_PERMISSIONS,
]);

const FORECAST_PERMISSION_IMPLICATIONS = Object.freeze({
  'forecast.edit': ['forecast.view'],
  'forecast.submit': ['forecast.view'],
  'forecast.review': ['forecast.view'],
  'forecast.approve': ['forecast.review', 'forecast.view'],
  'forecast.publish': ['forecast.view'],
  'forecast.archive': ['forecast.view'],
});

const FORECAST_RUNTIME_LEGACY_PERMISSIONS = Object.freeze({
  'forecast.view': ['projects.view'],
  'forecast.edit': ['projects.create', 'projects.edit'],
  'forecast.submit': ['projects.submit'],
  'forecast.review': ['projects.review'],
  'forecast.approve': ['projects.approve'],
  'forecast.publish': ['projects.publish'],
});

const cleanPermissionInput = (permissions) => {
  if (!Array.isArray(permissions)) {
    const error = new Error('permissions must be an array.');
    error.status = 400;
    throw error;
  }

  return [...new Set(permissions.map((value) => String(value || '').trim()))].filter(Boolean);
};

const applyForecastPermissionImplications = (permissions) => {
  const result = new Set(permissions);
  let changed = true;

  while (changed) {
    changed = false;
    for (const [permission, impliedPermissions] of Object.entries(
      FORECAST_PERMISSION_IMPLICATIONS
    )) {
      if (!result.has(permission)) continue;
      for (const impliedPermission of impliedPermissions) {
        if (result.has(impliedPermission)) continue;
        result.add(impliedPermission);
        changed = true;
      }
    }
  }

  return result;
};

export const normalizePermissionKeys = (permissions = []) => {
  const cleaned = cleanPermissionInput(permissions);
  const unknown = cleaned.filter(
    (permission) => !PERMISSION_SET.has(permission) && !LEGACY_PERMISSION_SET.has(permission)
  );

  if (unknown.length) {
    const error = new Error(`Unknown permission keys: ${unknown.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const canonical = new Set();
  for (const permission of cleaned) {
    if (PERMISSION_SET.has(permission)) {
      canonical.add(permission);
      continue;
    }

    const alias = LEGACY_PROJECT_PERMISSION_ALIASES[permission];
    if (alias) {
      canonical.add(alias);
      continue;
    }

    // Preserve the two legacy scope permissions until standalone Project access
    // is removed. They are intentionally not exposed in PERMISSION_CATALOG.
    canonical.add(permission);
  }

  return [...applyForecastPermissionImplications(canonical)].sort();
};

export const expandEffectivePermissions = (permissions = []) => {
  const normalized = normalizePermissionKeys(permissions);
  const effective = new Set(normalized);

  for (const permission of normalized) {
    for (const legacyPermission of FORECAST_RUNTIME_LEGACY_PERMISSIONS[permission] || []) {
      effective.add(legacyPermission);
    }
  }

  // Preserve any original legacy scope permission exactly as stored so a role
  // cannot gain broader standalone Project access through forecast.view.
  for (const permission of cleanPermissionInput(permissions)) {
    if (LEGACY_PROJECT_SCOPE_PERMISSIONS.includes(permission)) {
      effective.add(permission);
    }
  }

  return [...effective].sort();
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
    description: 'Operational forecasting access for Studio and wave-model use.',
    permissions: [
      'dashboard.view',
      'forecast.view',
      'forecast.edit',
      'forecast.submit',
      'studio.view',
      'studio.edit',
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
