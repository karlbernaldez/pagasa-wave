export const normalizeGeometry = (geometry) => {
  if (!geometry || !geometry.coordinates) return geometry;

  const { type, coordinates } = geometry;

  // Recursively unwrap single-nested arrays
  const unwrap = (coords) => {
    if (!Array.isArray(coords)) return coords;

    // If first element is an array and only one item → unwrap
    if (coords.length === 1 && Array.isArray(coords[0])) {
      return unwrap(coords[0]);
    }

    return coords;
  };

  return {
    ...geometry,
    coordinates: unwrap(coordinates),
  };
};