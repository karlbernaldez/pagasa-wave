import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({ onMapLoad, isDarkMode }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      console.error('Map container reference is not available.');
      return;
    }

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not defined.');
      return;
    }

    if (!mapRef.current) {
      // Clear container div to make sure it's empty
      while (mapContainerRef.current.firstChild) {
        mapContainerRef.current.removeChild(mapContainerRef.current.firstChild);
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        projection: 'mercator',
        style: isDarkMode
          ? 'mapbox://styles/karlbernaldizzy/cmcirw8l200bc01s78p7f2m2q' //--Dark
          : 'mapbox://styles/karlbernaldizzy/cmcu9sdf300ec01sr4g4werqd',
        center: [120.0, 15.5],
        minZoom: 3.5,
        zoom: 4,
        preserveDrawingBuffer: true,
        // maxBounds: [
        //   [103.0, 2.0],
        //   [150.0, 36.8]
        // ]
      });

      map.fitBounds(
        [
          [99.79339501828959, 3.757304989541903],
          [153.8595159535438, 27.162621752400347],
        ],
        {
          padding: { top: 200, bottom: 100, left: 100, right: 200 },
        }
      );

      map.on('load', () => {
        mapRef.current = map;
        if (onMapLoad) {
          onMapLoad(map);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update the map style when isDarkMode changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(
        isDarkMode
          ? 'mapbox://styles/karlbernaldizzy/cmcirw8l200bc01s78p7f2m2q'
          : 'mapbox://styles/karlbernaldizzy/cmcu9sdf300ec01sr4g4werqd'
      );
    }
  }, [isDarkMode]); // Re-run whenever isDarkMode changes

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
};

export default MapComponent;
