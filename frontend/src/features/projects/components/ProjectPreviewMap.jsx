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
const PREVIEW_MARKER_ICON_ID = 'project-preview-warning-symbol';
const PREVIEW_MARKER_SIZE = {
  width: 72,
  height: 72,
};

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

function createPreviewMarkerImageData() {
  const canvas = document.createElement('canvas');
  canvas.width = PREVIEW_MARKER_SIZE.width;
  canvas.height = PREVIEW_MARKER_SIZE.height;

  const ctx = canvas.getContext('2d');
  const center = 36;

  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(center, 5);
  ctx.lineTo(67, center);
  ctx.lineTo(center, 67);
  ctx.lineTo(5, center);
  ctx.closePath();
  ctx.fillStyle = '#f97316';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center, 14);
  ctx.lineTo(58, center);
  ctx.lineTo(center, 58);
  ctx.lineTo(14, center);
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0284c7';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center, 22);
  ctx.lineTo(center, 39);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, 47, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  const imageData = ctx.getImageData(0, 0, PREVIEW_MARKER_SIZE.width, PREVIEW_MARKER_SIZE.height);

  return {
    width: PREVIEW_MARKER_SIZE.width,
    height: PREVIEW_MARKER_SIZE.height,
    data: imageData.data,
  };
}

function ensurePreviewMarkerIcon(map) {
  if (map.hasImage(PREVIEW_MARKER_ICON_ID)) return;
  map.addImage(PREVIEW_MARKER_ICON_ID, createPreviewMarkerImageData(), { pixelRatio: 2 });
}

function addPreviewLayers(map, featureCollection) {
  const sourceId = 'project-preview-features';

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(featureCollection);
    return;
  }

  ensurePreviewMarkerIcon(map);

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
      'fill-color': '#38bdf8',
      'fill-opacity': 0.36,
    },
  });

  map.addLayer({
    id: 'project-preview-polygons-outline',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color': '#0f172a',
      'line-width': 2.5,
      'line-opacity': 0.9,
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
      'line-color': '#0284c7',
      'line-width': 4,
      'line-opacity': 1,
    },
  });

  map.addLayer({
    id: 'project-preview-points-symbol',
    type: 'symbol',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    layout: {
      'icon-image': PREVIEW_MARKER_ICON_ID,
      'icon-size': 0.46,
      'icon-anchor': 'center',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });

  map.addLayer({
    id: 'project-preview-points-label',
    type: 'symbol',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    layout: {
      'text-field': ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], 'Marker'],
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
  return feature.id || feature._id || feature.properties?.id || feature.properties?.sourceId || feature.properties?.name || '';
}

function getFeatureRenderKey(featureCollection) {
  return JSON.stringify(
    featureCollection.features.map((feature) => ({
      geometry: feature.geometry,
      id: getFeatureIdentity(feature),
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
    if (hasProvidedFeatures) {
      return providedFeatureCollection;
    }

    return normalizeFeatureCollection(remoteFeatures);
  }, [hasProvidedFeatures, providedFeatureCollection, remoteFeatures]);

  const hasFeatures = featureCollection.features.length > 0;
  const featureKey = useMemo(() => getFeatureRenderKey(featureCollection), [featureCollection]);
  const shouldRenderMap = isNearViewport && hasFeatures;
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
    const map = mapRef.current;
    if (!map || !isReady || !hasFeatures) return;

    addPreviewLayers(map, featureCollection);

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
  }, [featureCollection, featureKey, hasFeatures, isReady]);

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
