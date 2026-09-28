import { describe, expect, it } from 'vitest';

import {
  cornerCutPoints,
  getDrawingSmoothingProfile,
  getFinalCurvePoints,
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
