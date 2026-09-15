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
  analytics_forecast: ['view'],
  analytics_users: ['view'],
  analytics_system: ['view'],
  calendar: ['view'],
  reports: ['view', 'create', 'approve'],
  settings: ['view', 'manage'],
  settings_schedule: ['view', 'manage'],
  settings_workspace: ['view', 'manage'],
  settings_map_view: ['view', 'manage'],
  settings_review_targets: ['view', 'manage'],
  settings_public_general: ['view', 'manage'],
  settings_public_about: ['view', 'manage'],
  settings_public_contact: ['view', 'manage'],
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
  dashboard: {
    category: 'dashboard',
    subsection: 'overview',
    subsectionLabel: 'Operational Overview',
    subsectionDescription: 'Shared dashboard and readiness information.',
    subsectionOrder: 10,
    subject: 'dashboard',
  },
  forecast: {
    category: 'forecast_operations',
    subsection: 'packages',
    subsectionLabel: 'Forecast Packages',
    subsectionDescription: 'Prepare, review, approve, publish, and archive forecast packages.',
    subsectionOrder: 10,
    subject: 'forecast packages',
  },
  studio: {
    category: 'forecast_studio',
    subsection: 'chart_authoring',
    subsectionLabel: 'Chart Authoring',
    subsectionDescription: 'Work with forecast charts and annotation content in Studio.',
    subsectionOrder: 10,
    subject: 'Forecast Studio content',
  },
  wave_models: {
    category: 'models_pipeline',
    subsection: 'wave_models',
    subsectionLabel: 'Wave Models',
    subsectionDescription: 'View and operate configured wave models and packages.',
    subsectionOrder: 10,
    subject: 'wave models',
  },
  wave_pipeline: {
    category: 'models_pipeline',
    subsection: 'pipeline_status',
    subsectionLabel: 'Pipeline Status',
    subsectionDescription: 'Inspect wave-model pipeline and package readiness.',
    subsectionOrder: 20,
    subject: 'wave pipeline',
  },
  model_onboarding: {
    category: 'models_pipeline',
    subsection: 'model_onboarding',
    subsectionLabel: 'Model Onboarding',
    subsectionDescription: 'View or manage model onboarding workflows.',
    subsectionOrder: 30,
    subject: 'model onboarding',
  },
  users: {
    category: 'users_access',
    subsection: 'users',
    subsectionLabel: 'Users',
    subsectionDescription: 'View and manage operational user accounts.',
    subsectionOrder: 10,
    subject: 'users',
  },
  roles: {
    category: 'users_access',
    subsection: 'user_types',
    subsectionLabel: 'User Types & Permissions',
    subsectionDescription: 'Create and maintain permission bundles for User Types.',
    subsectionOrder: 20,
    subject: 'User Types',
  },
  analytics: {
    category: 'analytics_reports',
    subsection: 'analytics_full',
    subsectionLabel: 'Analytics - Full Access',
    subsectionDescription: 'Compatibility access spanning all analytics views.',
    subsectionOrder: 5,
    subject: 'analytics',
  },
  analytics_forecast: {
    category: 'analytics_reports',
    subsection: 'analytics_forecast',
    subsectionLabel: 'Forecast Operations Analytics',
    subsectionDescription: 'Forecast package throughput, review outcomes, and timing metrics.',
    subsectionOrder: 10,
    subject: 'forecast operations analytics',
  },
  analytics_users: {
    category: 'analytics_reports',
    subsection: 'analytics_users',
    subsectionLabel: 'User Activity Analytics',
    subsectionDescription: 'Account activity and user participation metrics without user administration access.',
    subsectionOrder: 20,
    subject: 'user activity analytics',
  },
  analytics_system: {
    category: 'analytics_reports',
    subsection: 'analytics_system',
    subsectionLabel: 'System Operations Analytics',
    subsectionDescription: 'Operational health and system-level analytics summaries.',
    subsectionOrder: 30,
    subject: 'system operations analytics',
  },
  reports: {
    category: 'analytics_reports',
    subsection: 'reports',
    subsectionLabel: 'Reports',
    subsectionDescription: 'View, create, and approve operational reports.',
    subsectionOrder: 40,
    subject: 'reports',
  },
  calendar: {
    category: 'calendar',
    subsection: 'calendar',
    subsectionLabel: 'Calendar',
    subsectionDescription: 'WaveLab calendar information.',
    subsectionOrder: 10,
    subject: 'calendar',
  },
  settings: {
    category: 'system',
    subsection: 'settings_full',
    subsectionLabel: 'Settings - Full Access',
    subsectionDescription: 'Compatibility access spanning all Settings work areas.',
    subsectionOrder: 5,
    subject: 'system settings',
  },
  settings_schedule: {
    category: 'system',
    subsection: 'settings_schedule',
    subsectionLabel: 'Forecast Operations - Schedule & Policy',
    subsectionDescription: 'Operational timing, package windows, archive policy, and no-publication options.',
    subsectionOrder: 10,
    subject: 'Schedule & Policy settings',
  },
  settings_workspace: {
    category: 'system',
    subsection: 'settings_workspace',
    subsectionLabel: 'Forecaster Workspace - Workspace Defaults',
    subsectionDescription: 'Forecaster-facing helper copy, workspace defaults, and collaboration guidance.',
    subsectionOrder: 20,
    subject: 'Workspace Defaults settings',
  },
  settings_map_view: {
    category: 'system',
    subsection: 'settings_map_view',
    subsectionLabel: 'Forecaster Workspace - Map View',
    subsectionDescription: 'Default map center, zoom, bounds, and map-facing behavior.',
    subsectionOrder: 30,
    subject: 'Map View settings',
  },
  settings_review_targets: {
    category: 'system',
    subsection: 'settings_review_targets',
    subsectionLabel: 'Admin Review - Review Targets',
    subsectionDescription: 'Review SLA targets and admin-facing package resolution settings.',
    subsectionOrder: 40,
    subject: 'Review Targets settings',
  },
  settings_public_general: {
    category: 'system',
    subsection: 'settings_public_general',
    subsectionLabel: 'Public Site - General',
    subsectionDescription: 'General public dashboard branding and shared public-site configuration.',
    subsectionOrder: 50,
    subject: 'Public Site General settings',
  },
  settings_public_about: {
    category: 'system',
    subsection: 'settings_public_about',
    subsectionLabel: 'Public Site - About Page',
    subsectionDescription: 'Public About page content and presentation.',
    subsectionOrder: 60,
    subject: 'About Page settings',
  },
  settings_public_contact: {
    category: 'system',
    subsection: 'settings_public_contact',
    subsectionLabel: 'Public Site - Contact Page',
    subsectionDescription: 'Public Contact page content and presentation.',
    subsectionOrder: 70,
    subject: 'Contact Page settings',
  },
  chat: {
    category: 'internal_assistant',
    subsection: 'assistant',
    subsectionLabel: 'Internal Assistant',
    subsectionDescription: 'Internal assistant access and approved knowledge scopes.',
    subsectionOrder: 10,
    subject: 'internal assistant',
  },
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
  'settings_schedule.manage',
  'settings_workspace.manage',
  'settings_map_view.manage',
  'settings_review_targets.manage',
  'settings_public_general.manage',
  'settings_public_about.manage',
  'settings_public_contact.manage',
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
          subsection: presentation.subsection,
          subsectionLabel: presentation.subsectionLabel,
          subsectionDescription: presentation.subsectionDescription,
          subsectionOrder: presentation.subsectionOrder,
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

const PERMISSION_IMPLICATIONS = Object.freeze({
  'forecast.edit': ['forecast.view'],
  'forecast.submit': ['forecast.view'],
  'forecast.review': ['forecast.view'],
  'forecast.approve': ['forecast.review', 'forecast.view'],
  'forecast.publish': ['forecast.view'],
  'forecast.archive': ['forecast.view'],
  'analytics.view': ['analytics_forecast.view', 'analytics_users.view', 'analytics_system.view'],
  'analytics.export': ['analytics.view'],
  'settings.view': [
    'settings_schedule.view',
    'settings_workspace.view',
    'settings_map_view.view',
    'settings_review_targets.view',
    'settings_public_general.view',
    'settings_public_about.view',
    'settings_public_contact.view',
  ],
  'settings.manage': [
    'settings.view',
    'settings_schedule.manage',
    'settings_workspace.manage',
    'settings_map_view.manage',
    'settings_review_targets.manage',
    'settings_public_general.manage',
    'settings_public_about.manage',
    'settings_public_contact.manage',
  ],
  'settings_schedule.manage': ['settings_schedule.view'],
  'settings_workspace.manage': ['settings_workspace.view'],
  'settings_map_view.manage': ['settings_map_view.view'],
  'settings_review_targets.manage': ['settings_review_targets.view'],
  'settings_public_general.manage': ['settings_public_general.view'],
  'settings_public_about.manage': ['settings_public_about.view'],
  'settings_public_contact.manage': ['settings_public_contact.view'],
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

const applyPermissionImplications = (permissions) => {
  const result = new Set(permissions);
  let changed = true;

  while (changed) {
    changed = false;
    for (const [permission, impliedPermissions] of Object.entries(PERMISSION_IMPLICATIONS)) {
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

  return [...applyPermissionImplications(canonical)].sort();
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
