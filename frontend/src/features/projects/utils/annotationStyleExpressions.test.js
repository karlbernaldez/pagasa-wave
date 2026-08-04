import { describe, expect, it } from 'vitest';

import {
  FEATURE_STYLE_OBJECT,
  LINE_DASH_PATTERNS,
  featureStyleGet,
  getFeatureStyle,
  getLineDashArrayExpression,
  getLineDashPattern,
} from './annotationStyleExpressions';

describe('annotationStyleExpressions', () => {
  it('matches the Studio solid, dashed, and dotted patterns', () => {
    expect(LINE_DASH_PATTERNS).toEqual({
      solid: [1],
      dashed: [4, 2],
      dotted: [1, 2],
    });
    expect(getLineDashPattern('solid')).toEqual([1]);
    expect(getLineDashPattern('dashed')).toEqual([4, 2]);
    expect(getLineDashPattern('dotted')).toEqual([1, 2]);
  });

  it('falls back safely to a solid line for missing or unknown styles', () => {
    expect(getLineDashPattern()).toEqual([1]);
    expect(getLineDashPattern('legacy-value')).toEqual([1]);
  });

  it('reads nested saved styles before legacy top-level properties', () => {
    expect(featureStyleGet('lineColor', '#2563eb')).toEqual([
      'coalesce',
      ['get', 'lineColor', FEATURE_STYLE_OBJECT],
      ['get', 'lineColor'],
      '#2563eb',
    ]);
  });

  it('builds a data-driven Mapbox dash expression with a solid fallback', () => {
    expect(getLineDashArrayExpression()).toEqual([
      'match',
      featureStyleGet('lineDash', 'solid'),
      'dashed',
      ['literal', [4, 2]],
      'dotted',
      ['literal', [1, 2]],
      ['literal', [1]],
    ]);
  });

  it('reads persisted styles from normalized and legacy feature shapes', () => {
    expect(getFeatureStyle({ properties: { style: { lineDash: 'dashed' } } })).toEqual({
      lineDash: 'dashed',
    });
    expect(getFeatureStyle({ style: { lineDash: 'dotted' } })).toEqual({
      lineDash: 'dotted',
    });
    expect(getFeatureStyle({ properties: { style: 'invalid' } })).toEqual({});
  });
});
