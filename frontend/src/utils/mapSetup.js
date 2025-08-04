import phGeoJson from '../data/ph.json';
import { loadImage, initTyphoonLayer, initDrawControl, typhoonMarker as saveMarkerFn } from './mapUtils';

export function setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures = [], logger, setLoading, selectedToolRef, setCapturedImages }) {
  if (!map) return console.warn('No map instance provided');
  if (typeof setLoading === 'function') {
    setLoading(true)
  };

  map.addSource('wind_data_source', {
    type: 'raster-array',
    url: 'mapbox://karlbernaldizzy.07022025',
    tileSize: 4096
  });

  map.addLayer({
    id: 'wind-layer',
    type: 'raster-particle',
    source: 'wind_data_source',
    'source-layer': '10m_wind',
    slot: 'bottom',
    paint: {
      'raster-particle-speed-factor': 0.2,
      'raster-particle-fade-opacity-factor': 0.9,
      'raster-particle-reset-rate-factor': 0.4,
      'raster-particle-count': 20000,
      'raster-particle-max-speed': 80,
      'raster-particle-color': [
        'interpolate',
        ['linear'],
        ['raster-particle-speed'],
        .8,
        'rgba(134,163,171,256)',
        2.5,
        'rgba(126,152,188,256)',
        4.12,
        'rgba(110,143,208,256)',
        4.63,
        'rgba(110,143,208,256)',
        6.17,
        'rgba(15,147,167,256)',
        7.72,
        'rgba(15,147,167,256)',
        9.26,
        'rgba(57,163,57,256)',
        10.29,
        'rgba(57,163,57,256)',
        11.83,
        'rgba(194,134,62,256)',
        13.37,
        'rgba(194,134,63,256)',
        14.92,
        'rgba(200,66,13,256)',
        16.46,
        'rgba(200,66,13,256)',
        18.0,
        'rgba(210,0,50,256)',
        20.06,
        'rgba(215,0,50,256)',
        21.6,
        'rgba(175,80,136,256)',
        23.66,
        'rgba(175,80,136,256)',
        25.21,
        'rgba(117,74,147,256)',
        27.78,
        'rgba(117,74,147,256)',
        29.32,
        'rgba(68,105,141,256)',
        31.89,
        'rgba(68,105,141,256)',
        33.44,
        'rgba(194,251,119,256)',
        42.18,
        'rgba(194,251,119,256)',
        43.72,
        'rgba(241,255,109,256)',
        48.87,
        'rgba(241,255,109,256)',
        50.41,
        'rgba(256,256,256,256)',
        57.61,
        'rgba(256,256,256,256)',
        59.16,
        'rgba(0,256,256,256)',
        68.93,
        'rgba(0,256,256,256)',
        69.44,
        'rgba(256,37,256,256)'
      ]
    }
  });

  //   map.addLayer({
  //   id: 'wind-layer_colorblind',
  //   type: 'raster-particle',
  //   source: 'wind_data_source',
  //   'source-layer': '10m_wind',
  //   slot: 'bottom',
  //   paint: {
  //     'raster-particle-speed-factor': 0.2,
  //     'raster-particle-fade-opacity-factor': 0.9,
  //     'raster-particle-reset-rate-factor': 0.4,
  //     'raster-particle-count': 20000,
  //     'raster-particle-max-speed': 80,
  //     'raster-particle-color': [
  //       'interpolate',
  //       ['linear'],
  //       ['raster-particle-speed'],
  //       .8, 'rgba(158,1,66,256)',   // Deep Red
  //       2.5, 'rgba(213,62,79,256)', // Red
  //       4.12, 'rgba(244,109,67,256)', // Orange
  //       4.63, 'rgba(253,174,97,256)', // Light Orange
  //       6.17, 'rgba(254,224,139,256)', // Yellow
  //       7.72, 'rgba(217,239,139,256)', // Light Green
  //       9.26, 'rgba(166,217,106,256)', // Green
  //       10.29, 'rgba(102,189,99,256)', // Strong Green
  //       11.83, 'rgba(26,152,80,256)',  // Dark Green
  //       13.37, 'rgba(0,104,55,256)',   // Darker Green
  //       14.92, 'rgba(0,69,41,256)',    // Very Dark Green
  //       16.46, 'rgba(37,52,148,256)',  // Dark Blue
  //       18.0, 'rgba(8,29,88,256)',     // Deep Blue
  //       20.06, 'rgba(49,54,149,256)',  // Purple
  //       21.6, 'rgba(0,0,0,256)',       // Black
  //       23.66, 'rgba(255,255,255,256)', // White
  //       25.21, 'rgba(166,206,227,256)', // Light Blue
  //       27.78, 'rgba(31,120,180,256)', // Moderate Blue
  //       29.32, 'rgba(51,160,44,256)',  // Bright Green
  //       31.89, 'rgba(255,255,191,256)', // Very Light Yellow
  //       33.44, 'rgba(227,26,28,256)',  // Bright Red
  //       42.18, 'rgba(255,127,0,256)',  // Bright Orange
  //       43.72, 'rgba(255,255,51,256)', // Yellow
  //       48.87, 'rgba(127,127,127,256)', // Neutral Gray
  //       50.41, 'rgba(186,186,186,256)', // Light Gray
  //       57.61, 'rgba(204,204,204,256)', // Gray
  //       59.16, 'rgba(150,150,150,256)', // Darker Gray
  //       68.93, 'rgba(0,128,0,256)',    // Dark Green
  //       69.44, 'rgba(0,0,255,256)'     // Blue
  //     ]
  //   }
  // });

  const geoJsonSourceId = 'my-geojson-source';
  const geoJsonLayerId = 'my-geojson-layer';

  map.addSource(geoJsonSourceId, {
    type: 'geojson',
    data: phGeoJson, // from your import
  });

  map.addLayer({
    id: `${geoJsonLayerId}_fill`,
    type: "fill",
    source: geoJsonSourceId,
    slot: 'bottom',
    paint: {
      "fill-color": "#2e3d4d",
      "fill-opacity": 0.7,
    },
  });


  map.addLayer({
    id: `${geoJsonLayerId}_line`,
    type: "line",
    source: geoJsonSourceId,
    slot: 'middle',
    paint: {
      "line-color": "#fff",
      "line-width": .7,
    },
  });


  mapRef.current = map;

  loadImage(map, 'typhoon', '/hurricane.png');
  loadImage(map, 'low_pressure', '/LPA.png');
  loadImage(map, 'high_pressure', '/HPA.png');
  loadImage(map, 'less_1', '/L1.png');

  map.on('load', () => {
    initTyphoonLayer(map);
  });

  const draw = initDrawControl(map);
  setDrawInstance(draw);

  const featuresArray = Array.isArray(initialFeatures)
    ? initialFeatures
    : initialFeatures?.features || [];

  const markerPoints = [];
  const frontLines = [];
  const nonFrontLines = [];

  let totalLineCount = 0;

  // === Classify features ===
  featuresArray.forEach((feature) => {
    const type = feature.geometry?.type;

    if (type === 'Point') {
      markerPoints.push(feature);
    } else if (type === 'Polygon') {
      draw.add({
        type: 'Feature',
        geometry: feature.geometry,
        properties: feature.properties || {},
      });
    } else if (type === 'LineString') {
      totalLineCount++;

      // Fix malformed LineString
      const coords = feature.geometry?.coordinates;
      if (
        Array.isArray(coords) &&
        coords.length === 1 &&
        Array.isArray(coords[0]) &&
        Array.isArray(coords[0][0])
      ) {
        feature.geometry.coordinates = coords[0];
      }

      (feature.properties?.isFront ? frontLines : nonFrontLines).push(feature);
    }
  });

  if (typeof setLineCount === 'function') {
    setLineCount(totalLineCount);
  }

  // === Render Marker Points ===
  if (markerPoints.length > 0) {
    markerPoints.forEach((point) => {
      const [points] = point.geometry?.coordinates || [];
      const [coordinates, s] = points;
      const [lng, lat] = coordinates;
      const title = point.name || '';
      const sourceId = point.sourceId || 'typhoon';
      const markerType = point.properties.type

      if (lng !== undefined && lat !== undefined) {
        saveMarkerFn({ lat, lng }, mapRef, () => { }, markerType)(title);
      }
    });
  }

  // === Non-front lines with labels ===
  if (nonFrontLines.length > 0) {
    nonFrontLines.forEach((feature) => {
      const geojsonFeature = {
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
        id: feature._id,
      };

      const name = feature.sourceId;
      const sourceId = feature.sourceId || 'non-front-lines';

      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonFeature,
      });

      // Determine if the line should be dashed
      const wave_height = feature.properties?.labelValue;

      const isDashed = wave_height < 2;

      map.addLayer({
        id: name,
        type: 'line',
        source: sourceId,
        slot: 'top',
        paint: {
          'line-color': '#0080ff',
          'line-opacity': 0.5,
          'line-width': 3,
          'line-dasharray': isDashed ? [.5, .5] : [], // Dashed line if not closedMode
        },
        filter: ['==', '$type', 'LineString'],
      });

      // Generate label features for this line
      const coords = feature.geometry?.coordinates;
      const props = feature.properties || {};
      const labelValue = String(props.labelValue || feature.name || 'Label');
      const closedMode = props.closedMode;
      const featureId = feature._id;

      if (Array.isArray(coords) && coords.length >= 2) {
        let points = [];

        if (closedMode) {
          const [lng, lat] = coords[0];
          points.push([lng, lat]);
        } else {
          const [lng1, lat1] = coords[0];
          const [lng2, lat2] = coords[coords.length - 1];
          points.push([lng1, lat1], [lng2, lat2]);
        }

        points.forEach((coord, i) => {
          const labelSourceId = `${name}-${i}`;
          const labelLayerId = `${name}-${i}`;

          map.addSource(labelSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  id: `${featureId}-${i}`,
                  geometry: { type: 'Point', coordinates: coord },
                  properties: { text: labelValue },
                },
              ],
            },
          });

          map.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: labelSourceId,
            slot: 'top',
            layout: {
              'text-field': ['get', 'text'],
              'text-size': 18,
              'text-anchor': 'bottom',
              'text-offset': [0, 0.5],
            },
            paint: {
              'text-color': '#FF0000',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 2,
            },
          });
        });
      }
    });
  }

  // === Front lines with animated dashed effect ===
  let animationFrameIds = [];

  if (frontLines.length > 0) {
    frontLines.forEach((feature, index) => {
      const sourceId = feature.sourceId;
      const bgLayerId = `${sourceId}_bg`;
      const dashLayerId = `${sourceId}_dash`;

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [feature],
        },
      });

      map.addLayer({
        id: bgLayerId,
        type: 'line',
        source: sourceId,
        slot: 'top',
        paint: {
          'line-color': '#0000FF',
          'line-width': 6,
          'line-opacity': 0.8,
        },
      });

      map.addLayer({
        id: dashLayerId,
        type: 'line',
        source: sourceId,
        slot: 'top',
        paint: {
          'line-color': '#FF0000',
          'line-width': 6,
          'line-dasharray': [0, 4, 3],
        },
      });

      const dashArraySequence = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1],
        [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3],
        [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5],
        [0, 3, 3, 1], [0, 3.5, 3, 0.5],
      ];

      // map.once('idle', () => {
      //   let step = 0;

      //   function animateDashArray(timestamp) {
      //     const layer = safeGetLayer(dashLayerId);
      //     if (!layer) {
      //       // Log a warning if the layer is not available
      //       console.warn(`Layer '${dashLayerId}' is not available. Skipping animation.`);
      //       return; // Return early if the layer is not found
      //     }

      //     const newStep = Math.floor((timestamp / 150) % dashArraySequence.length);
      //     if (newStep !== step) {
      //       try {
      //         map.setPaintProperty(dashLayerId, 'line-dasharray', dashArraySequence[newStep]);
      //         step = newStep;
      //       } catch (err) {
      //         console.warn(`Error updating dasharray for ${dashLayerId}:`, err);
      //         return;
      //       }
      //     }

      //     // Continue the animation
      //     animationFrameIds[index] = requestAnimationFrame(animateDashArray);
      //   }

      //   function tryStartAnimation(retries = 10) {
      //     const layer = safeGetLayer(dashLayerId);
      //     if (layer) {
      //       // If the layer exists, start the animation
      //       animationFrameIds[index] = requestAnimationFrame(animateDashArray);
      //     } else if (retries > 0) {
      //       // Retry after a delay if the layer is not ready
      //       setTimeout(() => tryStartAnimation(retries - 1), 300);
      //     } else {
      //       console.warn(`Skipping animation: '${dashLayerId}' not ready after retries.`);
      //     }
      //   }


      //   setTimeout(() => tryStartAnimation(), 300);
      // });
    });
  }

  const PARstate = localStorage.getItem('PAR');
  const TCIDstate = localStorage.getItem('TCID');
  const TCADstate = localStorage.getItem('TCAD');
  const windLayerState = localStorage.getItem('wind_layer');

  if (PARstate === 'true') {
    map.setLayoutProperty('PAR', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('PAR', 'visibility', 'none');
  }

  if (TCIDstate === 'true') {
    map.setLayoutProperty('TCID', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('TCID', 'visibility', 'none');
  }

  if (TCADstate === 'true') {
    map.setLayoutProperty('TCAD', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('TCAD', 'visibility', 'none');
  }

  if (windLayerState === 'true') {
    map.setLayoutProperty('wind-layer', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('wind-layer', 'visibility', 'none');
  }

  // === Map loaded and draw.create handler ===
  map.on('draw.create', (e) => {
    const feature = e.features[0];

    if (feature?.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      setSelectedPoint({ lng, lat });

      const selectedType = selectedToolRef?.current || '';

      if (selectedType.toLowerCase() !== 'less_1') {
        setShowTitleModal(true);
      }

      draw.delete(feature.id);
    }
  });

  // ✅ When fully idle (all sources & layers processed)
  map.once('idle', () => {
    if (typeof setLoading === 'function') setLoading(false); // ✅ Hide modal
    setMapLoaded(true);

    try {
      const canvas = map.getCanvas();
      const imageDataUrl = canvas.toDataURL("image/png");

      // Determine theme from localStorage
      const isDarkMode = localStorage.getItem("isDarkMode") === "true";
      const snapshotKey = isDarkMode ? "map_snapshot_dark" : "map_snapshot_light";

      // Save to localStorage using dynamic key
      localStorage.setItem(snapshotKey, imageDataUrl);

      // Update app state if needed
      if (typeof setCapturedImages === "function") {
        setCapturedImages(prev => ({
          ...prev,
          [isDarkMode ? "dark" : "light"]: imageDataUrl,
        }));
      }

    } catch (e) {
      console.error("❌ Error capturing map snapshot:", e);
    }
  });

  setMapLoaded(true);

  // === Return cleanup function ===
  return function cleanup() {
    animationFrameIds.forEach(id => cancelAnimationFrame(id));
  };
}
