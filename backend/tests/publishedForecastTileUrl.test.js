import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePublicWaveTileUrl } from '../controllers/publishedForecastController.js';

test('rewrites loopback WW3 tile URLs to same-origin wavetiles outside development', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    assert.equal(
      normalizePublicWaveTileUrl(
        'http://127.0.0.1:8081/WW3/dark/2026SEP29/2026092818/5/27/14.png'
      ),
      '/wavetiles/WW3/dark/2026SEP29/2026092818/5/27/14.png'
    );
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves non-loopback tile URLs', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    assert.equal(
      normalizePublicWaveTileUrl(
        'https://tiles.example.com/WW3/light/2026OCT01/2026093018/{z}/{x}/{y}.png'
      ),
      'https://tiles.example.com/WW3/light/2026OCT01/2026093018/{z}/{x}/{y}.png'
    );
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('preserves loopback URLs in explicit development mode', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    assert.equal(
      normalizePublicWaveTileUrl('http://127.0.0.1:8081/WW3/light/example.png'),
      'http://127.0.0.1:8081/WW3/light/example.png'
    );
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
