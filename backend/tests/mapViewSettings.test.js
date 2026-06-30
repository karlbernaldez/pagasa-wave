import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_MAP_VIEW_SETTINGS,
  buildMapViewSettingsResponse,
  normalizeMapViewSettings,
  parseMapViewSettingsPayload,
} from '../utils/mapViewSettings.js';

test('map view settings default to the current Studio map view', () => {
  assert.deepEqual(buildMapViewSettingsResponse(), DEFAULT_MAP_VIEW_SETTINGS);
});

test('map view settings normalize partial payloads with Studio defaults', () => {
  const normalized = normalizeMapViewSettings({
    center: { longitude: '121.5' },
    zoom: { default: '6' },
    padding: { left: 120 },
  });

  assert.deepEqual(normalized, {
    ...DEFAULT_MAP_VIEW_SETTINGS,
    center: {
      longitude: 121.5,
      latitude: DEFAULT_MAP_VIEW_SETTINGS.center.latitude,
    },
    zoom: {
      default: 6,
      min: DEFAULT_MAP_VIEW_SETTINGS.zoom.min,
      max: DEFAULT_MAP_VIEW_SETTINGS.zoom.max,
    },
    padding: {
      ...DEFAULT_MAP_VIEW_SETTINGS.padding,
      left: 120,
    },
  });
});

test('map view settings accept a valid admin payload', () => {
  const payload = {
    center: { longitude: 121, latitude: 14.5 },
    zoom: { default: 7, min: 3, max: 12 },
    maxBounds: { west: 90, south: -5, east: 160, north: 35 },
    fitBounds: { west: 100, south: 4, east: 140, north: 22 },
    padding: { top: 40, right: 180, bottom: 60, left: 180 },
    fitBoundsMaxZoom: 9,
  };

  assert.deepEqual(parseMapViewSettingsPayload(payload), payload);
});

test('map view settings reject invalid zoom ordering', () => {
  assert.throws(
    () => parseMapViewSettingsPayload({
      zoom: { min: 9, default: 6, max: 12 },
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Invalid map view settings payload/);
      assert.ok(error.details.includes('zoom.min must be less than or equal to zoom.default.'));
      return true;
    }
  );
});

test('map view settings reject invalid bounds ordering', () => {
  assert.throws(
    () => parseMapViewSettingsPayload({
      maxBounds: { west: 170, east: 80 },
      fitBounds: { south: 25, north: 5 },
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.ok(error.details.includes('maxBounds.west must be less than maxBounds.east.'));
      assert.ok(error.details.includes('fitBounds.south must be less than fitBounds.north.'));
      return true;
    }
  );
});

test('map view settings reject unsafe numeric ranges', () => {
  assert.throws(
    () => parseMapViewSettingsPayload({
      center: { longitude: 190, latitude: -95 },
      padding: { top: -1, right: 1001 },
      fitBoundsMaxZoom: 30,
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.ok(error.details.includes('center.longitude must be between -180 and 180.'));
      assert.ok(error.details.includes('center.latitude must be between -90 and 90.'));
      assert.ok(error.details.includes('padding.top must be between 0 and 1000.'));
      assert.ok(error.details.includes('padding.right must be between 0 and 1000.'));
      assert.ok(error.details.includes('fitBoundsMaxZoom must be between 0 and 24.'));
      return true;
    }
  );
});

test('saved invalid map view settings fall back to Studio defaults on read', () => {
  const savedBadData = {
    center: { longitude: 500, latitude: 15.5 },
    zoom: { default: 5.5, min: 4, max: 16 },
  };

  assert.deepEqual(buildMapViewSettingsResponse(savedBadData), DEFAULT_MAP_VIEW_SETTINGS);
});
