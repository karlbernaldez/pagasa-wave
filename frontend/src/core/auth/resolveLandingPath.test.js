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
      expect(hasEffectivePermission(user(role, ['forecast.review']), 'forecast.review')).toBe(true);
      expect(hasEffectivePermission(user(role, []), 'forecast.review')).toBe(false);
    }
  });

  it('supports all-of and any-of permission checks without role shortcuts', () => {
    const reviewer = user('custom-reviewer', ['forecast.view', 'forecast.review']);

    expect(hasEveryEffectivePermission(reviewer, ['forecast.view', 'forecast.review'])).toBe(true);
    expect(hasEveryEffectivePermission(reviewer, ['forecast.review', 'forecast.approve'])).toBe(false);
    expect(hasAnyEffectivePermission(reviewer, ['forecast.approve', 'forecast.review'])).toBe(true);
    expect(hasAnyEffectivePermission(user('admin', []), ['forecast.review'])).toBe(false);
  });

  it('sends a reviewer-only custom User Type to the review workspace', () => {
    expect(resolveAuthenticatedLandingPath(user('duty_reviewer', ['forecast.review']), '/')).toBe(
      '/dashboard/review'
    );
  });

  it('sends a Studio-capable arbitrary User Type to Studio', () => {
    expect(resolveAuthenticatedLandingPath(user('anything', ['studio.view']), '/')).toBe('/studio');
  });

  it('does not grant an admin-named User Type a landing route without permissions', () => {
    expect(resolveAuthenticatedLandingPath(user('admin', []), '/')).toBe('/');
  });

  it('uses permission priority rather than role priority', () => {
    expect(
      resolveAuthenticatedLandingPath(
        user('forecaster', ['dashboard.view', 'forecast.review', 'studio.view']),
        '/'
      )
    ).toBe('/dashboard');

    expect(
      resolveAuthenticatedLandingPath(user('admin', ['forecast.review', 'studio.view']), '/')
    ).toBe('/dashboard/review');
  });
});
