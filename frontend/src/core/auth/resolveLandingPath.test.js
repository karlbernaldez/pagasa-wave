import { describe, expect, it } from 'vitest';

import { resolveAuthenticatedLandingPath } from './resolveLandingPath';

describe('resolveAuthenticatedLandingPath', () => {
  it('keeps built-in administrators on the admin dashboard', () => {
    expect(
      resolveAuthenticatedLandingPath({
        role: 'admin',
        permissions: ['studio.view', 'projects.review', 'dashboard.view'],
      })
    ).toBe('/dashboard');
  });

  it('keeps combined forecaster-reviewer user types in Studio as their primary workspace', () => {
    expect(
      resolveAuthenticatedLandingPath({
        role: 'forecaster_reviewer',
        permissions: ['studio.view', 'studio.edit', 'projects.review'],
      })
    ).toBe('/studio');
  });

  it('sends reviewer-only user types to the forecast review workspace', () => {
    expect(
      resolveAuthenticatedLandingPath({
        role: 'reviewer',
        permissions: ['projects.review'],
      })
    ).toBe('/dashboard/review');
  });

  it('sends basic registered users to the public landing page', () => {
    expect(resolveAuthenticatedLandingPath({ role: 'user', permissions: [] })).toBe('/');
  });
});
