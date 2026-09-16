import assert from 'node:assert/strict';
import test from 'node:test';

import { getDashboardOverview } from '../services/dashboardOverviewOperationalService.js';

const baseOverview = {
  meta: { partial: false },
  summaryCards: [],
  errors: [],
};

test('dashboard does not fetch published chart view analytics without system analytics permission', async () => {
  let publicViewsFetched = false;
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'forecast.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-16T01:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadPublishedViews: async () => {
        publicViewsFetched = true;
        return { totalViews: 99 };
      },
    }
  );

  assert.equal(publicViewsFetched, false);
  assert.equal(result.publishedChartViews, undefined);
  assert.deepEqual(result.summaryCards, []);
});

test('dashboard fetches and composes aggregate public views when permitted', async () => {
  let receivedDateKey = null;
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_system.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-15T03:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadPublishedViews: async (_range, options) => {
        receivedDateKey = options.currentDateKey;
        return {
          totalViews: 21,
          viewsToday: 5,
          trend: [{ date: '2026-09-15', views: 5 }],
          topCharts: [],
        };
      },
    }
  );

  assert.equal(receivedDateKey, '2026-09-15');
  assert.equal(result.publishedChartViews.totalViews, 21);
  assert.deepEqual(result.summaryCards, [
    {
      key: 'published_chart_views',
      label: 'Published Chart Views',
      value: 21,
      format: 'integer',
      tone: 'info',
      icon: 'views',
    },
  ]);
});

test('dashboard degrades to partial data when published chart view analytics fail', async () => {
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_system.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
    },
    {
      getBaseOverview: async () => baseOverview,
      loadPublishedViews: async () => {
        throw new Error('view store unavailable');
      },
    }
  );

  assert.equal(result.meta.partial, true);
  assert.equal(result.publishedChartViews, null);
  assert.equal(result.errors.at(-1).source, 'published_chart_views');
});
