import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePublicWaveTileUrl } from '../controllers/publishedForecastController.js';

test('rewrites loopback WW3 tile URLs outside development', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const input = 'http://127.0.0.1:8081/WW3/dark/2026SEP29/2026092818/5/27/14.png';
  const expected = '/wavetiles/WW3/dark/2026SEP29/2026092818/5/27/14.png';
  process.env.NODE_ENV = 'production';

  try {
    assert.equal(normalizePublicWaveTileUrl(input), expected);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves non-loopback tile URLs', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const input =
    'https://tiles.example.com/WW3/light/2026OCT01/2026093018/{z}/{x}/{y}.png';
  process.env.NODE_ENV = 'production';

  try {
    assert.equal(normalizePublicWaveTileUrl(input), input);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves loopback URLs in explicit development mode', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const input = 'http://127.0.0.1:8081/WW3/light/example.png';
  process.env.NODE_ENV = 'development';

  try {
    assert.equal(normalizePublicWaveTileUrl(input), input);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
