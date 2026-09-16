import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONTRIBUTION_ACTIONS,
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from '../services/operationalAnalyticsService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const range = parseAnalyticsDateRange(
  { start: '2026-09-01', end: '2026-09-15' },
  new Date('2026-09-16T01:00:00.000Z')
);

test('user contributions use meaningful forecast workflow events and exclude styling or movement metrics', async () => {
  let capturedPipeline = null;
  const ForecastPackageModel = {
    aggregate: async (pipeline) => {
      capturedPipeline = pipeline;
      return [
        {
          totals: [{ count: 7 }],
          contributors: [{ count: 3 }],
          byAction: [
            { _id: 'submitted', count: 2 },
            { _id: 'chart_completion_updated', count: 5 },
          ],
          byDay: [
            { _id: { date: '2026-09-10', action: 'submitted' }, count: 2 },
            {
              _id: { date: '2026-09-10', action: 'chart_completion_updated' },
              count: 3,
            },
            {
              _id: { date: '2026-09-11', action: 'chart_completion_updated' },
              count: 2,
            },
          ],
        },
      ];
    },
  };

  const result = await loadUserContributionAnalytics(range, { ForecastPackageModel });
  const match = capturedPipeline.find((stage) => stage.$match)?.$match;

  assert.deepEqual(match['auditLogs.action'].$in, CONTRIBUTION_ACTIONS);
  assert.equal(CONTRIBUTION_ACTIONS.includes('chart_released'), false);
  assert.equal(
    CONTRIBUTION_ACTIONS.some((action) => /style|move|annotation/i.test(action)),
    false
  );
  assert.equal(match['auditLogs.timestamp'].$gte.toISOString(), range.startAt.toISOString());
  assert.equal(match['auditLogs.timestamp'].$lt.toISOString(), range.endExclusive.toISOString());
  assert.equal(result.totalEvents, 7);
  assert.equal(result.activeContributors, 3);
  assert.deepEqual(result.trend, [
    {
      date: '2026-09-10',
      total: 5,
      actions: { submitted: 2, chart_completion_updated: 3 },
    },
    {
      date: '2026-09-11',
      total: 2,
      actions: { chart_completion_updated: 2 },
    },
  ]);
});

test('user contribution analytics expose no participant identity or profile fields', async () => {
  const ForecastPackageModel = {
    aggregate: async () => [
      {
        totals: [{ count: 1 }],
        contributors: [{ count: 1 }],
        byAction: [{ _id: 'approved', count: 1 }],
        byDay: [{ _id: { date: '2026-09-12', action: 'approved' }, count: 1 }],
      },
    ],
  };

  const result = await loadUserContributionAnalytics(range, { ForecastPackageModel });
  const serialized = JSON.stringify(result).toLowerCase();

  for (const forbidden of ['email', 'phone', 'firstname', 'lastname', 'username', 'performedby']) {
    assert.equal(serialized.includes(forbidden), false, `unexpected PII field: ${forbidden}`);
  }
});

test('published chart views keep today independent from the selected period and expose only public-safe chart fields', async () => {
  let capturedPipeline = null;
  const PublishedChartViewModel = {
    aggregate: async (pipeline) => {
      capturedPipeline = pipeline;
      return [
        {
          totals: [{ count: 12 }],
          today: [{ count: 4 }],
          byDay: [
            { _id: '2026-09-14', count: 5 },
            { _id: '2026-09-15', count: 7 },
          ],
          topCharts: [
            {
              projectId: '507f1f77bcf86cd799439011',
              name: '24-Hour Forecast',
              chartType: 'forecast_24h',
              forecastDate: new Date('2026-09-15T00:00:00.000Z'),
              publishedAt: new Date('2026-09-15T02:00:00.000Z'),
              views: 8,
            },
          ],
        },
      ];
    },
  };

  const result = await loadPublishedChartViewAnalytics(range, {
    PublishedChartViewModel,
    currentDateKey: '2026-09-16',
  });
  const facet = capturedPipeline[0].$facet;
  const periodMatch = facet.totals[0].$match.viewedAt;
  const lookupIndex = facet.topCharts.findIndex((stage) => stage.$lookup);
  const sortIndex = facet.topCharts.findIndex((stage) => stage.$sort);
  const limitIndex = facet.topCharts.findIndex((stage) => stage.$limit);
  const lookup = facet.topCharts[lookupIndex].$lookup;

  assert.equal(periodMatch.$gte.toISOString(), range.startAt.toISOString());
  assert.equal(periodMatch.$lt.toISOString(), range.endExclusive.toISOString());
  assert.deepEqual(facet.today[0], { $match: { dateKey: '2026-09-16' } });
  assert.deepEqual(facet.byDay[0], { $match: { viewedAt: periodMatch } });
  assert.deepEqual(facet.topCharts[0], { $match: { viewedAt: periodMatch } });
  assert.ok(lookupIndex < sortIndex);
  assert.ok(sortIndex < limitIndex);
  assert.deepEqual(lookup.pipeline[0], { $match: { status: 'Published' } });
  assert.deepEqual(Object.keys(lookup.pipeline[1].$project).sort(), [
    '_id',
    'chartType',
    'forecastDate',
    'name',
    'publishedAt',
  ]);
  assert.equal(result.totalViews, 12);
  assert.equal(result.viewsToday, 4);
  assert.deepEqual(result.trend, [
    { date: '2026-09-14', views: 5 },
    { date: '2026-09-15', views: 7 },
  ]);
});
