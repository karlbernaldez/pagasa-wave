import { describe, expect, it } from 'vitest';
import { Navigate } from 'react-router-dom';

import OperationalDashboardRouteLayout from '@/features/dashboard/OperationalDashboardRouteLayout';

import operationalDashboardRoutes from './operationalDashboardRoutes';

function findRoute(routes, path) {
  for (const route of routes) {
    if (route.path === path) return route;
    const nested = findRoute(route.children || [], path);
    if (nested) return nested;
  }
  return null;
}

describe('operational dashboard routes', () => {
  it('uses the shared operational dashboard layout', () => {
    expect(operationalDashboardRoutes[0].element.type).toBe(OperationalDashboardRouteLayout);
  });

  it('owns the canonical /dashboard route in the shared route tree', () => {
    expect(findRoute(operationalDashboardRoutes, '/dashboard')).toBeTruthy();
  });

  it('keeps Forecast review outside the Dashboard workflow', () => {
    const route = findRoute(operationalDashboardRoutes, '/dashboard/review');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(Navigate);
    expect(route.element.props.to).toBe('/forecasts/review');
    expect(route.element.props.replace).toBe(true);
  });

  it('redirects legacy Dashboard account routes to canonical account routes', () => {
    const accountRoute = findRoute(operationalDashboardRoutes, '/dashboard/account');
    const securityRoute = findRoute(
      operationalDashboardRoutes,
      '/dashboard/account/security'
    );

    expect(accountRoute.element.type).toBe(Navigate);
    expect(accountRoute.element.props.to).toBe('/account');
    expect(securityRoute.element.type).toBe(Navigate);
    expect(securityRoute.element.props.to).toBe('/account/security');
  });
});
