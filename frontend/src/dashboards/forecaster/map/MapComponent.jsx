import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { registerMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Single base style
const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

// Theme palette
const THEME_COLORS = {
  dark: {
    land: '#0f1117',
    water: '#0b3d91',
  },
  light: {
    land: '#f2f2f2',
    water: '#cbedfa',
  },
};

const applyTheme = (map, isDarkMode) => {
  if (!map || !map.isStyleLoaded()) return;

  const theme = isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;

  // LAND (background layer)
  if (map.getLayer('land')) {
    map.setPaintProperty(
      'land',
      'background-color',
      theme.land
    );
  }

  // WATER (fill layer)
  if (map.getLayer('water')) {
    map.setPaintProperty(
      'water',
      'fill-color',
      theme.water
    );
  }
};

const MapComponent = ({ setMapInstance, onMapLoad, isDarkMode }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize map (runs once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean container (important for hot reloads)
    while (mapContainerRef.current.firstChild) {
      mapContainerRef.current.removeChild(mapContainerRef.current.firstChild);
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      projection: 'mercator',
      style: STYLE_URL,
      center: [120.0, 15.5],
      zoom: 5.5,
      minZoom: 4,
      maxZoom: 16,
      preserveDrawingBuffer: true,
      maxBounds: [
        [80, -10],
        [170, 40],
      ],
    });

    window.map = map;
    map.fitBounds(
      [
        [93, 5],
        [153.8595159535438, 25],
      ],
      {
        padding: { top: 50, bottom: 50, left: 200, right: 200 },
        maxZoom: 8,
      }
    );

    map.on('load', () => {
      mapRef.current = map;

      registerMapInstance(map);
      if (setMapInstance) setMapInstance(map);
      if (onMapLoad) onMapLoad(map);

      // Apply initial theme
      applyTheme(map, isDarkMode);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      if (setMapInstance) setMapInstance(null);
    };
  }, []);

  // Theme updates (NO style reload)
  useEffect(() => {
    if (!mapRef.current) return;
    applyTheme(mapRef.current, isDarkMode);
  }, [isDarkMode]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
};

export default MapComponent;
