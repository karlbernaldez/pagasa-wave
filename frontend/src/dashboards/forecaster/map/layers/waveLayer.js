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

export async function addWaveSource(map, isDarkMode, modelInput = localStorage.getItem('WAVE_MODEL')) {
    if (!map) return;

    const theme = isDarkMode ? 'dark' : 'light';

    // Normalize models safely
    const models = (modelInput || 'WW3')
        .split(',')
        .map(m => m.trim().toUpperCase())
        .filter(Boolean);

    // Fetch GeoJSON once with fallback safety
    let geojsonData = null;
    try {
        geojsonData = await fetchLatestGeoJSON({
            model: models[0].toLowerCase(),
            product: 'wave',
            date: 'today'
        });
    } catch (err) {
        console.error('[Wave] Failed to fetch GeoJSON:', err);
    }

    // Helper: add source if not exists
    const ensureSource = (id, config) => {
        if (!map.getSource(id)) {
            map.addSource(id, config);
        }
    };

    // Optional: centralize date logic
    const resolveDate = (model) => {
        switch (model) {
            case 'WW3':
                return '2026011200'; // TODO: replace with dynamic
            default:
                return '2026011200';
        }
    };

    // Add raster sources
    for (const model of models) {
        const sourceId = `wave-source-${model}`;
        const date = resolveDate(model);
        const tileUrl = buildTileUrl(model, theme, date);

        ensureSource(sourceId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            bounds: [100, -5, 180, 50],
            scheme: 'xyz',
        });
    }

    // Add GeoJSON points
    if (geojsonData) {
        ensureSource('wave-points', {
            type: 'geojson',
            data: geojsonData,
        });
    }

    // Add PH boundaries
    ensureSource('ph-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
    });
}

export async function addWaveLayer(map, isDarkMode) {
    const sourceId = getWaveSourceId(isDarkMode);
    addRasterLayer(map, sourceId, isDarkMode);
    addWaveDirectionLayer(map);    // wave direction arrows (new)
    setupPopup(map, isDarkMode);
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
            source: 'ph-boundaries',
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

// ── Wave direction arrows (new) ────────────────────────────────────────────
//
// Requires a sprite entry named "wave-arrow" — a simple single-headed arrow
// pointing UP (north, 0°). Mapbox will rotate it by waveDirection degrees CW.
//
// If you don't have a sprite image yet, loadWaveArrowImage() below generates
// a plain canvas arrow at runtime so you can test without touching the sprite.
//
function addWaveDirectionLayer(map) {
    // Register a programmatic arrow icon if "wave-arrow" is not in the sprite
    if (!map.hasImage('wave-arrow')) {
        loadWaveArrowImage(map);
    }

    map.addLayer({
        id: 'wave-direction',
        type: 'symbol',
        source: 'wave-points',
        slot: 'middle',

        // Only show points that have a valid wave height + direction
        filter: [
            'all',
            ['has', 'waveDirection'],
            ['>', ['to-number', ['get', 'waveHeight'], 0], 0],
        ],

        layout: {
            // Controlled externally via setWaveElement → applyWaveLayers
            visibility: 'none',

            'icon-image': 'wave-arrow',

            // Scale arrow with wave height: calm (~0.5 m) → small, rough (~4 m+) → large
            'icon-size': [
                'interpolate', ['linear'], ['get', 'waveHeight'],
                0.0, 0.3,
                1.0, 0.45,
                3.0, 0.65,
                6.0, 0.85,
            ],

            // Rotate arrow to point in the direction waves are TRAVELING
            'icon-rotate': ['to-number', ['get', 'waveDirection'], 0],
            'icon-rotation-alignment': 'map',   // rotates with the map
            'icon-pitch-alignment': 'map',

            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
        },

        paint: {
            // Tint arrow color by wave height:
            //   calm  (< 1 m) → soft cyan
            //   moderate (2 m) → teal/green
            //   rough  (4 m+) → orange-red
            'icon-color': [
                'interpolate', ['linear'], ['get', 'waveHeight'],
                0.0, 'rgba(160, 220, 255, 0.7)',
                1.0, 'rgba( 64, 196, 180, 0.8)',
                2.5, 'rgba( 80, 200,  80, 0.85)',
                4.0, 'rgba(255, 160,  40, 0.9)',
                6.0, 'rgba(220,  40,  40, 0.95)',
            ],

            // Fade out at low zoom, fully visible from zoom 5+
            'icon-opacity': [
                'interpolate', ['linear'], ['zoom'],
                3, 0.0,
                4, 0.5,
                5, 1.0,
            ],
        },
    }, 'country-boundaries');
}

/**
 * Draws a minimal north-pointing arrow onto a canvas and registers it
 * as a Mapbox SDF image named "wave-arrow".
 * SDF = true  →  icon-color expressions work on it.
 */
function loadWaveArrowImage(map) {
    const SIZE = 64;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const cx = SIZE / 2;

    // Shaft: vertical line pointing up from center
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, SIZE * 0.80);   // tail
    ctx.lineTo(cx, SIZE * 0.18);   // tip
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, SIZE * 0.08);   // tip
    ctx.lineTo(cx - SIZE * 0.18, SIZE * 0.32); // left wing
    ctx.lineTo(cx + SIZE * 0.18, SIZE * 0.32); // right wing
    ctx.closePath();
    ctx.fill();

    map.addImage('wave-arrow', ctx.getImageData(0, 0, SIZE, SIZE), { sdf: true });
}

// ── Popup (covers both wave-arrows and wave-direction layers) ──────────────
function setupPopup(map, isDarkMode) {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    const showPopup = (e) => {
        if (!e.features.length) return;
        popup
            .setLngLat(e.lngLat)
            .setHTML(createWavePopup(e.features[0], isDarkMode))
            .setOffset([0, -5])
            .addTo(map);
    };

    const hidePopup = () => popup.remove();

    // Wind barbs
    map.on('mousemove', 'wave-arrows', showPopup);
    map.on('mouseleave', 'wave-arrows', hidePopup);

    // Wave direction arrows
    map.on('mousemove', 'wave-direction', showPopup);
    map.on('mouseleave', 'wave-direction', hidePopup);
}