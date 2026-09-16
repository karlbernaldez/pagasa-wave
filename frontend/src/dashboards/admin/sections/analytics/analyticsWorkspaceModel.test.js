import { describe, expect, it } from 'vitest';

import {
  buildForecastMetrics,
  buildSystemMetrics,
  buildUserMetrics,
  contributionMixRows,
  getAllowedAnalyticsSections,
  publishedChartRows,
} from './analyticsWorkspaceModel';

describe('analytics workspace model', () => {
  it('returns only subsections granted by effective permissions', () => {
    const sections = getAllowedAnalyticsSections(
      new Set(['analytics_forecast.view', 'analytics_system.view'])
    );

    expect(sections.map((section) => section.id)).toEqual(['forecast', 'system']);
  });

  it('does not infer analytics access from unrelated permissions', () => {
    expect(getAllowedAnalyticsSections(['users.view', 'forecast.review'])).toEqual([]);
  });

  it('builds forecast workload metrics from scoped status counts', () => {
    expect(
      buildForecastMetrics({
        total: 20,
        sampleSize: 12,
        statusCounts: {
          Submitted: 2,
          'Under Review': 3,
          'Revision Requested': 2,
          Rejected: 1,
          Approved: 4,
          Published: 6,
          Archived: 2,
        },
      })
    ).toMatchObject({
      total: 20,
      sampleSize: 12,
      inReview: 5,
      returned: 3,
      approved: 10,
      published: 6,
      archived: 2,
      completionRate: 50,
    });
  });

  it('builds user activity metrics from aggregate operational participation without profile fields', () => {
    expect(
      buildUserMetrics({
        total: 10,
        statusCounts: { active: 7, pending: 1, suspended: 1, locked: 1 },
        contributions: { totalEvents: 26, activeContributors: 5 },
      })
    ).toEqual({
      total: 10,
      active: 7,
      pending: 1,
      suspended: 2,
      inactive: 0,
      activeRate: 70,
      contributionEvents: 26,
      activeContributors: 5,
    });
  });

  it('normalizes contribution mix without participant identities or ranking fields', () => {
    expect(
      contributionMixRows({
        actionMix: [
          { action: 'submitted', label: 'Package submitted', count: 4 },
          { action: 'approved', label: 'Approved', count: 3 },
        ],
      })
    ).toEqual([
      { label: 'Package submitted', value: 4 },
      { label: 'Approved', value: 3 },
    ]);
  });

  it('builds system readiness and published view metrics from aggregate-only payloads', () => {
    expect(
      buildSystemMetrics({
        users: {
          total: 8,
          active: 6,
          statusCounts: { pending: 2 },
        },
        forecastPackages: {
          total: 12,
          statusCounts: {
            Submitted: 1,
            'Under Review': 2,
            'Revision Requested': 1,
            Rejected: 1,
            Published: 5,
          },
        },
        publishedChartViews: { totalViews: 31, viewsToday: 6 },
      })
    ).toEqual({
      totalUsers: 8,
      activeUsers: 6,
      totalPackages: 12,
      activeUserRate: 75,
      packagesInReview: 3,
      packagesReturned: 2,
      packagesPublished: 5,
      usersPending: 2,
      publishedViews: 31,
      viewsToday: 6,
    });
  });

  it('normalizes most-viewed charts as aggregate distribution rows', () => {
    expect(
      publishedChartRows({
        topCharts: [
          { name: 'Analysis', views: 12 },
          { name: '24-Hour Forecast', views: 8 },
        ],
      })
    ).toEqual([
      { label: 'Analysis', value: 12 },
      { label: '24-Hour Forecast', value: 8 },
    ]);
  });
});
