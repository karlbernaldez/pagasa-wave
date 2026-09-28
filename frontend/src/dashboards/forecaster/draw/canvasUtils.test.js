import { describe, expect, it } from 'vitest';

import {
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
