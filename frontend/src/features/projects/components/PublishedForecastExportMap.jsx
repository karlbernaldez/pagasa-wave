import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import usePublicMapBounds, {
  getMapBoundsCenter,
} from '@/features/projects/hooks/usePublicMapBounds';
import {
  featureStyleGet,
  getFeatureStyle,
  getLineDashArrayExpression,
} from '@/features/projects/utils/annotationStyleExpressions';
import {
  CHART_STYLE_MODE,
  getChartStyleModePaint,
  normalizeChartStyleMode,
} from '@/features/projects/utils/chartStyleModes';
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

const MARKER_ICON_IMAGES = [
  { name: 'less_1', path: '/L1.png', size: 0.32 },
  { name: 'low_pressure', path: '/LPA.png', size: 0.3 },
  { name: 'high_pressure', path: '/HPA.png', size: 0.3 },
  { name: 'typhoon', path: '/hurricane.png', size: 0.32 },
];
const MARKER_ICON_NAMES = MARKER_ICON_IMAGES.map(({ name }) => name);
const MARKER_ICON_NAME_SET = new Set(MARKER_ICON_NAMES);

const POINT_TYPE = ['coalesce', ['get', 'markerType'], ['get', 'symbolType'], ['get', 'type'], ''];
const POINT_FILTER = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];
const LINE_FILTER = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const POLYGON_FILTER = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const MARKER_ICON_FILTER = [
  'all',
  POINT_FILTER,
  ['in', POINT_TYPE, ['literal', MARKER_ICON_NAMES]],
];
const POINT_SYMBOL_FILTER = [
  'all',
  POINT_FILTER,
  ['!', ['in', POINT_TYPE, ['literal', MARKER_ICON_NAMES]]],
  ['!=', POINT_TYPE, 'text_note'],
];
const POINT_LABEL_FILTER = ['all', POINT_FILTER, ['!=', POINT_TYPE, 'less_1']];
const MARKER_ICON_IMAGE_EXPRESSION = [
  'match',
  POINT_TYPE,
  ...MARKER_ICON_IMAGES.flatMap(({ name }) => [name, name]),
  '',
];
const MARKER_ICON_SIZE_EXPRESSION = [
  'match',
  POINT_TYPE,
  ...MARKER_ICON_IMAGES.flatMap(({ name, size }) => [name, size]),
  0.3,
];
const LINE_DASHARRAY_EXPRESSION = getLineDashArrayExpression();

const EXPORT_LAYER_ORDER = [
  RASTER_LAYER_ID,
  COUNTRY_LAND_LAYER_ID,
  COUNTRY_LINE_LAYER_ID,
  'published-forecast-export-polygons',
  'published-forecast-export-polygons-outline',
  'published-forecast-export-lines-casing',
  'published-forecast-export-lines',
  'published-forecast-export-points',
  'published-forecast-export-marker-icons',
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
  if (map.getLayer(layerId))
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
}

function getLineParts(geometry) {
  if (!Array.isArray(geometry?.coordinates)) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function getLineLabel(feature) {
  const props = feature?.properties || {};
  return String(
    props.labelValue ??
      props.waveHeight ??
      props.heightValue ??
      props.height ??
      props.value ??
      props.text ??
      props.label ??
      props.name ??
      props.title ??
      feature?.name ??
      ''
  ).trim();
}

function getPointMarkerType(feature) {
  const props = feature?.properties || {};
  return String(props.markerType || props.symbolType || props.type || '').trim();
}

function collectionNeedsMarkerImages(featureCollection) {
  return featureCollection.features.some((feature) =>
    MARKER_ICON_NAME_SET.has(getPointMarkerType(feature))
  );
}

function ensureExportMarkerImages(map) {
  if (!map) return false;

  const pendingLoads = map.__publishedExportMarkerImageLoads || new Set();
  map.__publishedExportMarkerImageLoads = pendingLoads;

  let allReady = true;

  MARKER_ICON_IMAGES.forEach(({ name, path }) => {
    if (map.hasImage(name)) return;

    allReady = false;
    if (pendingLoads.has(name)) return;

    pendingLoads.add(name);
    map.loadImage(path, (error, image) => {
      pendingLoads.delete(name);

      if (error || !image) {
        console.warn(`[PublishedForecastExportMap] Failed to load marker image ${name}:`, error);
        map.fire?.('wavelab.exportImagesLoaded');
        return;
      }

      if (!map.hasImage(name)) map.addImage(name, image);
      map.fire?.('wavelab.exportImagesLoaded');
      map.triggerRepaint?.();
    });
  });

  return allReady;
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
      const closed =
        feature?.properties?.closedMode ||
        (Array.isArray(first) &&
          Array.isArray(last) &&
          first[0] === last[0] &&
          first[1] === last[1]);
      const points = closed ? [first] : [first, last];

      points.forEach((coordinates, pointIndex) =>
        labels.push({
          type: 'Feature',
          id: `${feature.id || featureIndex}-${lineIndex}-${pointIndex}`,
          geometry: { type: 'Point', coordinates },
          properties: { text, style: getFeatureStyle(feature) },
        })
      );
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

  if (map.getSource(RASTER_SOURCE_ID) && map.__publishedExportTileUrl !== raster.tileUrl)
    removeRaster(map);

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
    if (!map.getSource(COUNTRY_SOURCE_ID))
      map.addSource(COUNTRY_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

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

function syncExportLayers(map, featureCollection, chartStyleMode) {
  if (!isMapStyleReady(map)) return false;

  const paint = getChartStyleModePaint(chartStyleMode);
  const collections = buildCollections(featureCollection);
  const polygonFill = featureStyleGet('fillColor', paint.polygonFill);
  const polygonOpacity = featureStyleGet('fillOpacity', paint.polygonOpacity);
  const polygonOutline = featureStyleGet('lineColor', paint.polygonOutline);
  const polygonOutlineWidth = featureStyleGet('lineWidth', paint.polygonOutlineWidth);
  const polygonOutlineOpacity = featureStyleGet('lineOpacity', 0.9);
  const lineCasing = featureStyleGet('lineCasing', paint.lineCasing);
  const lineCasingWidth = featureStyleGet('lineCasingWidth', paint.lineCasingWidth);
  const lineColor = featureStyleGet('lineColor', paint.lineColor);
  const lineWidth = featureStyleGet('lineWidth', paint.lineWidth);
  const lineOpacity = featureStyleGet('lineOpacity', 1);
  const lineLabelSize = featureStyleGet('textSize', paint.lineLabelSize);
  const pointLabelSize = featureStyleGet('textSize', paint.pointLabelSize);
  const labelColor = featureStyleGet('textColor', paint.labelColor);
  const labelHaloColor = featureStyleGet('textHaloColor', paint.labelHaloColor);
  const labelHaloWidth = featureStyleGet('textHaloWidth', paint.labelHaloWidth);
  const labelLetterSpacing = featureStyleGet('textLetterSpacing', 0);
  const labelTransform = featureStyleGet('textTransform', 'none');

  setGeoJson(map, FEATURE_SOURCE_ID, collections.regular);
  setGeoJson(map, LABEL_SOURCE_ID, collections.labels);

  if (collectionNeedsMarkerImages(collections.regular) && !ensureExportMarkerImages(map))
    return false;

  if (!map.getLayer('published-forecast-export-polygons')) {
    map.addLayer({
      id: 'published-forecast-export-polygons',
      type: 'fill',
      source: FEATURE_SOURCE_ID,
      filter: POLYGON_FILTER,
      paint: { 'fill-color': polygonFill, 'fill-opacity': polygonOpacity },
    });
    map.addLayer({
      id: 'published-forecast-export-polygons-outline',
      type: 'line',
      source: FEATURE_SOURCE_ID,
      filter: POLYGON_FILTER,
      paint: {
        'line-color': polygonOutline,
        'line-width': polygonOutlineWidth,
        'line-opacity': polygonOutlineOpacity,
        'line-dasharray': LINE_DASHARRAY_EXPRESSION,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-lines-casing',
      type: 'line',
      source: FEATURE_SOURCE_ID,
      filter: LINE_FILTER,
      paint: {
        'line-color': lineCasing,
        'line-width': lineCasingWidth,
        'line-opacity': 0.95,
        'line-dasharray': LINE_DASHARRAY_EXPRESSION,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-lines',
      type: 'line',
      source: FEATURE_SOURCE_ID,
      filter: LINE_FILTER,
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth,
        'line-opacity': lineOpacity,
        'line-dasharray': LINE_DASHARRAY_EXPRESSION,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-points',
      type: 'circle',
      source: FEATURE_SOURCE_ID,
      filter: POINT_SYMBOL_FILTER,
      paint: {
        'circle-color': paint.pointColor,
        'circle-radius': paint.pointRadius,
        'circle-opacity': paint.showPoints ? 1 : 0,
        'circle-stroke-color': paint.pointStroke,
        'circle-stroke-width': paint.pointStrokeWidth,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-marker-icons',
      type: 'symbol',
      source: FEATURE_SOURCE_ID,
      filter: MARKER_ICON_FILTER,
      layout: {
        'icon-image': MARKER_ICON_IMAGE_EXPRESSION,
        'icon-size': MARKER_ICON_SIZE_EXPRESSION,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-line-labels',
      type: 'symbol',
      source: LABEL_SOURCE_ID,
      layout: {
        'text-field': ['get', 'text'],
        'text-size': lineLabelSize,
        'text-letter-spacing': labelLetterSpacing,
        'text-transform': labelTransform,
        'text-anchor': 'bottom',
        'text-offset': [0, 0.5],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': labelColor,
        'text-halo-color': labelHaloColor,
        'text-halo-width': labelHaloWidth,
      },
    });
    map.addLayer({
      id: 'published-forecast-export-labels',
      type: 'symbol',
      source: FEATURE_SOURCE_ID,
      filter: POINT_LABEL_FILTER,
      layout: {
        'text-field': [
          'to-string',
          [
            'coalesce',
            ['get', 'name'],
            ['get', 'title'],
            ['get', 'displayName'],
            ['get', 'label'],
            ['get', 'labelValue'],
            '',
          ],
        ],
        'text-size': pointLabelSize,
        'text-letter-spacing': labelLetterSpacing,
        'text-transform': labelTransform,
        'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]],
        'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': labelColor,
        'text-halo-color': labelHaloColor,
        'text-halo-width': labelHaloWidth,
      },
    });
  }

  if (map.getLayer('published-forecast-export-polygons')) {
    map.setPaintProperty('published-forecast-export-polygons', 'fill-color', polygonFill);
    map.setPaintProperty('published-forecast-export-polygons', 'fill-opacity', polygonOpacity);
  }
  if (map.getLayer('published-forecast-export-polygons-outline')) {
    map.setPaintProperty(
      'published-forecast-export-polygons-outline',
      'line-color',
      polygonOutline
    );
    map.setPaintProperty(
      'published-forecast-export-polygons-outline',
      'line-width',
      polygonOutlineWidth
    );
    map.setPaintProperty(
      'published-forecast-export-polygons-outline',
      'line-opacity',
      polygonOutlineOpacity
    );
    map.setPaintProperty(
      'published-forecast-export-polygons-outline',
      'line-dasharray',
      LINE_DASHARRAY_EXPRESSION
    );
  }
  if (map.getLayer('published-forecast-export-lines-casing')) {
    map.setPaintProperty('published-forecast-export-lines-casing', 'line-color', lineCasing);
    map.setPaintProperty('published-forecast-export-lines-casing', 'line-width', lineCasingWidth);
    map.setPaintProperty(
      'published-forecast-export-lines-casing',
      'line-dasharray',
      LINE_DASHARRAY_EXPRESSION
    );
  }
  if (map.getLayer('published-forecast-export-lines')) {
    map.setPaintProperty('published-forecast-export-lines', 'line-color', lineColor);
    map.setPaintProperty('published-forecast-export-lines', 'line-width', lineWidth);
    map.setPaintProperty('published-forecast-export-lines', 'line-opacity', lineOpacity);
    map.setPaintProperty(
      'published-forecast-export-lines',
      'line-dasharray',
      LINE_DASHARRAY_EXPRESSION
    );
  }
  if (map.getLayer('published-forecast-export-points')) {
    map.setPaintProperty('published-forecast-export-points', 'circle-color', paint.pointColor);
    map.setPaintProperty('published-forecast-export-points', 'circle-radius', paint.pointRadius);
    map.setPaintProperty(
      'published-forecast-export-points',
      'circle-stroke-color',
      paint.pointStroke
    );
    map.setPaintProperty(
      'published-forecast-export-points',
      'circle-stroke-width',
      paint.pointStrokeWidth
    );
    map.setPaintProperty(
      'published-forecast-export-points',
      'circle-opacity',
      paint.showPoints ? 1 : 0
    );
  }
  if (map.getLayer('published-forecast-export-marker-icons')) {
    map.setLayoutProperty(
      'published-forecast-export-marker-icons',
      'icon-image',
      MARKER_ICON_IMAGE_EXPRESSION
    );
    map.setLayoutProperty(
      'published-forecast-export-marker-icons',
      'icon-size',
      MARKER_ICON_SIZE_EXPRESSION
    );
    setLayerVisibility(map, 'published-forecast-export-marker-icons', paint.showPoints);
  }
  if (map.getLayer('published-forecast-export-line-labels')) {
    map.setLayoutProperty('published-forecast-export-line-labels', 'text-size', lineLabelSize);
    map.setLayoutProperty(
      'published-forecast-export-line-labels',
      'text-letter-spacing',
      labelLetterSpacing
    );
    map.setLayoutProperty(
      'published-forecast-export-line-labels',
      'text-transform',
      labelTransform
    );
    map.setPaintProperty('published-forecast-export-line-labels', 'text-color', labelColor);
    map.setPaintProperty(
      'published-forecast-export-line-labels',
      'text-halo-color',
      labelHaloColor
    );
    map.setPaintProperty(
      'published-forecast-export-line-labels',
      'text-halo-width',
      labelHaloWidth
    );
  }
  if (map.getLayer('published-forecast-export-labels')) {
    map.setLayoutProperty('published-forecast-export-labels', 'text-size', pointLabelSize);
    map.setLayoutProperty(
      'published-forecast-export-labels',
      'text-letter-spacing',
      labelLetterSpacing
    );
    map.setLayoutProperty('published-forecast-export-labels', 'text-transform', labelTransform);
    map.setPaintProperty('published-forecast-export-labels', 'text-color', labelColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-color', labelHaloColor);
    map.setPaintProperty('published-forecast-export-labels', 'text-halo-width', labelHaloWidth);
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

const PublishedForecastExportMap = forwardRef(function PublishedForecastExportMap(
  { features, chartStyleMode, raster },
  ref
) {
  const { isDarkMode } = useTheme();
  const { bounds: mapBounds } = usePublicMapBounds();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readySignatureRef = useRef('');
  const readyDataUrlRef = useRef('');
  const [isReady, setIsReady] = useState(false);
  const [fetchedRaster, setFetchedRaster] = useState(null);
  const featureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);
  const hasFeatures = featureCollection.features.length > 0;
  const shouldRenderRaster = normalizedStyleMode === CHART_STYLE_MODE.WAVE_WIND;
  const resolvedRaster = raster || fetchedRaster;
  const hasRenderableContent =
    hasFeatures || Boolean(shouldRenderRaster && resolvedRaster?.tileUrl);
  const projectId = useMemo(() => getProjectIdFromLocation(), []);
  const theme = isDarkMode ? 'dark' : 'light';
  const mapBoundsSignature = useMemo(() => JSON.stringify(mapBounds), [mapBounds]);
  const featureSignature = useMemo(() => JSON.stringify(featureCollection), [featureCollection]);
  const renderSignature = useMemo(
    () =>
      [
        projectId,
        normalizedStyleMode,
        theme,
        shouldRenderRaster ? resolvedRaster?.tileUrl || 'raster-pending' : 'no-raster',
        featureSignature,
        mapBoundsSignature,
      ].join('|'),
    [
      featureSignature,
      mapBoundsSignature,
      normalizedStyleMode,
      projectId,
      resolvedRaster?.tileUrl,
      shouldRenderRaster,
      theme,
    ]
  );

  const clearReadyCapture = () => {
    readySignatureRef.current = '';
    readyDataUrlRef.current = '';
    setIsReady(false);
  };

  const markReadyCapture = (signature) => {
    const map = mapRef.current;
    if (!map || !hasRenderableContent || !isMapStyleReady(map)) return false;

    readySignatureRef.current = signature;
    readyDataUrlRef.current = map.getCanvas().toDataURL('image/png');
    setIsReady(true);
    return true;
  };

  const renderExport = () => {
    const map = mapRef.current;
    if (!map || !isMapStyleReady(map)) return false;

    syncRaster(map, resolvedRaster, shouldRenderRaster);
    syncCountryOverlay(map, isDarkMode);
    fitExportBounds(map, mapBounds);
    if (hasFeatures) return syncExportLayers(map, featureCollection, normalizedStyleMode);
    restackExportLayers(map);
    return true;
  };

  useEffect(() => {
    let mounted = true;
    if (raster || !projectId) return undefined;

    fetchPublicPublishedChartOutput(projectId, { theme })
      .then((data) => {
        if (mounted) setFetchedRaster(data?.raster || null);
      })
      .catch((error) =>
        console.warn('[PublishedForecastExportMap] Failed to load export raster:', error)
      );

    return () => {
      mounted = false;
    };
  }, [projectId, raster, theme]);

  useImperativeHandle(ref, () => ({
    getDataUrl() {
      if (
        !mapRef.current ||
        !hasRenderableContent ||
        readySignatureRef.current !== renderSignature ||
        !readyDataUrlRef.current ||
        !isMapStyleReady(mapRef.current)
      ) {
        throw new Error('Map is still preparing for export. Please try again in a moment.');
      }

      return readyDataUrlRef.current;
    },
    get isReady() {
      return Boolean(
        mapRef.current &&
        hasRenderableContent &&
        readySignatureRef.current === renderSignature &&
        readyDataUrlRef.current &&
        isMapStyleReady(mapRef.current)
      );
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

    return () => {
      map.remove();
      mapRef.current = null;
      readySignatureRef.current = '';
      readyDataUrlRef.current = '';
      setIsReady(false);
    };
    // Initialize once per mounted export map; updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRenderableContent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasRenderableContent) return undefined;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    let retryTimer = 0;
    const signature = renderSignature;
    clearReadyCapture();

    const captureAfterPaint = () => {
      if (cancelled) return;
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (!cancelled) markReadyCapture(signature);
        });
      });
    };

    const renderWhenReady = () => {
      if (cancelled) return;
      if (!renderExport()) {
        retryTimer = window.setTimeout(renderWhenReady, 120);
        return;
      }
      if (map.loaded()) captureAfterPaint();
      else map.once('idle', captureAfterPaint);
    };

    if (isMapStyleReady(map)) renderWhenReady();
    else map.once('load', renderWhenReady);
    map.on('wavelab.exportImagesLoaded', renderWhenReady);

    return () => {
      cancelled = true;
      map.off('load', renderWhenReady);
      map.off('idle', captureAfterPaint);
      map.off('wavelab.exportImagesLoaded', renderWhenReady);
      if (retryTimer) window.clearTimeout(retryTimer);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
    // renderSignature is the stable value-level dependency for all render inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRenderableContent, renderSignature]);

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
