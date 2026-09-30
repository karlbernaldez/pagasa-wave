import { describe, expect, it } from 'vitest';

import {
  buildGraticuleFeatureCollection,
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
