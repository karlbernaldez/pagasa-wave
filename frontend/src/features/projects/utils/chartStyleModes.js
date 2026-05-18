export const CHART_STYLE_MODE = {
  WAVE_WIND: 'wave-wind',
  WAVE_ONLY: 'wave-only',
  ACCESSIBLE: 'visually-impaired',
};

export const DEFAULT_CHART_STYLE_MODE = CHART_STYLE_MODE.WAVE_WIND;
export const CHART_STYLE_STORAGE_KEY = 'wavelab.chartStyleMode';

export const CHART_STYLE_MODES = [
  {
    id: CHART_STYLE_MODE.WAVE_WIND,
    label: 'Wave & Wind',
    shortLabel: 'Wave + Wind',
    description: 'Default public chart style with wave annotations and weather context.',
    accent: '#2563eb',
  },
  {
    id: CHART_STYLE_MODE.WAVE_ONLY,
    label: 'Wave Only',
    shortLabel: 'Wave Only',
    description: 'Wave-focused style that reduces non-wave marker emphasis where possible.',
    accent: '#0891b2',
  },
  {
    id: CHART_STYLE_MODE.ACCESSIBLE,
    label: 'Accessible',
    shortLabel: 'Accessible',
    description: 'High-contrast style with stronger strokes and larger labels.',
    accent: '#059669',
  },
];

const MODE_BY_ID = new Map(CHART_STYLE_MODES.map((mode) => [mode.id, mode]));

export function normalizeChartStyleMode(value) {
  return MODE_BY_ID.has(value) ? value : DEFAULT_CHART_STYLE_MODE;
}

export function getChartStyleMode(value) {
  return MODE_BY_ID.get(normalizeChartStyleMode(value)) || MODE_BY_ID.get(DEFAULT_CHART_STYLE_MODE);
}

export function getChartStyleModePaint(value) {
  const mode = normalizeChartStyleMode(value);

  if (mode === CHART_STYLE_MODE.ACCESSIBLE) {
    return {
      polygonFill: '#facc15',
      polygonOpacity: 0.34,
      polygonOutline: '#111827',
      polygonOutlineWidth: 4,
      lineCasing: '#ffffff',
      lineCasingWidth: 11,
      lineColor: '#111827',
      lineWidth: 6,
      pointColor: '#7c2d12',
      pointRadius: 9,
      pointStroke: '#ffffff',
      pointStrokeWidth: 4,
      labelColor: '#000000',
      labelHaloColor: '#ffffff',
      labelHaloWidth: 3,
      lineLabelSize: 22,
      pointLabelSize: 14,
      showPointLabels: true,
      showPoints: true,
    };
  }

  if (mode === CHART_STYLE_MODE.WAVE_ONLY) {
    return {
      polygonFill: '#67e8f9',
      polygonOpacity: 0.3,
      polygonOutline: '#0e7490',
      polygonOutlineWidth: 2.5,
      lineCasing: '#ecfeff',
      lineCasingWidth: 8,
      lineColor: '#0891b2',
      lineWidth: 4.5,
      pointColor: '#64748b',
      pointRadius: 5,
      pointStroke: '#ffffff',
      pointStrokeWidth: 2,
      labelColor: '#0f172a',
      labelHaloColor: '#ffffff',
      labelHaloWidth: 2,
      lineLabelSize: 18,
      pointLabelSize: 11,
      showPointLabels: false,
      showPoints: true,
    };
  }

  return {
    polygonFill: '#38bdf8',
    polygonOpacity: 0.36,
    polygonOutline: '#0f172a',
    polygonOutlineWidth: 2.5,
    lineCasing: '#ffffff',
    lineCasingWidth: 8,
    lineColor: '#0284c7',
    lineWidth: 4,
    pointColor: '#f97316',
    pointRadius: 8,
    pointStroke: '#ffffff',
    pointStrokeWidth: 3,
    labelColor: '#0f172a',
    labelHaloColor: '#ffffff',
    labelHaloWidth: 2,
    lineLabelSize: 18,
    pointLabelSize: 12,
    showPointLabels: true,
    showPoints: true,
  };
}
