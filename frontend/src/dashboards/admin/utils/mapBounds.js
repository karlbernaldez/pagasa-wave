export const fitGeoJSONBounds = (map, geojson, options = {}) => {
  if (!geojson || !geojson.features?.length) return;

  const bounds = new mapboxgl.LngLatBounds();

  const extend = (coords) => {
    if (typeof coords[0] === 'number') {
      bounds.extend(coords);
    } else {
      coords.forEach(extend);
    }
  };

  geojson.features.forEach((feature) => {
    extend(feature.geometry.coordinates);
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 20,
      maxZoom: 10,
      ...options,
    });
  }
};