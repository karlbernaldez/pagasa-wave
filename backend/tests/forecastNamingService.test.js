import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FORECAST_NAMING,
  loadForecastNamingSettings,
  resolveForecastNames,
} from '../services/forecastNamingService.js';

const FORECAST_DATE = new Date('2026-09-28T16:00:00.000Z');

test('forecast naming defaults preserve the current package and chart names', () => {
  const names = resolveForecastNames({
    forecastDate: FORECAST_DATE,
    settings: DEFAULT_FORECAST_NAMING,
  });

  assert.equal(names.packageName, 'Marine Forecast 2026-09-29');
  assert.equal(names.chartNames.analysis, 'Marine Forecast 2026-09-29 - Wave Analysis');
  assert.equal(names.chartNames.forecast_24h, 'Marine Forecast 2026-09-29 - 24h Wave Forecast');
  assert.equal(names.chartNames.forecast_36h, 'Marine Forecast 2026-09-29 - 36h Wave Forecast');
  assert.equal(names.chartNames.forecast_48h, 'Marine Forecast 2026-09-29 - 48h Wave Forecast');
});

test('forecast naming renders configured package and chart templates', () => {
  const names = resolveForecastNames({
    forecastDate: FORECAST_DATE,
    settings: {
      packageNameTemplate: 'Wave Bulletin {date}',
      analysisChartNameTemplate: '{package} / Analysis',
      forecast24ChartNameTemplate: '{date} / 24-Hour',
      forecast36ChartNameTemplate: '{package} / 36-Hour',
      forecast48ChartNameTemplate: '{package} / 48-Hour',
    },
  });

  assert.equal(names.packageName, 'Wave Bulletin 2026-09-29');
  assert.equal(names.chartNames.analysis, 'Wave Bulletin 2026-09-29 / Analysis');
  assert.equal(names.chartNames.forecast_24h, '2026-09-29 / 24-Hour');
});

test('explicit package names remain supported while chart templates use that package name', () => {
  const names = resolveForecastNames({
    forecastDate: FORECAST_DATE,
    settings: DEFAULT_FORECAST_NAMING,
    packageNameOverride: 'Special Marine Operations',
  });

  assert.equal(names.packageName, 'Special Marine Operations');
  assert.equal(names.chartNames.analysis, 'Special Marine Operations - Wave Analysis');
});

test('loadForecastNamingSettings falls back for settings that predate naming configuration', async () => {
  const settingsModel = {
    findOne() {
      return {
        lean: async () => ({
          data: {
            timezone: 'Asia/Manila',
            packageNameTemplate: 'Daily Waves {date}',
          },
        }),
      };
    },
  };

  const settings = await loadForecastNamingSettings({ settingsModel });

  assert.equal(settings.packageNameTemplate, 'Daily Waves {date}');
  assert.equal(settings.analysisChartNameTemplate, '{package} - Wave Analysis');
});
