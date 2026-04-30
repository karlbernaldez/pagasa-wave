import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';

import { fetchFeatures, fetchProjectFeatureCollection } from '@/api/featureServices';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_CENTER = [120.0, 15.5];
const DEFAULT_BOUNDS = [
  [93, 5],
  [153.8595159535438, 25],
];

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

function getPrimaryCoordinate(featureCollection) {
  let coordinate = null;

  const visit = (coordinates) => {
    if (coordinate || !Array.isArray(coordinates)) return;

    if (
      coordinates.length >= 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      coordinate = coordinates;
      return;
    }

    coordinates.forEach(visit);
  };

  featureCollection.features.forEach((feature) => visit(feature?.geometry?.coordinates));

  return coordinate;
}

function removePreviewLayers(map) {
  [
    'project-preview-points-label',
    'project-preview-points-core',
    'project-preview-points-halo',
    'project-preview-lines-casing',
    'project-preview-lines',
    'project-preview-polygons-outline',
    'project-preview-polygons',
  ].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });

  if (map.getSource('project-preview-features')) map.removeSource('project-preview-features');
}

function addPreviewLayers(map, featureCollection) {
  const sourceId = 'project-preview-features';

  removePreviewLayers(map);

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
    id: 'project-preview-points-halo',
    type: 'circle',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color': '#ffffff',
      'circle-radius': 13,
      'circle-opacity': 0.95,
      'circle-stroke-color': '#0284c7',
      'circle-stroke-width': 3,
    },
  });

  map.addLayer({
    id: 'project-preview-points-core',
    type: 'circle',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color': '#f97316',
      'circle-radius': 7,
      'circle-stroke-color': '#0f172a',
      'circle-stroke-width': 2,
      'circle-opacity': 1,
    },
  });

  map.addLayer({
    id: 'project-preview-points-label',
    type: 'symbol',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    layout: {
      'text-field': ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], 'Annotation'],
      'text-size': 12,
      'text-offset': [0, 1.6],
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

function useNearViewport(rootMargin = '400px') {
  const targetRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
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
  }, [isNearViewport, rootMargin]);

  return [targetRef, isNearViewport];
}

export default function ProjectPreviewMap({
  projectId,
  features,
  featureScope = 'user',
  className = '',
  height = 180,
  isDarkMode = false,
  emptyLabel = 'No annotations yet',
  onFeatureCollectionLoad,
}) {
  const [viewportRef, isNearViewport] = useNearViewport();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [remoteFeatures, setRemoteFeatures] = useState(null);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);

  const providedFeatureCollection = useMemo(
    () => normalizeFeatureCollection(features),
    [features]
  );

  const shouldFetchFeatures = isNearViewport && Boolean(projectId) && providedFeatureCollection.features.length === 0;

  useEffect(() => {
    let isMounted = true;

    if (!shouldFetchFeatures) {
      if (!isNearViewport) return undefined;
      setRemoteFeatures(null);
      setIsLoadingFeatures(false);
      return undefined;
    }

    setIsLoadingFeatures(true);

    loadProjectFeatures(projectId, featureScope)
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
    if (providedFeatureCollection.features.length > 0) {
      return providedFeatureCollection;
    }

    return normalizeFeatureCollection(remoteFeatures);
  }, [providedFeatureCollection, remoteFeatures]);

  const hasFeatures = featureCollection.features.length > 0;

  useEffect(() => {
    if (!isNearViewport) return;
    onFeatureCollectionLoad?.(featureCollection);
  }, [featureCollection, isNearViewport, onFeatureCollectionLoad]);

  useEffect(() => {
    if (!isNearViewport || !containerRef.current || mapRef.current) return undefined;

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
      setIsReady(false);
    };
  }, [isNearViewport]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    if (!hasFeatures) {
      removePreviewLayers(map);
      map.fitBounds(DEFAULT_BOUNDS, { padding: 18, maxZoom: 6, duration: 0 });
      return;
    }

    addPreviewLayers(map, featureCollection);

    const bounds = getFeatureBounds(featureCollection);
    const primaryCoordinate = getPrimaryCoordinate(featureCollection);

    if (bounds) {
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: featureCollection.features.length === 1 ? 8 : 10,
        duration: 0,
      });
    } else if (primaryCoordinate) {
      map.flyTo({ center: primaryCoordinate, zoom: 7, duration: 0 });
    }
  }, [featureCollection, hasFeatures, isReady]);

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}
      style={{ height }}
    >
      {isNearViewport ? (
        <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
      ) : (
        <div className="h-full w-full animate-pulse bg-slate-200" aria-hidden="true" />
      )}

      {!hasFeatures && !isLoadingFeatures && isNearViewport && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 text-xs font-semibold text-slate-500 backdrop-blur-[1px]">
          {emptyLabel}
        </div>
      )}

      {isLoadingFeatures && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 text-xs font-semibold text-slate-500 backdrop-blur-[1px]">
          Loading annotations…
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/80 to-transparent" />
    </div>
  );
}
