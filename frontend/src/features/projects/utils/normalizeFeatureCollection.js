const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: 'FeatureCollection',
  features: [],
});

function unwrapCoordinates(coords) {
  if (!Array.isArray(coords)) return coords;

  if (coords.length === 1 && Array.isArray(coords[0])) {
    return unwrapCoordinates(coords[0]);
  }

  return coords;
}

function isGeoJsonFeature(value) {
  return Boolean(value && value.type === 'Feature' && value.geometry);
}

function normalizeGeometry(geometry) {
  if (!geometry) return null;

  return {
    ...geometry,
    coordinates: unwrapCoordinates(geometry.coordinates),
  };
}

function toFeature(value) {
  if (!value) return null;

  if (isGeoJsonFeature(value)) {
    return {
      ...value,
      geometry: normalizeGeometry(value.geometry),
      properties: value.properties ?? {},
    };
  }

  if (value.geometry) {
    return {
      type: 'Feature',
      geometry: normalizeGeometry(value.geometry),
      properties: value.properties ?? {},
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
