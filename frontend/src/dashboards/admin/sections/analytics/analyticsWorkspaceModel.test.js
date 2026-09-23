import { describe, expect, it } from 'vitest';

import {
  adaptiveBucketDays,
  bucketDateSeries,
  buildForecastDailySeries,
  buildForecastMetrics,
  buildPackagePerformanceRows,
  buildTimingRows,
  buildWorkflowFunnel,
  buildSystemMetrics,
  buildUserMetrics,
  contributionMixRows,
  formatComparisonDelta,
  getAllowedAnalyticsSections,
  publishedChartRows,
} from './analyticsWorkspaceModel';

describe('analytics workspace model', () => {
  it('returns only subsections granted by effective permissions', () => {
    const sections = getAllowedAnalyticsSections(
      new Set(['analytics_forecast.view', 'analytics_system.view'])
    );

    expect(sections.map((section) => section.id)).toEqual([
      'overview',
      'forecast',
      'public',
      'system',
    ]);
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

  it('builds workflow funnel values without inventing unavailable stages', () => {
    expect(
      buildWorkflowFunnel({
        summary: {
          submitted: 9,
          reviewStarted: 8,
          revisionRequests: 1,
          approvedEvents: 7,
          publishedEvents: 5,
        },
      })
    ).toEqual([
      { stage: 'Submitted', value: 9 },
      { stage: 'Review started', value: 8 },
      { stage: 'Revision requested', value: 1 },
      { stage: 'Approved', value: 7 },
      { stage: 'Published', value: 5 },
    ]);
  });

  it('normalizes timing analysis into table-ready rows with sample evidence', () => {
    expect(
      buildTimingRows({
        preparation: { medianHours: 2.1, sampleSize: 8 },
        reviewWait: { medianHours: 0.7, sampleSize: 9 },
      })
    ).toMatchObject([
      {
        stage: 'Preparation',
        medianHours: 2.1,
        p75Hours: null,
        p90Hours: null,
        sampleSize: 8,
      },
      {
        stage: 'Review wait',
        medianHours: 0.7,
        p75Hours: null,
        p90Hours: null,
        sampleSize: 9,
      },
      {
        stage: 'Review duration',
        medianHours: null,
        p75Hours: null,
        p90Hours: null,
        sampleSize: 0,
      },
      {
        stage: 'Publication delay',
        medianHours: null,
        p75Hours: null,
        p90Hours: null,
        sampleSize: 0,
      },
    ]);
  });

  it('normalizes package rows without adding identity or synthetic timing values', () => {
    expect(
      buildPackagePerformanceRows([
        {
          id: 'pkg-1',
          name: 'Forecast Package',
          status: 'Published',
          reviewDurationHours: '1.4',
        },
        {
          id: 'pkg-2',
          status: 'Submitted',
          reviewDurationHours: null,
        },
      ])
    ).toEqual([
      {
        id: 'pkg-1',
        forecastDate: undefined,
        name: 'Forecast Package',
        status: 'Published',
        submittedAt: null,
        reviewedAt: null,
        publishedAt: null,
        reviewDurationHours: 1.4,
        revisionCycles: 0,
      },
      {
        id: 'pkg-2',
        forecastDate: undefined,
        name: 'Forecast package',
        status: 'Submitted',
        submittedAt: null,
        reviewedAt: null,
        publishedAt: null,
        reviewDurationHours: null,
        revisionCycles: 0,
      },
    ]);
  });

  it('formats period comparison deltas without inventing a percentage when baseline is zero', () => {
    expect(formatComparisonDelta({ percentChange: 12.5 })).toBe('+12.5%');
    expect(formatComparisonDelta({ percentChange: -4 })).toBe('-4%');
    expect(
      formatComparisonDelta(
        { percentagePointChange: -3.2 },
        { percentagePoints: true }
      )
    ).toBe('-3.2 pp');
    expect(formatComparisonDelta({ percentChange: null })).toBeNull();
  });
});
