import { v4 as uuidv4 } from 'uuid';

export const convertToGeoJSON = (lines, mapRef) => {
  if (!mapRef.current) {
    console.error('Map reference is not available!');
    return null;
  }

  const geojsonFeatures = lines.map((line) => {
    const coords = [];

    for (let i = 0; i < line.points.length; i += 2) {
      const x = line.points[i];
      const y = line.points[i + 1];
      const lngLat = mapRef.current.unproject([x, y]);
      coords.push([lngLat.lng, lngLat.lat]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        color: line.color, // now consistent
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: geojsonFeatures,
  };
};

export const downloadGeoJSON = (lines, mapRef) => {
  const geojson = convertToGeoJSON(lines, mapRef);
  if (!geojson) return;

  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'flag-drawing.geojson';
  link.click();
};


export const handlePointerDown = (e, lines, setLines, isFlagDrawing, strokeColor) => {
  isFlagDrawing.current = true;
  const pos = e.target.getStage().getPointerPosition();

  setLines([...lines, { points: [pos.x, pos.y], color: strokeColor }]);
};

export const handlePointerMove = (e, lines, setLines, isFlagDrawing) => {
  if (!isFlagDrawing.current) return;
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();

  const lastLine = { ...lines[lines.length - 1] };
  lastLine.points = [...lastLine.points, point.x, point.y];

  const updatedLines = [...lines.slice(0, -1), lastLine];
  setLines(updatedLines);
};

export const handlePointerUp = async (
  mapRef,
  lines,
  setLines,
  isFlagDrawing,
  drawCounter,
  setDrawCounter,
  setLayersRef,
  saveFeature,
  closedMode,
  colorToggle
) => {
  const map = mapRef.current;
  if (!map) return;

  isFlagDrawing.current = false;
  const geojson = convertToGeoJSON(lines, mapRef);
  if (!geojson) return;

  const uniqueId = uuidv4();
  const sourceId = `SF_${uniqueId}`;
  const bgLayerId = `SF_${uniqueId}_bg`;
  const dashedLayerId = `SF_${uniqueId}_dash`;
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;

  if (map.getSource(sourceId)) map.removeSource(sourceId);
  if (map.getLayer(bgLayerId)) map.removeLayer(bgLayerId);
  if (map.getLayer(dashedLayerId)) map.removeLayer(dashedLayerId);

  map.addSource(sourceId, {
    type: 'geojson',
    data: geojson,
  });

  // Hard-coded colors
  const backgroundColor = '#0000FF'; // Blue
  const animatedColor = '#FF0000';   // Red

  // Background (blue) line layer
  map.addLayer(
    {
      id: bgLayerId,
      type: 'line',
      source: sourceId,
      slot: "top",
      paint: {
        'line-color': backgroundColor,
        'line-width': 6,
        'line-opacity': 0.8,
      },
    },
    beforeLayer
  );

  // Animated (red) dashed line layer
  map.addLayer(
    {
      id: dashedLayerId,
      type: 'line',
      source: sourceId,
      slot: "top",
      paint: {
        'line-color': animatedColor,
        'line-width': 6,
        'line-dasharray': [0, 4, 3],
      },
    },
    beforeLayer
  );

  // Animate the dashed line
  const dashArraySequence = [
    [0, 4, 3],
    [0.5, 4, 2.5],
    [1, 4, 2],
    [1.5, 4, 1.5],
    [2, 4, 1],
    [2.5, 4, 0.5],
    [3, 4, 0],
    [0, 0.5, 3, 3.5],
    [0, 1, 3, 3],
    [0, 1.5, 3, 2.5],
    [0, 2, 3, 2],
    [0, 2.5, 3, 1.5],
    [0, 3, 3, 1],
    [0, 3.5, 3, 0.5],
  ];

  let step = 0;
  function animateDashArray(timestamp) {
    if (!map.getLayer(dashedLayerId)) {
      console.warn(`Layer '${dashedLayerId}' does not exist. Reloading page.`);
      window.location.reload();  // Safe alternative to 'location.reload()'
      return;
    }

    const newStep = parseInt((timestamp / 150) % dashArraySequence.length);
    if (newStep !== step) {
      map.setPaintProperty(dashedLayerId, 'line-dasharray', dashArraySequence[newStep]);
      step = newStep;
    }

    requestAnimationFrame(animateDashArray);
  }

  animateDashArray(0);

  // Save feature metadata and update UI state
  if (typeof setLayersRef?.current === 'function') {
    const baseName = 'Surface Front Layer';
    setLayersRef.current((prevLayers) => {
      let counter = 1;
      let uniqueName = baseName;
      const existingNames = prevLayers.map((l) => l.name);
      const owner = JSON.parse(localStorage.getItem("user"));
      const projectId = localStorage.getItem("projectId");
      
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${baseName} ${counter++}`;
      }

      if (geojson.features.length > 0) {
        const feature = geojson.features[0];
        const token = localStorage.getItem('authToken');
        saveFeature({
          geometry: feature.geometry,
          properties: {
            isFront: true,
            owner: owner?.id,
            project: projectId,
          },
          name: uniqueName,
          sourceId,
        }, token).catch((err) => {
          console.error('Error saving feature:', err);
        });
      }

      return [
        ...prevLayers,
        {
          id: dashedLayerId,
          sourceID: sourceId,
          name: uniqueName,
          visible: true,
          locked: false,
        },
      ];
    });
  }

  colorToggle.current = !colorToggle.current;
  setLines([]);
};
