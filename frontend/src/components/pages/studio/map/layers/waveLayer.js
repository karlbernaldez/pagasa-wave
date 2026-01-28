import { fetchLatestGeoJSON, createWavePopup, getWindTileset, getWaveSourceId } from '../../utils/mapHelpers';

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

export async function addWaveSource(map, isDarkMode, model = localStorage.getItem('WAVE_MODEL')) {

    // Fetch latest wind points GeoJSON
    const ww3 = await fetchLatestGeoJSON({
        model: 'ww3',
        product: 'wave',
        date: 'today'
    });

    const ecwam = await fetchLatestGeoJSON({
        model: 'ecwam',
        product: 'wave',
        date: 'today'
    });

    const mri3 = await fetchLatestGeoJSON({
        model: 'mri3',
        product: 'wave',
        date: 'today'
    });

    const waveData = ww3

    // Determine tileset & source
    const date = '2026011200'
    const sourceId = getWaveSourceId(isDarkMode);
    const theme = isDarkMode ? 'dark' : 'light';

    // Add sources
    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: 'raster',
            tiles: [
                `http://34.45.182.236:5173/tiles/${model}/${theme}/${date}/{z}/{x}/{y}.png`
            ],
            tileSize: 256,
            bounds: [100, -5, 180, 50],
            scheme: "xyz",
        });

    }

    if (!map.getSource('wave-points')) {
        map.addSource('wave-points', { type: 'geojson', data: waveData });
    }

}


export async function addWaveLayer(map, isDarkMode) {
    console.log('ADDING WAVE LAYERS')
    // Add layers (modularized)
    const sourceId = getWaveSourceId(isDarkMode);
    addRasterLayer(map, sourceId);

    setupPopup(map);
}

// ------------------- Layer Helper Functions -------------------
function addRasterLayer(map, sourceId) {
    const isWaveRasterVisible = localStorage.getItem('WAVE_RASTER') === 'true';
    if (localStorage.getItem('WAVE_ENABLED') === 'true') {
        map.addLayer({
            id: "wave-raster",
            type: "raster",
            source: sourceId,
            paint: {
                "raster-opacity": 1,
                "raster-fade-duration": 0
            },
            layout: {
                visibility: isWaveRasterVisible ? 'visible' : 'none'
            },
        }, "graticules");

        map.addLayer({
            id: 'wave-glass-fill',
            type: 'fill',
            source: 'glass-layer',
            'source-layer': 'ph-bum99e',
            slot: "top",
            paint: {
                'fill-color': 'rgba(255, 255, 255, 0.15)',
                'fill-opacity': 0.8,
                'fill-outline-color': 'rgba(255, 255, 255, 0.35)'
            },
            layout: {
                visibility: isWaveRasterVisible ? 'visible' : 'none'
            },
        });

        map.addLayer({
            id: 'wave-glass-depth',
            type: 'fill',
            source: 'glass-layer',
            'source-layer': 'ph-bum99e',
            slot: "top",
            paint: {
                'fill-color': ['interpolate', ['linear'], ['zoom'], 5, 'rgba(255,255,255,0.05)', 10, 'rgba(255,255,255,0.25)'],
                'fill-opacity': 0.8
            },
            layout: {
                visibility: isWaveRasterVisible ? 'visible' : 'none'
            },
        });

    }
}

function addWaveArrowsLayer(map) {
    map.addLayer({
        id: 'wave-arrows',
        type: 'symbol',
        source: 'wave-points',
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

function setupPopup(map) {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map.on('mousemove', 'wind-arrows', (e) => {
        if (!e.features.length) return;
        popup.setLngLat(e.lngLat)
            .setHTML(createWavePopup(e.features[0]))
            .setOffset([0, -5])
            .addTo(map);
    });

    map.on('mouseleave', 'wind-arrows', () => popup.remove());
}
