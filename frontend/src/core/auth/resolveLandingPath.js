const ADMIN_LANDING_ROUTES = Object.freeze([
  ['dashboard.view', '/dashboard'],
  ['projects.review', '/dashboard/review'],
  ['wave_models.manage', '/dashboard/wave-models'],
  ['wave_pipeline.view', '/dashboard/wave-models/pipeline'],
  ['model_onboarding.view', '/dashboard/wave-models/onboard'],
  ['users.view', '/dashboard/users'],
  ['roles.view', '/dashboard/users/roles'],
  ['analytics.view', '/dashboard/analytics'],
  ['settings.view', '/dashboard/settings'],
]);

export function hasEffectivePermission(user, permission) {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
}

export function resolveAuthenticatedLandingPath(user, fallback = '/') {
  if (!user) return fallback;

  if (user.role === 'admin') return '/dashboard';

  // Studio remains the primary operational workspace for forecaster-style custom user types.
  if (hasEffectivePermission(user, 'studio.view')) return '/studio';

  const adminRoute = ADMIN_LANDING_ROUTES.find(([permission]) =>
    hasEffectivePermission(user, permission)
  );
  if (adminRoute) return adminRoute[1];

  return user.role === 'user' ? '/' : fallback;
}
