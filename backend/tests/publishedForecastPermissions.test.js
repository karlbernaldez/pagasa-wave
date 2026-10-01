import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canArchivePublishedForecast,
  normalizePublicWaveTileUrl,
  resolvePublishedWaveRunDateTime,
} from '../controllers/publishedForecastController.js';
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

test('rewrites loopback WW3 tile URLs outside development', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const input = 'http://127.0.0.1:8081/WW3/dark/example.png';
    assert.equal(normalizePublicWaveTileUrl(input), '/wavetiles/WW3/dark/example.png');
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves non-loopback tile URLs', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const input = 'https://tiles.example.com/WW3/light/example.png';
    assert.equal(normalizePublicWaveTileUrl(input), input);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves loopback URLs in explicit development mode', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    const input = 'http://127.0.0.1:8081/WW3/light/example.png';
    assert.equal(normalizePublicWaveTileUrl(input), input);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});


test('resolves published WW3 chart frames from the package source cycle', () => {
  const sourceCycle = '2026093000';

  assert.equal(
    resolvePublishedWaveRunDateTime({
      chartType: 'analysis',
      sourceCycle,
      fallbackRunDateTime: '2026092918',
    }),
    '2026093000'
  );
  assert.equal(
    resolvePublishedWaveRunDateTime({
      chartType: 'forecast_24h',
      sourceCycle,
      fallbackRunDateTime: '2026093018',
    }),
    '2026100100'
  );
  assert.equal(
    resolvePublishedWaveRunDateTime({
      chartType: 'forecast_36h',
      sourceCycle,
      fallbackRunDateTime: '2026100106',
    }),
    '2026100112'
  );
  assert.equal(
    resolvePublishedWaveRunDateTime({
      chartType: 'forecast_48h',
      sourceCycle,
      fallbackRunDateTime: '2026100118',
    }),
    '2026100200'
  );
});

test('falls back to legacy published run resolution when source cycle is unavailable', () => {
  assert.equal(
    resolvePublishedWaveRunDateTime({
      chartType: 'forecast_24h',
      sourceCycle: '',
      fallbackRunDateTime: '2026093018',
    }),
    '2026093018'
  );
});
