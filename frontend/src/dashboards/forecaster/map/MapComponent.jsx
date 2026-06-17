import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { registerMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Single base style
const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

// Basemap palette. Keep forecast/annotation overlays untouched.
const BASEMAP_THEMES = {
  dark: {
    background: '#06131f',
    land: '#0f2132',
    landcover: '#143045',
    water: '#062c49',
    waterway: '#0c5f82',
    road: '#4b6478',
    roadCase: '#071827',
    boundary: '#67e8f9',
    label: '#e0f7ff',
    labelMuted: '#9cc8d8',
    labelHalo: '#06131f',
  },
  light: {
    background: '#e7f7fb',
    land: '#f8fbf3',
    landcover: '#e9f4df',
    water: '#b9e9f5',
    waterway: '#7ecce2',
    road: '#ffffff',
    roadCase: '#b7c8d5',
    boundary: '#08799b',
    label: '#1e293b',
    labelMuted: '#496579',
    labelHalo: '#f8fdff',
  },
};

const BASEMAP_SOURCE_LAYERS = [
  'land',
  'landuse',
  'landcover',
  'water',
  'waterway',
  'waterway-label',
  'road',
  'building',
  'admin',
  'place_label',
  'natural_label',
  'poi_label',
  'road_label',
  'water_label',
];

const NON_BASEMAP_LAYER_IDS = new Set([
  'Satellite',
  'PAR',
  'PAR_dash',
  'TCID',
  'TCAD',
  'graticules',
  'graticules_blur',
  'SHIPPING_ZONE_LABELS',
  'SHIPPING_ZONE_OUTLINE',
]);

const THEMED_OVERLAY_LAYER_IDS = new Set([
  'ph-overlay',
  'ph-overlay-outline',
]);

const includesAny = (value = '', terms = []) => {
  const text = String(value).toLowerCase();
  return terms.some((term) => text.includes(term));
};

const isBasemapLayer = (layer) => {
  if (THEMED_OVERLAY_LAYER_IDS.has(layer?.id)) return true;
  if (!layer?.id || NON_BASEMAP_LAYER_IDS.has(layer.id)) return false;
  if (layer.id.startsWith('wave-') || layer.id.startsWith('wind-')) return false;
  if (layer.id.startsWith('front-') || layer.id.startsWith('non-front-')) return false;

  const sourceLayer = layer['source-layer'];
  if (!layer.source && layer.type === 'background') return true;
  if (sourceLayer && BASEMAP_SOURCE_LAYERS.some((name) => sourceLayer.toLowerCase().includes(name))) return true;

  return includesAny(layer.id, [
    'background',
    'land',
    'landcover',
    'landuse',
    'water',
    'waterway',
    'road',
    'admin',
    'boundary',
    'place',
    'label',
    'poi',
    'settlement',
    'building',
  ]);
};

const safeSetPaint = (map, layerId, prop, value) => {
  try {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, prop, value);
  } catch {
    // Custom styles may omit paint properties for a layer type; skip quietly.
  }
};

const applyLayerTheme = (map, layer, theme) => {
  const id = layer.id.toLowerCase();
  const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
  const key = `${id} ${sourceLayer}`;

  if (layer.id === 'ph-overlay') {
    safeSetPaint(map, layer.id, 'fill-color', theme.land);
    safeSetPaint(map, layer.id, 'fill-opacity', 0.94);
    return;
  }

  if (layer.id === 'ph-overlay-outline') {
    safeSetPaint(map, layer.id, 'line-color', theme.boundary);
    safeSetPaint(map, layer.id, 'line-width', isDarkColor(theme.land) ? 0.75 : 0.65);
    safeSetPaint(map, layer.id, 'line-opacity', isDarkColor(theme.land) ? 0.58 : 0.62);
    return;
  }

  if (layer.type === 'background') {
    safeSetPaint(map, layer.id, 'background-color', theme.background);
    return;
  }

  if (layer.type === 'fill') {
    if (includesAny(key, ['water', 'waterway', 'ocean', 'lake', 'river'])) {
      safeSetPaint(map, layer.id, 'fill-color', theme.water);
      safeSetPaint(map, layer.id, 'fill-opacity', 0.98);
      return;
    }

    if (includesAny(key, ['landcover', 'landuse', 'park', 'vegetation', 'forest', 'grass'])) {
      safeSetPaint(map, layer.id, 'fill-color', theme.landcover);
      safeSetPaint(map, layer.id, 'fill-opacity', 0.9);
      return;
    }

    if (includesAny(key, ['building'])) {
      safeSetPaint(map, layer.id, 'fill-color', isDarkColor(theme.land) ? '#182235' : '#e2e8f0');
      safeSetPaint(map, layer.id, 'fill-opacity', 0.42);
      return;
    }

    safeSetPaint(map, layer.id, 'fill-color', theme.land);
    safeSetPaint(map, layer.id, 'fill-opacity', 0.96);
    return;
  }

  if (layer.type === 'line') {
    if (includesAny(key, ['water', 'waterway', 'river', 'stream'])) {
      safeSetPaint(map, layer.id, 'line-color', theme.waterway);
      safeSetPaint(map, layer.id, 'line-opacity', 0.72);
      return;
    }

    if (includesAny(key, ['admin', 'boundary'])) {
      safeSetPaint(map, layer.id, 'line-color', theme.boundary);
      safeSetPaint(map, layer.id, 'line-opacity', 0.5);
      return;
    }

    if (includesAny(key, ['road', 'street', 'bridge', 'tunnel'])) {
      const color = includesAny(key, ['case', 'casing']) ? theme.roadCase : theme.road;
      safeSetPaint(map, layer.id, 'line-color', color);
      safeSetPaint(map, layer.id, 'line-opacity', 0.52);
    }
    return;
  }

  if (layer.type === 'symbol') {
    const muted = includesAny(key, ['poi', 'road', 'water', 'natural']);
    safeSetPaint(map, layer.id, 'text-color', muted ? theme.labelMuted : theme.label);
    safeSetPaint(map, layer.id, 'text-halo-color', theme.labelHalo);
    safeSetPaint(map, layer.id, 'text-halo-width', 1.2);
    safeSetPaint(map, layer.id, 'icon-color', muted ? theme.labelMuted : theme.label);
  }
};

const isDarkColor = (hex) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

const applyTheme = (map, isDarkMode) => {
  if (!map) return false;
  if (!map.isStyleLoaded()) return false;

  const theme = isDarkMode ? BASEMAP_THEMES.dark : BASEMAP_THEMES.light;
  const layers = map.getStyle()?.layers || [];

  layers.filter(isBasemapLayer).forEach((layer) => applyLayerTheme(map, layer, theme));

  return true;
};

const MapComponent = ({ setMapInstance, onMapLoad, isDarkMode }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize map (runs once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean container (important for hot reloads)
    while (mapContainerRef.current.firstChild) {
      mapContainerRef.current.removeChild(mapContainerRef.current.firstChild);
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      projection: 'mercator',
      style: STYLE_URL,
      center: [120.0, 15.5],
      zoom: 5.5,
      minZoom: 4,
      maxZoom: 16,
      preserveDrawingBuffer: true,
      maxBounds: [
        [80, -10],
        [170, 40],
      ],
    });

    const resizeMap = () => map.resize();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(resizeMap)
        : null;
    const resizeFrame = requestAnimationFrame(resizeMap);

    resizeObserver?.observe(mapContainerRef.current);

    window.map = map;
    map.fitBounds(
      [
        [93, 5],
        [153.8595159535438, 25],
      ],
      {
        padding: { top: 50, bottom: 50, left: 200, right: 200 },
        maxZoom: 8,
      }
    );

    map.on('load', () => {
      mapRef.current = map;
      map.resize();

      registerMapInstance(map);
      if (setMapInstance) setMapInstance(map);
      if (onMapLoad) onMapLoad(map);

      // Apply initial theme after the custom style is fully available.
      applyTheme(map, isDarkMode);
    });

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      if (setMapInstance) setMapInstance(null);
    };
  }, []);

  // Theme updates (NO style reload)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (applyTheme(map, isDarkMode)) return;

    const applyWhenReady = () => applyTheme(map, isDarkMode);
    map.once('styledata', applyWhenReady);
    return () => map.off('styledata', applyWhenReady);
  }, [isDarkMode]);

  return (
    <div className="absolute inset-0 h-full min-h-screen w-full overflow-hidden">
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          position: 'absolute',
          inset: 0,
        }}
      />
      <div
        className="studio-map-glass-overlay"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle at 18% 12%, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 82% 8%, rgba(14,165,233,0.12), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.24))'
            : 'radial-gradient(circle at 16% 10%, rgba(14,165,233,0.18), transparent 34%), radial-gradient(circle at 84% 12%, rgba(45,212,191,0.12), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.1), rgba(186,230,253,0.18))',
          opacity: isDarkMode ? 0.78 : 0.66,
        }}
      />
    </div>
  );
};

export default MapComponent;
