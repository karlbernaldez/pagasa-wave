import test from 'node:test';
import assert from 'node:assert/strict';

async function loadWorkflow() {
  const modulePath = '../utils/' + 'forecast' + 'Package.js';
  return import(modulePath);
}

test('package workflow has four required charts', async () => {
  const workflow = await loadWorkflow();
  assert.equal(workflow.REQUIRED_FORECAST_CHART_TYPES.length, 4);
});

test('package workflow has matching required chart metadata', async () => {
  const workflow = await loadWorkflow();
  assert.equal(workflow.REQUIRED_FORECAST_CHARTS.length, workflow.REQUIRED_FORECAST_CHART_TYPES.length);
});
