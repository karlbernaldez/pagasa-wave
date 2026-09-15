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
  calendar: ['view'],
  reports: ['view', 'create', 'approve'],
  settings: ['view', 'manage'],
  chat: ['use_internal', 'forecaster_knowledge', 'admin_knowledge'],
});

export const PERMISSION_KEYS = Object.freeze(
  Object.entries(PERMISSION_CATALOG).flatMap(([feature, actions]) =>
    actions.map((action) => `${feature}.${action}`)
  )
);

export const PERMISSION_CATEGORIES = Object.freeze([
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Access the shared operational overview and readiness summaries.',
    order: 10,
  },
  {
    key: 'forecast_operations',
    label: 'Forecast Operations',
    description: 'Work with forecast packages through preparation, review, and publication.',
    order: 20,
  },
  {
    key: 'forecast_studio',
    label: 'Forecast Studio',
    description: 'View and edit forecast charts, annotations, and Studio content.',
    order: 30,
  },
  {
    key: 'models_pipeline',
    label: 'Models & Pipeline',
    description: 'View or manage wave models, model packages, pipeline status, and onboarding.',
    order: 40,
  },
  {
    key: 'users_access',
    label: 'Users & Access',
    description: 'Manage operational accounts, User Types, and authorization settings.',
    order: 50,
  },
  {
    key: 'analytics_reports',
    label: 'Analytics & Reports',
    description: 'View operational analytics and create or approve reports.',
    order: 60,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'View WaveLab calendar information.',
    order: 70,
  },
  {
    key: 'system',
    label: 'System',
    description: 'View and manage system-level configuration.',
    order: 80,
  },
  {
    key: 'internal_assistant',
    label: 'Internal Assistant',
    description: 'Use internal assistant capabilities and approved knowledge sources.',
    order: 90,
  },
]);

const FEATURE_PRESENTATION = Object.freeze({
  dashboard: { category: 'dashboard', subject: 'dashboard' },
  forecast: { category: 'forecast_operations', subject: 'forecast packages' },
  studio: { category: 'forecast_studio', subject: 'Forecast Studio content' },
  wave_models: { category: 'models_pipeline', subject: 'wave models' },
  wave_pipeline: { category: 'models_pipeline', subject: 'wave pipeline' },
  model_onboarding: { category: 'models_pipeline', subject: 'model onboarding' },
  users: { category: 'users_access', subject: 'users' },
  roles: { category: 'users_access', subject: 'User Types' },
  analytics: { category: 'analytics_reports', subject: 'analytics' },
  calendar: { category: 'calendar', subject: 'calendar' },
  reports: { category: 'analytics_reports', subject: 'reports' },
  settings: { category: 'system', subject: 'system settings' },
  chat: { category: 'internal_assistant', subject: 'internal assistant' },
});

const ACTION_LABELS = Object.freeze({
  view: 'View',
  edit: 'Edit',
  submit: 'Submit',
  review: 'Review',
  approve: 'Approve',
  publish: 'Publish',
  archive: 'Archive',
  manage: 'Manage',
  create: 'Create',
  export: 'Export',
  delete: 'Delete',
  change_status: 'Change status for',
  run_builder: 'Run builder for',
  delete_package: 'Delete packages for',
  edit_any_annotation: 'Edit any annotation in',
  use_internal: 'Use',
  forecaster_knowledge: 'Use forecaster knowledge in',
  admin_knowledge: 'Use administrative knowledge in',
});

const ELEVATED_PERMISSIONS = new Set([
  'forecast.approve',
  'forecast.publish',
  'forecast.archive',
  'studio.edit_any_annotation',
  'wave_models.manage',
  'wave_models.run_builder',
  'wave_models.delete_package',
  'model_onboarding.manage',
  'users.create',
  'users.edit',
  'users.change_status',
  'users.delete',
  'roles.create',
  'roles.edit',
  'roles.delete',
  'analytics.export',
  'reports.approve',
  'settings.manage',
  'chat.admin_knowledge',
]);

const FEATURE_ORDER = Object.freeze(Object.keys(PERMISSION_CATALOG));

export const PERMISSION_METADATA = Object.freeze(
  Object.fromEntries(
    PERMISSION_KEYS.map((key) => {
      const [feature, action] = key.split('.');
      const presentation = FEATURE_PRESENTATION[feature];
      const actionLabel = ACTION_LABELS[action] || action;
      const featureIndex = FEATURE_ORDER.indexOf(feature);
      const actionIndex = PERMISSION_CATALOG[feature].indexOf(action);
      const label = `${actionLabel} ${presentation.subject}`;

      return [
        key,
        Object.freeze({
          category: presentation.category,
          label,
          description: `Allows this User Type to ${label.toLowerCase()}.`,
          order: featureIndex * 100 + actionIndex * 10,
          sensitivity: ELEVATED_PERMISSIONS.has(key) ? 'elevated' : 'standard',
        }),
      ];
    })
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

  for (const permissionKey of normalized) {
    for (const legacyPermission of FORECAST_RUNTIME_LEGACY_PERMISSIONS[permissionKey] || []) {
      effective.add(legacyPermission);
    }
  }

  // Preserve any original legacy scope permission exactly as stored so a role
  // cannot gain broader standalone Project access through forecast.view.
  for (const permissionKey of cleanPermissionInput(permissions)) {
    if (LEGACY_PROJECT_SCOPE_PERMISSIONS.includes(permissionKey)) {
      effective.add(permissionKey);
    }
  }

  return [...effective].sort();
};

export const DEFAULT_ROLE_DEFINITIONS = Object.freeze([
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Full WaveLab administration and operational management access.',
    permissions: [...PERMISSION_KEYS, 'projects.view_all'],
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
      'projects.view_own',
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
