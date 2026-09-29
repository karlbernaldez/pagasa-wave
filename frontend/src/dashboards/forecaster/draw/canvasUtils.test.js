import { describe, expect, it } from 'vitest';

import {
  applyPostProcessSmoothing,
  cornerCutPoints,
  getDrawingSmoothingProfile,
  getFinalCurvePoints,
  getPostProcessSmoothingPasses,
  getPreviewCurvePoints,
} from './canvasUtils';

describe('Studio drawing smoothing settings', () => {
  it('maps 0-100 smoothing into progressively stronger smoothing parameters', () => {
    const precise = getDrawingSmoothingProfile(0);
    const balanced = getDrawingSmoothingProfile(50);
    const smooth = getDrawingSmoothingProfile(100);

    expect(precise.previewFactor).toBeGreaterThan(balanced.previewFactor);
    expect(balanced.previewFactor).toBeGreaterThan(smooth.previewFactor);
    expect(precise.previewTolerance).toBeLessThan(balanced.previewTolerance);
    expect(balanced.previewTolerance).toBeLessThan(smooth.previewTolerance);
    expect(precise.finalTolerance).toBeLessThan(smooth.finalTolerance);
  });

  it('clamps smoothing values outside the supported range', () => {
    expect(getDrawingSmoothingProfile(-20)).toEqual(getDrawingSmoothingProfile(0));
    expect(getDrawingSmoothingProfile(150)).toEqual(getDrawingSmoothingProfile(100));
  });

  it('returns valid preview and final coordinate pairs', () => {
    const raw = [0, 0, 10, 8, 20, 2, 30, 10, 40, 5];

    const preview = getPreviewCurvePoints(raw, 65);
    const final = getFinalCurvePoints(raw, 65);

    expect(preview.length % 2).toBe(0);
    expect(final.length % 2).toBe(0);
    expect(preview.length).toBeGreaterThanOrEqual(4);
    expect(final.length).toBeGreaterThanOrEqual(4);
  });
});


describe('high smoothing corner rounding', () => {
  it('adds rounded intermediate points at high smoothing', () => {
    const raw = [0, 0, 20, 0, 20, 20, 40, 20];
    const rounded = cornerCutPoints(raw, 2);

    expect(rounded.length).toBeGreaterThan(raw.length);
    expect(rounded).not.toEqual(raw);
  });

  it('uses progressively more corner-cutting passes above 60 percent', () => {
    expect(getDrawingSmoothingProfile(55).finalCornerCutPasses).toBe(1);
    expect(getDrawingSmoothingProfile(80).finalCornerCutPasses).toBe(3);
    expect(getDrawingSmoothingProfile(95).finalCornerCutPasses).toBe(4);
  });

  it('returns a rounded closed path without reintroducing the seam', () => {
    const raw = [0, 0, 20, 0, 20, 20, 0, 20, 0, 0];
    const final = getFinalCurvePoints(raw, 90, { closed: true });

    expect(final.length).toBeGreaterThan(raw.length);
    expect(final.length % 2).toBe(0);
  });
});


describe('optional post-process smoothing', () => {
  it('maps post-process strength to progressively more smoothing passes', () => {
    expect(getPostProcessSmoothingPasses(0)).toBe(0);
    expect(getPostProcessSmoothingPasses(20)).toBe(1);
    expect(getPostProcessSmoothingPasses(50)).toBe(3);
    expect(getPostProcessSmoothingPasses(80)).toBe(4);
    expect(getPostProcessSmoothingPasses(100)).toBe(5);
  });

  it('leaves geometry unchanged at zero strength', () => {
    const points = [0, 0, 20, 0, 20, 20, 40, 20];
    expect(applyPostProcessSmoothing(points, 0)).toBe(points);
  });

  it('rounds finalized open geometry while preserving endpoints', () => {
    const points = [0, 0, 20, 0, 20, 20, 40, 20];
    const processed = applyPostProcessSmoothing(points, 80);

    expect(processed.length).toBeGreaterThan(points.length);
    expect(processed.slice(0, 2)).toEqual(points.slice(0, 2));
    expect(processed.slice(-2)).toEqual(points.slice(-2));
  });

  it('supports closed contour post-processing without requiring duplicated end points', () => {
    const points = [0, 0, 20, 0, 20, 20, 0, 20];
    const processed = applyPostProcessSmoothing(points, 100, { closed: true });

    expect(processed.length).toBeGreaterThan(points.length);
    expect(processed.length % 2).toBe(0);
  });
});


it('caps dense post-processed geometry to a bounded point count', () => {
  const dense = [];
  for (let i = 0; i < 1200; i += 1) {
    dense.push(i, Math.sin(i / 20) * 30);
  }

  const processed = applyPostProcessSmoothing(dense, 100);

  expect(processed.length / 2).toBeLessThanOrEqual(480);
  expect(processed.length % 2).toBe(0);
});
