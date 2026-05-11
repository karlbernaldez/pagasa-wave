const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: 'FeatureCollection',
  features: [],
});

const PH_LNG_MIN = 93;
const PH_LNG_MAX = 154;
const PH_LAT_MIN = 3;
const PH_LAT_MAX = 26;

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function looksLikePhilippinesLngLat(lng, lat) {
  return lng >= PH_LNG_MIN && lng <= PH_LNG_MAX && lat >= PH_LAT_MIN && lat <= PH_LAT_MAX;
}

function shouldSwapLatLng(first, second) {
  return looksLikePhilippinesLngLat(second, first) && !looksLikePhilippinesLngLat(first, second);
}

function normalizeCoordinatePair(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return coords;

  const [first, second, ...rest] = coords;

  if (!isNumber(first) || !isNumber(second)) return coords;

  if (shouldSwapLatLng(first, second)) {
    return [second, first, ...rest];
  }

  return coords;
}

function normalizeCoordinates(coords) {
  if (!Array.isArray(coords)) return coords;

  if (coords.length === 1 && Array.isArray(coords[0])) {
    return normalizeCoordinates(coords[0]);
  }

  if (
    coords.length >= 2 &&
    isNumber(coords[0]) &&
    isNumber(coords[1])
  ) {
    return normalizeCoordinatePair(coords);
  }

  return coords.map((child) => normalizeCoordinates(child));
}

function isGeoJsonFeature(value) {
  return Boolean(value && value.type === 'Feature' && value.geometry);
}

function normalizeGeometry(geometry) {
  if (!geometry) return null;

  return {
    ...geometry,
    coordinates: normalizeCoordinates(geometry.coordinates),
  };
}

function getFeatureProperties(value) {
  return {
    ...(value.properties ?? {}),
    ...(value.name && !value.properties?.name ? { name: value.name } : {}),
    ...(value.title && !value.properties?.title ? { title: value.title } : {}),
    ...(value.label && !value.properties?.label ? { label: value.label } : {}),
    ...(value.sourceId && !value.properties?.sourceId ? { sourceId: value.sourceId } : {}),
  };
}

function toFeature(value) {
  if (!value) return null;

  if (isGeoJsonFeature(value)) {
    return {
      ...value,
      geometry: normalizeGeometry(value.geometry),
      properties: getFeatureProperties(value),
    };
  }

  if (value.geometry) {
    return {
      type: 'Feature',
      geometry: normalizeGeometry(value.geometry),
      properties: getFeatureProperties(value),
      ...Object.fromEntries(
        Object.entries(value).filter(
          ([key]) => !['geometry', 'properties'].includes(key)
        )
      ),
    };
  }

  return null;
}

export function normalizeFeatureCollection(input) {
  if (!input) {
    return EMPTY_FEATURE_COLLECTION;
  }

  if (input.type === 'FeatureCollection') {
    return {
      type: 'FeatureCollection',
      features: Array.isArray(input.features)
        ? input.features.map(toFeature).filter(Boolean)
        : [],
    };
  }

  if (Array.isArray(input)) {
    return {
      type: 'FeatureCollection',
      features: input.map(toFeature).filter(Boolean),
    };
  }

  const feature = toFeature(input);

  if (feature) {
    return {
      type: 'FeatureCollection',
      features: [feature],
    };
  }

  return EMPTY_FEATURE_COLLECTION;
}
