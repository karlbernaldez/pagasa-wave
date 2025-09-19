import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { fetchProjectById } from '../../../api/projectAPI';

// More aggressive point reduction to prevent payload issues
export const reducePoints = (points, tolerance = 5) => {
  if (points.length < 4) return points;

  const result = [points[0], points[1]]; // Always keep first point

  for (let i = 2; i < points.length - 2; i += 2) {
    const lastX = result[result.length - 2];
    const lastY = result[result.length - 1];
    const currX = points[i];
    const currY = points[i + 1];

    const distance = Math.sqrt((currX - lastX) ** 2 + (currY - lastY) ** 2);

    // Only add point if it's far enough from the last point
    if (distance > tolerance) {
      result.push(currX, currY);
    }
  }

  // Always keep last point if it's different from the last added point
  const lastX = result[result.length - 2];
  const lastY = result[result.length - 1];
  const finalX = points[points.length - 2];
  const finalY = points[points.length - 1];

  if (Math.sqrt((finalX - lastX) ** 2 + (finalY - lastY) ** 2) > tolerance / 2) {
    result.push(finalX, finalY);
  }

  return result;
};

// Lightweight smoothing for Konva preview - minimal processing
export const lightSmoothPoints = (points, factor = 0.2) => {
  if (points.length < 6) return points;

  const result = [points[0], points[1]]; // Keep first point

  for (let i = 2; i < points.length - 2; i += 2) {
    const prevX = points[i - 2];
    const prevY = points[i - 1];
    const currX = points[i];
    const currY = points[i + 1];
    const nextX = points[i + 2];
    const nextY = points[i + 3];

    // Light smoothing
    const smoothX = currX + (prevX + nextX - 2 * currX) * factor;
    const smoothY = currY + (prevY + nextY - 2 * currY) * factor;

    result.push(smoothX, smoothY);
  }

  // Keep last point
  result.push(points[points.length - 2], points[points.length - 1]);
  return result;
};

// Optimized smoothing with fewer segments for final output
export const smoothPoints = (points, numOfSegments = 8) => {
  if (points.length < 4) return points;

  // First reduce points to prevent too many segments
  const reducedPoints = reducePoints(points, 3);
  if (reducedPoints.length < 4) return reducedPoints;

  const result = [];
  const pts = reducedPoints.slice();

  // duplicate first and last points
  pts.unshift(reducedPoints[0], reducedPoints[1]);
  pts.push(reducedPoints[reducedPoints.length - 2], reducedPoints[reducedPoints.length - 1]);

  for (let i = 2; i < pts.length - 4; i += 2) {
    const p0 = { x: pts[i - 2], y: pts[i - 1] };
    const p1 = { x: pts[i], y: pts[i + 1] };
    const p2 = { x: pts[i + 2], y: pts[i + 3] };
    const p3 = { x: pts[i + 4], y: pts[i + 5] };

    for (let t = 0; t <= numOfSegments; t++) {
      const st = t / numOfSegments;

      const x =
        0.5 *
        ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * (st * st * st) +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * (st * st) +
          (-p0.x + p2.x) * st +
          2 * p1.x);

      const y =
        0.5 *
        ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * (st * st * st) +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * (st * st) +
          (-p0.y + p2.y) * st +
          2 * p1.y);

      result.push(x, y);
    }
  }

  // Final reduction to ensure manageable payload size
  return reducePoints(result, 2);
};

export const convertToGeoJSON = (lines, mapRef) => {
  if (!mapRef.current) {
    console.error('Map reference is not available!');
    return null;
  }

  const geojsonFeatures = lines.map((line) => {
    // Use the final smoothed points for GeoJSON conversion
    const finalPoints = line.points;
    const coords = [];

    for (let i = 0; i < finalPoints.length; i += 2) {
      const x = finalPoints[i];
      const y = finalPoints[i + 1];
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
  setLines([...lines, {
    points: [pos.x, pos.y],
    rawPoints: [pos.x, pos.y]
  }]);
};

export const handlePointerMove = (e, lines, setLines, isDrawing) => {
  if (!isDrawing.current) return;

  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  const lastLine = lines[lines.length - 1];

  // Add to raw points
  const newRawPoints = lastLine.rawPoints.concat([point.x, point.y]);

  // More aggressive point reduction during drawing to prevent lag
  const reducedPoints = reducePoints(newRawPoints, 5);
  const smoothedPoints = lightSmoothPoints(reducedPoints);

  const updatedLine = {
    ...lastLine,
    points: smoothedPoints,
    rawPoints: newRawPoints
  };

  const updatedLines = lines.slice(0, -1).concat(updatedLine);
  setLines(updatedLines);
};

// Helper: validate project
const validateProject = async (projectId) => {
  if (!projectId) return null;

  try {
    const res = await fetchProjectById(projectId, { credentials: 'include' });

    // res is already the JSON object
    if (!res || !res._id) return null;

    return res; // no need for res.json()
  } catch (err) {
    console.error("Project validation failed:", err);
    return null;
  }
};

// Helper: create label features
const createLabelFeatures = (map, lastLine, closedMode, labelValue) => {
  const features = [];
  if (closedMode) {
    const [firstX, firstY] = lastLine.points;
    const lngLat = map.unproject([firstX, firstY]);
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] },
      properties: { text: String(labelValue) },
    });
  } else {
    const [firstX, firstY] = lastLine.points;
    const [lastX, lastY] = lastLine.points.slice(-2);
    const firstLngLat = map.unproject([firstX, firstY]);
    const lastLngLat = map.unproject([lastX, lastY]);
    features.push(
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [firstLngLat.lng, firstLngLat.lat] },
        properties: { text: String(labelValue) },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lastLngLat.lng, lastLngLat.lat] },
        properties: { text: String(labelValue) },
      }
    );
  }
  return features;
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
  labelValue = 5,
  isDarkMode,
  openProjectModal
) => {
  const map = mapRef.current;
  if (!map) return;

  isDrawing.current = false;
  const owner = JSON.parse(localStorage.getItem('user'));
  const projectId = localStorage.getItem('projectId');
  const token = localStorage.getItem('authToken');

  const lineColor = isDarkMode ? '#19b8b7' : '#000000';
  const textColor = isDarkMode ? '#ffffff' : '#19b8b7';

  // --- Smooth last line ---
  if (lines.length > 0) {
    const lastIndex = lines.length - 1;
    const lastLine = { ...lines[lastIndex] };
    if (lastLine.rawPoints?.length >= 4) {
      lastLine.points = smoothPoints(lastLine.rawPoints, 6);
    }
    const updatedLines = [...lines];
    updatedLines[lastIndex] = lastLine;
    setLines(updatedLines);
    lines = updatedLines;
  }

  // --- Close last line if needed ---
  if (closedMode && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const lastLine = { ...lines[lastIndex] };
    if (lastLine.points.length >= 4) {
      const [firstX, firstY] = lastLine.points;
      lastLine.points = [...lastLine.points, firstX, firstY];
      const updatedLines = [...lines];
      updatedLines[lastIndex] = lastLine;
      setLines(updatedLines);
      lines = updatedLines;
    }
  }

  // --- Convert to GeoJSON & size check ---
  const geojson = convertToGeoJSON(lines, mapRef);
  const payloadSize = JSON.stringify(geojson).length;
  if (payloadSize > 100000) {
    Swal.fire({
      icon: 'info',
      title: 'Feature Too Large',
      text: 'This feature is too large to save. Try simplifying it.',
    });
    return;
  }

  // --- Prepare IDs & helper cleanup fn ---
  const uniqueId = uuidv4();
  const prefix = closedMode ? 'WHC' : 'WHO';
  const sourceId = `${prefix}_${uniqueId}`;
  const layerId = `${prefix}_${uniqueId}`;
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;
  let labelLayerId = '';
  let labelSourceId = '';

  const cleanupMapArtifacts = () => {
    try {

      // remove labels
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);

      // remove lines
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // extra safety: clear any layers/sources with this prefix
      map.getStyle().layers
        .filter(l => l.id.startsWith(prefix + '_'))
        .forEach(l => {
          try { map.removeLayer(l.id); } catch { }
        });

      Object.keys(map.getStyle().sources)
        .filter(id => id.startsWith(prefix + '_'))
        .forEach(id => {
          try { map.removeSource(id); } catch { }
        });

    } catch (e) {
      console.warn('cleanupMapArtifacts error:', e);
    }
  };

  // --- Draw line layer (visual feedback) ---
  map.addSource(sourceId, { type: 'geojson', data: geojson, lineMetrics: true });
  map.addLayer(
    {
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      slot: 'top',
      paint: {
        'line-color': lineColor,
        'line-opacity': 0.5,
        'line-width': 3,
        'line-dasharray': parseFloat(labelValue) < 2 ? [0.5, 0.5] : [],
        'line-blur': 0.5,
      },
    },
    beforeLayer
  );

  // --- Add labels visually ---
  if (lines.length > 0 && lines.at(-1).points.length >= 4) {
    const labelFeatures = createLabelFeatures(map, lines.at(-1), closedMode, labelValue);
    labelSourceId = `${sourceId}-0`;
    labelLayerId = `${sourceId}-0`;

    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);

    map.addSource(labelSourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: labelFeatures },
    });

    map.addLayer(
      {
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
      },
      beforeLayer
    );
  }

  // keep custom-points-layer on top
  if (map.getLayer('custom-points-layer')) {
    try { map.moveLayer('custom-points-layer'); } catch (e) { console.warn('Could not move custom-points-layer:', e); }
  }

  // --- Validate project BEFORE saving ---

  const project = await validateProject(projectId);

  if (!project) {
    // inform user and remove the visual layers we added
    Swal.fire({
      icon: 'warning',
      title: 'No Project Selected',
      text: 'Please create or select a valid project before saving features.',
    }).then((res) => {
      cleanupMapArtifacts();
      setLines([]);
    });

    return;
  }

  // --- Compute a unique name (read current layers, but don't add yet) ---
  const baseName = 'Wave Height Layer';
  let computedName = baseName;
  if (typeof setLayersRef?.current === 'function') {
    // use updater to read current layers synchronously and compute a non-colliding name
    setLayersRef.current((prevLayers) => {
      const existingNames = prevLayers.map((l) => l.name);
      let counter = 1;
      while (existingNames.includes(computedName)) {
        computedName = `${baseName} ${counter++}`;
      }
      // return prevLayers unchanged — we will add only after save success
      return prevLayers;
    });
  }

  // If we couldn't get a name above (no setLayersRef), fallback to baseName + uuid short
  if (!computedName) computedName = `${baseName} ${uniqueId.slice(0, 6)}`;

  // --- Attempt to save feature (use computedName) ---
  if (geojson.features.length > 0) {
    const feature = geojson.features[0];

    try {
      await saveFeature(
        {
          geometry: feature.geometry,
          properties: {
            labelValue,
            closedMode,
            isFront: false,
            owner: owner?.id,
            project: projectId,
          },
          name: computedName,
          sourceId,
        },
        token
      );

      // on success: only now add the layer entry to the UI state
      if (typeof setLayersRef?.current === 'function') {
        setLayersRef.current((prevLayers) => {
          // recompute uniqueness just before inserting (race-safe)
          let nameToInsert = computedName;
          const existingNames = prevLayers.map((l) => l.name);
          if (existingNames.includes(nameToInsert)) {
            let counter = 1;
            while (existingNames.includes(`${nameToInsert} ${counter}`)) counter++;
            nameToInsert = `${nameToInsert} ${counter}`;
          }

          return [...prevLayers, {
            id: layerId,
            sourceID: sourceId,
            name: nameToInsert,
            visible: true,
            locked: false,
          }];
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Feature Saved',
        text: 'Your feature was saved successfully!',
        timer: 800,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error('Error saving feature:', err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Could not save feature. The visual layers will be removed.',
      });

      // cleanup unsaved visual artifacts
      cleanupMapArtifacts();
    }
  }

  // clear lines regardless
  setLines([]);
};