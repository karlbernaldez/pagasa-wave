export const GRATICULE_STORAGE_KEY = 'GRATICULE_SPACING';
export const GRATICULE_OPACITY_STORAGE_KEY = 'GRATICULE_OPACITY';
export const DEFAULT_GRATICULE_SPACING = 5;
export const DEFAULT_GRATICULE_OPACITY = 0.5;

const SOURCE_ID = 'wavelab-graticules-source';
export const WAVELAB_GRATICULE_LAYER_ID = 'wavelab-graticules';
export const WAVELAB_GRATICULE_BLUR_LAYER_ID = 'wavelab-graticules-blur';
const MAIN_LAYER_ID = WAVELAB_GRATICULE_LAYER_ID;
const BLUR_LAYER_ID = WAVELAB_GRATICULE_BLUR_LAYER_ID;
const LEGACY_GRATICULE_LAYER_IDS = new Set(['graticules', 'graticules_blur']);
const MIN_LATITUDE = -80;
const MAX_LATITUDE = 80;

export function normalizeGraticuleSpacing(value, fallback = DEFAULT_GRATICULE_SPACING) {
  const spacing = Number(value);
  if (!Number.isFinite(spacing)) return fallback;
  return Math.min(10, Math.max(1, Math.round(spacing)));
}

export function normalizeGraticuleOpacity(value, fallback = DEFAULT_GRATICULE_OPACITY) {
  const opacity = Number(value);
  if (!Number.isFinite(opacity)) return fallback;
  return Math.min(1, Math.max(0.1, opacity));
}

export function readStoredGraticuleSpacing(fallback = DEFAULT_GRATICULE_SPACING) {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(GRATICULE_STORAGE_KEY);
  if (stored === null || stored === '') return fallback;
  return normalizeGraticuleSpacing(stored, fallback);
}

export function readStoredGraticuleOpacity(fallback = DEFAULT_GRATICULE_OPACITY) {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(GRATICULE_OPACITY_STORAGE_KEY);
  if (stored === null || stored === '') return fallback;
  return normalizeGraticuleOpacity(stored, fallback);
}

export function readStoredGraticulePreferences() {
  return {
    spacing: readStoredGraticuleSpacing(DEFAULT_GRATICULE_SPACING),
    opacity: readStoredGraticuleOpacity(DEFAULT_GRATICULE_OPACITY),
  };
}

export function buildGraticuleFeatureCollection(spacing = DEFAULT_GRATICULE_SPACING) {
  const step = normalizeGraticuleSpacing(spacing);
  const features = [];

  for (let longitude = -180; longitude <= 180; longitude += step) {
    features.push({
      type: 'Feature',
      properties: { axis: 'longitude', value: longitude },
      geometry: {
        type: 'LineString',
        coordinates: [
          [longitude, MIN_LATITUDE],
          [longitude, MAX_LATITUDE],
        ],
      },
    });
  }

  for (let latitude = -80; latitude <= 80; latitude += step) {
    features.push({
      type: 'Feature',
      properties: { axis: 'latitude', value: latitude },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, latitude],
          [180, latitude],
        ],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

function safeRemoveLayer(map, id) {
  if (map?.getLayer?.(id)) map.removeLayer(id);
}

const layerSearchText = (layer = {}) =>
  [
    layer.id,
    layer['source-layer'],
    layer.source,
    layer.metadata?.['mapbox:featureComponent'],
    layer.metadata?.['mapbox:group'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export function isForeignGraticuleLayer(layer = {}) {
  if (!layer?.id) return false;
  if ([MAIN_LAYER_ID, BLUR_LAYER_ID].includes(layer.id) && layer.source === SOURCE_ID) {
    return false;
  }

  if (LEGACY_GRATICULE_LAYER_IDS.has(layer.id)) return true;

  const text = layerSearchText(layer);
  return /gratic|coordinate.?grid|grid.?line|latitude|longitude|lat.?lon/.test(text);
}

function suppressForeignGraticuleLayers(map) {
  const layers = map.getStyle?.()?.layers || [];
  layers
    .filter(isForeignGraticuleLayer)
    .forEach((layer) => {
      try {
        if (map.getLayer?.(layer.id)) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      } catch {
        // Some imported/custom-style layers may not support mutation.
      }
    });
}

export function findGraticuleInsertionLayer(style = {}) {
  const layers = Array.isArray(style?.layers) ? style.layers : [];
  const candidates = layers
    .map((layer, index) => ({ layer, index }))
    .filter(
      ({ layer }) => layer?.id && ![MAIN_LAYER_ID, BLUR_LAYER_ID].includes(layer.id)
    );

  const isWaterLayer = (layer) => {
    const text = layerSearchText(layer);
    return (
      ['fill', 'raster'].includes(layer.type) &&
      /(^|[^a-z])(water|ocean|sea|marine)([^a-z]|$)/.test(text)
    );
  };

  const isLandLayer = (layer) => {
    if (!['fill', 'fill-extrusion'].includes(layer.type)) return false;
    const text = layerSearchText(layer);
    return /(^|[^a-z])(land|landcover|landuse|terrain|building)([^a-z]|$)/.test(text);
  };

  const lastWaterIndex = candidates.reduce(
    (maxIndex, { layer, index }) => (isWaterLayer(layer) ? Math.max(maxIndex, index) : maxIndex),
    -1
  );

  // The grid must be above water but below land. Only use a land anchor that
  // appears after the final water layer; otherwise the water fill will hide it.
  const landAboveWater = candidates.find(
    ({ layer, index }) => index > lastWaterIndex && isLandLayer(layer)
  );
  if (landAboveWater) return landAboveWater.layer.id;

  const coastlineAboveWater = candidates.find(({ layer, index }) => {
    if (index <= lastWaterIndex) return false;
    const text = layerSearchText(layer);
    return /coast|shoreline/.test(text);
  });
  if (coastlineAboveWater) return coastlineAboveWater.layer.id;

  // If the style does not expose an opaque land fill after water, keep the
  // graticule above the basemap and below labels rather than letting water hide it.
  const firstSymbolAboveWater = candidates.find(
    ({ layer, index }) => index > lastWaterIndex && layer.type === 'symbol'
  );
  if (firstSymbolAboveWater) return firstSymbolAboveWater.layer.id;

  // Styles with no identifiable water layer can still use their first land fill.
  if (lastWaterIndex === -1) {
    const firstLand = candidates.find(({ layer }) => isLandLayer(layer));
    if (firstLand) return firstLand.layer.id;

    const firstCoastline = candidates.find(({ layer }) => {
      const text = layerSearchText(layer);
      return /coast|shoreline/.test(text);
    });
    if (firstCoastline) return firstCoastline.layer.id;

    return candidates.find(({ layer }) => layer.type === 'symbol')?.layer.id || null;
  }

  return null;
}

function positionGraticuleLayers(map, beforeId) {
  if (!beforeId || typeof map?.moveLayer !== 'function') return;

  if (map.getLayer?.(BLUR_LAYER_ID)) {
    map.moveLayer(BLUR_LAYER_ID, beforeId);
  }
  if (map.getLayer?.(MAIN_LAYER_ID)) {
    map.moveLayer(MAIN_LAYER_ID, beforeId);
  }
}

function ensureOwnedSource(map, spacing) {
  const data = buildGraticuleFeatureCollection(spacing);

  // Keep the basemap's own graticule layers hidden and render WaveLab's
  // generated grid under unique layer IDs to avoid ownership collisions.
  suppressForeignGraticuleLayers(map);

  const source = map.getSource?.(SOURCE_ID);

  if (source?.setData) {
    source.setData(data);
    return;
  }

  // Remove stale WaveLab layers before recreating the source.
  safeRemoveLayer(map, MAIN_LAYER_ID);
  safeRemoveLayer(map, BLUR_LAYER_ID);

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data,
  });
}

export function ensureGraticuleLayer(
  map,
  {
    spacing = DEFAULT_GRATICULE_SPACING,
    opacity = DEFAULT_GRATICULE_OPACITY,
    visible = false,
    isDarkMode = false,
  } = {}
) {
  if (!map?.isStyleLoaded?.()) return;

  const normalizedSpacing = normalizeGraticuleSpacing(spacing);
  const normalizedOpacity = normalizeGraticuleOpacity(opacity);
  ensureOwnedSource(map, normalizedSpacing);

  const visibility = visible ? 'visible' : 'none';
  const lineColor = isDarkMode ? '#d8f6ff' : '#334155';
  const blurColor = isDarkMode ? '#06131f' : '#ffffff';
  const beforeId = findGraticuleInsertionLayer(map.getStyle?.());

  if (!map.getLayer(BLUR_LAYER_ID)) {
    map.addLayer({
      id: BLUR_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { visibility },
      paint: {
        'line-color': blurColor,
        'line-width': 2.5,
        'line-opacity': Math.min(1, normalizedOpacity * 0.75),
        'line-blur': 1.2,
      },
    }, beforeId || undefined);
  }

  if (!map.getLayer(MAIN_LAYER_ID)) {
    map.addLayer({
      id: MAIN_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { visibility },
      paint: {
        'line-color': lineColor,
        'line-width': 0.8,
        'line-opacity': normalizedOpacity,
      },
    }, beforeId || undefined);
  }

  positionGraticuleLayers(map, beforeId);

  map.setLayoutProperty(BLUR_LAYER_ID, 'visibility', visibility);
  map.setLayoutProperty(MAIN_LAYER_ID, 'visibility', visibility);
  map.setPaintProperty(BLUR_LAYER_ID, 'line-color', blurColor);
  map.setPaintProperty(MAIN_LAYER_ID, 'line-color', lineColor);
  map.setPaintProperty(
    BLUR_LAYER_ID,
    'line-opacity',
    Math.min(1, normalizedOpacity * 0.75)
  );
  map.setPaintProperty(MAIN_LAYER_ID, 'line-opacity', normalizedOpacity);

  map.__wavelabGraticuleSpacing = normalizedSpacing;
  map.__wavelabGraticuleOpacity = normalizedOpacity;
}

export function updateGraticuleSpacing(map, spacing) {
  const normalizedSpacing = normalizeGraticuleSpacing(spacing);
  const source = map?.getSource?.(SOURCE_ID);
  source?.setData?.(buildGraticuleFeatureCollection(normalizedSpacing));
  if (map) map.__wavelabGraticuleSpacing = normalizedSpacing;
  return normalizedSpacing;
}

export function updateGraticuleOpacity(map, opacity) {
  const normalizedOpacity = normalizeGraticuleOpacity(opacity);
  if (map?.getLayer?.(BLUR_LAYER_ID)) {
    map.setPaintProperty(
      BLUR_LAYER_ID,
      'line-opacity',
      Math.min(1, normalizedOpacity * 0.75)
    );
  }
  if (map?.getLayer?.(MAIN_LAYER_ID)) {
    map.setPaintProperty(MAIN_LAYER_ID, 'line-opacity', normalizedOpacity);
  }
  if (map) map.__wavelabGraticuleOpacity = normalizedOpacity;
  return normalizedOpacity;
}
