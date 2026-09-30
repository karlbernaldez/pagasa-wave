export const GRATICULE_STORAGE_KEY = 'GRATICULE_SPACING';
export const GRATICULE_OPACITY_STORAGE_KEY = 'GRATICULE_OPACITY';
export const DEFAULT_GRATICULE_SPACING = 5;
export const DEFAULT_GRATICULE_OPACITY = 0.5;

const SOURCE_ID = 'wavelab-graticules-source';
const MAIN_LAYER_ID = 'graticules';
const BLUR_LAYER_ID = 'graticules_blur';
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
  return normalizeGraticuleSpacing(window.localStorage.getItem(GRATICULE_STORAGE_KEY), fallback);
}

export function readStoredGraticuleOpacity(fallback = DEFAULT_GRATICULE_OPACITY) {
  if (typeof window === 'undefined') return fallback;
  return normalizeGraticuleOpacity(
    window.localStorage.getItem(GRATICULE_OPACITY_STORAGE_KEY),
    fallback
  );
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

function ensureOwnedSource(map, spacing) {
  const data = buildGraticuleFeatureCollection(spacing);
  const source = map.getSource?.(SOURCE_ID);

  if (source?.setData) {
    source.setData(data);
    return;
  }

  // Replace style-provided graticule layers with the WaveLab-owned dynamic grid.
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

  if (!map.getLayer(BLUR_LAYER_ID)) {
    map.addLayer({
      id: BLUR_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      layout: { visibility },
      paint: {
        'line-color': blurColor,
        'line-width': 2.5,
        'line-opacity': Math.min(1, normalizedOpacity * 0.75),
        'line-blur': 1.2,
      },
    });
  }

  if (!map.getLayer(MAIN_LAYER_ID)) {
    map.addLayer({
      id: MAIN_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      slot: 'top',
      layout: { visibility },
      paint: {
        'line-color': lineColor,
        'line-width': 0.8,
        'line-opacity': normalizedOpacity,
      },
    });
  }

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
