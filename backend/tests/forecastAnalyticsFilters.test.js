import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseForecastAnalyticsFilters,
  serializeForecastAnalyticsFilters,
} from '../utils/forecastAnalyticsFilters.js';

test('forecast analytics filters default to package scope', () => {
  const filters = parseForecastAnalyticsFilters({});
  assert.deepEqual(filters, {
    status: null,
    chartType: null,
    horizonHours: null,
    unit: 'package',
  });
});

test('forecast analytics filters map horizon to chart scope', () => {
  const filters = parseForecastAnalyticsFilters({
    status: 'Published',
    horizon: '36',
  });
  assert.deepEqual(filters, {
    status: 'Published',
    chartType: 'forecast_36h',
    horizonHours: 36,
    unit: 'chart',
  });
  assert.deepEqual(serializeForecastAnalyticsFilters(filters), filters);
});

test('forecast analytics filters reject unsupported or conflicting dimensions', () => {
  assert.throws(() => parseForecastAnalyticsFilters({ status: 'Draft' }), {
    message: 'Unsupported forecast analytics status filter.',
    status: 400,
  });
  assert.throws(() => parseForecastAnalyticsFilters({ chartType: 'forecast_60h' }), {
    message: 'Unsupported forecast analytics chartType filter.',
    status: 400,
  });
  assert.throws(
    () =>
      parseForecastAnalyticsFilters({
        chartType: 'forecast_24h',
        horizon: '48',
      }),
    {
      message: 'chartType and horizon filters must refer to the same forecast chart.',
      status: 400,
    }
  );
});
