
import { v4 as uuidv4 } from 'uuid';

export const chaikinSmoothing = (points, iterations = 2) => {
  for (let k = 0; k < iterations; k++) {
    let newPoints = [];
    for (let i = 0; i < points.length - 2; i += 2) {
      const x0 = points[i];
      const y0 = points[i + 1];
      const x1 = points[i + 2];
      const y1 = points[i + 3];

      const Qx = 0.75 * x0 + 0.25 * x1;
      const Qy = 0.75 * y0 + 0.25 * y1;
      const Rx = 0.25 * x0 + 0.75 * x1;
      const Ry = 0.25 * y0 + 0.75 * y1;

      newPoints.push(Qx, Qy, Rx, Ry);
    }
    points = newPoints;
  }
  return points;
};

export const convertToGeoJSON = (lines, mapRef) => {
  if (!mapRef.current) {
    console.error('Map reference is not available!');
    return null;
  }

  const geojsonFeatures = lines.map((line) => {
    const coords = [];

    // ✅ Apply smoothing to each line's points
    const smoothedPoints = chaikinSmoothing(line.points, 4); // you can tweak the iteration count

    for (let i = 0; i < smoothedPoints.length; i += 2) {
      const x = smoothedPoints[i];
      const y = smoothedPoints[i + 1];
      const lngLat = mapRef.current.unproject([x, y]);
      coords.push([lngLat.lng, lngLat.lat]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {},
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
  link.download = 'drawing.geojson';
  link.click();
};

export const handlePointerDown = (e, lines, setLines, isDrawing) => {
  isDrawing.current = true;
  const pos = e.target.getStage().getPointerPosition();
  setLines([...lines, { points: [pos.x, pos.y] }]);
};

export const handlePointerMove = (e, lines, setLines, isDrawing) => {
  if (!isDrawing.current) return;
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  lastLine.points = lastLine.points.concat([point.x, point.y]);

  const updatedLines = lines.slice(0, -1).concat(lastLine);
  setLines(updatedLines);
};

export const handlePointerUp = async (
  mapRef,
  lines,
  setLines,
  isDrawing,
  drawCounter,
  setDrawCounter,
  setLayersRef,
  saveFeature,
  closedMode,
  lineCount,
  labelValue = 5 // ✅ new default label value
) => {
  const map = mapRef.current;
  if (!map) return;

  isDrawing.current = false;

  // --- CLOSE THE LAST LINE IF closedMode IS TRUE ---
  if (closedMode && lines.length > 0) {
    const lastLineIndex = lines.length - 1;
    const lastLine = { ...lines[lastLineIndex] };

    if (lastLine.points.length >= 4) {
      const firstX = lastLine.points[0];
      const firstY = lastLine.points[1];
      lastLine.points = [...lastLine.points, firstX, firstY];
      const updatedLines = [...lines];
      updatedLines[lastLineIndex] = lastLine;
      setLines(updatedLines);
      lines = updatedLines;
    }
  }

  // --- CONVERT TO GEOJSON ---
  const geojson = convertToGeoJSON(lines, mapRef);
  const uniqueId = uuidv4();
  const prefix = closedMode ? 'WHC' : 'WHO'; // WHC = Closed, WHO = Open
  const sourceId = `${prefix}_${uniqueId}`;
  const layerId = `${prefix}_${uniqueId}`;
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;

  if (map.getSource(sourceId)) map.removeSource(sourceId);
  if (map.getLayer(layerId)) map.removeLayer(layerId);

  // Determine if the line should be dashed
  const wave_height = parseFloat(labelValue);
  const isDashed = wave_height < 2; // Dash if not closedMode

  map.addSource(sourceId, {
    type: 'geojson',
    data: geojson,
  });

  map.addLayer(
    {
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {},
      slot: "top",
      paint: {
        'line-color': '#0080ff',
        'line-opacity': 0.5,
        'line-width': 3,
        'line-dasharray': isDashed ? [.5, .5] : [], // Dashed line if not closedMode
      },
    },
    beforeLayer
  );

  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    if (lastLine.points.length >= 4) {
      const labelSourceId = `${sourceId}-0`;
      const labelLayerId = `${sourceId}-0`;

      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);

      let features = [];

      if (closedMode) {
        const firstX = lastLine.points[0];
        const firstY = lastLine.points[1];
        const lngLat = map.unproject([firstX, firstY]);
        features.push({
          type: 'Feature',
          geometry: {
            coordinates: [lngLat.lng, lngLat.lat],
            type: 'Point',
          },
          properties: {
            text: String(labelValue), // ✅ use dynamic label value
          },
        });
      } else {
        const firstX = lastLine.points[0];
        const firstY = lastLine.points[1];
        const lastX = lastLine.points[lastLine.points.length - 2];
        const lastY = lastLine.points[lastLine.points.length - 1];

        const firstLngLat = map.unproject([firstX, firstY]);
        const lastLngLat = map.unproject([lastX, lastY]);

        features.push(
          {
            type: 'Feature',
            geometry: {
              coordinates: [firstLngLat.lng, firstLngLat.lat],
              type: 'Point',
            },
            properties: {
              text: String(labelValue), // ✅ dynamic
            },
          },
          {
            type: 'Feature',
            geometry: {
              coordinates: [lastLngLat.lng, lastLngLat.lat],
              type: 'Point',
            },
            properties: {
              text: String(labelValue), // ✅ dynamic
            },
          }
        );
      }

      map.addSource(labelSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      map.addLayer(
        {
          id: labelLayerId,
          type: 'symbol',
          source: labelSourceId,
          slot: "top",
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
        },
        beforeLayer
      );
    }
  }

  if (map.getLayer('custom-points-layer')) {
    try {
      map.moveLayer('custom-points-layer');
    } catch (e) {
      console.warn('Could not move custom-points-layer:', e);
    }
  }

  if (typeof setLayersRef?.current === 'function') {
    const baseName = 'Wave Height Layer';

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
            labelValue: labelValue,
            closedMode: closedMode,
            isFront: false,
            owner: owner?.id,
            project: projectId,
          },
          name: uniqueName,
          sourceId: sourceId,
        }, token).catch((err) => {
          console.error('Error saving feature:', err);
        });
      }

      return [
        ...prevLayers,
        {
          id: layerId,
          sourceID: sourceId,
          name: uniqueName,
          visible: true,
          locked: false,
        },
      ];
    });
  }

  setLines([]);
};

