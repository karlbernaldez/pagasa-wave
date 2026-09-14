import { describe, expect, it } from 'vitest';
import { Navigate } from 'react-router-dom';

import ForecastRouteLayout from '@/features/forecasts/layout/ForecastRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';

import adminRoutes from './adminRoutes';
import forecastRoutes from './forecastRoutes';
import forecasterRoutes from './forecasterRoutes';
import publicRoutes from './publicRoutes';

function findRoute(routes, path) {
  for (const route of routes) {
    if (route.path === path) return route;
    const nested = findRoute(route.children || [], path);
    if (nested) return nested;
  }
  return null;
}

describe('forecast business routes', () => {
  it('uses the shared Forecast route layout', () => {
    expect(forecastRoutes).toHaveLength(1);
    expect(forecastRoutes[0].element.type).toBe(ForecastRouteLayout);
  });

  it('gates the package list by forecast.view', () => {
    const route = findRoute(forecastRoutes, '/forecasts');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(ProtectedRoute);
    expect(route.element.props.permission).toBe('forecast.view');
  });

  it('gates package detail by forecast.view', () => {
    const route = findRoute(forecastRoutes, '/forecasts/:packageId');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(ProtectedRoute);
    expect(route.element.props.permission).toBe('forecast.view');
  });

  it('gates the shared review queue by forecast.review', () => {
    const route = findRoute(forecastRoutes, '/forecasts/review');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(ProtectedRoute);
    expect(route.element.props.permission).toBe('forecast.review');
  });

  it('reserves /forecasts paths for the authenticated business area', () => {
    expect(findRoute(publicRoutes, '/forecasts')).toBeNull();
    expect(findRoute(publicRoutes, '/forecasts/:projectId')).toBeNull();
    expect(findRoute(publicRoutes, '/charts/:projectId')).toBeTruthy();
  });

  it('redirects the legacy package-library entry to /forecasts', () => {
    const route = findRoute(forecasterRoutes, '/studio');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(Navigate);
    expect(route.element.props.to).toBe('/forecasts');
    expect(route.element.props.replace).toBe(true);
  });

  it('redirects the legacy review entry to /forecasts/review', () => {
    const route = findRoute(adminRoutes, '/dashboard/review');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(Navigate);
    expect(route.element.props.to).toBe('/forecasts/review');
    expect(route.element.props.replace).toBe(true);
  });

  it('preserves the Studio project route behind studio.view', () => {
    const route = findRoute(forecasterRoutes, '/studio/:projectId');

    expect(route).toBeTruthy();
    expect(route.element.type).toBe(ProtectedRoute);
    expect(route.element.props.permission).toBe('studio.view');
  });
});
