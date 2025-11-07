import MapboxDraw from '@mapbox/mapbox-gl-draw';
import drawStyles from '../components/Edit/draw/styles';
import DrawLineString from '../components/Edit/draw/linestring';
import DrawRectangle from '../components/Edit/draw/rectangle';
import DrawCircle from '../components/Edit/draw/circle';
import SimpleSelect from '../components/Edit/draw/simple_select';

function applyWatermark(ctx, width, height, { text, style, font, color, opacity }) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = font;
  ctx.fillStyle = color;

  switch (style) {
    case "diagonal-repeat":
      applyDiagonalRepeat(ctx, width, height, text);
      break;
    case "pattern-grid":
      applyPatternGrid(ctx, width, height, text);
      break;
    case "corner":
      applyCorner(ctx, width, height, text);
      break;
    case "center":
      applyCenter(ctx, width, height, text);
      break;
    case "bottom-right":
      applyBottomRight(ctx, width, height, text);
      break;
    default:
      applyBottomRight(ctx, width, height, text);
  }

  ctx.restore();
}

function applyDiagonalRepeat(ctx, width, height, text) {
  const spacing = 300; // Space between text repetitions
  const lineSpacing = 250; // Space between diagonal lines
  const angle = -Math.PI / 4; // 45 degrees

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Calculate the diagonal length to cover entire canvas
  const diagonalLength = Math.sqrt(width * width + height * height) + 200;

  // Create multiple diagonal lines
  for (let line = -diagonalLength; line < diagonalLength; line += lineSpacing) {
    for (let i = -diagonalLength; i < diagonalLength; i += spacing) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.translate(i, line);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
}

function applyPatternGrid(ctx, width, height, text) {
  const spacingX = 200;
  const spacingY = 150;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < height; y += spacingY) {
    for (let x = 0; x < width; x += spacingX) {
      ctx.fillText(text, x, y);
    }
  }
}

function applyCorner(ctx, width, height, text) {
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, width - 20, height - 20);
}

function applyCenter(ctx, width, height, text) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
}

function applyBottomRight(ctx, width, height, text) {
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, width - 10, height - 10);
}

function drawLabelBox(ctx, labelData, { font, color, bgColor, padding }) {
  const lines = [
    `PROJECT NAME: ${labelData.projectName || ""}`,
    `CHART TYPE: ${labelData.chartType || ""}`,
    `Annotator: ${labelData.annotator || ""}`,
    `Date: ${labelData.date || ""}`,
  ];

  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Calculate box dimensions
  const lineHeight = 20;
  const boxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  const x = 10;
  const y = 10;

  // Draw background box
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, boxWidth, boxHeight);

  // Draw border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  // Draw text
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    ctx.fillText(line, x + padding, y + padding + index * lineHeight);
  });
}

/**
 * Get the latest valid Mapbox map instance.
 * Works even after re-render, theme toggle, or ref mismatch.
 *
 * @param {object|function} mapRef - Can be a Mapbox map instance, a React ref (mapRef.current), or a getter function.
 * @returns {object|null} - The latest valid Mapbox map instance, or null if unavailable.
 */
export function getLatestMapInstance(mapRef) {
  try {
    // 1️⃣ Direct Mapbox map instance
    if (mapRef && typeof mapRef.getStyle === 'function') {
      return mapRef;
    }

    // 2️⃣ React ref object: mapRef.current
    if (mapRef && typeof mapRef === 'object' && mapRef.current) {
      const map = mapRef.current;
      if (map && typeof map.getStyle === 'function') {
        return map;
      }
    }

    // 3️⃣ If a function was passed (e.g. a getter)
    if (typeof mapRef === 'function') {
      const map = mapRef();
      if (map && typeof map.getStyle === 'function') {
        return map;
      }
    }

    // 4️⃣ Try global cache fallback (optional safety net)
    if (window.__latestMap && typeof window.__latestMap.getStyle === 'function') {
      return window.__latestMap;
    }

    console.warn('⚠️ No valid map instance found');
    return null;
  } catch (err) {
    console.error('❌ Error fetching latest map instance:', err);
    return null;
  }
}

/**
 * Optionally register a new map instance globally for fallback use.
 * Call this once in your MapComponent’s onLoad callback.
 */
export function registerMapInstance(map) {
  if (map && typeof map.getStyle === 'function') {
    window.__latestMap = map;
  }
}

/**
 * Add a typhoon or low pressure marker point feature to the map source.
 * @param {object} selectedPoint - {lng, lat} coordinates
 * @param {object} mapRef - React ref to Mapbox map instance
 * @param {function} setShowTitleModal - callback to hide title modal
 * @param {string} type - feature type, e.g. 'draw_point' or 'low_pressure'
 * @returns {function} - function accepting the title string
 */

export function loadImage(map, name, path) {
  if (!map.hasImage(name)) {
    map.loadImage(path, (error, image) => {
      if (error) {
        // console.error(`Error loading image ${name} from ${path}:`, error);
        return;
      }
      if (!map.hasImage(name)) {
        map.addImage(name, image);
      }
    });
  }
}

// Initialize all custom images
export function loadCustomImages(map) {
  const singleImages = [
    { name: 'typhoon', path: '/hurricane.png' },
    { name: 'low_pressure', path: '/LPA.png' },
    { name: 'high_pressure', path: '/HPA.png' },
    { name: 'less_1', path: '/L1.png' }
  ];

  const windBarbs = [
    { name: '0kts', path: '/barbs/0kts.svg' },
    { name: '5kts', path: '/barbs/5kts.svg' },
    { name: '10kts', path: '/barbs/10kts.svg' },
    { name: '15kts', path: '/barbs/15kts.svg' },
    { name: '20kts', path: '/barbs/20kts.svg' },
    { name: '25kts', path: '/barbs/25kts.svg' },
    { name: '30kts', path: '/barbs/30kts.svg' }
  ];

  // Load standard images
  singleImages.forEach(img => loadImage(map, img.name, img.path));

  // Load wind barb images
  windBarbs.forEach(img => loadImage(map, img.name, img.path));
}

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

/** Initialize Mapbox Draw instance with custom modes and styles */
export function initDrawControl(map) {
  if (map.drawControl) {
    // Already initialized
    return map.drawControl;
  }

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: {
      ...MapboxDraw.modes,
      simple_select: SimpleSelect,
      direct_select: MapboxDraw.modes.direct_select,
      draw_line_string: DrawLineString,
      draw_rectangle: DrawRectangle,
      draw_circle: DrawCircle,
    },
    styles: drawStyles,
  });

  map.addControl(draw);
  map.drawControl = draw; // store instance to avoid duplicates
  return draw;
}

export const typhoonMarker = (selectedPoint, mapRef, setShowTitleModal, type) => (title) => {
  if (!selectedPoint) return;

  const { lng, lat } = selectedPoint;

  const iconMap = {
    typhoon: 'typhoon',
    low_pressure: 'low_pressure',
    high_pressure: 'high_pressure',
    less_1: 'less_1'
  };

  const defaultTitles = {
    typhoon: 'Typhoon',
    low_pressure: 'LPA',
  };

  const markerType = type;
  const iconName = iconMap[markerType];
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      title: title || defaultTitles[markerType],
      markerType,
      icon: iconName,
    },
  };

  const map = mapRef.current;
  if (!map) return;

  const sourceId = `${markerType}_${title}`;
  const layerId = `${markerType}_${title}`;

  // ✅ Add source only if not exists
  if (!map.getSource(sourceId)) {
    try {
      map.addSource(sourceId, {
        type: 'geojson',
        data: feature,
      });
    } catch (error) {
      console.error(`❌ Failed to add source "${sourceId}":`, error);
    }
  }

  // 🔧 Layout
  const layout = {
    'icon-image': ['get', 'icon'],
    'icon-size': [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 0.028,
      ['==', ['get', 'markerType'], 'high_pressure'], 0.028,
      ['==', ['get', 'markerType'], 'less_1'], 0.28,
      0.07
    ],
    'icon-allow-overlap': true,
  };

  if (markerType !== 'less_1') {
    layout['text-field'] = ['get', 'title'];
    layout['text-font'] = ['Open Sans Semibold', 'Arial Unicode MS Bold'];
    layout['text-offset'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'],
      [0, 1.0],
      [0, 1.25],
    ];
    layout['text-anchor'] = 'top';
    layout['text-allow-overlap'] = true;
  }

  // 🎨 Paint
  const paint = {};
  if (markerType !== 'less_1') {
    paint['text-color'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 'red',
      ['==', ['get', 'markerType'], 'high_pressure'], 'blue',
      'purple'
    ];
    paint['text-halo-color'] = '#FFFFFF';
    paint['text-halo-width'] = 1;
    paint['text-opacity'] = [
      'case',
      ['any',
        ['==', ['get', 'markerType'], 'low_pressure'],
        ['==', ['get', 'markerType'], 'high_pressure']
      ],
      0,   // fully transparent
      1    // visible for others (like typhoon, etc.)
    ];
  }

  // ✅ Add layer only if not exists
  if (!map.getLayer(layerId)) {
    try {
      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        slot: 'top',
        layout,
        paint,
      });
    } catch (error) {
      console.error(`❌ Failed to add layer "${layerId}":`, error);
    }
  }

  setShowTitleModal(false);
};

export function addHimawariLayer(map) {
  const videoUrl = `${import.meta.env.VITE_API_URL}/api/public/himawari.mp4`;

  // Clean up previous instance
  ["himawari-video-layer", "himawari-video"].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  map.addSource("himawari-video", {
    type: "video",
    urls: [videoUrl],
    coordinates: [
      [104, 29.55],
      [146.99, 29.55],
      [146.99, -1.5],
      [104, -1.5],
    ],
  });

  map.addLayer({
    id: "Satellite",
    type: "raster",
    source: "himawari-video",
    slot: "bottom",
    layout: { visibility: "none" },
    paint: { "raster-opacity": 0.95 },
  });

  // Autoplay when ready
  map.on("data", (e) => {
    if (e.sourceId === "himawari-video" && e.isSourceLoaded) {
      const video = map.getSource("himawari-video")?.getVideo();
      if (video) {
        video.loop = true;
        video.muted = true;
        video.play().catch((err) => console.warn("Video play failed:", err));
        // console.log("🎥 Himawari video started.");
      }
    }
  });
}

export async function addWindLayer(map) {
  const geojson = await fetch('/geojson/20251106180000-144h-oper-fc.geojson');
  const windData = await geojson.json();

  map.addSource('wind-speed', {
    type: 'raster-array',
    url: 'mapbox://karlbernaldizzy.windmagnitude',
    tileSize: 512
  });

  map.addSource("12SEP2025v2", {
    type: "raster-array",
    url: `mapbox://karlbernaldizzy.ecmwf?fresh=${Date.now()}`,
    tileSize: 4096,
  });

  map.addSource('glass-layer', {
    type: 'vector',
    url: 'mapbox://karlbernaldizzy.192shi9k'
  });

  map.addSource('wind-points', {
    type: 'geojson',
    data: windData
  });

  // map.addLayer({
  //   id: "wind-layer",
  //   type: "raster-particle",
  //   source: "12SEP2025v2",
  //   "source-layer": "10m_wind",
  //   slot: "bottom",
  //   paint: {
  //     "raster-particle-speed-factor": 0.6,
  //     "raster-particle-fade-opacity-factor": 0.6,
  //     "raster-particle-reset-rate-factor": 0.4,
  //     "raster-particle-count": 48000,
  //     "raster-particle-max-speed": 100,
  //     "raster-particle-color": [
  //       "interpolate",
  //       ["linear"],
  //       ["raster-particle-speed"],
  //       1.5, "rgba(134,163,171,256)",
  //       6.17, "rgba(15,147,167,256)",
  //       11.83, "rgba(194,134,62,256)",
  //       18.0, "rgba(210,0,50,256)",
  //       25.21, "rgba(117,74,147,256)",
  //       42.18, "rgba(194,251,119,256)",
  //       50.41, "rgba(256,256,256,256)",
  //       59.16, "rgba(0,256,256,256)",
  //       69.44, "rgba(256,37,256,256)",
  //     ],
  //   },
  // });

  map.addLayer({
    id: 'wind-speed-layer',
    type: 'raster',
    source: 'wind-speed',
    'source-layer': 'wind_speed',
    paint: {
      'raster-opacity': 1,
      'raster-resampling': 'linear',
      'raster-color-range': [0, 30],  // adjust if needed
      'raster-color': [
        'interpolate',
        ['linear'],
        ['raster-value'],

        0.01, '#032de6',   // deep ultramarine
        1.8, '#0047ff',   // windy blue
        3.6, '#00c6ff',   // bright cyan
        5.4, '#00ffc8',   // aqua
        7.2, '#23ce26',   // vivid green
        10.8, '#b5ff00',   // lime
        14.4, '#ffe600',   // yellow
        20.4, '#ffb400',   // yellow-orange
        24, '#ff6e00',   // orange
        27.6, '#ff003c',   // red
        30, '#db0070',   // magenta-red
      ],
    },
    layout: {
      'visibility': 'none'   // 👈 start hidden
    }
  }, 'country-boundaries');

  map.addLayer({
    id: "wind-layer",
    type: "raster-particle",
    source: "12SEP2025v2",
    "source-layer": "10m_wind",
    slot: "bottom",
    paint: {
      "raster-particle-speed-factor": 0.4,        // slower movement = clearer particles
      "raster-particle-fade-opacity-factor": 0.8, // more visible traces
      "raster-particle-reset-rate-factor": 0.3,   // less frequent resets (longer trails)
      "raster-particle-count": 64000,             // fewer particles = larger appearance
      "raster-particle-max-speed": 160,            // slower, smoother trails
      "raster-particle-color": [
        "interpolate",
        ["linear"],
        ["raster-particle-speed"],
        0, "rgba(255,255,255,0.7)",
        100, "rgba(255,255,255,1)"
      ],
    },
    layout: {
      'visibility': 'none'   // 👈 start hidden
    }
  });

  map.addLayer({
    id: 'wind-arrows',
    type: 'symbol',
    source: 'wind-points',
    slot: "middle",

    // 🧠 Filter out weak winds
    filter: [">=", ["get", "windSpeed"], 2],

    layout: {
      // Choose icon image based on wind speed
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

      // Slight size scaling by speed
      'icon-size': [
        'interpolate', ['linear'], ['get', 'windSpeed'],
        0, 3.0,
        16.5, 4.2
      ],

      // Rotate based on windDirection (+180 so arrow points TO the flow)
      'icon-rotate': [
        '+',
        ['to-number', ['get', 'windDirection'], 0],
        360
      ],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
    },
    paint: { 'icon-opacity': 0.95 }
  });

  map.addLayer({
    id: 'wind-labels',
    type: 'symbol',
    slot: "middle",
    source: 'wind-points',
    filter: [">=", ["get", "windSpeed"], 2],
    layout: {
      'visibility': 'none',
      'text-field': [
        'concat',
        [
          'round',
          ['*', ['to-number', ['get', 'windSpeed'], 0], 1.94384]
        ],
        ' kts'
      ],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        3, 8,
        6, 10,
        9, 12
      ],
      // **Bold fonts for wind speed**
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0.9],
      'text-anchor': 'top',
      'text-allow-overlap': true
    },
    paint: {
      // Cool cyan-blue palette for wind
      'text-color': [
        'interpolate',
        ['linear'],
        ['get', 'windSpeed'],
        0, '#60a5fa',    // blue-400
        15, '#38bdf8',   // cyan-400
        30, '#06b6d4'    // cyan-500
      ],
      'text-halo-color': 'rgba(0, 0, 0, 0.8)',
      'text-halo-width': 2.5,
      'text-halo-blur': 1.2,
      'text-opacity': 1
    }
  });

  map.addLayer({
    id: 'wave-arrows',
    type: 'symbol',
    source: 'wind-points',
    slot: "middle",
    // same filter: show only where windSpeed >= 2
    filter: [">=", ["get", "windSpeed"], 2],
    layout: {
      'visibility': 'none',
      'icon-image': 'Arrow (1)',      // name in your sprite
      'icon-size': 1.8,               // scale to taste
      'icon-rotate': [
        '+',
        ['to-number', ['get', 'waveDirection'], 0],
        0
      ],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-opacity': 0.9
    }
  });

  map.addLayer({
    id: 'wave-period-labels',
    type: 'symbol',
    source: 'wind-points',
    slot: "middle",
    filter: [
      "all",
      [">=", ["get", "windSpeed"], 2],
      ["<", ["get", "wavePeriod"], 30],
      [">", ["get", "wavePeriod"], 0],
      ["!=", ["get", "wavePeriod"], 9999]
    ],
    layout: {
      'visibility': 'none',
      'text-field': [
        'concat',
        ['to-string', ['round', ['get', 'wavePeriod']]],
        ' s'
      ],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        3, 10,
        6, 14,
        9, 18
      ],
      // **Italic / light font style for wave period**
      'text-font': ['Open Sans Italic', 'Arial Unicode MS Regular'],
      'text-offset': [0, -0.7],
      'text-anchor': 'bottom',
      'text-allow-overlap': true
    },
    paint: {
      // Warm golden tone for wave labels
      'text-color': [
        'interpolate',
        ['linear'],
        ['get', 'wavePeriod'],
        0, '#fde68a',   // amber-200
        10, '#fbbf24',  // amber-400
        20, '#f59e0b'   // amber-500
      ],
      'text-halo-color': 'rgba(0,0,0,0.85)',
      'text-halo-width': 2.8,
      'text-halo-blur': 0.8,
      'text-opacity': 1
    }
  });

  map.addLayer({
    id: 'glass-fill',
    type: 'fill',
    source: 'glass-layer',
    'source-layer': 'ph-bum99e',
    slot: "top",
    paint: {
      // Transparent white base
      'fill-color': 'rgba(255, 255, 255, 0.15)',
      'fill-opacity': 0.4,

      // Soft white outline for edges
      'fill-outline-color': 'rgba(255, 255, 255, 0.35)'
    },
    layout: {
      'visibility': 'none'   // 👈 start hidden
    }
  });

  map.addLayer({
    id: 'glass-depth',
    type: 'fill',
    source: 'glass-layer',
    'source-layer': 'ph-bum99e',
    slot: "top",
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 'rgba(255,255,255,0.05)',
        10, 'rgba(255,255,255,0.25)'
      ],
      'fill-opacity': 0.3
    },
    layout: {
      'visibility': 'none'   // 👈 start hidden
    }
  });

}

/**
 * Capture a Mapbox map snapshot and optionally update state, localStorage, and console preview.
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {Function} [setCapturedImages] - Optional setter to update React state
 * @param {Object} [options]
 * @param {string} [options.lightKey='map_snapshot_light'] - localStorage key for light mode
 * @param {string} [options.darkKey='map_snapshot_dark'] - localStorage key for dark mode
 * @param {number} [options.consolePreviewSize=1600] - size in px for console preview
 */
export function captureMapSnapshot(map, setCapturedImages, options = {}) {
  const {
    lightKey = "map_snapshot_light",
    darkKey = "map_snapshot_dark",
    consolePreviewSize = 1600,
    watermarkText = "",
    watermarkStyle = "diagonal-repeat", // "diagonal-repeat" | "corner" | "center" | "bottom-right" | "pattern-grid"
    crop = null,
    labelData = null, // { projectName, chartType, annotator, date }
    labelFont = "14px Arial",
    labelColor = "white",
    labelBgColor = "rgba(0, 0, 0, 0.7)",
    labelPadding = 12,
    watermarkFont = "32px Arial",
    watermarkColor = "rgba(255, 255, 255, 0.5)",
    watermarkOpacity = 0.5,
  } = options;

  if (!map) return console.warn("No map instance provided for snapshot.");

  try {
    const canvas = map.getCanvas();
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");

    const cropX = crop?.x || 0;
    const cropY = crop?.y || 0;
    const cropWidth = crop?.width || originalWidth;
    const cropHeight = crop?.height || originalHeight;

    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;

    ctx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Apply watermark based on style
    applyWatermark(ctx, cropWidth, cropHeight, {
      text: watermarkText,
      style: watermarkStyle,
      font: watermarkFont,
      color: watermarkColor,
      opacity: watermarkOpacity,
    });

    // Add label on upper-left if provided
    if (labelData) {
      drawLabelBox(ctx, labelData, {
        font: labelFont,
        color: labelColor,
        bgColor: labelBgColor,
        padding: labelPadding,
      });
    }

    const imageDataUrl = tempCanvas.toDataURL("image/png");

    const darkMode = localStorage.getItem("isDarkMode") === "true";
    const snapshotKey = darkMode ? darkKey : lightKey;

    localStorage.setItem(snapshotKey, imageDataUrl);

    setCapturedImages?.((prev) => ({
      ...prev,
      [darkMode ? "dark" : "light"]: imageDataUrl,
    }));

    console.log(
      "%c ",
      `font-size:${consolePreviewSize}px; line-height:${consolePreviewSize}px; background:url(${imageDataUrl}) no-repeat; background-size:contain;`
    );

    return imageDataUrl;
  } catch (e) {
    console.error("❌ Error capturing map snapshot:", e);
    return null;
  }
}
