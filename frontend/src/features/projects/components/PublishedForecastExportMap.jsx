import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import usePublicMapBounds, { getMapBoundsCenter } from '@/features/projects/hooks/usePublicMapBounds';
import { CHART_STYLE_MODE, getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';
import { isFrontFeature, renderFrontFeatures } from '@/features/projects/utils/frontRendering';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const EXPORT_WIDTH = 1400;
const EXPORT_HEIGHT = 700;
const RASTER_SOURCE_ID = 'published-export-raster-source';
const RASTER_LAYER_ID = 'published-export-raster';
const COUNTRY_SOURCE_ID = 'published-export-country-source';
const COUNTRY_LAND_LAYER_ID = 'published-export-country-land';
const COUNTRY_LINE_LAYER_ID = 'published-export-country-lines';
const FEATURE_SOURCE_ID = 'published-forecast-export-features';
const LABEL_SOURCE_ID = 'published-forecast-export-line-labels-source';

const POINT_TYPE = ['coalesce', ['get', 'markerType'], ['get', 'type'], ''];
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];
const LINE_FILTER = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const POLYGON_FILTER = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const POINT_LABEL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];

const EXPORT_LAYER_ORDER = [
  RASTER_LAYER_ID,
  COUNTRY_LAND_LAYER_ID,
  COUNTRY_LINE_LAYER_ID,
  'published-forecast-export-polygons',
  'published-forecast-export-polygons-outline',
  'published-forecast-export-lines-casing',
  'published-forecast-export-lines',
  'published-forecast-export-points',
  'published-forecast-export-line-labels',
  'published-forecast-export-labels',
];

function getProjectIdFromLocation() {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function isMapStyleReady(map) {
  return Boolean(map && map.isStyleLoaded && map.isStyleLoaded());
}

function setLayerVisibility(map, layerId, isVisible) {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
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

function buildCollections(featureCollection) {
  const regular = [];
  const fronts = [];
  const labels = [];

  featureCollection.features.forEach((feature, featureIndex) => {
    if (isFrontFeature(feature)) {
      fronts.push(feature);
      return;
    }

    regular.push(feature);
    const text = getLineLabel(feature);
    if (!text) return;

    getLineParts(feature.geometry).forEach((line, lineIndex) => {
      if (!Array.isArray(line) || line.length < 2) return;
      const first = line[0];
      const last = line[line.length - 1];
      const closed = feature?.properties?.closedMode || (Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1]);
      const points = closed ? [first] : [first, last];

      points.forEach((coordinates, pointIndex) => labels.push({
        type: 'Feature',
        id: `${feature.id || featureIndex}-${lineIndex}-${pointIndex}`,
        geometry: { type: 'Point', coordinates },
        properties: { text },
      }));
    });
  });

  return {
    regular: { type: 'FeatureCollection', features: regular },
    fronts,
    labels: { type: 'FeatureCollection', features: labels },
  };
}

function setGeoJson(map, id, data) {
  if (map.getSource(id)) map.getSource(id).setData(data);
  else map.addSource(id, { type: 'geojson', data });
}

function moveToTop(map, layerId) {
  if (!map.getLayer(layerId)) return;
  try {
    map.moveLayer(layerId);
  } catch (error) {
    console.warn(`[PublishedForecastExportMap] Failed to move ${layerId}:`, error);
  }
}

function restackExportLayers(map) {
  EXPORT_LAYER_ORDER.forEach((layerId) => moveToTop(map, layerId));
}

function removeRaster(map) {
  if (map.getLayer(RASTER_LAYER_ID)) map.removeLayer(RASTER_LAYER_ID);
  if (map.getSource(RASTER_SOURCE_ID)) map.removeSource(RASTER_SOURCE_ID);
  map.__publishedExportTileUrl = '';
}

function syncRaster(map, raster, enabled) {
  if (!enabled || !raster?.tileUrl) {
    removeRaster(map);
    return;
  }

  if (map.getSource(RASTER_SOURCE_ID) && map.__publishedExportTileUrl !== raster.tileUrl) removeRaster(map);

  if (!map.getSource(RASTER_SOURCE_ID)) {
    map.addSource(RASTER_SOURCE_ID, {
      type: 'raster',
      tiles: [raster.tileUrl],
      tileSize: Number(raster.tileSize) || 256,
      scheme: raster.scheme || 'xyz',
      bounds: Array.isArray(raster.bounds) ? raster.bounds : undefined,
      attribution: raster.attribution,
    });
    map.__publishedExportTileUrl = raster.tileUrl;
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
    if (!map.getSource(COUNTRY_SOURCE_ID)) map.addSource(COUNTRY_SOURCE_ID, { type: 'vector', url: 'mapbox://mapbox.country-boundaries-v1' });

    if (!map.getLayer(COUNTRY_LAND_LAYER_ID)) {
      map.addLayer({ id: COUNTRY_LAND_LAYER_ID, type: 'fill', source: COUNTRY_SOURCE_ID, 'source-layer': 'country_boundaries', paint: { 'fill-color': isDarkMode ? '#1e293b' : '#d6d3cd', 'fill-opacity': 0.82 } });
    } else {
      map.setPaintProperty(COUNTRY_LAND_LAYER_ID, 'fill-color', isDarkMode ? '#1e293b' : '#d6d3cd');
    }

    if (!map.getLayer(COUNTRY_LINE_LAYER_ID)) {
      map.addLayer({ id: COUNTRY_LINE_LAYER_ID, type: 'line', source: COUNTRY_SOURCE_ID, 'source-layer': 'country_boundaries', paint: { 'line-color': isDarkMode ? '#94a3b8' : '#4b5563', 'line-opacity': 0.5, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 1.2] } });
    } else {
      map.setPaintProperty(COUNTRY_LINE_LAYER_ID, 'line-color', isDarkMode ? '#94a3b8' : '#4b5563');
    }
  } catch (error) {
    console.warn('[PublishedForecastExportMap] Country overlay unavailable:', error);
  }
}

function syncExportLayers(map, featureCollection, chartStyleMode) {
  if (!isMapStyleReady(map)) return false;

  const paint = getChartStyleModePaint(chartStyleMode);
  const collections = buildCollections(featureCollection);

  setGeoJson(map, FEATURE_SOURCE_ID, collections.regular);
  setGeoJson(map, LABEL_SOURCE_ID, collections.labels);

  if (!map.getLayer('published-forecast-export-polygons')) {
    map.addLayer({ id: 'published-forecast-export-polygons', type: 'fill', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'fill-color': paint.polygonFill, 'fill-opacity': paint.polygonOpacity } });
    map.addLayer({ id: 'published-forecast-export-polygons-outline', type: 'line', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'line-color': paint.polygonOutline, 'line-width': paint.polygonOutlineWidth, 'line-opacity': 0.9 } });
    map.addLayer({ id: 'published-forecast-export-lines-casing', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineCasing, 'line-width': paint.lineCasingWidth, 'line-opacity': 0.95 } });
    map.addLayer({ id: 'published-forecast-export-lines', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineColor, 'line-width': paint.lineWidth, 'line-opacity': 1 } });
    map.addLayer({ id: 'published-forecast-export-points', type: 'circle', source: FEATURE_SOURCE_ID, filter: POINT_FILTER, paint: { 'circle-color': paint.pointColor, 'circle-radius': paint.pointRadius, 'circle-opacity': paint.showPoints ? 1 : 0, 'circle-stroke-color': paint.pointStroke, 'circle-stroke-width': paint.pointStrokeWidth } });
    map.addLayer({ id: 'published-forecast-export-line-labels', type: 'symbol', source: LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': paint.lineLabelSize, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });
    map.addLayer({ id: 'published-forecast-export-labels', type: 'symbol', source: FEATURE_SOURCE_ID, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], '']], 'text-size': paint.pointLabelSize, 'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]], 'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });
  }

  if (map.getLayer('published-forecast-export-polygons')) {
    map.setPaintProperty('published-forecast-export-polygons', 'fill-color', paint.polygonFill);
    map.setPaintProperty('published-forecast-export-polygons', 'fill-opacity', paint.polygonOpacity);
  }
  if (map.getLayer('published-forecast-export-polygons-outline')) {
    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-color', paint.polygonOutline);
    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-width', paint.polygonOutlineWidth);
  }
  if (map.getLayer('published-forecast-export-lines-casing')) {
    map.setPaintProperty('published-forecast-export-lines-casing', 'line-color', paint.lineCasing);
    map.setPaintProperty('published-forecast-export-lines-casing', 'line-width', paint.lineCasingWidth);
  }
  if (map.getLayer('published-forecast-export-lines')) {
    map.setPaintProperty('published-forecast-export-lines', 'line-color', paint.lineColor);
    map.setPaintProperty('published-forecast-export-lines', 'line-width', paint.lineWidth);
  }
  if (map.getLayer('published-forecast-export-points')) {
    map.setPaintProperty('published-forecast-export-points', 'circle-color', paint.pointColor);
    map.setPaintProperty('published-forecast-export-points', 'circle-radius', paint.pointRadius);
    map.setPaintProperty('published-forecast-export-points', 'circle-stroke-color', paint.pointStroke);
    map.setPaintProperty('published-forecast-export-points', 'circle-stroke-width', paint.pointStrokeWidth);
    map.setPaintProperty('published-forecast-export-points', 'circle-opacity', paint.showPoints ? 1 : 0);
  }
  if (map.getLayer('published-forecast-export-line-labels')) {
    map.setLayoutProperty('published-forecast-export-line-labels', 'text-size', paint.lineLabelSize);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-color', paint.labelColor);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-color', paint.labelHaloColor);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-width', paint.labelHaloWidth);
  }
  if (map.getLayer('published-forecast-export-labels')) {
    map.setLayoutProperty('published-forecast-export-labels', 'text-size', paint.pointLabelSize);
    map.setPaintProperty('published-forecast-export-labels', 'text-color', paint.labelColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-color', paint.labelHaloColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-width', paint.labelHaloWidth);
    setLayerVisibility(map, 'published-forecast-export-labels', paint.showPointLabels);
  }

  restackExportLayers(map);
  renderFrontFeatures(map, collections.fronts, { namespace: 'published-forecast-export-front' });
  return true;
}

function fitExportBounds(map, bounds) {
  map.resize();
  map.fitBounds(bounds, { padding: 16, maxZoom: 6, duration: 0 });
}

const PublishedForecastExportMap = forwardRef(function PublishedForecastExportMap({ features, chartStyleMode, raster }, ref) {
  const { isDarkMode } = useTheme();
  const { bounds: mapBounds } = usePublicMapBounds();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readySignatureRef = useRef('');
  const [isReady, setIsReady] = useState(false);
  const [fetchedRaster, setFetchedRaster] = useState(null);
  const featureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);
  const hasFeatures = featureCollection.features.length > 0;
  const shouldRenderRaster = normalizedStyleMode === CHART_STYLE_MODE.WAVE_WIND;
  const resolvedRaster = raster || fetchedRaster;
  const hasRenderableContent = hasFeatures || Boolean(shouldRenderRaster && resolvedRaster?.tileUrl);
  const projectId = useMemo(() => getProjectIdFromLocation(), []);
  const theme = isDarkMode ? 'dark' : 'light';
  const renderSignature = useMemo(() => [
    projectId,
    normalizedStyleMode,
    theme,
    shouldRenderRaster ? resolvedRaster?.tileUrl || 'raster-pending' : 'no-raster',
    featureCollection.features.length,
    JSON.stringify(mapBounds),
  ].join('|'), [featureCollection.features.length, mapBounds, normalizedStyleMode, projectId, resolvedRaster?.tileUrl, shouldRenderRaster, theme]);

  const renderExport = () => {
    const map = mapRef.current;
    if (!map || !isMapStyleReady(map)) return false;

    syncRaster(map, resolvedRaster, shouldRenderRaster);
    syncCountryOverlay(map, isDarkMode);
    fitExportBounds(map, mapBounds);
    if (hasFeatures) syncExportLayers(map, featureCollection, normalizedStyleMode);
    else restackExportLayers(map);
    return true;
  };

  useEffect(() => {
    let mounted = true;
    if (raster || !projectId) return undefined;

    fetchPublicPublishedChartOutput(projectId, { theme })
      .then((data) => { if (mounted) setFetchedRaster(data?.raster || null); })
      .catch((error) => console.warn('[PublishedForecastExportMap] Failed to load export raster:', error));

    return () => { mounted = false; };
  }, [projectId, raster, theme]);

  useImperativeHandle(ref, () => ({
    getDataUrl() {
      if (!mapRef.current || !hasRenderableContent || !isReady || readySignatureRef.current !== renderSignature || !isMapStyleReady(mapRef.current)) {
        throw new Error('Map is still preparing for export. Please try again in a moment.');
      }

      return mapRef.current.getCanvas().toDataURL('image/png');
    },
    get isReady() {
      return Boolean(mapRef.current && hasRenderableContent && isReady && readySignatureRef.current === renderSignature && isMapStyleReady(mapRef.current));
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasRenderableContent) return undefined;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: 'mercator',
      center: getMapBoundsCenter(mapBounds),
      zoom: 4.8,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    mapRef.current = map;

    map.on('load', () => {
      readySignatureRef.current = '';
      setIsReady(false);
      renderExport();
    });

    map.on('idle', () => {
      if (renderExport()) {
        readySignatureRef.current = renderSignature;
        setIsReady(true);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readySignatureRef.current = '';
      setIsReady(false);
    };
    // Initialize once per mounted export map; updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRenderableContent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasRenderableContent) return undefined;

    let cancelled = false;
    readySignatureRef.current = '';
    setIsReady(false);

    const markReady = () => {
      if (cancelled) return;
      readySignatureRef.current = renderSignature;
      setIsReady(true);
    };

    if (isMapStyleReady(map) && renderExport()) map.once('idle', markReady);

    return () => {
      cancelled = true;
      map.off('idle', markReady);
    };
  }, [featureCollection, hasFeatures, hasRenderableContent, isDarkMode, mapBounds, normalizedStyleMode, renderSignature, resolvedRaster, shouldRenderRaster]);

  if (!hasRenderableContent) return null;

  return (
    <div
      aria-hidden="true"
      data-export-ready={isReady ? 'true' : 'false'}
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }} />
    </div>
  );
});

export default PublishedForecastExportMap;
