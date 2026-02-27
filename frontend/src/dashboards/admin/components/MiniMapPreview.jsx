import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchProjectFeatureCollection } from '@/api/featureServices';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

const STATIC_CENTER = [120.0, 15.5];
const STATIC_ZOOM = 2.5;

const OPERATIONAL_MAX_BOUNDS = [
  [80, -10],
  [170, 40],
];

const MiniMapPreview = ({ projectId, isDarkMode }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [geojson, setGeojson] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ===============================
  // Fetch FeatureCollection
  // ===============================
  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        const data = await fetchProjectFeatureCollection(projectId);
        const cleaned = normalizeFeatureCollection(data);
        setGeojson(cleaned);
      } catch (err) {
        console.error('Failed to load features:', err);
      }
    };

    load();
  }, [projectId]);

  // ===============================
  // Initialize Static Map ONCE
  // ===============================
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      projection: 'mercator',
      style: STYLE_URL,
      center: STATIC_CENTER,
      zoom: STATIC_ZOOM,
      minZoom: STATIC_ZOOM,
      maxZoom: STATIC_ZOOM,
      maxBounds: OPERATIONAL_MAX_BOUNDS,
      interactive: false,
      attributionControl: false,
      dragPan: false,
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoomRotate: false,
    });

    map.on('load', () => setIsLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ===============================
  // Add GeoJSON
  // ===============================
  useEffect(() => {
    if (!geojson || !mapRef.current) return;
    if (!geojson.features?.length) return;

    const map = mapRef.current;

    if (!map.isStyleLoaded()) {
      map.once('load', () => addOrUpdateData(map, geojson));
    } else {
      addOrUpdateData(map, geojson);
    }
  }, [geojson]);

  return (
    <div className="relative w-full h-52 overflow-hidden">
      {/* Shimmer placeholder while map loads */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 animate-pulse ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        />
      )}

      {/* Map canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Subtle bottom gradient so card text doesn't compete with the map */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-10 pointer-events-none ${
          isDarkMode
            ? 'bg-gradient-to-t from-gray-900/60 to-transparent'
            : 'bg-gradient-to-t from-black/20 to-transparent'
        }`}
      />
    </div>
  );
};

export default MiniMapPreview;

// ===============================
// NORMALIZE FEATURE COLLECTION
// ===============================
function normalizeFeatureCollection(fc) {
  if (!fc || !fc.features) return fc;

  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => ({
      ...f,
      geometry: {
        ...f.geometry,
        coordinates: unwrapCoordinates(f.geometry.coordinates),
      },
    })),
  };
}

function unwrapCoordinates(coords) {
  if (!Array.isArray(coords)) return coords;
  if (coords.length === 1 && Array.isArray(coords[0])) {
    return unwrapCoordinates(coords[0]);
  }
  return coords;
}

// ===============================
// ADD / UPDATE SOURCE + LAYERS
// ===============================
function addOrUpdateData(map, geojson) {
  const SOURCE_ID = 'project-data';

  if (map.getSource(SOURCE_ID)) {
    map.getSource(SOURCE_ID).setData(geojson);
    return;
  }

  map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

  map.addLayer({
    id: 'project-polygons',
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Polygon'],
    paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.4 },
  });

  map.addLayer({
    id: 'project-polygon-outline',
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Polygon'],
    paint: { 'line-color': '#60a5fa', 'line-width': 1.5 },
  });

  map.addLayer({
    id: 'project-lines',
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'LineString'],
    paint: { 'line-color': '#2563eb', 'line-width': 2.5 },
  });

  map.addLayer({
    id: 'project-points',
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#ef4444',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  });
}