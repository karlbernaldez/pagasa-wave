import test from 'node:test';
import assert from 'node:assert/strict';

test('package workflow has four required charts', async () => {
  const modulePath = '../utils/' + 'forecast' + 'Package.js';
  const workflow = await import(modulePath);
  assert.equal(workflow.REQUIRED_FORECAST_CHART_TYPES.length, 4);
});
