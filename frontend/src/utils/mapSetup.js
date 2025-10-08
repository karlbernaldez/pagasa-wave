import { loadImage, loadCustomImages, initTyphoonLayer, initDrawControl, typhoonMarker as saveMarkerFn } from './mapUtils';

export function setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures = [], logger, setLoading, selectedToolRef, setCapturedImages, isDarkMode }) {
  const lineColor = isDarkMode ? '#19b8b7' : '#000000';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  let isVideoLoading = true;

  if (!map) return console.warn('No map instance provided');
  if (typeof setLoading === 'function') {
    setLoading(true)
  };

  const bounds = [
    [104, -1.15],   // SW
    [146.99, 29.6],  // NE
  ];

  // remove previous video source/layer if exists
  if (map.getLayer("himawari-video-layer")) map.removeLayer("himawari-video-layer");
  if (map.getSource("himawari-video")) map.removeSource("himawari-video");

  const videoUrl = `${import.meta.env.VITE_API_URL}/api/public/himawari.mp4`;

  map.addSource('himawari-video', {
    type: 'video',
    urls: [videoUrl],
    coordinates: [
      [104, 29.55],    // top-left
      [146.99, 29.55], // top-right
      [146.99, -1.5],  // bottom-right
      [104, -1.5]      // bottom-left
    ]
  });

  map.addLayer({
    id: 'Satellite',
    type: 'raster',
    source: 'himawari-video',
    slot: 'bottom',
    layout: {
    'visibility': 'none' // layer is hidden initially
  },
    paint: { 'raster-opacity': 0.95 }
  });

  // play the video
  const source = map.getSource("himawari-video");

  if (source) {
    // Mapbox emits 'data' when a source is loaded
    map.on('data', (e) => {
      if (e.sourceId === 'himawari-video' && e.isSourceLoaded) {
        const video = source.getVideo();
        if (video) {
          console.log("Himawari video loaded, starting playback...");
          video.loop = true;
          video.muted = true;  // needed for autoplay in some browsers
          video.play().catch(err => console.warn("Video play failed:", err));
          isVideoLoading = false;
          console.log("Video LOADING STATE:", isVideoLoading);
        }
      }
    });
  }

  loadImage(map, 'typhoon', '/hurricane.png');
  loadImage(map, 'low_pressure', '/LPA.png');
  loadImage(map, 'high_pressure', '/HPA.png');
  loadImage(map, 'less_1', '/L1.png');
  loadImage(map, '0kts', '/barbs/0kts.svg');
  loadImage(map, '5kts', '/barbs/5kts.svg');
  loadImage(map, '10kts', '/barbs/10kts.svg');
  loadImage(map, '15kts', '/barbs/15kts.svg');
  loadImage(map, '20kts', '/barbs/20kts.svg');
  loadImage(map, '25kts', '/barbs/25kts.svg');
  loadImage(map, '30kts', '/barbs/30kts.svg');


  loadCustomImages(map);
  initTyphoonLayer(map);
  // animateHimawari(map);

  if (map.getSource('12SEP2025v2')) {
    map.removeLayer('wind-layer');  // remove layer first
    map.removeSource('12SEP2025v2');
  }

  map.addSource('12SEP2025v2', {
    type: 'raster-array',
    url: 'mapbox://karlbernaldizzy.09182025?fresh=' + Date.now(),
    tileSize: 4096
  });

  // map.addSource('era5_c1', {
  //   type: 'geojson',
  //   data: era5_c1,
  // });

  // map.addLayer({
  //   id: 'wind_barbs',
  //   type: 'symbol',
  //   source: 'era5_c1',
  //   slot: 'bottom',
  //   layout: {
  //     // show wavePeriod only if it's not 9999
  //     'text-field': [
  //       'case',
  //       ['==', ['get', 'wavePeriod'], 9999],
  //       '', // show nothing if wavePeriod is 9999
  //       ["to-string", ["round", ["get", "wavePeriod"]]] // else show rounded value
  //     ],
  //     'text-size': 16,

  //     // rotate text same as icon
  //     'text-rotate': [
  //       '*',
  //       10,
  //       ["round", ["/", ["get", "windDirection"], 10]]
  //     ],

  //     // pick icon name dynamically by windSpeed bins
  //     'icon-image': [
  //       'step', ["get", "windSpeed"],
  //       ["image", "0kts", { "params": { "color-1": "#192750" } }], // <= 2
  //       3.57632, "5kts",
  //       6.25856, "10kts",
  //       8.9408, "15kts",
  //       11.176, "20kts",
  //       13.85824, "25kts",
  //       16.54048, "30kts"
  //     ],

  //     'icon-size': 3,

  //     // rotate icon by wind direction
  //     'icon-rotate': [
  //       '*',
  //       10,
  //       ["round", ["/", ["get", "windDirection"], 10]]
  //     ]
  //   },
  //   paint: {
  //     // text color adapts to dark mode
  //     'text-color': isDarkMode ? '#19b8b7' : '#000000',
  //     'text-halo-color': isDarkMode ? '#0d0d0d' : '#ffffff',
  //     'text-halo-width': 1.5
  //   }
  // });

  map.addLayer({
    id: 'wind-layer',
    type: 'raster-particle',
    source: '12SEP2025v2',
    'source-layer': '10m_wind',
    slot: 'bottom',
    paint: {
      'raster-particle-speed-factor': 0.6,
      'raster-particle-fade-opacity-factor': 0.60,
      'raster-particle-reset-rate-factor': 0.4,
      'raster-particle-count': 48000,
      'raster-particle-max-speed': 100,
      'raster-particle-color': [
        'interpolate',
        ['linear'],
        ['raster-particle-speed'],
        1.5,
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

  mapRef.current = map;

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
          'line-color': lineColor,
          'line-opacity': 0.5,
          'line-width': 3,
          'line-dasharray': isDashed ? [0.5, 0.5] : [],
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
              'text-color': textColor,
              'text-halo-width': 2,
              'text-halo-color': isDarkMode ? '#19b8b7' : '#ffffff', // subtle halo for readability
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

    });
  }

  const PARstate = localStorage.getItem('PAR');
  const TCIDstate = localStorage.getItem('TCID');
  const TCADstate = localStorage.getItem('TCAD');
  const ShippingZonestate = localStorage.getItem('SHIPPING_ZONE');
  const windLayerState = localStorage.getItem('wind_layer');

  if (PARstate === 'true') {
    map.setLayoutProperty('PAR', 'visibility', 'visible');
    map.setLayoutProperty('PAR_dash', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('PAR', 'visibility', 'none');
    map.setLayoutProperty('PAR_dash', 'visibility', 'none');
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

  if (ShippingZonestate === 'true') {
    map.setLayoutProperty('graticules', 'visibility', 'visible');
    map.setLayoutProperty('country-boundaries', 'visibility', 'visible');
    map.setLayoutProperty('ERA5_c1', 'visibility', 'visible');
    map.setLayoutProperty('ERA5_c2', 'visibility', 'visible');
    // map.setLayoutProperty('SHIPPING_ZONE_LABELS', 'visibility', 'visible');
    // map.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', 'visible');
    // map.setLayoutProperty('SHIPPING_ZONE_FILL', 'visibility', 'visible');
  } else {
    // map.setLayoutProperty('SHIPPING_ZONE_LABELS', 'visibility', 'none');
    // map.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', 'none');
    map.setLayoutProperty('graticules', 'visibility', 'none');
    map.setLayoutProperty('country-boundaries', 'visibility', 'none');
    map.setLayoutProperty('ERA5_c1', 'visibility', 'none');
    map.setLayoutProperty('ERA5_c2', 'visibility', 'none');
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
  map.once('render', () => {
    console.log("Map is fully loaded and idle.");
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
