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

const MRI3_TIMESTEP = '012';

const buildTileUrl = (model, theme, date, step = MRI3_TIMESTEP) => {
    const m = model.trim().toUpperCase();
    const base = `https://storage.googleapis.com/wavelab-tiles/${m}/${theme}/${date}`;

    return m === 'MRI3'
        ? `${base}/${step}/{z}/{x}/{y}.png`
        : `${base}/{z}/{x}/{y}.png`;
};

export async function addWaveSource(map, isDarkMode, model = localStorage.getItem('WAVE_MODEL')) {
    const ww3 = await fetchLatestGeoJSON({ model: 'ww3', product: 'wave', date: 'today' });

    let date = '2026011200';
    const theme = isDarkMode ? 'dark' : 'light';
    const models = (model || 'WW3').split(',').map((m) => m.trim().toUpperCase());

    models.forEach((m) => {
        const sourceId = `wave-source-${m}`;
        if (m == 'WW3') date = '2026011200'
        const tileUrl = buildTileUrl(m, theme, date);

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                bounds: [100, -5, 180, 50],
                scheme: 'xyz',
            });
        }
    });

    if (!map.getSource('wave-points')) {
        map.addSource('wave-points', { type: 'geojson', data: ww3 });
    }

    if (!map.getSource('ph-boundaries')) {
        map.addSource('ph-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1',
        });
    }
}

export async function addWaveLayer(map, isDarkMode) {
    const sourceId = getWaveSourceId(isDarkMode);
    addRasterLayer(map, sourceId, isDarkMode);

    setupPopup(map);
}

// ------------------- Layer Helper Functions -------------------
function addRasterLayer(map, sourceId, isDarkMode) {
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

        map.addLayer({
            id: 'ph-overlay',
            type: 'fill',
            source: 'ph-boundaries',       // ✅ own source, no conflict
            'source-layer': 'country_boundaries',
            filter: [
                "all",
                ["match", ["get", "iso_3166_1_alpha_3"], ["PHL"], true, false]
            ],
            paint: {
                'fill-color': isDarkMode ? '#0f1117' : '#f2f2f2',
                'fill-opacity': 1,
            },
        });

        map.addLayer({
            id: 'ph-overlay-outline',
            type: 'line',
            source: 'ph-boundaries',
            'source-layer': 'country_boundaries',
            filter: [
                "all",
                ["match", ["get", "iso_3166_1_alpha_3"], ["PHL"], true, false]
            ],
            paint: {
                'line-color': isDarkMode ? '#1e3a5f' : '#000000',
                'line-width': 0.5,
                'line-opacity': 0.8,
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

function setupPopup(map, isDarkMode) {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map.on('mousemove', 'wave-arrows', (e) => {
        if (!e.features.length) return;
        popup.setLngLat(e.lngLat)
            .setHTML(createWavePopup(e.features[0], isDarkMode))
            .setOffset([0, -5])
            .addTo(map);
    });

    map.on('mouseleave', 'wave-arrows', () => popup.remove());
}