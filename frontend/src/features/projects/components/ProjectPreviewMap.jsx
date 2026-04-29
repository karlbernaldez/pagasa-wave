import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';

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

function addPreviewLayers(map, featureCollection) {
  const sourceId = 'project-preview-features';

  if (map.getLayer('project-preview-points')) map.removeLayer('project-preview-points');
  if (map.getLayer('project-preview-lines')) map.removeLayer('project-preview-lines');
  if (map.getLayer('project-preview-polygons')) map.removeLayer('project-preview-polygons');
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, {
    type: 'geojson',
    data: featureCollection,
  });

  map.addLayer({
    id: 'project-preview-polygons',
    type: 'fill',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    paint: {
      'fill-color': '#0ea5e9',
      'fill-opacity': 0.22,
    },
  });

  map.addLayer({
    id: 'project-preview-lines',
    type: 'line',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
    paint: {
      'line-color': '#0284c7',
      'line-width': 2,
      'line-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'project-preview-points',
    type: 'circle',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
    paint: {
      'circle-color': '#f97316',
      'circle-radius': 4,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.95,
    },
  });
}

export default function ProjectPreviewMap({
  features,
  className = '',
  height = 180,
  isDarkMode = false,
  emptyLabel = 'No annotations yet',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const featureCollection = useMemo(
    () => normalizeFeatureCollection(features),
    [features]
  );
  const hasFeatures = featureCollection.features.length > 0;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: 'mercator',
      center: DEFAULT_CENTER,
      zoom: 4.8,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: false,
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
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    if (!hasFeatures) {
      if (map.getLayer('project-preview-points')) map.removeLayer('project-preview-points');
      if (map.getLayer('project-preview-lines')) map.removeLayer('project-preview-lines');
      if (map.getLayer('project-preview-polygons')) map.removeLayer('project-preview-polygons');
      if (map.getSource('project-preview-features')) map.removeSource('project-preview-features');
      map.fitBounds(DEFAULT_BOUNDS, { padding: 18, maxZoom: 6, duration: 0 });
      return;
    }

    addPreviewLayers(map, featureCollection);

    const bounds = getFeatureBounds(featureCollection);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 28,
        maxZoom: 10,
        duration: 0,
      });
    }
  }, [featureCollection, hasFeatures, isReady]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />

      {!hasFeatures && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 text-xs font-semibold text-slate-500 backdrop-blur-[1px]">
          {emptyLabel}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/80 to-transparent" />
    </div>
  );
}
