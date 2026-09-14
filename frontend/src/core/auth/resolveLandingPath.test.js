import { describe, expect, it } from 'vitest';

import {
  hasAnyEffectivePermission,
  hasEffectivePermission,
  hasEveryEffectivePermission,
  resolveAuthenticatedLandingPath,
} from './resolveLandingPath';

const user = (role, permissions = []) => ({ role, permissions });

describe('permission-driven frontend authorization helpers', () => {
  it('ignores User Type names when evaluating a permission', () => {
    const roles = ['admin', 'forecaster', 'duty_reviewer', 'shift-lead', 'marine_ops'];

    for (const role of roles) {
      const withReview = user(role, ['forecast.review']);
      const withoutReview = user(role, []);

      expect(hasEffectivePermission(withReview, 'forecast.review')).toBe(true);
      expect(hasEffectivePermission(withoutReview, 'forecast.review')).toBe(false);
    }
  });

  it('supports all-of and any-of permission checks without role shortcuts', () => {
    const reviewer = user('custom-reviewer', ['forecast.view', 'forecast.review']);
    const required = ['forecast.view', 'forecast.review'];
    const missingApprove = ['forecast.review', 'forecast.approve'];
    const anyReview = ['forecast.approve', 'forecast.review'];

    expect(hasEveryEffectivePermission(reviewer, required)).toBe(true);
    expect(hasEveryEffectivePermission(reviewer, missingApprove)).toBe(false);
    expect(hasAnyEffectivePermission(reviewer, anyReview)).toBe(true);
    expect(hasAnyEffectivePermission(user('admin', []), ['forecast.review'])).toBe(false);
  });

  it('sends a reviewer-only custom User Type to the shared review queue', () => {
    const reviewer = user('duty_reviewer', ['forecast.review']);
    const landing = resolveAuthenticatedLandingPath(reviewer, '/');

    expect(landing).toBe('/forecasts/review');
  });

  it('sends a Forecast-capable arbitrary User Type to the canonical Forecast entry', () => {
    const forecastUser = user('anything', ['forecast.view']);

    expect(resolveAuthenticatedLandingPath(forecastUser, '/')).toBe('/forecasts');
  });

  it('does not use Studio permission as a generic landing route without a project', () => {
    const studioOnlyUser = user('anything', ['studio.view']);

    expect(resolveAuthenticatedLandingPath(studioOnlyUser, '/')).toBe('/');
  });

  it('does not grant an admin-named User Type a landing route without permissions', () => {
    expect(resolveAuthenticatedLandingPath(user('admin', []), '/')).toBe('/');
  });

  it('uses permission priority rather than role priority', () => {
    const combined = user('forecaster', [
      'dashboard.view',
      'forecast.review',
      'forecast.view',
      'studio.view',
    ]);
    const reviewer = user('admin', ['forecast.review', 'forecast.view', 'studio.view']);
    const forecastOnly = user('admin', ['forecast.view', 'studio.view']);

    expect(resolveAuthenticatedLandingPath(combined, '/')).toBe('/dashboard');
    expect(resolveAuthenticatedLandingPath(reviewer, '/')).toBe('/forecasts/review');
    expect(resolveAuthenticatedLandingPath(forecastOnly, '/')).toBe('/forecasts');
  });
});
