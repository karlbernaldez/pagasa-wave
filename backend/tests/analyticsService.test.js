import assert from 'node:assert/strict';
import test from 'node:test';

import { loadForecastAnalytics, loadSystemAnalytics } from '../services/analyticsService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const range = parseAnalyticsDateRange(
  { start: '2026-09-01', end: '2026-09-30' },
  new Date('2026-10-01T00:00:00.000Z')
);

test('forecast analytics use audit event timestamps for throughput and median workflow timing', async () => {
  const packages = [
    {
      _id: 'package-1',
      name: 'Daily Forecast',
      forecastDate: new Date('2026-09-10T00:00:00.000Z'),
      status: 'Published',
      auditLogs: [
        { action: 'chart_claimed', timestamp: new Date('2026-09-10T00:00:00.000Z') },
        { action: 'submitted', timestamp: new Date('2026-09-10T02:00:00.000Z') },
        { action: 'review_started', timestamp: new Date('2026-09-10T03:00:00.000Z') },
        { action: 'approved', timestamp: new Date('2026-09-10T04:00:00.000Z') },
        { action: 'published', timestamp: new Date('2026-09-10T05:00:00.000Z') },
      ],
    },
  ];

  const query = {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    lean: async () => packages,
  };
  let aggregateCall = 0;
  const ForecastPackageModel = {
    find: () => query,
    aggregate: async (pipeline) => {
      aggregateCall += 1;
      if (pipeline.some((stage) => stage.$facet)) {
        return [
          {
            byAction: [
              { _id: 'submitted', count: 1 },
              { _id: 'approved', count: 1 },
              { _id: 'published', count: 1 },
            ],
            byDay: [
              { _id: { date: '2026-09-10', action: 'submitted' }, count: 1 },
              { _id: { date: '2026-09-10', action: 'approved' }, count: 1 },
              { _id: { date: '2026-09-10', action: 'published' }, count: 1 },
            ],
          },
        ];
      }
      return [{ _id: 'Published', count: 1 }];
    },
  };

  const result = await loadForecastAnalytics(range, { ForecastPackageModel });

  assert.equal(aggregateCall, 2);
  assert.equal(result.summary.submitted, 1);
  assert.equal(result.summary.publishedEvents, 1);
  assert.equal(result.summary.completionRate, 100);
  assert.deepEqual(result.throughput, [
    { date: '2026-09-10', submitted: 1, completed: 2, returned: 0 },
  ]);
  assert.deepEqual(result.timing.preparation, { medianHours: 2, sampleSize: 1 });
  assert.deepEqual(result.timing.reviewWait, { medianHours: 1, sampleSize: 1 });
  assert.deepEqual(result.timing.reviewDuration, { medianHours: 1, sampleSize: 1 });
  assert.deepEqual(result.timing.publicationDelay, { medianHours: 1, sampleSize: 1 });
});

test('forecast timing excludes incomplete historical samples instead of manufacturing zero durations', async () => {
  const query = {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    lean: async () => [
      {
        _id: 'package-2',
        name: 'Historical Forecast',
        forecastDate: new Date('2026-09-11T00:00:00.000Z'),
        status: 'Submitted',
        auditLogs: [{ action: 'submitted', timestamp: new Date('2026-09-11T02:00:00.000Z') }],
      },
    ],
  };
  const ForecastPackageModel = {
    find: () => query,
    aggregate: async (pipeline) =>
      pipeline.some((stage) => stage.$facet)
        ? [{ byAction: [{ _id: 'submitted', count: 1 }], byDay: [] }]
        : [{ _id: 'Submitted', count: 1 }],
  };

  const result = await loadForecastAnalytics(range, { ForecastPackageModel });

  assert.deepEqual(result.timing.preparation, { medianHours: null, sampleSize: 0 });
  assert.deepEqual(result.timing.reviewDuration, { medianHours: null, sampleSize: 0 });
});

test('system analytics derive readiness from dynamic pipeline models without hard-coded model names', async () => {
  const result = await loadSystemAnalytics(range, {
    getPipelineStatus: async () => ({
      generatedAt: '2026-09-23T01:00:00.000Z',
      packageDate: '2026-09-23',
      models: [
        {
          model: 'CUSTOM_A',
          modelId: '1',
          modelLabel: 'Custom A',
          state: 'READY',
          requiredSourceCycle: '2026092218',
          sourceCycle: '2026092218',
          published: true,
          frameCount: 21,
          expectedFrameCount: 21,
        },
        {
          model: 'CUSTOM_B',
          modelId: '2',
          modelLabel: 'Custom B',
          state: 'BUILDING',
          requiredSourceCycle: '2026092218',
          published: false,
          frameCount: 6,
          expectedFrameCount: 21,
        },
      ],
    }),
  });

  assert.equal(result.summary.models, 2);
  assert.equal(result.summary.readyModels, 1);
  assert.equal(result.summary.packagesAvailable, 1);
  assert.equal(result.summary.pipelineHealth, 'processing');
  assert.equal(result.summary.currentForecastCycle, '2026092218');
  assert.deepEqual(
    result.models.map((model) => model.code),
    ['CUSTOM_A', 'CUSTOM_B']
  );
});
