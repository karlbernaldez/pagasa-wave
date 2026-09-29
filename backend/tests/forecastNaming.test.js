import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FORECAST_NAMING,
  resolveForecastNames,
} from '../utils/forecastNaming.js';

const forecastDate = new Date('2026-09-28T16:00:00.000Z');

test('forecast naming defaults preserve the existing WaveLab names', () => {
  const names = resolveForecastNames({
    forecastDate,
    settings: DEFAULT_FORECAST_NAMING,
  });

  assert.equal(names.packageName, 'Marine Forecast 2026-09-29');
  assert.equal(names.chartNames.analysis, 'Marine Forecast 2026-09-29 - Wave Analysis');
  assert.equal(names.chartNames.forecast_24h, 'Marine Forecast 2026-09-29 - 24h Wave Forecast');
  assert.equal(names.chartNames.forecast_36h, 'Marine Forecast 2026-09-29 - 36h Wave Forecast');
  assert.equal(names.chartNames.forecast_48h, 'Marine Forecast 2026-09-29 - 48h Wave Forecast');
});

test('forecast naming renders saved templates and respects a manual package name override', () => {
  const names = resolveForecastNames({
    forecastDate,
    packageNameOverride: 'Special Marine Operations',
    settings: {
      ...DEFAULT_FORECAST_NAMING,
      waveAnalysisNameTemplate: '{package} / Analysis',
      forecast24hNameTemplate: '{date} / +24h',
    },
  });

  assert.equal(names.packageName, 'Special Marine Operations');
  assert.equal(names.chartNames.analysis, 'Special Marine Operations / Analysis');
  assert.equal(names.chartNames.forecast_24h, '2026-09-29 / +24h');
});
