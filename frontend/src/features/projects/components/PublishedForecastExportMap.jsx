import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { CHART_STYLE_MODE, getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const TCAD_BOUNDS = [[93, 0], [153.8595159535438, 25]];
const DEFAULT_CENTER = [120.0, 15.5];
const RASTER_SOURCE_ID = 'published-export-raster-source';
const RASTER_LAYER_ID = 'published-export-raster';
const COUNTRY_SOURCE_ID = 'published-export-country-source';
const COUNTRY_LAND_LAYER_ID = 'published-export-country-land';
const COUNTRY_LINE_LAYER_ID = 'published-export-country-lines';
const FEATURE_SOURCE_ID = 'published-forecast-export-features';
const LABEL_SOURCE_ID = 'published-forecast-export-line-labels-source';
const LESS_ONE_IMAGE_ID = 'published-export-less-1';

const LINE_LABEL_TEXT = [
  'coalesce',
  ['to-string', ['get', 'labelValue']],
  ['to-string', ['get', 'waveHeight']],
  ['to-string', ['get', 'heightValue']],
  ['to-string', ['get', 'value']],
  ['to-string', ['get', 'name']],
  ['to-string', ['get', 'title']],
  ['to-string', ['get', 'label']],
  '',
];

const POINT_TYPE = ['coalesce', ['get', 'markerType'], ['get', 'type'], ''];
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];
const LINE_FILTER = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const POLYGON_FILTER = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const LESS_ONE_FILTER = ['all', POINT_FILTER, ['==', POINT_TYPE, 'less_1']];
const POINT_SYMBOL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];
const POINT_LABEL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];

const EXPORT_LAYER_ORDER = [
  COUNTRY_LAND_LAYER_ID,
  COUNTRY_LINE_LAYER_ID,
  'published-forecast-export-polygons',
  'published-forecast-export-polygons-outline',
  'published-forecast-export-lines-casing',
  'published-forecast-export-lines',
  'published-forecast-export-points',
  'published-forecast-export-less-one',
  'published-forecast-export-line-labels',
  'published-forecast-export-labels',
];

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

function buildLineLabels(featureCollection) {
  const labels = [];

  featureCollection.features.forEach((feature, featureIndex) => {
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

  return { type: 'FeatureCollection', features: labels };
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
    if (!map.getSource(COUNTRY_SOURCE_ID)) {
      map.addSource(COUNTRY_SOURCE_ID, { type: 'vector', url: 'mapbox://mapbox.country-boundaries-v1' });
    }

    if (!map.getLayer(COUNTRY_LAND_LAYER_ID)) {
      map.addLayer({
        id: COUNTRY_LAND_LAYER_ID,
        type: 'fill',
        source: COUNTRY_SOURCE_ID,
        'source-layer': 'country_boundaries',
        paint: { 'fill-color': isDarkMode ? '#1e293b' : '#d6d3cd', 'fill-opacity': 0.82 },
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
    console.warn('[PublishedForecastExportMap] Country overlay unavailable:', error);
  }
}

function ensureLessOneImage(map) {
  if (map.hasImage(LESS_ONE_IMAGE_ID)) return;
  map.loadImage('/L1.png', (error, image) => {
    if (!error && image && !map.hasImage(LESS_ONE_IMAGE_ID)) map.addImage(LESS_ONE_IMAGE_ID, image);
  });
}

function applyExportLayerPaint(map, chartStyleMode) {
  const paint = getChartStyleModePaint(chartStyleMode);

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

  if (map.getLayer('published-forecast-export-line-labels')) {
    map.setLayoutProperty('published-forecast-export-line-labels', 'text-size', paint.lineLabelSize);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-color', paint.labelColor);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-color', paint.labelHaloColor);
    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-width', paint.labelHaloWidth);
  }

  if (map.getLayer('published-forecast-export-points')) {
    map.setPaintProperty('published-forecast-export-points', 'circle-color', paint.pointColor);
    map.setPaintProperty('published-forecast-export-points', 'circle-radius', paint.pointRadius);
    map.setPaintProperty('published-forecast-export-points', 'circle-stroke-color', paint.pointStroke);
    map.setPaintProperty('published-forecast-export-points', 'circle-stroke-width', paint.pointStrokeWidth);
    map.setPaintProperty('published-forecast-export-points', 'circle-opacity', paint.showPoints ? 1 : 0);
  }

  if (map.getLayer('published-forecast-export-labels')) {
    map.setLayoutProperty('published-forecast-export-labels', 'text-size', paint.pointLabelSize);
    map.setPaintProperty('published-forecast-export-labels', 'text-color', paint.labelColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-color', paint.labelHaloColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-width', paint.labelHaloWidth);
    setLayerVisibility(map, 'published-forecast-export-labels', paint.showPointLabels);
  }
}

function syncExportLayers(map, featureCollection, chartStyleMode) {
  if (!isMapStyleReady(map)) return false;

  const paint = getChartStyleModePaint(chartStyleMode);
  const labels = buildLineLabels(featureCollection);

  if (!map.getSource(FEATURE_SOURCE_ID)) {
    map.addSource(FEATURE_SOURCE_ID, { type: 'geojson', data: featureCollection });
  } else {
    map.getSource(FEATURE_SOURCE_ID).setData(featureCollection);
  }

  if (!map.getSource(LABEL_SOURCE_ID)) {
    map.addSource(LABEL_SOURCE_ID, { type: 'geojson', data: labels });
  } else {
    map.getSource(LABEL_SOURCE_ID).setData(labels);
  }

  ensureLessOneImage(map);

  if (!map.getLayer('published-forecast-export-polygons')) {
    map.addLayer({ id: 'published-forecast-export-polygons', type: 'fill', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'fill-color': paint.polygonFill, 'fill-opacity': paint.polygonOpacity } });
    map.addLayer({ id: 'published-forecast-export-polygons-outline', type: 'line', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'line-color': paint.polygonOutline, 'line-width': paint.polygonOutlineWidth, 'line-opacity': 0.9 } });
    map.addLayer({ id: 'published-forecast-export-lines-casing', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineCasing, 'line-width': paint.lineCasingWidth, 'line-opacity': 0.95 } });
    map.addLayer({ id: 'published-forecast-export-lines', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineColor, 'line-width': paint.lineWidth, 'line-opacity': 1 } });
    map.addLayer({ id: 'published-forecast-export-points', type: 'circle', source: FEATURE_SOURCE_ID, filter: POINT_SYMBOL_FILTER, paint: { 'circle-color': paint.pointColor, 'circle-radius': paint.pointRadius, 'circle-opacity': paint.showPoints ? 1 : 0, 'circle-stroke-color': paint.pointStroke, 'circle-stroke-width': paint.pointStrokeWidth } });
    map.addLayer({ id: 'published-forecast-export-less-one', type: 'symbol', source: FEATURE_SOURCE_ID, filter: LESS_ONE_FILTER, layout: { 'icon-image': LESS_ONE_IMAGE_ID, 'icon-size': 0.28, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
    map.addLayer({ id: 'published-forecast-export-line-labels', type: 'symbol', source: LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': paint.lineLabelSize, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });
    map.addLayer({ id: 'published-forecast-export-labels', type: 'symbol', source: FEATURE_SOURCE_ID, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], '']], 'text-size': paint.pointLabelSize, 'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]], 'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'], 'text-allow-overlap': true, 'text-ignore-placement': true, 'visibility': paint.showPointLabels ? 'visible' : 'none' }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });
  }

  applyExportLayerPaint(map, chartStyleMode);
  restackExportLayers(map);
  return true;
}

function fitExportBounds(map) {
  map.resize();
  map.fitBounds(TCAD_BOUNDS, { padding: 18, maxZoom: 6, duration: 0 });
}

const PublishedForecastExportMap = forwardRef(function PublishedForecastExportMap({ features, chartStyleMode, raster, isDarkMode = false }, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const featureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);
  const hasFeatures = featureCollection.features.length > 0;
  const shouldRenderRaster = normalizedStyleMode === CHART_STYLE_MODE.WAVE_WIND;

  useImperativeHandle(ref, () => ({
    getDataUrl() {
      if (!mapRef.current || !isReady || !hasFeatures || !isMapStyleReady(mapRef.current)) {
        throw new Error('Map is still preparing for export. Please try again in a moment.');
      }

      fitExportBounds(mapRef.current);
      return mapRef.current.getCanvas().toDataURL('image/png');
    },
    isReady: Boolean(mapRef.current && isReady && hasFeatures && isMapStyleReady(mapRef.current)),
  }), [hasFeatures, isReady]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasFeatures) return undefined;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: 'mercator',
      center: DEFAULT_CENTER,
      zoom: 4.8,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    mapRef.current = map;

    const renderExport = () => {
      if (!isMapStyleReady(map)) return;
      syncRaster(map, raster, shouldRenderRaster);
      syncCountryOverlay(map, isDarkMode);
      syncExportLayers(map, featureCollection, normalizedStyleMode);
      restackExportLayers(map);
      fitExportBounds(map);
    };

    map.on('load', () => {
      renderExport();
      setIsReady(true);
    });

    map.on('idle', () => {
      if (isMapStyleReady(map)) setIsReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, [featureCollection, hasFeatures, isDarkMode, normalizedStyleMode, raster, shouldRenderRaster]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasFeatures) return undefined;

    let cancelled = false;

    const renderExport = () => {
      if (cancelled || !mapRef.current || !isMapStyleReady(map)) return;
      syncRaster(map, raster, shouldRenderRaster);
      syncCountryOverlay(map, isDarkMode);
      syncExportLayers(map, featureCollection, normalizedStyleMode);
      restackExportLayers(map);
      fitExportBounds(map);
      setIsReady(true);
    };

    if (isMapStyleReady(map)) {
      renderExport();
      return undefined;
    }

    setIsReady(false);
    map.once('idle', renderExport);

    return () => {
      cancelled = true;
    };
  }, [featureCollection, hasFeatures, isDarkMode, normalizedStyleMode, raster, shouldRenderRaster]);

  if (!hasFeatures) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: 1280,
        height: 720,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} style={{ width: 1280, height: 720 }} />
    </div>
  );
});

export default PublishedForecastExportMap;
