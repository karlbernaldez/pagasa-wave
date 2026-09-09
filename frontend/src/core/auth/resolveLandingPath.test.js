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

  it('sends a reviewer-only custom User Type to the review workspace', () => {
    const reviewer = user('duty_reviewer', ['forecast.review']);
    const landing = resolveAuthenticatedLandingPath(reviewer, '/');

    expect(landing).toBe('/dashboard/review');
  });

  it('sends a Studio-capable arbitrary User Type to Studio', () => {
    const studioUser = user('anything', ['studio.view']);

    expect(resolveAuthenticatedLandingPath(studioUser, '/')).toBe('/studio');
  });

  it('does not grant an admin-named User Type a landing route without permissions', () => {
    expect(resolveAuthenticatedLandingPath(user('admin', []), '/')).toBe('/');
  });

  it('uses permission priority rather than role priority', () => {
    const combined = user('forecaster', [
      'dashboard.view',
      'forecast.review',
      'studio.view',
    ]);
    const reviewer = user('admin', ['forecast.review', 'studio.view']);

    expect(resolveAuthenticatedLandingPath(combined, '/')).toBe('/dashboard');
    expect(resolveAuthenticatedLandingPath(reviewer, '/')).toBe('/dashboard/review');
  });
});
