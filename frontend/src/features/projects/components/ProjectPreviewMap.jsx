import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { fetchFeatures, fetchProjectFeatureCollection } from '@/api/featureServices';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_CENTER = [120.0, 15.5];
const DEFAULT_BOUNDS = [
  [93, 5],
  [153.8595159535438, 25],
];
const FEATURE_CACHE_LIMIT = 80;
const FEATURE_CACHE_TTL_MS = 30_000;

const DIFF_COLOR_EXPRESSION = [
  'match',
  ['get', 'diffStatus'],
  'added', '#22c55e',
  'changed', '#f97316',
  'removed', '#ef4444',
  'unchanged', '#64748b',
  '#0284c7',
];

const DIFF_FILL_OPACITY_EXPRESSION = [
  'match',
  ['get', 'diffStatus'],
  'unchanged', 0.2,
  0.42,
];

const DIFF_LINE_OPACITY_EXPRESSION = [
  'match',
  ['get', 'diffStatus'],
  'unchanged', 0.62,
  1,
];

const PREVIEW_MARKER_IMAGES = [
  { id: 'preview-marker-typhoon', path: '/hurricane.png' },
  { id: 'preview-marker-low-pressure', path: '/LPA.png' },
  { id: 'preview-marker-high-pressure', path: '/HPA.png' },
  { id: 'preview-marker-less-1', path: '/L1.png' },
];

const MARKER_TYPE_TO_ICON = {
  typhoon: 'preview-marker-typhoon',
  low_pressure: 'preview-marker-low-pressure',
  high_pressure: 'preview-marker-high-pressure',
  less_1: 'preview-marker-less-1',
};

const MARKER_TYPE_ALIASES = {
  typhoon: 'typhoon',
  hurricane: 'typhoon',
  storm: 'typhoon',
  tropical_cyclone: 'typhoon',
  tropicalcyclone: 'typhoon',
  'tropical cyclone': 'typhoon',
  low_pressure: 'low_pressure',
  lowpressure: 'low_pressure',
  'low pressure': 'low_pressure',
  'low-pressure': 'low_pressure',
  lpa: 'low_pressure',
  high_pressure: 'high_pressure',
  highpressure: 'high_pressure',
  'high pressure': 'high_pressure',
  'high-pressure': 'high_pressure',
  hpa: 'high_pressure',
  less_1: 'less_1',
  less1: 'less_1',
  less_than_1m: 'less_1',
  'less-than-1m': 'less_1',
  lessthan1m: 'less_1',
  'less than 1m': 'less_1',
  'less than 1 meter': 'less_1',
  low_waves: 'less_1',
  'low waves': 'less_1',
};

const MARKER_TYPE_EXPRESSION = [
  'downcase',
  [
    'to-string',
    [
      'coalesce',
      ['get', 'markerType'],
      ['get', 'symbolType'],
      ['get', 'type'],
      ['get', 'icon'],
      ['get', 'title'],
      ['get', 'name'],
      '',
    ],
  ],
];

const PREVIEW_MARKER_ICON_EXPRESSION = [
  'match',
  MARKER_TYPE_EXPRESSION,
  'typhoon', MARKER_TYPE_TO_ICON.typhoon,
  'hurricane', MARKER_TYPE_TO_ICON.typhoon,
  'storm', MARKER_TYPE_TO_ICON.typhoon,
  'tropical_cyclone', MARKER_TYPE_TO_ICON.typhoon,
  'tropical cyclone', MARKER_TYPE_TO_ICON.typhoon,
  'low_pressure', MARKER_TYPE_TO_ICON.low_pressure,
  'low pressure', MARKER_TYPE_TO_ICON.low_pressure,
  'low-pressure', MARKER_TYPE_TO_ICON.low_pressure,
  'lpa', MARKER_TYPE_TO_ICON.low_pressure,
  'high_pressure', MARKER_TYPE_TO_ICON.high_pressure,
  'high pressure', MARKER_TYPE_TO_ICON.high_pressure,
  'high-pressure', MARKER_TYPE_TO_ICON.high_pressure,
  'hpa', MARKER_TYPE_TO_ICON.high_pressure,
  'less_1', MARKER_TYPE_TO_ICON.less_1,
  'less than 1m', MARKER_TYPE_TO_ICON.less_1,
  'less-than-1m', MARKER_TYPE_TO_ICON.less_1,
  'less than 1 meter', MARKER_TYPE_TO_ICON.less_1,
  'low waves', MARKER_TYPE_TO_ICON.less_1,
  MARKER_TYPE_TO_ICON.typhoon,
];

const PREVIEW_MARKER_SIZE_EXPRESSION = [
  'match',
  MARKER_TYPE_EXPRESSION,
  'typhoon', 0.02,
  'less_1', 0.2,
  'low_pressure', 0.015,
  'high_pressure', 0.015,
  0.02,
];

const featureCache = new Map();
const featureRequestCache = new Map();

function getFeatureCacheKey(projectId, scope) {
  return `${scope || 'user'}:${projectId || 'none'}`;
}

function setCachedFeatures(key, value) {
  if (!key) return;

  featureCache.set(key, {
    value,
    cachedAt: Date.now(),
  });

  if (featureCache.size > FEATURE_CACHE_LIMIT) {
    const oldestKey = featureCache.keys().next().value;
    if (oldestKey) featureCache.delete(oldestKey);
  }
}

function getCachedFeatures(key) {
  if (!key || !featureCache.has(key)) return null;

  const entry = featureCache.get(key);

  if (!entry || Date.now() - entry.cachedAt > FEATURE_CACHE_TTL_MS) {
    featureCache.delete(key);
    return null;
  }

  featureCache.delete(key);
  featureCache.set(key, entry);

  return entry.value;
}

function normalizeMarkerType(value) {
  const direct = String(value || '')
    .trim()
    .toLowerCase();
  const normalized = direct.replace(/[\s-]+/g, '_');

  return MARKER_TYPE_ALIASES[direct] || MARKER_TYPE_ALIASES[normalized] || normalized || 'typhoon';
}

function getFeatureMarkerType(feature) {
  const properties = feature?.properties || {};
  return normalizeMarkerType(
    properties.markerType ||
    properties.symbolType ||
    properties.type ||
    properties.icon ||
    properties.title ||
    properties.name
  );
}

function withNormalizedMarkerProperties(featureCollection) {
  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => {
      if (!['Point', 'MultiPoint'].includes(feature?.geometry?.type)) return feature;

      const markerType = getFeatureMarkerType(feature);
      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          markerType,
          symbolType: markerType,
          previewMarkerIcon: MARKER_TYPE_TO_ICON[markerType] || MARKER_TYPE_TO_ICON.typhoon,
        },
      };
    }),
  };
}

function hasDiffStyles(featureCollection) {
  return featureCollection.features.some((feature) => Boolean(feature?.properties?.diffStatus));
}

function extendBoundsFromCoordinates(bounds, coordinates) {
  if (!Array.isArray(coordinates)) return;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    bounds.extend(coordinates);
    return;
  }

  coordinates.forEach((child) => extendBoundsFromCoordinates(bounds, child));
}

function getFeatureBounds(featureCollection) {
  const bounds = new mapboxgl.LngLatBounds();

  featureCollection.features.forEach((feature) => {
    extendBoundsFromCoordinates(bounds, feature?.geometry?.coordinates);
  });

  return bounds.isEmpty() ? null : bounds;
}

function loadPreviewMarkerImage(map, marker) {
  if (map.hasImage(marker.id)) return Promise.resolve(true);

  return new Promise((resolve) => {
    map.loadImage(marker.path, (error, image) => {
      if (error || !image) {
        console.error(`[ProjectPreviewMap] Failed to load ${marker.path}:`, error);
        resolve(false);
        return;
      }

      if (!map.hasImage(marker.id)) {
        map.addImage(marker.id, image);
      }

      resolve(true);
    });
  });
}

function ensurePreviewMarkerIcons(map) {
  return Promise.all(PREVIEW_MARKER_IMAGES.map((marker) => loadPreviewMarkerImage(map, marker)));
}

function setPreviewLayerPaint(map, useDiffStyles) {
  const polygonColor = useDiffStyles ? DIFF_COLOR_EXPRESSION : '#38bdf8';
  const lineColor = useDiffStyles ? DIFF_COLOR_EXPRESSION : '#0284c7';
  const opacity = useDiffStyles ? DIFF_LINE_OPACITY_EXPRESSION : 1;

  if (map.getLayer('project-preview-polygons')) {
    map.setPaintProperty('project-preview-polygons', 'fill-color', polygonColor);
    map.setPaintProperty('project-preview-polygons', 'fill-opacity', useDiffStyles ? DIFF_FILL_OPACITY_EXPRESSION : 0.36);
  }

  if (map.getLayer('project-preview-polygons-outline')) {
    map.setPaintProperty('project-preview-polygons-outline', 'line-color', lineColor);
    map.setPaintProperty('project-preview-polygons-outline', 'line-opacity', opacity);
  }

  if (map.getLayer('project-preview-lines')) {
    map.setPaintProperty('project-preview-lines', 'line-color', lineColor);
    map.setPaintProperty('project-preview-lines', 'line-opacity', opacity);
  }

  if (map.getLayer('project-preview-points-diff-halo')) {
    map.setPaintProperty('project-preview-points-diff-halo', 'circle-color', useDiffStyles ? DIFF_COLOR_EXPRESSION : '#f97316');
    map.setPaintProperty('project-preview-points-diff-halo', 'circle-opacity', useDiffStyles ? DIFF_LINE_OPACITY_EXPRESSION : 0.28);
  }
}

function addPreviewLayers(map, featureCollection, { showLabels = true, showDiffStyles = false } = {}) {
  const sourceId = 'project-preview-features';

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(featureCollection);
    setPreviewLayerPaint(map, showDiffStyles);

    if (map.getLayer('project-preview-points-label')) {
      map.setLayoutProperty('project-preview-points-label', 'visibility', showLabels ? 'visible' : 'none');
    }

    return;
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: featureCollection,
  });

  map.addLayer({
    id: 'project-preview-polygons',
    type: 'fill',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'fill-color': showDiffStyles ? DIFF_COLOR_EXPRESSION : '#38bdf8',
      'fill-opacity': showDiffStyles ? DIFF_FILL_OPACITY_EXPRESSION : 0.36,
    },
  });

  map.addLayer({
    id: 'project-preview-polygons-outline',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color': showDiffStyles ? DIFF_COLOR_EXPRESSION : '#0f172a',
      'line-width': 2.5,
      'line-opacity': showDiffStyles ? DIFF_LINE_OPACITY_EXPRESSION : 0.9,
    },
  });

  map.addLayer({
    id: 'project-preview-lines-casing',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': '#ffffff',
      'line-width': 8,
      'line-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'project-preview-lines',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': showDiffStyles ? DIFF_COLOR_EXPRESSION : '#0284c7',
      'line-width': 4,
      'line-opacity': showDiffStyles ? DIFF_LINE_OPACITY_EXPRESSION : 1,
    },
  });

  map.addLayer({
    id: 'project-preview-points-diff-halo',
    type: 'circle',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color': showDiffStyles ? DIFF_COLOR_EXPRESSION : '#f97316',
      'circle-radius': showDiffStyles ? 15 : 11,
      'circle-opacity': showDiffStyles ? DIFF_LINE_OPACITY_EXPRESSION : 0.28,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': showDiffStyles ? 2 : 0,
    },
  });

  if (map.hasImage('preview-marker-typhoon')) {
    map.addLayer({
      id: 'project-preview-points-symbol',
      type: 'symbol',
      source: sourceId,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      layout: {
        'icon-image': ['coalesce', ['get', 'previewMarkerIcon'], PREVIEW_MARKER_ICON_EXPRESSION],
        'icon-size': PREVIEW_MARKER_SIZE_EXPRESSION,
        'icon-anchor': 'center',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
  } else {
    map.addLayer({
      id: 'project-preview-points-symbol',
      type: 'circle',
      source: sourceId,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      paint: {
        'circle-color': showDiffStyles ? DIFF_COLOR_EXPRESSION : '#f97316',
        'circle-radius': 8,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    });
  }

  if (showLabels) {
    map.addLayer({
      id: 'project-preview-points-label',
      type: 'symbol',
      source: sourceId,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], 'Marker'],
        'text-size': 12,
        'text-offset': [0, 1.8],
        'text-anchor': 'top',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#0f172a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });
  }
}

async function loadProjectFeatures(projectId, scope) {
  if (!projectId) return null;

  if (scope === 'admin') {
    return fetchProjectFeatureCollection(projectId);
  }

  return fetchFeatures(projectId);
}

async function loadProjectFeaturesCached(projectId, scope) {
  const key = getFeatureCacheKey(projectId, scope);
  const cached = getCachedFeatures(key);

  if (cached) return cached;

  if (featureRequestCache.has(key)) {
    return featureRequestCache.get(key);
  }

  const request = loadProjectFeatures(projectId, scope)
    .then((data) => {
      setCachedFeatures(key, data);
      return data;
    })
    .finally(() => {
      featureRequestCache.delete(key);
    });

  featureRequestCache.set(key, request);
  return request;
}

function useNearViewport(rootMargin = '500px', disabled = false) {
  const targetRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setIsNearViewport(true);
      return undefined;
    }

    const target = targetRef.current;
    if (!target || isNearViewport) return undefined;

    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [disabled, isNearViewport, rootMargin]);

  return [targetRef, isNearViewport];
}

function getFeatureIdentity(feature) {
  return feature.id || feature._id || feature.properties?.stableId || feature.properties?.annotationId || feature.properties?.id || feature.properties?.sourceId || feature.properties?.name || '';
}

function getFeatureRenderKey(featureCollection) {
  return JSON.stringify(
    featureCollection.features.map((feature) => ({
      geometry: feature.geometry,
      id: getFeatureIdentity(feature),
      markerType: feature.properties?.markerType,
      diffStatus: feature.properties?.diffStatus,
    }))
  );
}

function PreviewPlaceholder({ isDarkMode, label, loading = false }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center text-xs font-semibold backdrop-blur-[1px] ${
      isDarkMode ? 'bg-slate-950/55 text-slate-400' : 'bg-white/55 text-slate-500'
    }`}>
      {loading ? 'Loading annotations…' : label}
    </div>
  );
}

function ProjectPreviewMap({
  projectId,
  features,
  featureScope = 'user',
  className = '',
  height = 180,
  isDarkMode = false,
  emptyLabel = 'No annotations yet',
  lazy = true,
  showLabels = true,
  showDiffStyles = false,
}) {
  const [viewportRef, isNearViewport] = useNearViewport('500px', !lazy);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const fittedFeaturesKeyRef = useRef('');
  const [isReady, setIsReady] = useState(false);
  const [remoteFeatures, setRemoteFeatures] = useState(() => {
    if (!projectId) return null;
    return getCachedFeatures(getFeatureCacheKey(projectId, featureScope));
  });
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);

  const providedFeatureCollection = useMemo(
    () => normalizeFeatureCollection(features),
    [features]
  );

  const hasProvidedFeatures = providedFeatureCollection.features.length > 0;
  const featureCacheKey = useMemo(
    () => getFeatureCacheKey(projectId, featureScope),
    [featureScope, projectId]
  );

  useEffect(() => {
    if (hasProvidedFeatures || !projectId) {
      setRemoteFeatures(null);
      return;
    }

    const cached = getCachedFeatures(featureCacheKey);
    if (cached) setRemoteFeatures(cached);
  }, [featureCacheKey, hasProvidedFeatures, projectId]);

  const shouldFetchFeatures = isNearViewport && Boolean(projectId) && !hasProvidedFeatures && !remoteFeatures;

  useEffect(() => {
    let isMounted = true;

    if (!shouldFetchFeatures) {
      if (isNearViewport) setIsLoadingFeatures(false);
      return undefined;
    }

    setIsLoadingFeatures(true);

    loadProjectFeaturesCached(projectId, featureScope)
      .then((data) => {
        if (!isMounted) return;
        setRemoteFeatures(data);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('[ProjectPreviewMap] Failed to load project features:', error);
        setRemoteFeatures(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingFeatures(false);
      });

    return () => {
      isMounted = false;
    };
  }, [featureScope, isNearViewport, projectId, shouldFetchFeatures]);

  const featureCollection = useMemo(() => {
    const normalized = hasProvidedFeatures
      ? providedFeatureCollection
      : normalizeFeatureCollection(remoteFeatures);

    return withNormalizedMarkerProperties(normalized);
  }, [hasProvidedFeatures, providedFeatureCollection, remoteFeatures]);

  const hasFeatures = featureCollection.features.length > 0;
  const featureKey = useMemo(() => getFeatureRenderKey(featureCollection), [featureCollection]);
  const shouldRenderMap = isNearViewport && hasFeatures;
  const shouldUseDiffStyles = showDiffStyles || hasDiffStyles(featureCollection);
  const containerStyle = height == null ? undefined : { height };

  useEffect(() => {
    if (!shouldRenderMap || !containerRef.current || mapRef.current) return undefined;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: 'mercator',
      center: DEFAULT_CENTER,
      zoom: 4.8,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: false,
      fadeDuration: 0,
    });

    mapRef.current = map;

    map.on('load', () => {
      setIsReady(true);
      map.resize();
      map.fitBounds(DEFAULT_BOUNDS, {
        padding: 18,
        maxZoom: 6,
        duration: 0,
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      fittedFeaturesKeyRef.current = '';
      setIsReady(false);
    };
  }, [shouldRenderMap]);

  useEffect(() => {
    if (shouldRenderMap || !mapRef.current) return;

    mapRef.current.remove();
    mapRef.current = null;
    fittedFeaturesKeyRef.current = '';
    setIsReady(false);
  }, [shouldRenderMap]);

  useEffect(() => {
    let isMounted = true;
    const map = mapRef.current;
    if (!map || !isReady || !hasFeatures) return undefined;

    ensurePreviewMarkerIcons(map).then(() => {
      if (!isMounted || !mapRef.current) return;
      addPreviewLayers(map, featureCollection, { showLabels, showDiffStyles: shouldUseDiffStyles });

      if (fittedFeaturesKeyRef.current === featureKey) return;

      const bounds = getFeatureBounds(featureCollection);

      if (bounds) {
        map.fitBounds(bounds, {
          padding: 72,
          maxZoom: featureCollection.features.length === 1 ? 8 : 10,
          duration: 0,
        });
        fittedFeaturesKeyRef.current = featureKey;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [featureCollection, featureKey, hasFeatures, isReady, shouldUseDiffStyles, showLabels]);

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden rounded-xl border transition-colors ${
        isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-100'
      } ${className}`}
      style={containerStyle}
    >
      {shouldRenderMap ? (
        <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
      ) : (
        <div className={`h-full w-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`} aria-hidden="true" />
      )}

      {!isNearViewport && (
        <div className={`h-full w-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} aria-hidden="true" />
      )}

      {isNearViewport && !hasFeatures && !isLoadingFeatures && (
        <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} />
      )}

      {isLoadingFeatures && (
        <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} loading />
      )}

      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t ${isDarkMode ? 'from-slate-950/80' : 'from-white/80'} to-transparent`} />
    </div>
  );
}

export default memo(ProjectPreviewMap);
