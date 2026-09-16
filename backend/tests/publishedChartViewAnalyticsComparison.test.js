import assert from 'node:assert/strict';
import test from 'node:test';

import { loadPublishedChartViewAnalytics } from '../services/operationalAnalyticsService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const range = parseAnalyticsDateRange(
  { start: '2026-09-01', end: '2026-09-16' },
  new Date('2026-09-16T04:00:00.000Z')
);

test('published chart view analytics separate visit date, all-time total, and yesterday comparison', async () => {
  let capturedPipeline = null;
  const PublishedChartViewModel = {
    aggregate: async (pipeline) => {
      capturedPipeline = pipeline;
      return [
        {
          totals: [{ count: 12 }],
          allTime: [{ count: 40 }],
          today: [{ count: 6 }],
          yesterday: [{ count: 4 }],
          byDay: [
            { _id: '2026-09-15', count: 4 },
            { _id: '2026-09-16', count: 6 },
          ],
          topCharts: [],
        },
      ];
    },
  };

  const result = await loadPublishedChartViewAnalytics(range, {
    PublishedChartViewModel,
    currentDateKey: '2026-09-16',
  });

  const facet = capturedPipeline[0].$facet;
  assert.deepEqual(facet.today[0], { $match: { dateKey: '2026-09-16' } });
  assert.deepEqual(facet.yesterday[0], { $match: { dateKey: '2026-09-15' } });
  assert.deepEqual(facet.allTime, [{ $count: 'count' }]);
  assert.equal(result.totalViews, 12);
  assert.equal(result.allTimeViews, 40);
  assert.equal(result.viewsToday, 6);
  assert.equal(result.viewsYesterday, 4);
  assert.deepEqual(result.dayOverDay, {
    direction: 'up',
    percent: 50,
    previousValue: 4,
  });
});

test('day-over-day comparison reports new activity instead of dividing by zero', async () => {
  const PublishedChartViewModel = {
    aggregate: async () => [
      {
        totals: [{ count: 2 }],
        allTime: [{ count: 2 }],
        today: [{ count: 2 }],
        yesterday: [],
        byDay: [{ _id: '2026-09-16', count: 2 }],
        topCharts: [],
      },
    ],
  };

  const result = await loadPublishedChartViewAnalytics(range, {
    PublishedChartViewModel,
    currentDateKey: '2026-09-16',
  });

  assert.deepEqual(result.dayOverDay, {
    direction: 'new',
    percent: null,
    previousValue: 0,
  });
});
