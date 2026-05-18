import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_CENTER = [120.0, 15.5];
const DEFAULT_BOUNDS = [
  [93, 5],
  [153.8595159535438, 25],
];

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

function setLayerVisibility(map, layerId, isVisible) {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
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

function addExportLayers(map, featureCollection, chartStyleMode) {
  const sourceId = 'published-forecast-export-features';
  const paint = getChartStyleModePaint(chartStyleMode);

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(featureCollection);
    applyExportLayerPaint(map, chartStyleMode);
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
      'fill-color': paint.polygonFill,
      'fill-opacity': paint.polygonOpacity,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-polygons-outline',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color': paint.polygonOutline,
      'line-width': paint.polygonOutlineWidth,
      'line-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-lines-casing',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': paint.lineCasing,
      'line-width': paint.lineCasingWidth,
      'line-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-lines',
    type: 'line',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color': paint.lineColor,
      'line-width': paint.lineWidth,
      'line-opacity': 1,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-line-labels',
    type: 'symbol',
    source: sourceId,
    filter: [
      'all',
      ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
      ['has', 'labelValue'],
    ],
    layout: {
      'symbol-placement': 'line-center',
      'text-field': LINE_LABEL_TEXT,
      'text-size': paint.lineLabelSize,
      'text-anchor': 'center',
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': paint.labelColor,
      'text-halo-color': paint.labelHaloColor,
      'text-halo-width': paint.labelHaloWidth,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-points',
    type: 'circle',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color': paint.pointColor,
      'circle-radius': paint.pointRadius,
      'circle-opacity': paint.showPoints ? 1 : 0,
      'circle-stroke-color': paint.pointStroke,
      'circle-stroke-width': paint.pointStrokeWidth,
    },
  });

  map.addLayer({
    id: 'published-forecast-export-labels',
    type: 'symbol',
    source: sourceId,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    layout: {
      'text-field': ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], 'Marker'],
      'text-size': paint.pointLabelSize,
      'text-offset': [0, 1.8],
      'text-anchor': 'top',
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'visibility': paint.showPointLabels ? 'visible' : 'none',
    },
    paint: {
      'text-color': paint.labelColor,
      'text-halo-color': paint.labelHaloColor,
      'text-halo-width': paint.labelHaloWidth,
    },
  });
}

const PublishedForecastExportMap = forwardRef(function PublishedForecastExportMap({ features, chartStyleMode }, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const featureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);
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
      addExportLayers(map, featureCollection, normalizedStyleMode);

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
  }, [featureCollection, hasFeatures, normalizedStyleMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !hasFeatures) return;

    addExportLayers(map, featureCollection, normalizedStyleMode);
    const bounds = getFeatureBounds(featureCollection);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: featureCollection.features.length === 1 ? 8 : 10,
        duration: 0,
      });
    }
  }, [featureCollection, hasFeatures, isReady, normalizedStyleMode]);

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
