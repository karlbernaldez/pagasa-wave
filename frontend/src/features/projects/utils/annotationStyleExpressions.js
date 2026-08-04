const EMPTY_STYLE_OBJECT = ['literal', {}];

export const FEATURE_STYLE_OBJECT = ['coalesce', ['get', 'style'], EMPTY_STYLE_OBJECT];

export const LINE_DASH_PATTERNS = Object.freeze({
  solid: [1],
  dashed: [4, 2],
  dotted: [1, 2],
});

export function getFeatureStyle(feature) {
  const style = feature?.properties?.style ?? feature?.style;
  return style && typeof style === 'object' && !Array.isArray(style) ? style : {};
}

export function featureStyleGet(key, fallback) {
  return ['coalesce', ['get', key, FEATURE_STYLE_OBJECT], ['get', key], fallback];
}

export function getLineDashPattern(value) {
  return LINE_DASH_PATTERNS[value] || LINE_DASH_PATTERNS.solid;
}

export function getLineDashArrayExpression() {
  return [
    'match',
    featureStyleGet('lineDash', 'solid'),
    'dashed',
    ['literal', LINE_DASH_PATTERNS.dashed],
    'dotted',
    ['literal', LINE_DASH_PATTERNS.dotted],
    ['literal', LINE_DASH_PATTERNS.solid],
  ];
}
