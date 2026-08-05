import { updateFeatureStyle } from '@/api/featureServices';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';

const pendingStyleChanges = new Map();
const STYLE_SAVE_DEBOUNCE_MS = 250;
const COLORS = { cold: '#1d4ed8', warm: '#ef4444', occluded: '#7c3aed' };
const FRONT_SYMBOL_RADIUS = 6;
const FRONT_TRIANGLE_SIZE = 7;
const STATIONARY_SEGMENT_LENGTH = 26;
const FRONT_TYPES = {
  cold: { spacing: 40, symbols: [{ kind: 'triangle', color: COLORS.cold, side: -1 }] },
  warm: { spacing: 40, symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }] },
  stationary: {
    spacing: 38,
    symbols: [
      { kind: 'semicircle', color: COLORS.warm, side: -1 },
      { kind: 'triangle', color: COLORS.cold, side: 1 },
    ],
  },
  occluded: {
    spacing: 38,
    symbols: [
      { kind: 'semicircle', color: COLORS.occluded, side: -1 },
      { kind: 'triangle', color: COLORS.occluded, side: -1 },
    ],
  },
};
const STATIONARY_SEGMENT_SYMBOLS = FRONT_TYPES.stationary.symbols;
const DASH_PATTERNS = { solid: [1], dashed: [4, 2], dotted: [1, 2] };

function cloneStyle(style) {
  if (typeof structuredClone === 'function') return structuredClone(style || {});
  return JSON.parse(JSON.stringify(style || {}));
}

function stylesEqual(left, right) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {});
}

function getProjectId(layerInfo) {
  return (
    layerInfo?.projectId ||
    layerInfo?.project ||
    layerInfo?.properties?.project ||
    localStorage.getItem('projectId') ||
    ''
  );
}

function getLayerLabel(layerInfo) {
  return (
    layerInfo?.name ||
    layerInfo?.properties?.displayName ||
    layerInfo?.properties?.name ||
    'annotation'
  );
}

export function getLayerSourceId(layerInfo) {
  return layerInfo?.sourceID || layerInfo?.sourceId || layerInfo?.source || layerInfo?.id;
}

export function getPersistedStyle(featureOrLayer) {
  return featureOrLayer?.properties?.style || featureOrLayer?.style || {};
}

export function getMergedStyle(featureOrLayer, runtimeStyle = {}) {
  return { ...getPersistedStyle(featureOrLayer), ...runtimeStyle };
}

export function queuePersistAnnotationStyle(layerInfo, style) {
  const sourceId = getLayerSourceId(layerInfo);
  if (!sourceId || layerInfo?.canEdit === false) return;

  const existing = pendingStyleChanges.get(sourceId);
  if (existing?.timerId) window.clearTimeout(existing.timerId);

  const beforeStyle = existing?.beforeStyle || cloneStyle(getPersistedStyle(layerInfo));
  const afterStyle = cloneStyle(style);
  const projectId = existing?.projectId || getProjectId(layerInfo);
  const label = existing?.label || getLayerLabel(layerInfo);

  const timerId = window.setTimeout(async () => {
    pendingStyleChanges.delete(sourceId);
    if (stylesEqual(beforeStyle, afterStyle)) return;

    try {
      await updateFeatureStyle(sourceId, afterStyle);
      publishAnnotationHistoryCommand({
        label: `Style ${label}`,
        undo: async () => {
          await updateFeatureStyle(sourceId, beforeStyle);
          requestAnnotationHistoryRefresh(projectId);
        },
        redo: async () => {
          await updateFeatureStyle(sourceId, afterStyle);
          requestAnnotationHistoryRefresh(projectId);
        },
      });
    } catch (error) {
      console.error('[STYLE SAVE ERROR]', error);
      requestAnnotationHistoryRefresh(projectId);
    }
  }, STYLE_SAVE_DEBOUNCE_MS);

  pendingStyleChanges.set(sourceId, {
    beforeStyle,
    afterStyle,
    projectId,
    label,
    timerId,
  });
}

function safeSetPaint(map, layerId, prop, value) {
  if (value === undefined || value === null || !map?.getLayer(layerId)) return false;
  try {
    map.setPaintProperty(layerId, prop, value);
    return true;
  } catch {
    return false;
  }
}

function safeSetLayout(map, layerId, prop, value) {
  if (value === undefined || value === null || !map?.getLayer(layerId)) return false;
  try {
    map.setLayoutProperty(layerId, prop, value);
    return true;
  } catch {
    return false;
  }
}

function markerLayerId(feature) {
  const props = feature?.properties || {};
  const markerType = props.markerType || props.type;
  const name = feature?.name || props.name || props.title || props.labelValue;
  if (!markerType || !name) return null;
  return props.mapLayerId || `${markerType}_${name}`;
}

function getAnnotationSourceId(feature) {
  const props = feature?.properties || {};
  return feature?.sourceId || props.sourceId || props.stableId || props.annotationId || feature?.id;
}

function frontLayerIds(feature) {
  const sourceId = getAnnotationSourceId(feature);
  return sourceId
    ? [
        `${sourceId}_dash`,
        `${sourceId}_secondary`,
        `${sourceId}_frontSymbols`,
        `${sourceId}_frontSymbolOutline`,
        sourceId,
      ]
    : [];
}

function genericLayerIds(feature) {
  const props = feature?.properties || {};
  const sourceId = getAnnotationSourceId(feature);
  return Array.from(
    new Set(
      [
        props.mapLayerId,
        markerLayerId(feature),
        sourceId,
        sourceId ? `${sourceId}-0` : null,
        sourceId ? `${sourceId}-1` : null,
      ].filter(Boolean)
    )
  );
}

function normalizeFrontType(frontType) {
  return FRONT_TYPES[frontType] ? frontType : 'cold';
}

function getFrontType(feature) {
  const props = feature?.properties || {};
  const rawType = props.frontType || feature?.frontType;
  if (FRONT_TYPES[rawType]) return rawType;
  const label = `${feature?.name || ''} ${props.name || ''} ${props.title || ''}`.toLowerCase();
  if (label.includes('warm')) return 'warm';
  if (label.includes('stationary')) return 'stationary';
  if (label.includes('occluded')) return 'occluded';
  return 'cold';
}

function toLngLat(map, x, y) {
  const point = map.unproject([x, y]);
  return [point.lng, point.lat];
}

function triangleCoordinates(map, x, y, ux, uy, nx, ny, side) {
  const size = FRONT_TRIANGLE_SIZE;
  return [
    [
      toLngLat(map, x - ux * size, y - uy * size),
      toLngLat(map, x + ux * size, y + uy * size),
      toLngLat(map, x + nx * side * size * 1.35, y + ny * side * size * 1.35),
      toLngLat(map, x - ux * size, y - uy * size),
    ],
  ];
}

function semicircleCoordinates(map, x, y, ux, uy, nx, ny, side) {
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const theta = Math.PI - (Math.PI * i) / 12;
    points.push(
      toLngLat(
        map,
        x +
          ux * FRONT_SYMBOL_RADIUS * Math.cos(theta) +
          nx * side * FRONT_SYMBOL_RADIUS * Math.sin(theta),
        y +
          uy * FRONT_SYMBOL_RADIUS * Math.cos(theta) +
          ny * side * FRONT_SYMBOL_RADIUS * Math.sin(theta)
      )
    );
  }
  points.push(toLngLat(map, x - ux * FRONT_SYMBOL_RADIUS, y - uy * FRONT_SYMBOL_RADIUS));
  return [points];
}

function buildShapeFeature(map, symbol, sideMultiplier, x, y, ux, uy, nx, ny) {
  const side = symbol.side * sideMultiplier;
  const coordinates =
    symbol.kind === 'triangle'
      ? triangleCoordinates(map, x, y, ux, uy, nx, ny, side)
      : semicircleCoordinates(map, x, y, ux, uy, nx, ny, side);
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates },
    properties: { color: symbol.color },
  };
}

function buildScreenPath(map, coordinates) {
  const points = (coordinates || []).map((coord) => map.project(coord));
  const segments = [];
  let total = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    segments.push({ start, dx, dy, len, startDistance: total });
    total += len;
  }

  return { segments, total };
}

function pointAtDistance(path, distance) {
  if (!path.segments.length) return null;
  const clamped = Math.min(Math.max(distance, 0), path.total);
  const segment =
    path.segments.find((item) => clamped <= item.startDistance + item.len) ||
    path.segments[path.segments.length - 1];
  const local = Math.min(Math.max(clamped - segment.startDistance, 0), segment.len);
  const t = segment.len ? local / segment.len : 0;
  const ux = segment.dx / segment.len;
  const uy = segment.dy / segment.len;

  return {
    x: segment.start.x + segment.dx * t,
    y: segment.start.y + segment.dy * t,
    ux,
    uy,
    nx: -uy,
    ny: ux,
  };
}

function buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier) {
  const frontStyle = FRONT_TYPES[normalizeFrontType(frontType)];
  const path = buildScreenPath(map, coordinates);
  const features = [];
  if (!path.total) return features;

  let symbolIndex = 0;
  for (let distance = frontStyle.spacing; distance < path.total; distance += frontStyle.spacing) {
    const point = pointAtDistance(path, distance);
    const symbol = frontStyle.symbols[symbolIndex % frontStyle.symbols.length];
    if (point) {
      features.push(
        buildShapeFeature(
          map,
          symbol,
          sideMultiplier,
          point.x,
          point.y,
          point.ux,
          point.uy,
          point.nx,
          point.ny
        )
      );
    }
    symbolIndex += 1;
  }

  return features;
}

function buildStationarySymbolFeatures(map, coordinates, sideMultiplier) {
  const path = buildScreenPath(map, coordinates);
  const features = [];
  if (!path.total) return features;

  for (
    let startDistance = 0, index = 0;
    startDistance < path.total;
    startDistance += STATIONARY_SEGMENT_LENGTH, index += 1
  ) {
    const endDistance = Math.min(path.total, startDistance + STATIONARY_SEGMENT_LENGTH);
    if (endDistance - startDistance < STATIONARY_SEGMENT_LENGTH * 0.5) continue;
    const point = pointAtDistance(path, (startDistance + endDistance) / 2);
    const symbol = STATIONARY_SEGMENT_SYMBOLS[index % STATIONARY_SEGMENT_SYMBOLS.length];
    if (point) {
      features.push(
        buildShapeFeature(
          map,
          symbol,
          sideMultiplier,
          point.x,
          point.y,
          point.ux,
          point.uy,
          point.nx,
          point.ny
        )
      );
    }
  }

  return features;
}

function applyFrontSymbolSide(map, feature, style) {
  const sourceId = getAnnotationSourceId(feature);
  const symbolSource = map?.getSource(`${sourceId}_frontSymbolSource`);
  if (!sourceId || !symbolSource?.setData) return;

  const frontSymbolSide = style.frontSymbolSide || feature?.properties?.frontSymbolSide;
  if (!frontSymbolSide) return;

  const coordinates = feature?.geometry?.coordinates || [];
  const sideMultiplier = frontSymbolSide === 'opposite' ? -1 : 1;
  const frontType = getFrontType(feature);

  symbolSource.setData({
    type: 'FeatureCollection',
    features:
      frontType === 'stationary'
        ? buildStationarySymbolFeatures(map, coordinates, sideMultiplier)
        : buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier),
  });
}

export function applyAnnotationStyleToMap(map, feature) {
  const style = getPersistedStyle(feature);
  if (!map || !feature || !style || Object.keys(style).length === 0) return;

  const props = feature.properties || {};
  const isFront = Boolean(props.isFront || getAnnotationSourceId(feature)?.startsWith?.('SF_'));
  const candidateIds = isFront ? frontLayerIds(feature) : genericLayerIds(feature);

  if (isFront) applyFrontSymbolSide(map, feature, style);

  candidateIds.forEach((layerId) => {
    const layer = map.getLayer(layerId);
    if (!layer) return;

    if (layer.type === 'symbol') {
      safeSetLayout(map, layerId, 'icon-size', style.iconSize);
      safeSetLayout(map, layerId, 'icon-rotate', style.iconRotate);
      safeSetLayout(map, layerId, 'text-size', style.textSize);
      safeSetLayout(map, layerId, 'text-letter-spacing', style.textLetterSpacing);
      safeSetLayout(map, layerId, 'text-transform', style.textTransform);
      safeSetPaint(map, layerId, 'icon-opacity', style.iconOpacity);
      safeSetPaint(map, layerId, 'text-color', style.textColor);
      safeSetPaint(map, layerId, 'text-halo-color', style.textHaloColor);
      safeSetPaint(map, layerId, 'text-halo-width', style.textHaloWidth);
    }

    if (layer.type === 'line') {
      safeSetPaint(map, layerId, 'line-color', style.lineColor);
      safeSetPaint(map, layerId, 'line-width', style.lineWidth);
      safeSetPaint(map, layerId, 'line-opacity', style.lineOpacity);
      if (style.lineDash && DASH_PATTERNS[style.lineDash]) {
        safeSetPaint(map, layerId, 'line-dasharray', DASH_PATTERNS[style.lineDash]);
      }
    }

    if (layer.type === 'fill') {
      safeSetPaint(map, layerId, 'fill-color', style.fillColor);
      safeSetPaint(map, layerId, 'fill-opacity', style.fillOpacity ?? style.symbolOpacity);
    }
  });
}

export function applyAnnotationStylesToMap(map, features = []) {
  features.forEach((feature) => applyAnnotationStyleToMap(map, feature));
}
