import assert from 'node:assert/strict';
import test from 'node:test';

import { getDashboardOverview } from '../services/dashboardOverviewOperationalService.js';

const baseOverview = {
  meta: { partial: false },
  summaryCards: [],
  errors: [],
};

const systemPayload = {
  users: { total: 4, active: 3, statusCounts: { active: 3, pending: 1 } },
  forecastPackages: { total: 5, statusCounts: { Published: 3, Submitted: 2 } },
  publishedChartViews: {
    totalViews: 21,
    viewsToday: 5,
    trend: [{ date: '2026-09-15', views: 5 }],
    topCharts: [],
  },
};

test('dashboard does not fetch user or system analytics without corresponding permissions', async () => {
  let userFetched = false;
  let systemFetched = false;
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'forecast.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-16T01:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadUserAnalytics: async () => {
        userFetched = true;
        return {};
      },
      loadSystemAnalytics: async () => {
        systemFetched = true;
        return systemPayload;
      },
    }
  );

  assert.equal(userFetched, false);
  assert.equal(systemFetched, false);
  assert.equal(result.userAnalytics, undefined);
  assert.equal(result.systemAnalytics, undefined);
  assert.deepEqual(result.summaryCards, []);
});

test('dashboard fetches only aggregate user analytics when user analytics permission is granted', async () => {
  let systemFetched = false;
  const userAnalytics = {
    total: 3,
    statusCounts: { active: 2, pending: 1 },
    roleCounts: { forecaster: 2, administrator: 1 },
    contributions: {
      totalEvents: 8,
      activeContributors: 2,
      actionMix: [{ action: 'approved', label: 'Approved', count: 3 }],
      trend: [{ date: '2026-09-15', total: 3, actions: { approved: 3 } }],
    },
  };

  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_users.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-15T03:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadUserAnalytics: async () => userAnalytics,
      loadSystemAnalytics: async () => {
        systemFetched = true;
        return systemPayload;
      },
    }
  );

  assert.deepEqual(result.userAnalytics, userAnalytics);
  assert.equal(systemFetched, false);
  assert.equal(result.systemAnalytics, undefined);
  assert.equal(JSON.stringify(result.userAnalytics).includes('email'), false);
});

test('dashboard fetches and composes aggregate system analytics when permitted', async () => {
  let receivedDateKey = null;
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_system.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-15T03:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadSystemAnalytics: async (_range, options) => {
        receivedDateKey = options.currentDateKey;
        return systemPayload;
      },
    }
  );

  assert.equal(receivedDateKey, '2026-09-15');
  assert.deepEqual(result.systemAnalytics, systemPayload);
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

test('dashboard keeps other sources available when user analytics fail', async () => {
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_users.view', 'analytics_system.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
      now: new Date('2026-09-15T03:00:00.000Z'),
    },
    {
      getBaseOverview: async () => baseOverview,
      loadUserAnalytics: async () => {
        throw new Error('user analytics unavailable');
      },
      loadSystemAnalytics: async () => systemPayload,
    }
  );

  assert.equal(result.meta.partial, true);
  assert.equal(result.userAnalytics, null);
  assert.deepEqual(result.systemAnalytics, systemPayload);
  assert.equal(result.errors.some((error) => error.source === 'user_analytics'), true);
});

test('dashboard degrades to partial data when system analytics fail', async () => {
  const result = await getDashboardOverview(
    {
      permissions: ['dashboard.view', 'analytics_system.view'],
      query: { start: '2026-09-01', end: '2026-09-15' },
    },
    {
      getBaseOverview: async () => baseOverview,
      loadSystemAnalytics: async () => {
        throw new Error('system analytics unavailable');
      },
    }
  );

  assert.equal(result.meta.partial, true);
  assert.equal(result.systemAnalytics, null);
  assert.equal(result.publishedChartViews, null);
  assert.equal(result.errors.at(-1).source, 'system_analytics');
});
