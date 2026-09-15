const PERMISSION_LANDING_RULES = Object.freeze([
  { permissions: ['dashboard.view'], path: '/dashboard' },
  { permissions: ['forecast.review'], path: '/forecasts/review' },
  { permissions: ['forecast.view'], path: '/forecasts' },
  { permissions: ['wave_models.manage'], path: '/dashboard/wave-models' },
  { permissions: ['wave_pipeline.view'], path: '/dashboard/wave-models/pipeline' },
  { permissions: ['model_onboarding.view'], path: '/dashboard/wave-models/onboard' },
  { permissions: ['users.view'], path: '/dashboard/users' },
  { permissions: ['roles.view'], path: '/dashboard/users/roles' },
  {
    permissions: [
      'analytics.view',
      'analytics_forecast.view',
      'analytics_users.view',
      'analytics_system.view',
    ],
    path: '/dashboard/analytics',
  },
  { permissions: ['calendar.view'], path: '/dashboard/calendar' },
  {
    permissions: [
      'settings.view',
      'settings_schedule.view',
      'settings_workspace.view',
      'settings_map_view.view',
      'settings_review_targets.view',
      'settings_public_general.view',
      'settings_public_about.view',
      'settings_public_contact.view',
    ],
    path: '/dashboard/settings',
  },
]);

export function hasEffectivePermission(user, permission) {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
}

export function hasEveryEffectivePermission(user, permissions = []) {
  return permissions.every((permission) => hasEffectivePermission(user, permission));
}

export function hasAnyEffectivePermission(user, permissions = []) {
  return permissions.some((permission) => hasEffectivePermission(user, permission));
}

export function resolveAuthenticatedLandingPath(user, fallback = '/') {
  if (!user) return fallback;

  const rule = PERMISSION_LANDING_RULES.find(({ permissions }) =>
    hasAnyEffectivePermission(user, permissions)
  );

  return rule?.path ?? fallback;
}
