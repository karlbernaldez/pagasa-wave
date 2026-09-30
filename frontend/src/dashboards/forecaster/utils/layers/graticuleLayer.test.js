import { describe, expect, it } from 'vitest';

import {
  buildGraticuleFeatureCollection,
  findGraticuleInsertionLayer,
  isForeignGraticuleLayer,
  normalizeGraticuleOpacity,
  normalizeGraticuleSpacing,
} from './graticuleLayer';

describe('graticuleLayer', () => {
  it('normalizes supported spacing values', () => {
    expect(normalizeGraticuleSpacing(1)).toBe(1);
    expect(normalizeGraticuleSpacing('2')).toBe(2);
    expect(normalizeGraticuleSpacing(5)).toBe(5);
    expect(normalizeGraticuleSpacing(10)).toBe(10);
    expect(normalizeGraticuleSpacing(3)).toBe(3);
    expect(normalizeGraticuleSpacing(0)).toBe(1);
    expect(normalizeGraticuleSpacing(12)).toBe(10);
  });

  it('normalizes graticule opacity between 10 and 100 percent', () => {
    expect(normalizeGraticuleOpacity(0.1)).toBe(0.1);
    expect(normalizeGraticuleOpacity(0.55)).toBe(0.55);
    expect(normalizeGraticuleOpacity(1)).toBe(1);
    expect(normalizeGraticuleOpacity(0)).toBe(0.1);
    expect(normalizeGraticuleOpacity(2)).toBe(1);
  });

  it('detects foreign graticule layers without matching WaveLab-owned layers', () => {
    expect(
      isForeignGraticuleLayer({
        id: 'coordinate-grid-major',
        type: 'line',
        source: 'basemap',
      })
    ).toBe(true);

    expect(
      isForeignGraticuleLayer({
        id: 'lat-lon-grid',
        type: 'line',
        source: 'basemap',
      })
    ).toBe(true);

    expect(
      isForeignGraticuleLayer({
        id: 'wavelab-graticules',
        type: 'line',
        source: 'wavelab-graticules-source',
      })
    ).toBe(false);

    expect(
      isForeignGraticuleLayer({
        id: 'admin-boundary',
        type: 'line',
        source: 'composite',
      })
    ).toBe(false);
  });

  it('inserts above water and below land when vector layers allow it', () => {
    const style = {
      layers: [
        { id: 'water', type: 'fill', 'source-layer': 'water' },
        { id: 'landcover', type: 'fill', 'source-layer': 'landcover' },
        { id: 'place-labels', type: 'symbol' },
      ],
    };

    expect(findGraticuleInsertionLayer(style)).toBe('landcover');
  });

  it('ignores land anchors below the final water layer', () => {
    const style = {
      layers: [
        { id: 'landcover-low', type: 'fill', 'source-layer': 'landcover' },
        { id: 'water', type: 'fill', 'source-layer': 'water' },
        { id: 'labels', type: 'symbol' },
      ],
    };

    expect(findGraticuleInsertionLayer(style)).toBe('labels');
  });

  it('falls back to coastline, then labels, for styles without usable land fills', () => {
    expect(
      findGraticuleInsertionLayer({
        layers: [
          { id: 'base-raster', type: 'raster' },
          { id: 'coastline', type: 'line' },
          { id: 'labels', type: 'symbol' },
        ],
      })
    ).toBe('coastline');

    expect(
      findGraticuleInsertionLayer({
        layers: [
          { id: 'base-raster', type: 'raster' },
          { id: 'labels', type: 'symbol' },
        ],
      })
    ).toBe('labels');
  });

  it('returns no insertion anchor when a style exposes no suitable layer', () => {
    expect(
      findGraticuleInsertionLayer({
        layers: [{ id: 'base-raster', type: 'raster' }],
      })
    ).toBeNull();
  });

  it('builds a denser grid for smaller spacing', () => {
    const oneDegree = buildGraticuleFeatureCollection(1);
    const fiveDegree = buildGraticuleFeatureCollection(5);
    const tenDegree = buildGraticuleFeatureCollection(10);

    expect(oneDegree.type).toBe('FeatureCollection');
    expect(oneDegree.features.length).toBeGreaterThan(fiveDegree.features.length);
    expect(fiveDegree.features.length).toBeGreaterThan(tenDegree.features.length);
  });

  it('creates longitude and latitude line features', () => {
    const grid = buildGraticuleFeatureCollection(5);

    expect(grid.features.some((feature) => feature.properties.axis === 'longitude')).toBe(true);
    expect(grid.features.some((feature) => feature.properties.axis === 'latitude')).toBe(true);
  });
});
