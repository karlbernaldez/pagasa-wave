import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { registerMapInstance } from '../../utils/mapUtils';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({ setMapInstance, onMapLoad, isDarkMode }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove any previous map DOM content
    while (mapContainerRef.current.firstChild) {
      mapContainerRef.current.removeChild(mapContainerRef.current.firstChild);
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      projection: 'mercator',
      style: isDarkMode
        ? 'mapbox://styles/votewave/cmi3xgfli006p01st7bob9drl'
        : 'mapbox://styles/votewave/cmi6o2f9p000b01rcex3f0vcq',
      center: [120.0, 15.5],
      minZoom: 4,
      zoom: 5.5,
      maxZoom: 8,
      preserveDrawingBuffer: true,
      maxBounds: [
        [80, -10],
        [170, 40],
      ],
    });

    map.fitBounds(
      [
        [93, 0],
        [153.8595159535438, 25],
      ],
      {
        padding: { top: 100, bottom: 100, left: 200, right: 200 },
        maxZoom: 8,
      }
    );

    // When map is loaded
    map.on('load', () => {
      mapRef.current = map;
      registerMapInstance(map); // ✅ Register latest instance
      if (setMapInstance) setMapInstance(map);
      if (onMapLoad) onMapLoad(map);
    });

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      if (setMapInstance) setMapInstance(null);
    };
  }, []); // runs only once

  // Update style when theme changes
  useEffect(() => {
    if (!mapRef.current) return;

    const newStyle = isDarkMode
      ? 'mapbox://styles/votewave/cmi3xgfli006p01st7bob9drl'
      : 'mapbox://styles/votewave/cmi6o2f9p000b01rcex3f0vcq';

    const onStyleLoad = () => {
      registerMapInstance(mapRef.current); // ✅ refresh global map ref after style change
      if (setMapInstance) setMapInstance(mapRef.current);
      mapRef.current.off('style.load', onStyleLoad);
    };

    mapRef.current.on('style.load', onStyleLoad);
    mapRef.current.setStyle(newStyle);
  }, [isDarkMode, setMapInstance]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
};

export default MapComponent;
