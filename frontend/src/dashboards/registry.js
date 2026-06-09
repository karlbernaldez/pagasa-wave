export const DASHBOARD_IDS = Object.freeze({
  PUBLIC: 'public',
  FORECASTER: 'forecaster',
  ADMIN: 'admin',
});

export const DASHBOARD_REGISTRY = Object.freeze({
  [DASHBOARD_IDS.PUBLIC]: {
    id: DASHBOARD_IDS.PUBLIC,
    name: 'Public Site',
    basePath: '/',
    owner: 'product',
    appBoundary: 'public',
  },
  [DASHBOARD_IDS.FORECASTER]: {
    id: DASHBOARD_IDS.FORECASTER,
    name: 'Forecaster Workspace',
    basePath: '/projects',
    owner: 'forecasting',
    appBoundary: 'dashboards/forecaster',
  },
  [DASHBOARD_IDS.ADMIN]: {
    id: DASHBOARD_IDS.ADMIN,
    name: 'Admin Console',
    basePath: '/dashboard',
    owner: 'operations',
    appBoundary: 'dashboards/admin',
  },
});

export function getDashboardConfig(id) {
  return DASHBOARD_REGISTRY[id];
}
