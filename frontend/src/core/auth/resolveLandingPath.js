const PERMISSION_LANDING_ROUTES = Object.freeze([
  ['dashboard.view', '/dashboard'],
  ['forecast.review', '/dashboard/review'],
  ['studio.view', '/studio'],
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

export function hasEveryEffectivePermission(user, permissions = []) {
  return permissions.every((permission) => hasEffectivePermission(user, permission));
}

export function hasAnyEffectivePermission(user, permissions = []) {
  return permissions.some((permission) => hasEffectivePermission(user, permission));
}

export function resolveAuthenticatedLandingPath(user, fallback = '/') {
  if (!user) return fallback;

  const route = PERMISSION_LANDING_ROUTES.find(([permission]) =>
    hasEffectivePermission(user, permission)
  );

  return route?.[1] ?? fallback;
}
