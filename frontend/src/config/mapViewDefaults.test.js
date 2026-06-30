import { describe, expect, it } from 'vitest';

import {
  DEFAULT_STUDIO_MAP_VIEW,
  normalizeStudioMapViewSettings,
} from './mapViewDefaults';

describe('normalizeStudioMapViewSettings', () => {
  it('keeps the current Studio defaults when settings are empty', () => {
    expect(normalizeStudioMapViewSettings()).toEqual({
      center: { ...DEFAULT_STUDIO_MAP_VIEW.center },
      zoom: { ...DEFAULT_STUDIO_MAP_VIEW.zoom },
      maxBounds: { ...DEFAULT_STUDIO_MAP_VIEW.maxBounds },
      fitBounds: { ...DEFAULT_STUDIO_MAP_VIEW.fitBounds },
      padding: { ...DEFAULT_STUDIO_MAP_VIEW.padding },
      fitBoundsMaxZoom: DEFAULT_STUDIO_MAP_VIEW.fitBoundsMaxZoom,
    });
  });

  it('clamps the startup center inside configured max bounds', () => {
    const settings = normalizeStudioMapViewSettings({
      center: { longitude: 120, latitude: 5 },
      maxBounds: { west: 100, south: 10, east: 140, north: 30 },
    });

    expect(settings.center).toEqual({
      longitude: 120,
      latitude: 10,
    });
  });

  it('clamps initial fit bounds inside configured max bounds', () => {
    const settings = normalizeStudioMapViewSettings({
      maxBounds: { west: 100, south: 10, east: 140, north: 30 },
      fitBounds: { west: 93, south: 5, east: 153.8595159535438, north: 35 },
    });

    expect(settings.maxBounds).toEqual({
      west: 100,
      south: 10,
      east: 140,
      north: 30,
    });
    expect(settings.fitBounds).toEqual({
      west: 100,
      south: 10,
      east: 140,
      north: 30,
    });
  });

  it('falls back from invalid fit bounds and still clamps the fallback inside max bounds', () => {
    const settings = normalizeStudioMapViewSettings({
      maxBounds: { west: 100, south: 10, east: 140, north: 30 },
      fitBounds: { west: 150, south: 20, east: 120, north: 25 },
    });

    expect(settings.fitBounds).toEqual({
      west: 100,
      south: 10,
      east: 140,
      north: 25,
    });
  });

  it('normalizes malformed values without returning invalid map options', () => {
    const settings = normalizeStudioMapViewSettings({
      center: { longitude: 'bad', latitude: 'also-bad' },
      zoom: { min: 9, default: 6, max: 12 },
      maxBounds: { west: 170, south: -10, east: 80, north: 40 },
      fitBounds: { west: 120, south: 20, east: 110, north: 25 },
      padding: { top: -20, right: 'bad', bottom: 25, left: 50 },
      fitBoundsMaxZoom: 30,
    });

    expect(settings.center).toEqual({ ...DEFAULT_STUDIO_MAP_VIEW.center });
    expect(settings.zoom).toEqual({ ...DEFAULT_STUDIO_MAP_VIEW.zoom });
    expect(settings.maxBounds).toEqual({ ...DEFAULT_STUDIO_MAP_VIEW.maxBounds });
    expect(settings.fitBounds).toEqual({ ...DEFAULT_STUDIO_MAP_VIEW.fitBounds });
    expect(settings.padding).toEqual({
      top: 0,
      right: DEFAULT_STUDIO_MAP_VIEW.padding.right,
      bottom: 25,
      left: 50,
    });
    expect(settings.fitBoundsMaxZoom).toBe(DEFAULT_STUDIO_MAP_VIEW.fitBoundsMaxZoom);
  });
});
