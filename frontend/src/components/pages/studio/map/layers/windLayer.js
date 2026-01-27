import { fetchLatestGeoJSON, createWindPopup, getWindTileset, getWindSourceId } from '../../utils/mapHelpers';

(function injectPopupStyle() {
  const style = document.createElement("style");
  style.textContent = `
    .mapboxgl-popup-content {
      background: transparent !important;
      padding: 0 !important;
      box-shadow: none !important;
    }
    .mapboxgl-popup-tip { display:none !important; }
  `;
  document.head.appendChild(style);
})();

export async function addWindSource(map, isDarkMode) {
  // Fetch latest wind points GeoJSON
  const ecmwfWind = await fetchLatestGeoJSON({
    model: 'ecmwf',
    product: 'wind',
    date: 'today'
  });
  const windData = ecmwfWind

  // Determine tileset & source
  const tileset = getWindTileset(isDarkMode);
  const sourceId = getWindSourceId(isDarkMode);

  // Add sources
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "raster",
      url: `${tileset}?fresh=${Date.now()}`,
      tileSize: 4096,
    });

    // map.addSource(sourceId, {
    //   type: 'raster',
    //   tiles: [
    //     'http://34.45.182.236:5173/tiles/ecwam/2026011200/{z}/{x}/{y}.png'
    //   ],
    //   tileSize: 256,
    //   bounds: [100, -5, 180, 50],
    //   scheme: "xyz",
    // });

  }

  if (!map.getSource("wind-particles")) {
    map.addSource("wind-particles", {
      type: "raster-array",
      url: `mapbox://votewave.ecmwf?fresh=${Date.now()}`,
      tileSize: 4096,
    });
  }

  if (!map.getSource('glass-layer')) {
    map.addSource('glass-layer', {
      type: 'vector',
      url: 'mapbox://votewave.a1s6vck4'
    });
  }

  if (!map.getSource('wind-points')) {
    map.addSource('wind-points', { type: 'geojson', data: windData });
  }

}


export async function addWindLayer(sourceId) {
  // Add layers (modularized)
  addRasterLayer(map, sourceId);
  addWindParticlesLayer(map);
  addWindArrowsLayer(map);
  addGlassLayers(map);

  setupPopup(map);
}

// ------------------- Layer Helper Functions -------------------
function addRasterLayer(map, sourceId) {
  map.addLayer({
    id: "wind-raster",
    type: "raster",
    source: sourceId,
    paint: {
      "raster-opacity": 1,
      "raster-fade-duration": 0
    },
    layout: { visibility: 'none' },
  }, "graticules");
}

function addWindParticlesLayer(map) {
  map.addLayer({
    id: "wind-particles",
    type: "raster-particle",
    source: "wind-particles",
    "source-layer": "10m_wind",
    slot: "bottom",
    paint: {
      "raster-particle-speed-factor": 0.4,
      "raster-particle-fade-opacity-factor": 0.85,
      "raster-particle-reset-rate-factor": 0.4,
      "raster-particle-count": 36000,
      "raster-particle-max-speed": 160,
      "raster-particle-color": [
        "interpolate",
        ["linear"],
        ["raster-particle-speed"],
        0, "rgba(255,255,255,0.2)",
        100, "rgba(255,255,255,0.4)"
      ]
    },
    layout: { visibility: 'none' }
  }, "country-boundaries");
}

function addWindArrowsLayer(map) {
  map.addLayer({
    id: 'wind-arrows',
    type: 'symbol',
    source: 'wind-points',
    slot: "middle",
    filter: [">=", ["get", "windSpeed"], 3.08],
    layout: {
      'visibility': 'none',
      'icon-image': [
        'step', ['get', 'windSpeed'],
        ['image', '0KTS', { 'params': { 'color-1': 'rgb(240,240,240)' } }],
        2, ['image', '5 kts'],
        3.57632, ['image', '10kts (1)'],
        6.25856, ['image', '15 kts'],
        8.9408, ['image', '20 kts'],
        11.176, ['image', '25 kts'],
        13.85824, ['image', '30 kts']
      ],
      'icon-size': ['interpolate', ['linear'], ['get', 'windSpeed'], 0, 2.25, 16.5, 3.15],
      'icon-rotate': ['+', ['to-number', ['get', 'windDirection'], 0], 360],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
    },
    paint: { 'icon-opacity': 0.5 }
  }, "country-boundaries");
}

function addGlassLayers(map) {
  map.addLayer({
    id: 'glass-fill',
    type: 'fill',
    source: 'glass-layer',
    'source-layer': 'ph-bum99e',
    slot: "top",
    paint: {
      'fill-color': 'rgba(255, 255, 255, 0.15)',
      'fill-opacity': 0.4,
      'fill-outline-color': 'rgba(255, 255, 255, 0.35)'
    },
    layout: { 'visibility': 'none' }
  });

  map.addLayer({
    id: 'glass-depth',
    type: 'fill',
    source: 'glass-layer',
    'source-layer': 'ph-bum99e',
    slot: "top",
    paint: {
      'fill-color': ['interpolate', ['linear'], ['zoom'], 5, 'rgba(255,255,255,0.05)', 10, 'rgba(255,255,255,0.25)'],
      'fill-opacity': 0.3
    },
    layout: { 'visibility': 'none' }
  });
}

function setupPopup(map) {
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

  map.on('mousemove', 'wind-arrows', (e) => {
    if (!e.features.length) return;
    popup.setLngLat(e.lngLat)
      .setHTML(createWindPopup(e.features[0]))
      .setOffset([0, -5])
      .addTo(map);
  });

  map.on('mouseleave', 'wind-arrows', () => popup.remove());
}
