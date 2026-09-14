import { describe, expect, it } from 'vitest';

import { ADMIN_ROUTE_BY_TAB, ADMIN_TABS } from '@dashboards/admin/constants/navigation';
import { buildDashboardSidebarGroups } from './OperationalDashboardShell';

function visibleItemIds(groups) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => [item.id, ...(item.children ?? []).map((child) => child.id)])
  );
}

function findItem(groups, id) {
  for (const group of groups) {
    const item = group.items.find((candidate) => candidate.id === id);
    if (item) return item;
  }
  return null;
}

const FULL_OPERATIONAL_PERMISSIONS = [
  'dashboard.view',
  'forecast.view',
  'forecast.review',
  'wave_models.manage',
  'wave_pipeline.view',
  'model_onboarding.view',
  'users.view',
  'roles.view',
  'analytics.view',
  'calendar.view',
  'settings.view',
];

describe('OperationalDashboardShell permission-driven navigation', () => {
  it('shows identical navigation for arbitrary User Types with identical permissions', () => {
    const administrator = visibleItemIds(
      buildDashboardSidebarGroups({ role: 'admin', permissions: FULL_OPERATIONAL_PERMISSIONS })
    );
    const customType = visibleItemIds(
      buildDashboardSidebarGroups({
        role: 'marine_ops_lead',
        permissions: FULL_OPERATIONAL_PERMISSIONS,
      })
    );

    expect(customType).toEqual(administrator);
  });

  it('does not grant navigation from the admin User Type name alone', () => {
    const groups = buildDashboardSidebarGroups({ role: 'admin', permissions: [] });

    expect(visibleItemIds(groups)).toEqual([]);
  });

  it('shows Forecast with Forecast Packages for forecast.view only', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'package_viewer',
      permissions: ['forecast.view'],
    });
    const forecast = findItem(groups, ADMIN_TABS.FORECAST);

    expect(forecast).toBeTruthy();
    expect(forecast.path).toBe('/forecasts');
    expect(forecast.children.map((child) => child.id)).toEqual([ADMIN_TABS.FORECAST_PACKAGES]);
  });

  it('shows Forecast with Review Queue for forecast.review only', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'reviewer',
      permissions: ['forecast.review'],
    });
    const forecast = findItem(groups, ADMIN_TABS.FORECAST);

    expect(forecast).toBeTruthy();
    expect(forecast.path).toBe('/forecasts/review');
    expect(forecast.children.map((child) => child.id)).toEqual([ADMIN_TABS.FORECAST_REVIEW]);
  });

  it('hides Forecast Packages without forecast.view', () => {
    const ids = visibleItemIds(
      buildDashboardSidebarGroups({ role: 'reviewer', permissions: ['forecast.review'] })
    );

    expect(ids).not.toContain(ADMIN_TABS.FORECAST_PACKAGES);
  });

  it('hides Review Queue without forecast.review', () => {
    const ids = visibleItemIds(
      buildDashboardSidebarGroups({ role: 'package_viewer', permissions: ['forecast.view'] })
    );

    expect(ids).not.toContain(ADMIN_TABS.FORECAST_REVIEW);
  });

  it('routes Forecast Packages and Review Queue to their canonical paths', () => {
    expect(ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_PACKAGES]).toBe('/forecasts');
    expect(ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_REVIEW]).toBe('/forecasts/review');
  });

  it('keeps Dashboard, Models, Management, and System permission-gated', () => {
    const forecastOnlyIds = visibleItemIds(
      buildDashboardSidebarGroups({ role: 'forecast_only', permissions: ['forecast.view'] })
    );

    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.DASHBOARD);
    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.WAVE_MODELS);
    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.USERS);
    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.ANALYTICS);
    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.CALENDAR);
    expect(forecastOnlyIds).not.toContain(ADMIN_TABS.SETTINGS);

    const fullIds = visibleItemIds(
      buildDashboardSidebarGroups({
        role: 'operations_lead',
        permissions: FULL_OPERATIONAL_PERMISSIONS,
      })
    );

    expect(fullIds).toContain(ADMIN_TABS.DASHBOARD);
    expect(fullIds).toContain(ADMIN_TABS.WAVE_MODELS);
    expect(fullIds).toContain(ADMIN_TABS.WAVE_PIPELINE);
    expect(fullIds).toContain(ADMIN_TABS.WAVE_MODEL_ONBOARDING);
    expect(fullIds).toContain(ADMIN_TABS.USERS);
    expect(fullIds).toContain(ADMIN_TABS.USERS_ROLES);
    expect(fullIds).toContain(ADMIN_TABS.ANALYTICS);
    expect(fullIds).toContain(ADMIN_TABS.CALENDAR);
    expect(fullIds).toContain(ADMIN_TABS.SETTINGS);
  });

  it('shows User Types only when roles.view is present', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'operations_lead',
      permissions: ['dashboard.view', 'users.view', 'roles.view'],
    });

    const ids = visibleItemIds(groups);

    expect(ids).toContain(ADMIN_TABS.USERS);
    expect(ids).toContain(ADMIN_TABS.USERS_LIST);
    expect(ids).toContain(ADMIN_TABS.USERS_ROLES);
  });
});
