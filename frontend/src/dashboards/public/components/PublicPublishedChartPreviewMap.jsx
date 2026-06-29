import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_BOUNDS = [[93, 0], [153.8595159535438, 25]];
const DEFAULT_CENTER = [120, 15.5];
const RASTER_SOURCE_ID = 'published-cog-raster-source';
const RASTER_LAYER_ID = 'published-cog-raster';
const COUNTRY_SOURCE_ID = 'published-country-boundaries-source';
const COUNTRY_LAND_LAYER_ID = 'published-country-land-overlay';
const COUNTRY_LINE_LAYER_ID = 'published-country-line-overlay';
const FEATURE_SOURCE_ID = 'published-chart-annotations';
const LABEL_SOURCE_ID = 'published-chart-line-labels';
const LESS_ONE_IMAGE_ID = 'published-preview-less-1';

const COUNTRY_LAYER_ORDER = [COUNTRY_LAND_LAYER_ID, COUNTRY_LINE_LAYER_ID];
const ANNOTATION_LAYER_ORDER = [
  'published-chart-polygons',
  'published-chart-polygon-outline',
  'published-chart-lines',
  'published-chart-fronts',
  'published-chart-points',
  'published-chart-less-one',
  'published-chart-line-labels',
  'published-chart-point-labels',
];

const POINT_TYPE = ['coalesce', ['get', 'markerType'], ['get', 'type'], ''];
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];
const LINE_FILTER = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const POLYGON_FILTER = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const LESS_ONE_FILTER = ['all', POINT_FILTER, ['==', POINT_TYPE, 'less_1']];
const POINT_SYMBOL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];
const POINT_LABEL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];

function isFront(feature) {
  const props = feature?.properties || {};
  return Boolean(props.isFront || props.frontType || `${props.name || ''} ${props.title || ''}`.toLowerCase().includes('front'));
}

function frontColor(feature) {
  const type = String(feature?.properties?.frontType || '').toLowerCase();
  if (type === 'warm') return '#ef4444';
  if (type === 'occluded') return '#7c3aed';
  return '#1d4ed8';
}

function getLineParts(geometry) {
  if (!Array.isArray(geometry?.coordinates)) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function getLineLabel(feature) {
  const props = feature?.properties || {};
  return String(props.labelValue ?? props.waveHeight ?? props.heightValue ?? props.height ?? props.value ?? props.text ?? props.label ?? props.name ?? props.title ?? feature?.name ?? '').trim();
}

function isClosedLine(feature, line) {
  const first = line?.[0];
  const last = line?.[line.length - 1];
  return Boolean(feature?.properties?.closedMode || (Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1]));
}

function buildCollections(featureCollection) {
  const regular = [];
  const fronts = [];
  const labels = [];

  featureCollection.features.forEach((feature, featureIndex) => {
    if (isFront(feature)) {
      getLineParts(feature.geometry).forEach((line) => {
        fronts.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: line }, properties: { color: frontColor(feature) } });
      });
      return;
    }

    regular.push(feature);
    const text = getLineLabel(feature);
    if (!text) return;
    getLineParts(feature.geometry).forEach((line, lineIndex) => {
      if (!Array.isArray(line) || line.length < 2) return;
      const points = isClosedLine(feature, line) ? [line[0]] : [line[0], line[line.length - 1]];
      points.forEach((coordinates, pointIndex) => labels.push({ type: 'Feature', id: `${feature.id || featureIndex}-${lineIndex}-${pointIndex}`, geometry: { type: 'Point', coordinates }, properties: { text } }));
    });
  });

  return {
    regular: { type: 'FeatureCollection', features: regular },
    fronts: { type: 'FeatureCollection', features: fronts },
    labels: { type: 'FeatureCollection', features: labels },
  };
}

function setGeoJson(map, id, data) {
  if (map.getSource(id)) map.getSource(id).setData(data);
  else map.addSource(id, { type: 'geojson', data });
}

function safelyMoveLayerToTop(map, layerId) {
  if (!map.getLayer(layerId)) return;
  try {
    map.moveLayer(layerId);
  } catch (error) {
    console.warn(`[PublicPublishedChartPreviewMap] Failed to move layer ${layerId}:`, error);
  }
}

function restackPreviewLayers(map) {
  COUNTRY_LAYER_ORDER.forEach((layerId) => safelyMoveLayerToTop(map, layerId));
  ANNOTATION_LAYER_ORDER.forEach((layerId) => safelyMoveLayerToTop(map, layerId));
}

function removeRaster(map) {
  if (map.getLayer(RASTER_LAYER_ID)) map.removeLayer(RASTER_LAYER_ID);
  if (map.getSource(RASTER_SOURCE_ID)) map.removeSource(RASTER_SOURCE_ID);
  map.__publishedCogTileUrl = '';
}

function syncRaster(map, raster, enabled) {
  if (!enabled || !raster?.tileUrl) {
    removeRaster(map);
    return;
  }

  const changed = map.getSource(RASTER_SOURCE_ID) && map.__publishedCogTileUrl !== raster.tileUrl;
  if (changed) removeRaster(map);

  if (!map.getSource(RASTER_SOURCE_ID)) {
    map.addSource(RASTER_SOURCE_ID, {
      type: 'raster',
      tiles: [raster.tileUrl],
      tileSize: Number(raster.tileSize) || 256,
      scheme: raster.scheme || 'xyz',
      bounds: Array.isArray(raster.bounds) ? raster.bounds : undefined,
      attribution: raster.attribution,
    });
    map.__publishedCogTileUrl = raster.tileUrl;
  }

  if (!map.getLayer(RASTER_LAYER_ID)) {
    map.addLayer({
      id: RASTER_LAYER_ID,
      type: 'raster',
      source: RASTER_SOURCE_ID,
      paint: {
        'raster-opacity': Number.isFinite(Number(raster.opacity)) ? Number(raster.opacity) : 0.96,
        'raster-fade-duration': 0,
        'raster-resampling': 'linear',
      },
    });
  }
}

function syncCountryOverlay(map, isDarkMode) {
  try {
    if (!map.getSource(COUNTRY_SOURCE_ID)) {
      map.addSource(COUNTRY_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });
    }

    if (!map.getLayer(COUNTRY_LAND_LAYER_ID)) {
      map.addLayer({
        id: COUNTRY_LAND_LAYER_ID,
        type: 'fill',
        source: COUNTRY_SOURCE_ID,
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': isDarkMode ? '#1e293b' : '#d6d3cd',
          'fill-opacity': 0.82,
        },
      });
    } else {
      map.setPaintProperty(COUNTRY_LAND_LAYER_ID, 'fill-color', isDarkMode ? '#1e293b' : '#d6d3cd');
    }

    if (!map.getLayer(COUNTRY_LINE_LAYER_ID)) {
      map.addLayer({
        id: COUNTRY_LINE_LAYER_ID,
        type: 'line',
        source: COUNTRY_SOURCE_ID,
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': isDarkMode ? '#94a3b8' : '#4b5563',
          'line-opacity': 0.5,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 1.2],
        },
      });
    } else {
      map.setPaintProperty(COUNTRY_LINE_LAYER_ID, 'line-color', isDarkMode ? '#94a3b8' : '#4b5563');
    }
  } catch (error) {
    console.warn('[PublicPublishedChartPreviewMap] Country overlay unavailable:', error);
  }
}

function ensureLessOneImage(map) {
  if (map.hasImage(LESS_ONE_IMAGE_ID)) return;
  map.loadImage('/L1.png', (error, image) => {
    if (!error && image && !map.hasImage(LESS_ONE_IMAGE_ID)) map.addImage(LESS_ONE_IMAGE_ID, image);
  });
}

function syncAnnotations(map, featureCollection) {
  const { regular, fronts, labels } = buildCollections(featureCollection);
  ensureLessOneImage(map);
  setGeoJson(map, FEATURE_SOURCE_ID, regular);
  setGeoJson(map, `${FEATURE_SOURCE_ID}-fronts`, fronts);
  setGeoJson(map, LABEL_SOURCE_ID, labels);

  if (map.getLayer('published-chart-lines')) return;

  map.addLayer({ id: 'published-chart-polygons', type: 'fill', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.2 } });
  map.addLayer({ id: 'published-chart-polygon-outline', type: 'line', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'line-color': '#0284c7', 'line-width': 2, 'line-opacity': 0.9 } });
  map.addLayer({ id: 'published-chart-lines', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': '#0f172a', 'line-width': 3, 'line-opacity': 0.9 } });
  map.addLayer({ id: 'published-chart-fronts', type: 'line', source: `${FEATURE_SOURCE_ID}-fronts`, paint: { 'line-color': ['get', 'color'], 'line-width': 2.75, 'line-opacity': 1 } });
  map.addLayer({ id: 'published-chart-points', type: 'circle', source: FEATURE_SOURCE_ID, filter: POINT_SYMBOL_FILTER, paint: { 'circle-color': '#2563eb', 'circle-radius': 7, 'circle-opacity': 0.95, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
  map.addLayer({ id: 'published-chart-less-one', type: 'symbol', source: FEATURE_SOURCE_ID, filter: LESS_ONE_FILTER, layout: { 'icon-image': LESS_ONE_IMAGE_ID, 'icon-size': 0.28, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  map.addLayer({ id: 'published-chart-line-labels', type: 'symbol', source: LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': 16, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
  map.addLayer({ id: 'published-chart-point-labels', type: 'symbol', source: FEATURE_SOURCE_ID, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], '']], 'text-size': 14, 'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]], 'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
}

function StatusOverlay({ loading, hasRenderableRaster, hasFeatures, isDarkMode }) {
  if (loading) return <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-slate-950/55 text-slate-300' : 'bg-white/55 text-slate-600'}`}>Loading published chart...</div>;
  if (!hasRenderableRaster && !hasFeatures) return <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-slate-950/70 text-slate-400' : 'bg-slate-100/80 text-slate-500'}`}>Published preview unavailable</div>;
  return null;
}

function PublicPublishedChartPreviewMap({ projectId, initialRaster, isDarkMode = false, className = '', height = 288, onClick }) {
  const { activeChartType } = useChartType();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [isReady, setIsReady] = useState(false);
  const theme = isDarkMode ? 'dark' : 'light';
  const raster = payload?.raster || initialRaster || null;
  const featureCollection = useMemo(() => normalizeFeatureCollection(payload?.featureCollection), [payload]);
  const hasFeatures = featureCollection.features.length > 0;
  const shouldRenderRaster = activeChartType === 'wave-wind';
  const hasRenderableRaster = shouldRenderRaster && Boolean(raster?.tileUrl);

  useEffect(() => {
    let mounted = true;
    if (!projectId) { setPayload(null); setLoading(false); return undefined; }
    setLoading(true);
    fetchPublicPublishedChartOutput(projectId, { theme })
      .then((data) => { if (mounted) setPayload(data || null); })
      .catch((error) => { if (mounted) { console.error('[PublicPublishedChartPreviewMap] Failed to load published output:', error); setPayload(null); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [projectId, theme]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = new mapboxgl.Map({ container: containerRef.current, style: STYLE_URL, projection: 'mercator', center: DEFAULT_CENTER, zoom: 4.8, interactive: false, attributionControl: false, fadeDuration: 0 });
    mapRef.current = map;
    map.on('load', () => { setIsReady(true); map.resize(); map.fitBounds(DEFAULT_BOUNDS, { padding: 16, maxZoom: 6, duration: 0 }); });
    return () => { map.remove(); mapRef.current = null; setIsReady(false); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    syncRaster(map, raster, shouldRenderRaster);
    syncCountryOverlay(map, isDarkMode);
    if (hasFeatures) syncAnnotations(map, featureCollection);
    restackPreviewLayers(map);
    map.fitBounds(DEFAULT_BOUNDS, { padding: 16, maxZoom: 6, duration: 0 });
  }, [featureCollection, hasFeatures, isDarkMode, isReady, raster, shouldRenderRaster]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {onClick && <button type="button" className="absolute inset-0 z-10 h-full w-full cursor-pointer" onClick={onClick} aria-label="Open published chart" />}
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
      <StatusOverlay loading={loading} hasRenderableRaster={hasRenderableRaster} hasFeatures={hasFeatures} isDarkMode={isDarkMode} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t ${isDarkMode ? 'from-slate-950/80' : 'from-white/80'} to-transparent`} />
    </div>
  );
}

export default memo(PublicPublishedChartPreviewMap);
