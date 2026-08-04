import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { fetchFeatures, fetchProjectFeatureCollection } from '@/api/featureServices';
import {
  featureStyleGet as styleGet,
  getFeatureStyle,
  getLineDashArrayExpression,
} from '@/features/projects/utils/annotationStyleExpressions';
import {
  getChartStyleModePaint,
  normalizeChartStyleMode,
} from '@/features/projects/utils/chartStyleModes';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_CENTER = [120.0, 15.5];
const DEFAULT_BOUNDS = [
  [93, 5],
  [153.8595159535438, 25],
];
const FEATURE_CACHE_LIMIT = 80;
const FEATURE_CACHE_TTL_MS = 30_000;
const COLORS = { cold: '#1d4ed8', warm: '#ef4444', occluded: '#7c3aed' };
const FRONT_SYMBOL_RADIUS = 6;
const FRONT_TRIANGLE_SIZE = 7;
const STATIONARY_SEGMENT_LENGTH = 26;
const LINE_ENDPOINT_LABEL_SOURCE_ID = 'project-preview-line-endpoint-label-source';
const LINE_ENDPOINT_LABEL_LAYER_ID = 'project-preview-line-endpoint-labels';
const FRONT_TYPES = {
  cold: {
    color: COLORS.cold,
    lineWidth: 2.75,
    spacing: 40,
    symbols: [{ kind: 'triangle', color: COLORS.cold, side: -1 }],
  },
  warm: {
    color: COLORS.warm,
    lineWidth: 2.75,
    spacing: 40,
    symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }],
  },
  stationary: {
    color: COLORS.cold,
    lineWidth: 2.5,
    spacing: 38,
    symbols: [
      { kind: 'semicircle', color: COLORS.warm, side: -1 },
      { kind: 'triangle', color: COLORS.cold, side: 1 },
    ],
  },
  occluded: {
    color: COLORS.occluded,
    lineWidth: 2.75,
    spacing: 38,
    symbols: [
      { kind: 'semicircle', color: COLORS.occluded, side: -1 },
      { kind: 'triangle', color: COLORS.occluded, side: -1 },
    ],
  },
};
const STATIONARY_SEGMENT_COLORS = [COLORS.warm, COLORS.cold];
const STATIONARY_SEGMENT_SYMBOLS = FRONT_TYPES.stationary.symbols;

const DIFF_COLOR_EXPRESSION = [
  'match',
  ['get', 'diffStatus'],
  'added',
  '#22c55e',
  'changed',
  '#f97316',
  'removed',
  '#ef4444',
  'unchanged',
  '#64748b',
  '#0284c7',
];
const LINE_DASHARRAY_EXPRESSION = getLineDashArrayExpression();
const POINT_MARKER_TYPE = ['coalesce', ['get', 'markerType'], ['get', 'type'], ''];
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];
const POINT_SYMBOL_FILTER = [
  'all',
  POINT_FILTER,
  ['!=', POINT_MARKER_TYPE, 'text_note'],
  ['!=', POINT_MARKER_TYPE, 'less_1'],
];
const LESS_ONE_FILTER = ['all', POINT_FILTER, ['==', POINT_MARKER_TYPE, 'less_1']];
const POINT_LABEL_FILTER = ['all', POINT_FILTER, ['!=', POINT_MARKER_TYPE, 'less_1']];
const POINT_LABEL_OFFSET = ['case', ['==', POINT_MARKER_TYPE, 'text_note'], [0, 0], [0, 1.8]];
const POINT_LABEL_ANCHOR = ['case', ['==', POINT_MARKER_TYPE, 'text_note'], 'center', 'top'];

const featureCache = new Map();
const featureRequestCache = new Map();

function getFeatureCacheKey(projectId, scope) {
  return `${scope || 'user'}:${projectId || 'none'}`;
}
function setCachedFeatures(key, value) {
  if (!key) return;
  featureCache.set(key, { value, cachedAt: Date.now() });
  if (featureCache.size > FEATURE_CACHE_LIMIT) {
    const oldestKey = featureCache.keys().next().value;
    if (oldestKey) featureCache.delete(oldestKey);
  }
}
function getCachedFeatures(key) {
  if (!key || !featureCache.has(key)) return null;
  const entry = featureCache.get(key);
  if (!entry || Date.now() - entry.cachedAt > FEATURE_CACHE_TTL_MS) {
    featureCache.delete(key);
    return null;
  }
  featureCache.delete(key);
  featureCache.set(key, entry);
  return entry.value;
}
function hasDiffStyles(featureCollection) {
  return featureCollection.features.some((feature) => Boolean(feature?.properties?.diffStatus));
}
function extendBoundsFromCoordinates(bounds, coordinates) {
  if (!Array.isArray(coordinates)) return;
  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    bounds.extend(coordinates);
    return;
  }
  coordinates.forEach((child) => extendBoundsFromCoordinates(bounds, child));
}
function getFeatureBounds(featureCollection) {
  const bounds = new mapboxgl.LngLatBounds();
  featureCollection.features.forEach((feature) =>
    extendBoundsFromCoordinates(bounds, feature?.geometry?.coordinates)
  );
  return bounds.isEmpty() ? null : bounds;
}
function setLayerVisibility(map, layerId, isVisible) {
  if (map.getLayer(layerId))
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
}
function ensurePreviewImages(map) {
  const imageId = 'preview-less-1';
  if (!map || map.hasImage(imageId)) return;
  map.loadImage('/L1.png', (error, image) => {
    if (!error && image && !map.hasImage(imageId)) map.addImage(imageId, image);
  });
}
function getFeatureId(feature) {
  const props = feature?.properties || {};
  return (
    feature?.sourceId ||
    props.sourceId ||
    props.stableId ||
    props.annotationId ||
    feature?.id ||
    props.id ||
    props.name ||
    `preview-${Math.random().toString(36).slice(2)}`
  );
}
function normalizeFrontType(frontType) {
  return FRONT_TYPES[frontType] ? frontType : 'cold';
}
function getFrontType(feature) {
  const props = feature?.properties || {};
  const rawType = props.frontType || feature?.frontType || props.type;
  if (FRONT_TYPES[rawType]) return rawType;
  const label = `${feature?.name || ''} ${props.name || ''} ${props.title || ''}`.toLowerCase();
  if (label.includes('warm')) return 'warm';
  if (label.includes('stationary')) return 'stationary';
  if (label.includes('occluded')) return 'occluded';
  return 'cold';
}
function isFrontFeature(feature) {
  const props = feature?.properties || {};
  const id = String(getFeatureId(feature) || '');
  return Boolean(
    props.isFront ||
    props.frontType ||
    id.startsWith('SF_') ||
    `${props.name || ''} ${props.title || ''}`.toLowerCase().includes('front')
  );
}
function getLineLabelValue(feature) {
  const props = feature?.properties || {};
  return (
    props.labelValue ??
    props.waveHeight ??
    props.heightValue ??
    props.height ??
    props.value ??
    props.text ??
    props.label ??
    props.name ??
    props.title ??
    feature?.name ??
    feature?.title ??
    ''
  );
}
function getLineCoordinateParts(geometry) {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return [];
  if (geometry?.type === 'LineString') return [coordinates];
  if (geometry?.type === 'MultiLineString') return coordinates;
  return [];
}
function coordinatesMatch(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length >= 2 &&
    right.length >= 2 &&
    left[0] === right[0] &&
    left[1] === right[1]
  );
}
function isClosedLine(feature, line) {
  return Boolean(
    feature?.properties?.closedMode ||
    feature?.properties?.isClosed ||
    coordinatesMatch(line?.[0], line?.[line.length - 1])
  );
}
function buildLineEndpointLabelCollection(featureCollection) {
  const features = [];
  featureCollection.features
    .filter((feature) => ['LineString', 'MultiLineString'].includes(feature?.geometry?.type))
    .forEach((feature) => {
      const label = String(getLineLabelValue(feature) || '').trim();
      if (!label) return;
      getLineCoordinateParts(feature.geometry).forEach((line, lineIndex) => {
        if (!Array.isArray(line) || line.length < 2) return;
        const points = isClosedLine(feature, line) ? [line[0]] : [line[0], line[line.length - 1]];
        points.forEach((coordinates, pointIndex) => {
          if (!Array.isArray(coordinates) || coordinates.length < 2) return;
          features.push({
            type: 'Feature',
            id: `${getFeatureId(feature)}-${lineIndex}-${pointIndex}`,
            geometry: { type: 'Point', coordinates },
            properties: {
              text: label,
              style: getFeatureStyle(feature),
              diffStatus: feature?.properties?.diffStatus,
            },
          });
        });
      });
    });
  return { type: 'FeatureCollection', features };
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
  const style = FRONT_TYPES[normalizeFrontType(frontType)];
  const path = buildScreenPath(map, coordinates);
  const features = [];
  if (!path.total) return features;
  let symbolIndex = 0;
  for (let distance = style.spacing; distance < path.total; distance += style.spacing) {
    const point = pointAtDistance(path, distance);
    const symbol = style.symbols[symbolIndex % style.symbols.length];
    if (point)
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
    symbolIndex += 1;
  }
  return features;
}
function buildStationarySegmentFeatures(map, coordinates) {
  const path = buildScreenPath(map, coordinates || []);
  const features = [];
  if (!path.total) return features;
  for (
    let startDistance = 0, index = 0;
    startDistance < path.total;
    startDistance += STATIONARY_SEGMENT_LENGTH, index += 1
  ) {
    const endDistance = Math.min(path.total, startDistance + STATIONARY_SEGMENT_LENGTH);
    const start = pointAtDistance(path, startDistance);
    const end = pointAtDistance(path, endDistance);
    if (!start || !end || endDistance <= startDistance) continue;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [toLngLat(map, start.x, start.y), toLngLat(map, end.x, end.y)],
      },
      properties: { color: STATIONARY_SEGMENT_COLORS[index % STATIONARY_SEGMENT_COLORS.length] },
    });
  }
  return features;
}
function buildStationarySymbolFeatures(map, coordinates, sideMultiplier) {
  const path = buildScreenPath(map, coordinates || []);
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
    if (point)
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
  return features;
}
function setSourceData(map, sourceId, data) {
  if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
  else map.addSource(sourceId, { type: 'geojson', data });
}
function removePreviewFront(map, id) {
  [`${id}_dash`, `${id}_secondary`, `${id}_frontSymbols`].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  [`${id}_frontSymbolSource`, `${id}_stationarySegmentSource`, id].forEach((sourceId) => {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });
}
function renderFrontFeature(map, feature, showDiffStyles) {
  const id = getFeatureId(feature);
  const frontType = getFrontType(feature);
  const frontStyle = FRONT_TYPES[normalizeFrontType(frontType)];
  const style = feature?.properties?.style || feature?.style || {};
  const sideMultiplier =
    style.frontSymbolSide === 'opposite' || feature?.properties?.frontSymbolSide === 'opposite'
      ? -1
      : 1;
  const lineColor = showDiffStyles ? DIFF_COLOR_EXPRESSION : style.lineColor || frontStyle.color;
  const lineWidth = Number(style.lineWidth || frontStyle.lineWidth || 2.75);
  const coordinates = feature?.geometry?.coordinates || [];

  setSourceData(map, id, { type: 'FeatureCollection', features: [feature] });
  if (frontType === 'stationary') {
    setSourceData(map, `${id}_stationarySegmentSource`, {
      type: 'FeatureCollection',
      features: buildStationarySegmentFeatures(map, coordinates),
    });
    if (!map.getLayer(`${id}_dash`))
      map.addLayer({
        id: `${id}_dash`,
        type: 'line',
        source: `${id}_stationarySegmentSource`,
        layout: { 'line-join': 'round', 'line-cap': 'butt' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': lineWidth,
          'line-opacity': style.lineOpacity ?? 1,
        },
      });
  } else if (!map.getLayer(`${id}_dash`)) {
    map.addLayer({
      id: `${id}_dash`,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth,
        'line-opacity': style.lineOpacity ?? 1,
      },
    });
  } else {
    map.setPaintProperty(`${id}_dash`, 'line-color', lineColor);
    map.setPaintProperty(`${id}_dash`, 'line-width', lineWidth);
  }

  setSourceData(map, `${id}_frontSymbolSource`, {
    type: 'FeatureCollection',
    features:
      frontType === 'stationary'
        ? buildStationarySymbolFeatures(map, coordinates, sideMultiplier)
        : buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier),
  });
  if (!map.getLayer(`${id}_frontSymbols`))
    map.addLayer({
      id: `${id}_frontSymbols`,
      type: 'fill',
      source: `${id}_frontSymbolSource`,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': style.symbolOpacity ?? style.fillOpacity ?? 1,
      },
    });
}
function renderFrontFeatures(map, features, showDiffStyles) {
  const ids = new Set(features.map(getFeatureId));
  const previousIds = map.__previewFrontIds || new Set();
  previousIds.forEach((id) => {
    if (!ids.has(id)) removePreviewFront(map, id);
  });
  features.forEach((feature) => renderFrontFeature(map, feature, showDiffStyles));
  map.__previewFrontIds = ids;
}

function setPreviewLayerPaint(map, { showDiffStyles, styleMode }) {
  const paint = getChartStyleModePaint(styleMode);
  const polygonColor = showDiffStyles
    ? DIFF_COLOR_EXPRESSION
    : styleGet('fillColor', paint.polygonFill);
  const lineColor = showDiffStyles ? DIFF_COLOR_EXPRESSION : styleGet('lineColor', paint.lineColor);
  const pointColor = showDiffStyles
    ? DIFF_COLOR_EXPRESSION
    : styleGet('color', styleGet('pointColor', paint.pointColor));
  if (map.getLayer('project-preview-polygons')) {
    map.setPaintProperty('project-preview-polygons', 'fill-color', polygonColor);
    map.setPaintProperty(
      'project-preview-polygons',
      'fill-opacity',
      showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.2, 0.42]
        : styleGet('fillOpacity', paint.polygonOpacity)
    );
  }
  if (map.getLayer('project-preview-polygons-outline')) {
    map.setPaintProperty(
      'project-preview-polygons-outline',
      'line-color',
      showDiffStyles ? lineColor : styleGet('lineColor', paint.polygonOutline)
    );
    map.setPaintProperty(
      'project-preview-polygons-outline',
      'line-width',
      styleGet('lineWidth', paint.polygonOutlineWidth)
    );
    map.setPaintProperty(
      'project-preview-polygons-outline',
      'line-opacity',
      showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : styleGet('lineOpacity', 0.9)
    );
    map.setPaintProperty(
      'project-preview-polygons-outline',
      'line-dasharray',
      LINE_DASHARRAY_EXPRESSION
    );
  }
  if (map.getLayer('project-preview-lines-casing')) {
    map.setPaintProperty(
      'project-preview-lines-casing',
      'line-color',
      styleGet('lineCasing', 'rgba(255, 255, 255, 0)')
    );
    map.setPaintProperty(
      'project-preview-lines-casing',
      'line-width',
      styleGet('lineCasingWidth', 0)
    );
    map.setPaintProperty(
      'project-preview-lines-casing',
      'line-dasharray',
      LINE_DASHARRAY_EXPRESSION
    );
  }
  if (map.getLayer('project-preview-lines')) {
    map.setPaintProperty('project-preview-lines', 'line-color', lineColor);
    map.setPaintProperty(
      'project-preview-lines',
      'line-width',
      styleGet('lineWidth', paint.lineWidth)
    );
    map.setPaintProperty(
      'project-preview-lines',
      'line-opacity',
      showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : styleGet('lineOpacity', 1)
    );
    map.setPaintProperty('project-preview-lines', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);
  }
  setLayerVisibility(map, 'project-preview-line-labels', false);
  if (map.getLayer(LINE_ENDPOINT_LABEL_LAYER_ID)) {
    map.setLayoutProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-size',
      styleGet('textSize', paint.lineLabelSize)
    );
    map.setLayoutProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-letter-spacing',
      styleGet('textLetterSpacing', 0)
    );
    map.setLayoutProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-transform',
      styleGet('textTransform', 'none')
    );
    map.setPaintProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-color',
      styleGet('textColor', paint.labelColor)
    );
    map.setPaintProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-halo-color',
      styleGet('textHaloColor', paint.labelHaloColor)
    );
    map.setPaintProperty(
      LINE_ENDPOINT_LABEL_LAYER_ID,
      'text-halo-width',
      styleGet('textHaloWidth', paint.labelHaloWidth)
    );
  }
  if (map.getLayer('project-preview-points-halo')) {
    map.setPaintProperty('project-preview-points-halo', 'circle-color', pointColor);
    map.setPaintProperty(
      'project-preview-points-halo',
      'circle-radius',
      styleGet('iconSize', paint.pointRadius + 3)
    );
    map.setPaintProperty(
      'project-preview-points-halo',
      'circle-opacity',
      paint.showPoints ? styleGet('iconOpacity', 0.28) : 0
    );
  }
  if (map.getLayer('project-preview-points-symbol')) {
    map.setPaintProperty('project-preview-points-symbol', 'circle-color', pointColor);
    map.setPaintProperty(
      'project-preview-points-symbol',
      'circle-radius',
      styleGet('iconSize', paint.pointRadius)
    );
    map.setPaintProperty(
      'project-preview-points-symbol',
      'circle-stroke-color',
      styleGet('pointStroke', paint.pointStroke)
    );
    map.setPaintProperty(
      'project-preview-points-symbol',
      'circle-stroke-width',
      styleGet('pointStrokeWidth', paint.pointStrokeWidth)
    );
    map.setPaintProperty(
      'project-preview-points-symbol',
      'circle-opacity',
      paint.showPoints ? styleGet('iconOpacity', 1) : 0
    );
  }
  if (map.getLayer('project-preview-points-label')) {
    map.setLayoutProperty(
      'project-preview-points-label',
      'text-size',
      styleGet('textSize', paint.pointLabelSize)
    );
    map.setLayoutProperty(
      'project-preview-points-label',
      'text-letter-spacing',
      styleGet('textLetterSpacing', 0)
    );
    map.setLayoutProperty(
      'project-preview-points-label',
      'text-transform',
      styleGet('textTransform', 'none')
    );
    map.setPaintProperty(
      'project-preview-points-label',
      'text-color',
      styleGet('textColor', paint.labelColor)
    );
    map.setPaintProperty(
      'project-preview-points-label',
      'text-halo-color',
      styleGet('textHaloColor', paint.labelHaloColor)
    );
    map.setPaintProperty(
      'project-preview-points-label',
      'text-halo-width',
      styleGet('textHaloWidth', paint.labelHaloWidth)
    );
  }
}
function addPreviewLayers(
  map,
  featureCollection,
  { showLabels = true, showDiffStyles = false, styleMode } = {}
) {
  const sourceId = 'project-preview-features';
  const paint = getChartStyleModePaint(styleMode);
  const frontFeatures = featureCollection.features.filter(isFrontFeature);
  const genericFeatureCollection = {
    type: 'FeatureCollection',
    features: featureCollection.features.filter((feature) => !isFrontFeature(feature)),
  };
  const lineEndpointLabels = buildLineEndpointLabelCollection(genericFeatureCollection);
  const polygonColor = showDiffStyles
    ? DIFF_COLOR_EXPRESSION
    : styleGet('fillColor', paint.polygonFill);
  const lineColor = showDiffStyles ? DIFF_COLOR_EXPRESSION : styleGet('lineColor', paint.lineColor);
  const pointColor = showDiffStyles
    ? DIFF_COLOR_EXPRESSION
    : styleGet('color', styleGet('pointColor', paint.pointColor));

  ensurePreviewImages(map);
  renderFrontFeatures(map, frontFeatures, showDiffStyles);
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(genericFeatureCollection);
    setSourceData(map, LINE_ENDPOINT_LABEL_SOURCE_ID, lineEndpointLabels);
    setPreviewLayerPaint(map, { showDiffStyles, styleMode });
    setLayerVisibility(map, 'project-preview-line-labels', false);
    setLayerVisibility(map, LINE_ENDPOINT_LABEL_LAYER_ID, showLabels);
    setLayerVisibility(map, 'project-preview-points-label', showLabels && paint.showPointLabels);
    return;
  }

  map.addSource(sourceId, { type: 'geojson', data: genericFeatureCollection });
  map.addSource(LINE_ENDPOINT_LABEL_SOURCE_ID, { type: 'geojson', data: lineEndpointLabels });
  map.addLayer({
    id: 'project-preview-polygons',
    type: 'fill',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'fill-color': polygonColor,
      'fill-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.2, 0.42]
        : styleGet('fillOpacity', paint.polygonOpacity),
    },
  });
  map.addLayer({
    id: 'project-preview-polygons-outline',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color': showDiffStyles ? lineColor : styleGet('lineColor', paint.polygonOutline),
      'line-width': styleGet('lineWidth', paint.polygonOutlineWidth),
      'line-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : styleGet('lineOpacity', 0.9),
      'line-dasharray': LINE_DASHARRAY_EXPRESSION,
    },
  });
  map.addLayer({
    id: 'project-preview-lines-casing',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': styleGet('lineCasing', 'rgba(255, 255, 255, 0)'),
      'line-width': styleGet('lineCasingWidth', 0),
      'line-opacity': 0.95,
      'line-dasharray': LINE_DASHARRAY_EXPRESSION,
    },
  });
  map.addLayer({
    id: 'project-preview-lines',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': lineColor,
      'line-width': styleGet('lineWidth', paint.lineWidth),
      'line-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : styleGet('lineOpacity', 1),
      'line-dasharray': LINE_DASHARRAY_EXPRESSION,
    },
  });
  if (showLabels)
    map.addLayer({
      id: LINE_ENDPOINT_LABEL_LAYER_ID,
      type: 'symbol',
      source: LINE_ENDPOINT_LABEL_SOURCE_ID,
      layout: {
        'text-field': ['get', 'text'],
        'text-size': styleGet('textSize', paint.lineLabelSize),
        'text-letter-spacing': styleGet('textLetterSpacing', 0),
        'text-transform': styleGet('textTransform', 'none'),
        'text-anchor': 'bottom',
        'text-offset': [0, 0.5],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': styleGet('textColor', paint.labelColor),
        'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor),
        'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth),
      },
    });
  map.addLayer({
    id: 'project-preview-points-halo',
    type: 'circle',
    source: sourceId,
    filter: POINT_SYMBOL_FILTER,
    paint: {
      'circle-color': pointColor,
      'circle-radius': styleGet('iconSize', paint.pointRadius + 3),
      'circle-opacity': paint.showPoints ? styleGet('iconOpacity', 0.28) : 0,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  });
  map.addLayer({
    id: 'project-preview-points-symbol',
    type: 'circle',
    source: sourceId,
    filter: POINT_SYMBOL_FILTER,
    paint: {
      'circle-color': pointColor,
      'circle-radius': styleGet('iconSize', paint.pointRadius),
      'circle-opacity': paint.showPoints ? styleGet('iconOpacity', 1) : 0,
      'circle-stroke-color': styleGet('pointStroke', paint.pointStroke),
      'circle-stroke-width': styleGet('pointStrokeWidth', paint.pointStrokeWidth),
    },
  });
  map.addLayer({
    id: 'project-preview-less-one-symbol',
    type: 'symbol',
    source: sourceId,
    filter: LESS_ONE_FILTER,
    layout: {
      'icon-image': 'preview-less-1',
      'icon-size': 0.28,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
  if (showLabels)
    map.addLayer({
      id: 'project-preview-points-label',
      type: 'symbol',
      source: sourceId,
      filter: POINT_LABEL_FILTER,
      layout: {
        'text-field': [
          'to-string',
          [
            'coalesce',
            ['get', 'name'],
            ['get', 'title'],
            ['get', 'label'],
            ['get', 'labelValue'],
            'Marker',
          ],
        ],
        'text-size': styleGet('textSize', paint.pointLabelSize),
        'text-letter-spacing': styleGet('textLetterSpacing', 0),
        'text-transform': styleGet('textTransform', 'none'),
        'text-offset': POINT_LABEL_OFFSET,
        'text-anchor': POINT_LABEL_ANCHOR,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        visibility: paint.showPointLabels ? 'visible' : 'none',
      },
      paint: {
        'text-color': styleGet('textColor', paint.labelColor),
        'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor),
        'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth),
      },
    });
}

async function loadProjectFeatures(projectId, scope) {
  if (!projectId) return null;
  return scope === 'admin' ? fetchProjectFeatureCollection(projectId) : fetchFeatures(projectId);
}
async function loadProjectFeaturesCached(projectId, scope) {
  const key = getFeatureCacheKey(projectId, scope);
  const cached = getCachedFeatures(key);
  if (cached) return cached;
  if (featureRequestCache.has(key)) return featureRequestCache.get(key);
  const request = loadProjectFeatures(projectId, scope)
    .then((data) => {
      setCachedFeatures(key, data);
      return data;
    })
    .finally(() => featureRequestCache.delete(key));
  featureRequestCache.set(key, request);
  return request;
}
function useNearViewport(rootMargin = '500px', disabled = false) {
  const targetRef = useRef(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(
    () => disabled || typeof window === 'undefined' || !('IntersectionObserver' in window)
  );
  const isNearViewport = disabled || hasEnteredViewport;

  useEffect(() => {
    const target = targetRef.current;
    if (!target || isNearViewport) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [isNearViewport, rootMargin]);

  return [targetRef, isNearViewport];
}
function getFeatureIdentity(feature) {
  return (
    feature.id ||
    feature._id ||
    feature.properties?.stableId ||
    feature.properties?.annotationId ||
    feature.properties?.id ||
    feature.properties?.sourceId ||
    feature.properties?.name ||
    ''
  );
}
function getFeatureRenderKey(featureCollection) {
  return JSON.stringify(
    featureCollection.features.map((feature) => ({
      geometry: feature.geometry,
      id: getFeatureIdentity(feature),
      markerType: feature.properties?.markerType,
      diffStatus: feature.properties?.diffStatus,
      labelValue: feature.properties?.labelValue,
      waveHeight: feature.properties?.waveHeight,
      heightValue: feature.properties?.heightValue,
      height: feature.properties?.height,
      value: feature.properties?.value,
      label: feature.properties?.label,
      text: feature.properties?.text,
      name: feature.name,
      title: feature.title,
      style: feature.properties?.style,
      frontType: feature.properties?.frontType,
      frontSymbolSide: feature.properties?.frontSymbolSide,
    }))
  );
}
function PreviewPlaceholder({ isDarkMode, label, loading = false }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center text-xs font-semibold backdrop-blur-[1px] ${isDarkMode ? 'bg-slate-950/55 text-slate-400' : 'bg-white/55 text-slate-500'}`}
    >
      {loading ? 'Loading annotations...' : label}
    </div>
  );
}

function ProjectPreviewMap({
  projectId,
  features,
  featureScope = 'user',
  className = '',
  height = 180,
  isDarkMode = false,
  emptyLabel = 'No annotations yet',
  lazy = true,
  showLabels = true,
  showDiffStyles = false,
  chartStyleMode,
  fixedBounds = false,
}) {
  const [viewportRef, isNearViewport] = useNearViewport('500px', !lazy);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const fittedFeaturesKeyRef = useRef('');
  const [isReady, setIsReady] = useState(false);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);
  const providedFeatureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const hasProvidedFeatures = providedFeatureCollection.features.length > 0;
  const featureCacheKey = useMemo(
    () => getFeatureCacheKey(projectId, featureScope),
    [featureScope, projectId]
  );
  const [remoteFeatureState, setRemoteFeatureState] = useState(() => ({
    key: featureCacheKey,
    data: projectId ? getCachedFeatures(featureCacheKey) : null,
  }));
  const remoteFeatures =
    !hasProvidedFeatures && projectId && remoteFeatureState.key === featureCacheKey
      ? remoteFeatureState.data
      : null;
  const shouldFetchFeatures =
    isNearViewport && Boolean(projectId) && !hasProvidedFeatures && !remoteFeatures;
  const showFeatureLoading = shouldFetchFeatures && isLoadingFeatures;

  useEffect(() => {
    let isMounted = true;
    if (!shouldFetchFeatures) return undefined;

    Promise.resolve().then(() => {
      if (isMounted) setIsLoadingFeatures(true);
    });
    loadProjectFeaturesCached(projectId, featureScope)
      .then((data) => {
        if (isMounted) setRemoteFeatureState({ key: featureCacheKey, data });
      })
      .catch((error) => {
        if (isMounted) {
          console.error('[ProjectPreviewMap] Failed to load project features:', error);
          setRemoteFeatureState({ key: featureCacheKey, data: null });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingFeatures(false);
      });
    return () => {
      isMounted = false;
    };
  }, [featureCacheKey, featureScope, projectId, shouldFetchFeatures]);

  const featureCollection = useMemo(
    () =>
      hasProvidedFeatures ? providedFeatureCollection : normalizeFeatureCollection(remoteFeatures),
    [hasProvidedFeatures, providedFeatureCollection, remoteFeatures]
  );
  const hasFeatures = featureCollection.features.length > 0;
  const featureKey = useMemo(() => getFeatureRenderKey(featureCollection), [featureCollection]);
  const shouldRenderMap = isNearViewport && hasFeatures;
  const shouldUseDiffStyles = showDiffStyles || hasDiffStyles(featureCollection);
  const containerStyle = height == null ? undefined : { height };

  useEffect(() => {
    if (!shouldRenderMap || !containerRef.current || mapRef.current) return undefined;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: 'mercator',
      center: DEFAULT_CENTER,
      zoom: 4.8,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: false,
      fadeDuration: 0,
    });
    mapRef.current = map;
    map.on('load', () => {
      setIsReady(true);
      map.resize();
      map.fitBounds(DEFAULT_BOUNDS, { padding: 18, maxZoom: 6, duration: 0 });
    });
    return () => {
      map.remove();
      mapRef.current = null;
      fittedFeaturesKeyRef.current = '';
      setIsReady(false);
    };
  }, [shouldRenderMap]);
  useEffect(() => {
    if (shouldRenderMap || !mapRef.current) return;
    mapRef.current.remove();
    mapRef.current = null;
    fittedFeaturesKeyRef.current = '';
    setIsReady(false);
  }, [shouldRenderMap]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !hasFeatures) return;
    addPreviewLayers(map, featureCollection, {
      showLabels,
      showDiffStyles: shouldUseDiffStyles,
      styleMode: normalizedStyleMode,
    });
    if (fittedFeaturesKeyRef.current === featureKey) return;
    if (fixedBounds) {
      map.fitBounds(DEFAULT_BOUNDS, { padding: 18, maxZoom: 6, duration: 0 });
      fittedFeaturesKeyRef.current = featureKey;
      return;
    }
    const bounds = getFeatureBounds(featureCollection);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: featureCollection.features.length === 1 ? 8 : 10,
        duration: 0,
      });
      fittedFeaturesKeyRef.current = featureKey;
    }
  }, [
    featureCollection,
    featureKey,
    fixedBounds,
    hasFeatures,
    isReady,
    normalizedStyleMode,
    shouldUseDiffStyles,
    showLabels,
  ]);

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden rounded-xl border transition-colors ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-100'} ${className}`}
      style={containerStyle}
    >
      {shouldRenderMap ? (
        <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
      ) : (
        <div
          className={`h-full w-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}
          aria-hidden="true"
        />
      )}
      {!isNearViewport && (
        <div
          className={`h-full w-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
          aria-hidden="true"
        />
      )}
      {isNearViewport && !hasFeatures && !showFeatureLoading && (
        <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} />
      )}
      {showFeatureLoading && (
        <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} loading />
      )}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t ${isDarkMode ? 'from-slate-950/80' : 'from-white/80'} to-transparent`}
      />
    </div>
  );
}

export default memo(ProjectPreviewMap);
