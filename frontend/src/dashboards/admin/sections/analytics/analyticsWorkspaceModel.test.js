import { describe, expect, it } from 'vitest';

import {
  adaptiveBucketDays,
  bucketDateSeries,
  buildForecastDailySeries,
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

    expect(sections.map((section) => section.id)).toEqual(['overview', 'forecast', 'public', 'system']);
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

  it('uses daily points up to 31 days and weekly buckets for longer periods', () => {
    expect(adaptiveBucketDays(30)).toBe(1);
    expect(adaptiveBucketDays(31)).toBe(1);
    expect(adaptiveBucketDays(60)).toBe(7);
    expect(adaptiveBucketDays(61)).toBe(7);
    expect(adaptiveBucketDays(90)).toBe(7);
  });

  it('reduces a 60-day trend to weekly buckets without losing totals', () => {
    const rows = [
      { date: '2026-07-19', views: 2 },
      { date: '2026-07-20', views: 3 },
      { date: '2026-09-16', views: 5 },
    ];

    const result = bucketDateSeries(rows, {
      start: '2026-07-19',
      end: '2026-09-16',
      valueFields: ['views'],
      dayCount: 60,
    });

    expect(result).toHaveLength(9);
    expect(result[0].views).toBe(5);
    expect(result.at(-1).views).toBe(5);
    expect(result.reduce((total, row) => total + row.views, 0)).toBe(10);
  });

  it('reduces a 90-day trend to weekly buckets and retains zero-value periods', () => {
    const result = bucketDateSeries(
      [
        { date: '2026-06-19', total: 4 },
        { date: '2026-09-16', total: 6 },
      ],
      {
        start: '2026-06-19',
        end: '2026-09-16',
        valueFields: ['total'],
        dayCount: 90,
      }
    );

    expect(result).toHaveLength(13);
    expect(result.reduce((total, row) => total + row.total, 0)).toBe(10);
    expect(result.some((row) => row.total === 0)).toBe(true);
  });

  it('anchors forecast daily series to the selected historical end date', () => {
    const result = buildForecastDailySeries(
      [{ forecastDate: '2026-06-30T00:00:00.000Z', status: 'Published' }],
      3,
      '2026-06-30'
    );

    expect(result.map((row) => row.date)).toEqual(['2026-06-28', '2026-06-29', '2026-06-30']);
    expect(result.at(-1)).toMatchObject({ completed: 1 });
  });
});
