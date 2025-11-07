import { addHimawariLayer, addWindLayer, loadImage, loadCustomImages, initTyphoonLayer, initDrawControl, typhoonMarker as saveMarkerFn } from './mapUtils';

// === Helper: Classify features ===
function classifyFeatures(featuresArray) {
  const markerPoints = [];
  const frontLines = [];
  const nonFrontLines = [];
  let totalLineCount = 0;

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

  return { markerPoints, frontLines, nonFrontLines, totalLineCount };
}

// === Helper: Render marker points ===
function renderMarkerPoints(markerPoints, mapRef) {
  markerPoints.forEach((point) => {
    const coordsArr = point.geometry?.coordinates;
    if (!coordsArr || coordsArr.length === 0) return;

    const [points] = coordsArr;
    const [coordinates] = points;
    const [lng, lat] = coordinates;
    const title = point.name || '';
    const markerType = point.properties?.type;

    if (lng !== undefined && lat !== undefined) {
      saveMarkerFn({ lat, lng }, mapRef, () => { }, markerType)(title);
    }
  });
}

// === Helper: Render non-front lines with labels ===
function renderNonFrontLines(nonFrontLines, map, lineColor, textColor, isDarkMode) {
  nonFrontLines.forEach((feature) => {
    const sourceId = feature.sourceId || 'non-front-lines';
    const geojsonFeature = {
      type: 'Feature',
      geometry: feature.geometry,
      properties: feature.properties,
      id: feature._id,
    };

    // Determine if dashed
    const waveHeight = feature.properties?.labelValue;
    const isDashed = waveHeight < 2;

    // Add line layer
    map.addSource(sourceId, { type: 'geojson', data: geojsonFeature });
    map.addLayer({
      id: sourceId,
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

    // Add labels
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;

    const props = feature.properties || {};
    const labelValue = String(props.labelValue || feature.name || 'Label');
    const closedMode = props.closedMode;

    const points = closedMode
      ? [coords[0]]
      : [coords[0], coords[coords.length - 1]];

    points.forEach((coord, i) => {
      const labelSourceId = `${sourceId}-${i}`;
      const labelLayerId = `${sourceId}-${i}`;

      map.addSource(labelSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: `${feature._id}-${i}`,
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
          'text-halo-color': isDarkMode ? '#19b8b7' : '#ffffff',
        },
      });
    });
  });
}

// === Helper: Render front lines ===
function renderFrontLines(frontLines, map) {
  const animationFrameIds = [];

  frontLines.forEach((feature) => {
    const sourceId = feature.sourceId;
    const bgLayerId = `${sourceId}_bg`;
    const dashLayerId = `${sourceId}_dash`;

    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [feature] },
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

  return animationFrameIds;
}

// === Helper: Toggle visibility from localStorage ===
function applyLayerVisibility(map, layers) {
  layers.forEach(({ key, ids }) => {
    const isVisible = localStorage.getItem(key) === 'true';
    ids.forEach((id) => map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none'));
  });
}

export function setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures = [], logger, setLoading, selectedToolRef, setCapturedImages, isDarkMode }) {
  const lineColor = isDarkMode ? '#19b8b7' : '#000000';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const draw = initDrawControl(map);
  const featuresArray = Array.isArray(initialFeatures)
    ? initialFeatures
    : initialFeatures?.features || [];

  mapRef.current = map;
  if (!map) return console.warn('No map instance provided');

  if (typeof setLoading === 'function') {
    setLoading(true)
  };

  setDrawInstance(draw);
  addHimawariLayer(map);
  loadCustomImages(map);
  initTyphoonLayer(map);
  addWindLayer(map);

  ['typhoon', 'low_pressure', 'high_pressure', 'less_1'].forEach((id) => loadImage(map, id, `/${id.replace('_', '')}.png`));
  ['0kts', '5kts', '10kts', '15kts', '20kts', '25kts', '30kts'].forEach((id) => loadImage(map, id, `/barbs/${id}.svg`));

  const { markerPoints, frontLines, nonFrontLines, totalLineCount } = classifyFeatures(featuresArray);

  if (typeof setLineCount === 'function') setLineCount(totalLineCount);

  renderMarkerPoints(markerPoints, mapRef);
  renderNonFrontLines(nonFrontLines, map, lineColor, textColor, isDarkMode);
  const animationFrameIds = renderFrontLines(frontLines, map);

  applyLayerVisibility(map, [
    { key: 'PAR', ids: ['PAR', 'PAR_dash'] },
    { key: 'Satellite', ids: ['Satellite'] },
    { key: 'TCID', ids: ['TCID'] },
    { key: 'TCAD', ids: ['TCAD'] },
    { key: 'SHIPPING_ZONE', ids: ['graticules'] },
    { key: 'wind-layer', ids: ['wind-layer', 'wind-speed-layer', 'wind-arrows', 'wind-labels', 'wave-arrows', 'wave-period-labels', 'glass-fill', 'glass-stroke', 'glass-depth'] },
  ]);

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
    setLoading?.(false);

    // try {
    //   const canvas = map.getCanvas();
    //   const imageDataUrl = canvas.toDataURL("image/png");

    //   // Save snapshot in localStorage
    //   const darkMode = localStorage.getItem("isDarkMode") === "true";
    //   const snapshotKey = darkMode ? "map_snapshot_dark" : "map_snapshot_light";
    //   localStorage.setItem(snapshotKey, imageDataUrl);

    //   setCapturedImages?.((prev) => ({ ...prev, [darkMode ? "dark" : "light"]: imageDataUrl }));

    //   // === Log image preview in console ===
    //   console.log("%c ", `font-size:1600px; background:url(${imageDataUrl}) no-repeat; background-size:contain;`);

    // } catch (e) {
    //   console.error("❌ Error capturing map snapshot:", e);
    // }
  });

  setMapLoaded(true);
  logger?.info("Map setup complete with initial features.");

  // === Return cleanup function ===
  return function cleanup() {
    animationFrameIds.forEach(id => cancelAnimationFrame(id));
  };
}
