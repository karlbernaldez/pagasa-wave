export function initTyphoonLayer(map) {
  if (!map.getSource('typhoon-points')) {
    map.addSource('typhoon-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer('typhoon-layer')) {
    map.addLayer({
      id: 'typhoon-layer',
      type: 'symbol',
      source: 'typhoon-points',
      slot: 'top',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': [
          'case',
          ['==', ['get', 'markerType'], 'low_pressure'],
          0.2,
          0.09,
        ],
        'text-field': ['get', 'title'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [
          'case',
          ['==', ['get', 'markerType'], 'low_pressure'],
          [0, 2.0],
          [0, 1.25],
        ],
        'text-anchor': 'top',
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': 'red',
      },
      minzoom: 0,
      maxzoom: 24,
    });
  }
}