import assert from 'node:assert/strict';
import test from 'node:test';

import { canArchivePublishedForecast } from '../controllers/publishedForecastController.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

test('projects.review grants archive capability for published forecasts regardless of role key', () => {
  assert.equal(canArchivePublishedForecast(['projects.review'], PROJECT_STATUS.PUBLISHED), true);
});

test('role name alone does not grant archive capability', () => {
  assert.equal(canArchivePublishedForecast([], PROJECT_STATUS.PUBLISHED), false);
});

test('archive capability is false once the forecast is already archived', () => {
  assert.equal(canArchivePublishedForecast(['projects.review'], PROJECT_STATUS.ARCHIVED), false);
});
