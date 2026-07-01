const COLORS = { cold: '#1d4ed8', warm: '#ef4444', occluded: '#7c3aed' };
const FRONT_SYMBOL_RADIUS = 6;
const FRONT_TRIANGLE_SIZE = 7;
const STATIONARY_SEGMENT_LENGTH = 26;

const FRONT_TYPES = {
  cold: { color: COLORS.cold, lineWidth: 2.75, spacing: 40, symbols: [{ kind: 'triangle', color: COLORS.cold, side: -1 }] },
  warm: { color: COLORS.warm, lineWidth: 2.75, spacing: 40, symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }] },
  stationary: { color: COLORS.cold, lineWidth: 2.5, spacing: 38, symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }, { kind: 'triangle', color: COLORS.cold, side: 1 }] },
  occluded: { color: COLORS.occluded, lineWidth: 2.75, spacing: 38, symbols: [{ kind: 'semicircle', color: COLORS.occluded, side: -1 }, { kind: 'triangle', color: COLORS.occluded, side: -1 }] },
};

const STATIONARY_SEGMENT_COLORS = [COLORS.warm, COLORS.cold];
const STATIONARY_SEGMENT_SYMBOLS = FRONT_TYPES.stationary.symbols;

function setSourceData(map, sourceId, data) {
  if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
  else map.addSource(sourceId, { type: 'geojson', data });
}

function coordinatesMatch(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length >= 2 && right.length >= 2 && left[0] === right[0] && left[1] === right[1];
}

function getFeatureId(feature, fallback = 'front') {
  const props = feature?.properties || {};
  return feature?.sourceId || props.sourceId || props.stableId || props.annotationId || feature?.id || props.id || props.name || fallback;
}

function normalizeLayerId(value) {
  return String(value || 'front').replace(/[^A-Za-z0-9_-]+/g, '-');
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

export function isFrontFeature(feature) {
  const props = feature?.properties || {};
  const id = String(getFeatureId(feature, '') || '');
  return Boolean(props.isFront || props.frontType || id.startsWith('SF_') || `${props.name || ''} ${props.title || ''}`.toLowerCase().includes('front'));
}

function getLineCoordinateParts(geometry) {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return [];
  if (geometry?.type === 'LineString') return [coordinates];
  if (geometry?.type === 'MultiLineString') return coordinates;
  return [];
}

function toLngLat(map, x, y) {
  const point = map.unproject([x, y]);
  return [point.lng, point.lat];
}

function triangleCoordinates(map, x, y, ux, uy, nx, ny, side) {
  const size = FRONT_TRIANGLE_SIZE;
  return [[
    toLngLat(map, x - ux * size, y - uy * size),
    toLngLat(map, x + ux * size, y + uy * size),
    toLngLat(map, x + nx * side * size * 1.35, y + ny * side * size * 1.35),
    toLngLat(map, x - ux * size, y - uy * size),
  ]];
}

function semicircleCoordinates(map, x, y, ux, uy, nx, ny, side) {
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const theta = Math.PI - (Math.PI * i) / 12;
    points.push(toLngLat(
      map,
      x + ux * FRONT_SYMBOL_RADIUS * Math.cos(theta) + nx * side * FRONT_SYMBOL_RADIUS * Math.sin(theta),
      y + uy * FRONT_SYMBOL_RADIUS * Math.cos(theta) + ny * side * FRONT_SYMBOL_RADIUS * Math.sin(theta)
    ));
  }
  points.push(toLngLat(map, x - ux * FRONT_SYMBOL_RADIUS, y - uy * FRONT_SYMBOL_RADIUS));
  return [points];
}

function buildShapeFeature(map, symbol, sideMultiplier, x, y, ux, uy, nx, ny) {
  const side = symbol.side * sideMultiplier;
  const coordinates = symbol.kind === 'triangle'
    ? triangleCoordinates(map, x, y, ux, uy, nx, ny, side)
    : semicircleCoordinates(map, x, y, ux, uy, nx, ny, side);
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates }, properties: { color: symbol.color } };
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
  const segment = path.segments.find((item) => clamped <= item.startDistance + item.len) || path.segments[path.segments.length - 1];
  const local = Math.min(Math.max(clamped - segment.startDistance, 0), segment.len);
  const t = segment.len ? local / segment.len : 0;
  const ux = segment.dx / segment.len;
  const uy = segment.dy / segment.len;
  return { x: segment.start.x + segment.dx * t, y: segment.start.y + segment.dy * t, ux, uy, nx: -uy, ny: ux };
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
    if (point) features.push(buildShapeFeature(map, symbol, sideMultiplier, point.x, point.y, point.ux, point.uy, point.nx, point.ny));
    symbolIndex += 1;
  }

  return features;
}

function buildStationarySegmentFeatures(map, coordinates) {
  const path = buildScreenPath(map, coordinates || []);
  const features = [];
  if (!path.total) return features;

  for (let startDistance = 0, index = 0; startDistance < path.total; startDistance += STATIONARY_SEGMENT_LENGTH, index += 1) {
    const endDistance = Math.min(path.total, startDistance + STATIONARY_SEGMENT_LENGTH);
    const start = pointAtDistance(path, startDistance);
    const end = pointAtDistance(path, endDistance);
    if (!start || !end || endDistance <= startDistance) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [toLngLat(map, start.x, start.y), toLngLat(map, end.x, end.y)] },
      properties: { color: STATIONARY_SEGMENT_COLORS[index % STATIONARY_SEGMENT_COLORS.length] },
    });
  }

  return features;
}

function buildStationarySymbolFeatures(map, coordinates, sideMultiplier) {
  const path = buildScreenPath(map, coordinates || []);
  const features = [];
  if (!path.total) return features;

  for (let startDistance = 0, index = 0; startDistance < path.total; startDistance += STATIONARY_SEGMENT_LENGTH, index += 1) {
    const endDistance = Math.min(path.total, startDistance + STATIONARY_SEGMENT_LENGTH);
    if (endDistance - startDistance < STATIONARY_SEGMENT_LENGTH * 0.5) continue;
    const point = pointAtDistance(path, (startDistance + endDistance) / 2);
    const symbol = STATIONARY_SEGMENT_SYMBOLS[index % STATIONARY_SEGMENT_SYMBOLS.length];
    if (point) features.push(buildShapeFeature(map, symbol, sideMultiplier, point.x, point.y, point.ux, point.uy, point.nx, point.ny));
  }

  return features;
}

function removeFront(map, id) {
  [`${id}-line`, `${id}-symbols`, `${id}-stationary-segments`].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  [`${id}-line-source`, `${id}-symbol-source`, `${id}-stationary-source`].forEach((sourceId) => {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });
}

function moveFrontToTop(map, id) {
  [`${id}-line`, `${id}-stationary-segments`, `${id}-symbols`].forEach((layerId) => {
    if (!map.getLayer(layerId)) return;
    try {
      map.moveLayer(layerId);
    } catch {
      // Best-effort ordering only. Missing style/layer state should not break rendering.
    }
  });
}

function renderFrontLine(map, item, options) {
  const { id, feature, coordinates } = item;
  const frontType = getFrontType(feature);
  const frontStyle = FRONT_TYPES[normalizeFrontType(frontType)];
  const style = feature?.properties?.style || feature?.style || {};
  const sideMultiplier = style.frontSymbolSide === 'opposite' || feature?.properties?.frontSymbolSide === 'opposite' ? -1 : 1;
  const lineColor = options.showDiffStyles && options.diffColorExpression ? options.diffColorExpression : (style.lineColor || frontStyle.color);
  const lineWidth = Number(style.lineWidth || frontStyle.lineWidth || options.lineWidth || 2.75);
  const lineOpacity = style.lineOpacity ?? options.lineOpacity ?? 1;
  const lineFeature = { ...feature, geometry: { type: 'LineString', coordinates }, properties: { ...(feature?.properties || {}) } };

  setSourceData(map, `${id}-line-source`, { type: 'FeatureCollection', features: [lineFeature] });

  if (frontType === 'stationary') {
    setSourceData(map, `${id}-stationary-source`, { type: 'FeatureCollection', features: buildStationarySegmentFeatures(map, coordinates) });
    if (!map.getLayer(`${id}-stationary-segments`)) {
      map.addLayer({ id: `${id}-stationary-segments`, type: 'line', source: `${id}-stationary-source`, layout: { 'line-join': 'round', 'line-cap': 'butt' }, paint: { 'line-color': ['get', 'color'], 'line-width': lineWidth, 'line-opacity': lineOpacity } });
    } else {
      map.setPaintProperty(`${id}-stationary-segments`, 'line-width', lineWidth);
      map.setPaintProperty(`${id}-stationary-segments`, 'line-opacity', lineOpacity);
    }
  } else if (!map.getLayer(`${id}-line`)) {
    map.addLayer({ id: `${id}-line`, type: 'line', source: `${id}-line-source`, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': lineColor, 'line-width': lineWidth, 'line-opacity': lineOpacity } });
  } else {
    map.setPaintProperty(`${id}-line`, 'line-color', lineColor);
    map.setPaintProperty(`${id}-line`, 'line-width', lineWidth);
    map.setPaintProperty(`${id}-line`, 'line-opacity', lineOpacity);
  }

  const symbolFeatures = frontType === 'stationary'
    ? buildStationarySymbolFeatures(map, coordinates, sideMultiplier)
    : buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier);

  setSourceData(map, `${id}-symbol-source`, { type: 'FeatureCollection', features: symbolFeatures });

  if (!map.getLayer(`${id}-symbols`)) {
    map.addLayer({ id: `${id}-symbols`, type: 'fill', source: `${id}-symbol-source`, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': style.symbolOpacity ?? style.fillOpacity ?? options.symbolOpacity ?? 1 } });
  } else {
    map.setPaintProperty(`${id}-symbols`, 'fill-opacity', style.symbolOpacity ?? style.fillOpacity ?? options.symbolOpacity ?? 1);
  }

  moveFrontToTop(map, id);
}

export function renderFrontFeatures(map, features, options = {}) {
  if (!map) return;
  const namespace = normalizeLayerId(options.namespace || 'weather-front');
  const items = [];

  features.forEach((feature, featureIndex) => {
    getLineCoordinateParts(feature?.geometry).forEach((coordinates, lineIndex) => {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      items.push({
        id: normalizeLayerId(`${namespace}-${getFeatureId(feature, `front-${featureIndex}`)}-${lineIndex}`),
        feature,
        coordinates,
      });
    });
  });

  const ids = new Set(items.map((item) => item.id));
  const cacheKey = `__${namespace}Ids`;
  const previousIds = map[cacheKey] || new Set();
  previousIds.forEach((id) => { if (!ids.has(id)) removeFront(map, id); });
  items.forEach((item) => renderFrontLine(map, item, options));
  map[cacheKey] = ids;
}
