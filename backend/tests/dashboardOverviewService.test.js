import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildQuickActions,
  buildSummaryCards,
} from '../services/dashboardOverviewService.js';

test('dashboard summary cards expose only metrics backed by effective permissions', () => {
  const pipelineOnly = buildSummaryCards({
    permissions: ['dashboard.view', 'wave_pipeline.view'],
    waveModels: [
      { code: 'CUSTOM_A', pipelineState: 'READY' },
      { code: 'CUSTOM_B', pipelineState: 'WAITING_FOR_SOURCE' },
      { code: 'CUSTOM_C', pipelineState: 'READY' },
    ],
  });

  assert.deepEqual(pipelineOnly.map((card) => card.key), ['models_ready']);
  assert.equal(pipelineOnly[0].value, 2);
  assert.equal(pipelineOnly[0].total, 3);

  const forecastOnly = buildSummaryCards({
    permissions: ['dashboard.view', 'forecast.review'],
    workflowCounts: {
      Submitted: 2,
      'Under Review': 3,
      'Revision Requested': 1,
      Rejected: 2,
    },
    publishedToday: 4,
  });

  assert.deepEqual(forecastOnly.map((card) => card.key), [
    'in_review',
    'returned',
    'published_today',
  ]);
  assert.equal(forecastOnly[0].value, 5);
  assert.equal(forecastOnly[1].value, 3);
  assert.equal(forecastOnly[2].value, 4);
});

test('dashboard model readiness is model-agnostic', () => {
  const cards = buildSummaryCards({
    permissions: ['wave_pipeline.view'],
    waveModels: [
      { code: 'SWAN', pipelineState: 'READY' },
      { code: 'CUSTOM_WAVE', pipelineState: 'BUILDING' },
      { code: 'REGIONAL_X', pipelineState: 'READY' },
    ],
  });

  const readiness = cards.find((card) => card.key === 'models_ready');
  assert.ok(readiness);
  assert.equal(readiness.value, 2);
  assert.equal(readiness.total, 3);
});

test('quick actions are derived from capabilities rather than User Type names', () => {
  const actions = buildQuickActions([
    'dashboard.view',
    'forecast.review',
    'wave_pipeline.view',
    'analytics_forecast.view',
    'calendar.view',
  ]);

  assert.deepEqual(actions.map((action) => action.key), [
    'review_queue',
    'wave_pipeline',
    'calendar',
    'analytics',
  ]);
  assert.equal(actions.some((action) => action.key === 'users'), false);
  assert.equal(actions.some((action) => action.key === 'wave_models'), false);
});

test('dashboard helpers emit no unauthorized cards or actions when capabilities are absent', () => {
  assert.deepEqual(buildSummaryCards({ permissions: ['dashboard.view'] }), []);
  assert.deepEqual(buildQuickActions(['dashboard.view']), []);
});
