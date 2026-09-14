import { describe, expect, it } from 'vitest';

import ProtectedRoute from '@/middleware/ProtectedRoute';

import forecastRoutes from './forecastRoutes';
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
  it('gates the package list by forecast.view', () => {
    const route = findRoute(forecastRoutes, '/forecasts');

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

  it('reserves the exact /forecasts path for the authenticated business area', () => {
    expect(findRoute(publicRoutes, '/forecasts')).toBeNull();
    expect(findRoute(publicRoutes, '/forecasts/:projectId')).toBeTruthy();
  });
});
