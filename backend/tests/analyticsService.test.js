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

  const ProjectModel = {
    find: () => ({
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => [],
    }),
  };

  const result = await loadForecastAnalytics(range, {
    ForecastPackageModel,
    ProjectModel,
    includeComparison: false,
    referenceNow: new Date('2026-09-11T12:00:00.000Z'),
  });

  assert.equal(aggregateCall, 0);
  assert.equal(result.summary.submitted, 1);
  assert.equal(result.summary.publishedEvents, 1);
  assert.equal(result.summary.completionRate, 100);
  assert.deepEqual(result.throughput, [
    {
      date: '2026-09-10',
      submitted: 1,
      approved: 1,
      published: 1,
      completed: 1,
      returned: 0,
    },
  ]);
  assert.deepEqual(result.timing.preparation, {
    medianHours: 2,
    p75Hours: 2,
    p90Hours: 2,
    sampleSize: 1,
  });
  assert.deepEqual(result.timing.reviewWait, {
    medianHours: 1,
    p75Hours: 1,
    p90Hours: 1,
    sampleSize: 1,
  });
  assert.deepEqual(result.timing.reviewDuration, {
    medianHours: 1,
    p75Hours: 1,
    p90Hours: 1,
    sampleSize: 1,
  });
  assert.deepEqual(result.timing.publicationDelay, {
    medianHours: 1,
    p75Hours: 1,
    p90Hours: 1,
    sampleSize: 1,
  });
  assert.equal(result.efficiency.firstPassApprovalRate, 100);
  assert.equal(result.efficiency.averageRevisionCycles, 0);
  assert.equal(result.bottlenecks.slowestStage.key, 'preparation');
  assert.equal(result.bottlenecks.turnaround.medianHours, 3);
  assert.equal(result.bottlenecks.turnaround.p90Hours, 3);
  assert.equal(result.bottlenecks.turnaround.slowestPackages[0].id, 'package-1');
  assert.equal(result.bottlenecks.openAging.totalOpen, 0);
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

  const ProjectModel = {
    find: () => ({
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => [],
    }),
  };

  const result = await loadForecastAnalytics(range, {
    ForecastPackageModel,
    ProjectModel,
    includeComparison: false,
    referenceNow: new Date('2026-09-11T14:00:00.000Z'),
  });

  assert.deepEqual(result.timing.preparation, {
    medianHours: null,
    p75Hours: null,
    p90Hours: null,
    sampleSize: 0,
  });
  assert.deepEqual(result.timing.reviewDuration, {
    medianHours: null,
    p75Hours: null,
    p90Hours: null,
    sampleSize: 0,
  });
  assert.equal(result.bottlenecks.openAging.totalOpen, 1);
  assert.equal(result.bottlenecks.openAging.buckets['12_to_24h'], 1);
  assert.equal(result.bottlenecks.openAging.oldest[0].status, 'Submitted');
  assert.equal(result.bottlenecks.openAging.oldest[0].ageHours, 12);
});

test('system analytics derive readiness from dynamic pipeline models without hard-coded model names', async () => {
  const result = await loadSystemAnalytics(range, {
    getPipelineHistory: async () => ({
      available: true,
      collectingSince: '2026-09-20T01:00:00.000Z',
      invalidRecords: 0,
      summary: {
        runs: 3,
        successful: 2,
        failed: 1,
        retryAttempts: 1,
        successRate: 66.7,
        failureRate: 33.3,
        medianDurationSeconds: 900,
        p90DurationSeconds: 1200,
        durationSampleSize: 3,
      },
      trend: [],
      models: [],
      recentRuns: [],
    }),
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
  assert.equal(result.history.summary.runs, 3);
  assert.equal(result.history.summary.failed, 1);
  assert.equal(result.history.summary.retryAttempts, 1);
  assert.deepEqual(
    result.models.map((model) => model.code),
    ['CUSTOM_A', 'CUSTOM_B']
  );
});


test('system analytics preserve persisted history when the live pipeline source fails', async () => {
  const result = await loadSystemAnalytics(range, {
    getPipelineStatus: async () => {
      throw new Error('live pipeline unavailable');
    },
    getPipelineHistory: async () => ({
      available: true,
      collectingSince: '2026-09-20T01:00:00.000Z',
      invalidRecords: 0,
      summary: {
        runs: 2,
        successful: 1,
        failed: 1,
        retryAttempts: 1,
        successRate: 50,
        failureRate: 50,
        medianDurationSeconds: 600,
        p90DurationSeconds: 900,
        durationSampleSize: 2,
      },
      trend: [{ date: '2026-09-20', successful: 1, failed: 1, runs: 2 }],
      models: [],
      recentRuns: [],
    }),
  });

  assert.equal(result.available, false);
  assert.match(result.sourceError, /live pipeline unavailable/);
  assert.equal(result.history.available, true);
  assert.equal(result.history.summary.runs, 2);
  assert.equal(result.history.summary.failed, 1);
});

test('forecast analytics compare the selected period with the immediately preceding equal-length period', async () => {
  const currentStart = new Date(range.startAt).getTime();

  const packagesFor = (isCurrent) =>
    isCurrent
      ? [
          {
            _id: 'current-1',
            name: 'Current Published',
            forecastDate: new Date('2026-09-10T00:00:00.000Z'),
            status: 'Published',
            auditLogs: [
              { action: 'submitted', timestamp: new Date('2026-09-10T01:00:00.000Z') },
              { action: 'approved', timestamp: new Date('2026-09-10T03:00:00.000Z') },
              { action: 'published', timestamp: new Date('2026-09-10T04:00:00.000Z') },
            ],
          },
          {
            _id: 'current-2',
            name: 'Current Revised',
            forecastDate: new Date('2026-09-11T00:00:00.000Z'),
            status: 'Approved',
            auditLogs: [
              { action: 'submitted', timestamp: new Date('2026-09-11T01:00:00.000Z') },
              { action: 'revision_requested', timestamp: new Date('2026-09-11T02:00:00.000Z') },
              { action: 'approved', timestamp: new Date('2026-09-11T05:00:00.000Z') },
            ],
          },
        ]
      : [
          {
            _id: 'previous-1',
            name: 'Previous Published',
            forecastDate: new Date('2026-08-15T00:00:00.000Z'),
            status: 'Published',
            auditLogs: [
              { action: 'submitted', timestamp: new Date('2026-08-15T01:00:00.000Z') },
              { action: 'approved', timestamp: new Date('2026-08-15T02:00:00.000Z') },
              { action: 'published', timestamp: new Date('2026-08-15T03:00:00.000Z') },
            ],
          },
        ];

  const ForecastPackageModel = {
    find(match) {
      const isCurrent = new Date(match.forecastDate.$gte).getTime() === currentStart;
      const packages = packagesFor(isCurrent);
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => packages,
      };
    },
    async aggregate(pipeline) {
      const matchStage = pipeline.find((stage) => stage.$match)?.$match;
      const dateFilter = matchStage?.forecastDate || matchStage?.['auditLogs.timestamp'] || {};
      const isCurrent = new Date(dateFilter.$gte).getTime() === currentStart;
      const packages = packagesFor(isCurrent);

      if (pipeline.some((stage) => stage.$facet)) {
        const byAction = new Map();
        const byDay = [];
        for (const forecastPackage of packages) {
          for (const log of forecastPackage.auditLogs) {
            byAction.set(log.action, (byAction.get(log.action) || 0) + 1);
            byDay.push({
              _id: {
                date: log.timestamp.toISOString().slice(0, 10),
                action: log.action,
              },
              count: 1,
            });
          }
        }
        return [
          {
            byAction: [...byAction.entries()].map(([_id, count]) => ({ _id, count })),
            byDay,
          },
        ];
      }

      const counts = new Map();
      for (const forecastPackage of packages) {
        counts.set(forecastPackage.status, (counts.get(forecastPackage.status) || 0) + 1);
      }
      return [...counts.entries()].map(([_id, count]) => ({ _id, count }));
    },
  };

  const ProjectModel = {
    find: () => ({
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => [],
    }),
  };

  const result = await loadForecastAnalytics(range, { ForecastPackageModel, ProjectModel });

  assert.equal(result.summary.submitted, 2);
  assert.equal(result.summary.publishedEvents, 1);
  assert.equal(result.summary.revisionRequests, 1);
  assert.equal(result.efficiency.firstPassApprovalRate, 50);
  assert.equal(result.efficiency.packagesWithRevision, 1);
  assert.equal(result.efficiency.averageRevisionCycles, 1);
  assert.equal(result.packages.find((item) => item.id === 'current-2').revisionCycles, 1);

  assert.equal(result.comparison.submitted.previous, 1);
  assert.equal(result.comparison.submitted.percentChange, 100);
  assert.equal(result.comparison.published.percentChange, 0);
  assert.equal(result.comparison.revisions.percentChange, null);
  assert.equal(result.comparison.firstPassApprovalRate.current, 50);
  assert.equal(result.comparison.firstPassApprovalRate.previous, 100);
  assert.equal(result.comparison.firstPassApprovalRate.percentagePointChange, -50);
});

test('forecast analytics compare chart type and horizon performance from project audit evidence', async () => {
  const packageQuery = {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    lean: async () => [],
  };
  const ForecastPackageModel = {
    find: () => packageQuery,
    aggregate: async (pipeline) =>
      pipeline.some((stage) => stage.$facet) ? [{ byAction: [], byDay: [] }] : [],
  };

  const projects = [
    {
      _id: 'analysis-1',
      chartType: 'analysis',
      forecastDate: new Date('2026-09-10T00:00:00.000Z'),
      status: 'Published',
      auditLogs: [
        { action: 'submitted', timestamp: new Date('2026-09-10T01:00:00.000Z') },
        { action: 'review_started', timestamp: new Date('2026-09-10T02:00:00.000Z') },
        { action: 'approved', timestamp: new Date('2026-09-10T03:00:00.000Z') },
        { action: 'published', timestamp: new Date('2026-09-10T04:00:00.000Z') },
      ],
    },
    {
      _id: 'forecast-24-1',
      chartType: 'forecast_24h',
      forecastDate: new Date('2026-09-10T00:00:00.000Z'),
      status: 'Published',
      auditLogs: [
        { action: 'submitted', timestamp: new Date('2026-09-10T01:00:00.000Z') },
        { action: 'review_started', timestamp: new Date('2026-09-10T03:00:00.000Z') },
        { action: 'revision_requested', timestamp: new Date('2026-09-10T05:00:00.000Z') },
        { action: 'approved', timestamp: new Date('2026-09-10T07:00:00.000Z') },
        { action: 'published', timestamp: new Date('2026-09-10T08:00:00.000Z') },
      ],
    },
  ];
  const ProjectModel = {
    find: () => ({
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => projects,
    }),
  };

  const result = await loadForecastAnalytics(range, {
    ForecastPackageModel,
    ProjectModel,
    includeComparison: false,
  });

  const analysis = result.chartTypes.find((row) => row.chartType === 'analysis');
  const forecast24 = result.chartTypes.find((row) => row.chartType === 'forecast_24h');
  const forecast36 = result.chartTypes.find((row) => row.chartType === 'forecast_36h');

  assert.equal(analysis.horizonHours, 0);
  assert.equal(analysis.published, 1);
  assert.equal(analysis.revisionRate, 0);
  assert.equal(analysis.firstPassPublicationRate, 100);
  assert.equal(analysis.timing.reviewDuration.medianHours, 1);
  assert.equal(analysis.timing.submissionToPublication.medianHours, 3);

  assert.equal(forecast24.horizonHours, 24);
  assert.equal(forecast24.revisionRequests, 1);
  assert.equal(forecast24.revisionRate, 100);
  assert.equal(forecast24.firstPassPublicationRate, 0);
  assert.equal(forecast24.timing.reviewDuration.medianHours, 2);
  assert.equal(forecast24.timing.submissionToPublication.medianHours, 7);

  assert.equal(forecast36.projects, 0);
  assert.equal(forecast36.revisionRate, null);
});

test('server-backed chart filters recalculate forecast analytics on chart-project scope', async () => {
  const ForecastPackageModel = {
    find: () => ({
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => {
        throw new Error('package scope must not be queried for a chart filter');
      },
    }),
  };

  let capturedMatch = null;
  const ProjectModel = {
    find(match) {
      capturedMatch = match;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [
          {
            _id: 'chart-24-1',
            name: '24h Forecast A',
            chartType: 'forecast_24h',
            forecastDate: new Date('2026-09-12T00:00:00.000Z'),
            status: 'Published',
            auditLogs: [
              { action: 'submitted', timestamp: new Date('2026-09-12T01:00:00.000Z') },
              { action: 'review_started', timestamp: new Date('2026-09-12T02:00:00.000Z') },
              { action: 'revision_requested', timestamp: new Date('2026-09-12T03:00:00.000Z') },
              { action: 'approved', timestamp: new Date('2026-09-12T05:00:00.000Z') },
              { action: 'published', timestamp: new Date('2026-09-12T06:00:00.000Z') },
            ],
          },
        ],
      };
    },
  };

  const result = await loadForecastAnalytics(range, {
    ForecastPackageModel,
    ProjectModel,
    includeComparison: false,
    filters: {
      status: 'Published',
      chartType: 'forecast_24h',
      horizonHours: 24,
      unit: 'chart',
    },
  });

  assert.equal(capturedMatch.chartType, 'forecast_24h');
  assert.equal(capturedMatch.status, 'Published');
  assert.equal(result.filters.unit, 'chart');
  assert.equal(result.filters.chartType, 'forecast_24h');
  assert.equal(result.total, 1);
  assert.equal(result.summary.submitted, 1);
  assert.equal(result.summary.publishedEvents, 1);
  assert.equal(result.summary.revisionRequests, 1);
  assert.equal(result.efficiency.firstPassApprovalRate, 0);
  assert.equal(result.packages[0].id, 'chart-24-1');
  assert.equal(result.packages[0].revisionCycles, 1);
  assert.equal(result.chartTypes.find((row) => row.chartType === 'forecast_24h').projects, 1);
});

test('server-backed package status filter scopes package metrics and linked chart breakdown', async () => {
  let packageMatch = null;
  const ForecastPackageModel = {
    find(match) {
      packageMatch = match;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [
          {
            _id: 'package-published',
            name: 'Published package',
            forecastDate: new Date('2026-09-13T00:00:00.000Z'),
            status: 'Published',
            auditLogs: [
              { action: 'submitted', timestamp: new Date('2026-09-13T01:00:00.000Z') },
              { action: 'approved', timestamp: new Date('2026-09-13T02:00:00.000Z') },
              { action: 'published', timestamp: new Date('2026-09-13T03:00:00.000Z') },
            ],
          },
        ],
      };
    },
  };

  let projectMatch = null;
  const ProjectModel = {
    find(match) {
      projectMatch = match;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [],
      };
    },
  };

  const result = await loadForecastAnalytics(range, {
    ForecastPackageModel,
    ProjectModel,
    includeComparison: false,
    filters: {
      status: 'Published',
      chartType: null,
      horizonHours: null,
      unit: 'package',
    },
  });

  assert.equal(packageMatch.status, 'Published');
  assert.deepEqual(projectMatch.forecastPackage.$in, ['package-published']);
  assert.equal(result.filters.unit, 'package');
  assert.equal(result.total, 1);
  assert.equal(result.summary.published, 1);
  assert.equal(result.summary.publishedEvents, 1);
});
