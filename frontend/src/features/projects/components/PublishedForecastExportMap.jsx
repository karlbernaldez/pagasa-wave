import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

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

function addExportLayers(map, featureCollection) {
  const sourceId = 'published-forecast-export-features';

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(featureCollection);
    return;
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: featureCollection,
  });

  map.addLayer({
    id: 'published-forecast-export-polygons',
    type: 'fill',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'fill-color': '#38bdf8',
      'fill-opacity': 0.36,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-polygons-outline',
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
    id: 'published-forecast-export-lines-casing',
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
    id: 'published-forecast-export-lines',
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
    id: 'published-forecast-export-points',
    type: 'circle',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color': '#f97316',
      'circle-radius': 8,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-labels',
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

const PublishedForecastExportMap = forwardRef(function PublishedForecastExportMap({ features }, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const featureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const hasFeatures = featureCollection.features.length > 0;

  useImperativeHandle(ref, () => ({
    getDataUrl() {
      if (!mapRef.current || !isReady || !hasFeatures) {
        throw new Error('Map is still preparing for export. Please try again in a moment.');
      }

      return mapRef.current.getCanvas().toDataURL('image/png');
    },
    isReady: Boolean(mapRef.current && isReady && hasFeatures),
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

    map.on('load', () => {
      map.resize();
      map.fitBounds(DEFAULT_BOUNDS, {
        padding: 18,
        maxZoom: 6,
        duration: 0,
      });
      addExportLayers(map, featureCollection);

      const bounds = getFeatureBounds(featureCollection);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: 72,
          maxZoom: featureCollection.features.length === 1 ? 8 : 10,
          duration: 0,
        });
      }
    });

    map.on('idle', () => {
      setIsReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, [featureCollection, hasFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !hasFeatures) return;

    addExportLayers(map, featureCollection);
    const bounds = getFeatureBounds(featureCollection);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: featureCollection.features.length === 1 ? 8 : 10,
        duration: 0,
      });
    }
  }, [featureCollection, hasFeatures, isReady]);

  if (!hasFeatures) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: 1280,
        height: 820,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} style={{ width: 1280, height: 820 }} />
    </div>
  );
});

export default PublishedForecastExportMap;
