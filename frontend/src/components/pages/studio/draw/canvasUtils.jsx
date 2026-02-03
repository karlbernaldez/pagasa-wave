import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { fetchProjectById } from '@/api/projectAPI';

/**
 * Get stroke outline points using perfect-freehand style algorithm
 * Creates a smooth, pressure-sensitive stroke outline
 */
export const getStrokeOutlinePoints = (points, options = {}) => {
  const {
    size = 8,
    thinning = 0.5,
    smoothing = 0.5,
    streamline = 0.5,
  } = options;

  if (points.length < 2) return [];

  // Convert flat array to point objects with pressure
  const pts = [];
  for (let i = 0; i < points.length; i += 2) {
    pts.push({
      x: points[i],
      y: points[i + 1],
      pressure: 0.5, // Default pressure
    });
  }

  // Apply streamline smoothing
  const streamlined = streamline > 0 ? streamlinePoints(pts, streamline) : pts;

  // Calculate stroke points with variable width
  const strokePoints = [];
  for (let i = 0; i < streamlined.length; i++) {
    const point = streamlined[i];
    const pressure = point.pressure || 0.5;
    
    // Calculate width based on pressure and thinning
    const width = size * (1 - thinning * (1 - pressure));
    
    strokePoints.push({
      ...point,
      width,
    });
  }

  // Generate outline
  return strokePoints;
};

/**
 * Streamline points for smoother drawing
 */
const streamlinePoints = (points, streamline) => {
  if (points.length < 2) return points;

  const result = [points[0]];
  let prev = points[0];

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const dx = point.x - prev.x;
    const dy = point.y - prev.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > streamline * 2) {
      // Interpolate between prev and current point
      const steps = Math.ceil(distance / streamline);
      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        result.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t,
          pressure: prev.pressure + (point.pressure - prev.pressure) * t,
        });
      }
      prev = point;
    }
  }

  return result;
};

/**
 * Advanced Douglas-Peucker with adaptive tolerance
 */
export const reducePoints = (points, tolerance = 5) => {
  if (points.length < 4) return points;

  const pointObjs = [];
  for (let i = 0; i < points.length; i += 2) {
    pointObjs.push({ x: points[i], y: points[i + 1] });
  }

  const simplified = douglasPeucker(pointObjs, tolerance);

  const result = [];
  simplified.forEach(p => {
    result.push(p.x, p.y);
  });

  return result;
};

const douglasPeucker = (points, epsilon) => {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
};

const perpendicularDistance = (point, lineStart, lineEnd) => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  }

  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(dx ** 2 + dy ** 2);

  return numerator / denominator;
};

/**
 * Exponential moving average smoothing for real-time drawing
 * Much smoother than Chaikin for live preview
 */
export const lightSmoothPoints = (points, factor = 0.3) => {
  if (points.length < 4) return points;

  const result = [points[0], points[1]];

  for (let i = 2; i < points.length; i += 2) {
    const prevX = result[result.length - 2];
    const prevY = result[result.length - 1];
    const currX = points[i];
    const currY = points[i + 1];

    // Exponential moving average
    const smoothX = prevX + (currX - prevX) * factor;
    const smoothY = prevY + (currY - prevY) * factor;

    result.push(smoothX, smoothY);
  }

  return result;
};

/**
 * Bezier-based smoothing for final output
 * Creates smooth curves through points
 */
export const smoothPoints = (points, tension = 0.5) => {
  if (points.length < 4) return points;

  // First reduce points
  const reducedPoints = reducePoints(points, 3);
  if (reducedPoints.length < 4) return reducedPoints;

  const result = [];
  
  // Add first point
  result.push(reducedPoints[0], reducedPoints[1]);

  // Create smooth curves between points using cardinal splines
  for (let i = 0; i < reducedPoints.length - 2; i += 2) {
    const p0x = i === 0 ? reducedPoints[0] : reducedPoints[i - 2];
    const p0y = i === 0 ? reducedPoints[1] : reducedPoints[i - 1];
    const p1x = reducedPoints[i];
    const p1y = reducedPoints[i + 1];
    const p2x = reducedPoints[i + 2];
    const p2y = reducedPoints[i + 3];
    const p3x = i + 4 < reducedPoints.length ? reducedPoints[i + 4] : reducedPoints[i + 2];
    const p3y = i + 4 < reducedPoints.length ? reducedPoints[i + 5] : reducedPoints[i + 3];

    // Calculate tangents
    const t1x = tension * (p2x - p0x);
    const t1y = tension * (p2y - p0y);
    const t2x = tension * (p3x - p1x);
    const t2y = tension * (p3y - p1y);

    // Number of segments based on distance
    const distance = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);
    const segments = Math.max(4, Math.min(12, Math.floor(distance / 8)));

    // Generate curve points
    for (let t = 0; t <= segments; t++) {
      const st = t / segments;
      const st2 = st * st;
      const st3 = st2 * st;

      // Hermite basis functions
      const h1 = 2 * st3 - 3 * st2 + 1;
      const h2 = -2 * st3 + 3 * st2;
      const h3 = st3 - 2 * st2 + st;
      const h4 = st3 - st2;

      const x = h1 * p1x + h2 * p2x + h3 * t1x + h4 * t2x;
      const y = h1 * p1y + h2 * p2y + h3 * t1y + h4 * t2y;

      result.push(x, y);
    }
  }

  // Add last point
  result.push(reducedPoints[reducedPoints.length - 2], reducedPoints[reducedPoints.length - 1]);

  // Final pass to remove duplicate consecutive points
  return removeDuplicates(result);
};

/**
 * Remove duplicate consecutive points
 */
const removeDuplicates = (points, epsilon = 0.5) => {
  if (points.length < 4) return points;

  const result = [points[0], points[1]];

  for (let i = 2; i < points.length; i += 2) {
    const lastX = result[result.length - 2];
    const lastY = result[result.length - 1];
    const currX = points[i];
    const currY = points[i + 1];

    const dist = Math.sqrt((currX - lastX) ** 2 + (currY - lastY) ** 2);
    if (dist > epsilon) {
      result.push(currX, currY);
    }
  }

  return result;
};

/**
 * Convert canvas lines to GeoJSON format
 */
export const convertToGeoJSON = (lines, mapRef) => {
  if (!mapRef.current) {
    console.error('Map reference is not available!');
    return null;
  }

  const geojsonFeatures = lines.map((line) => {
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

/**
 * Download GeoJSON file
 */
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
  URL.revokeObjectURL(link.href);
};

/**
 * Handle pointer down event - start drawing
 */
export const handlePointerDown = (e, lines, setLines, isDrawing) => {
  isDrawing.current = true;
  const pos = e.target.getStage().getPointerPosition();
  setLines([
    ...lines,
    {
      points: [pos.x, pos.y],
      rawPoints: [pos.x, pos.y],
    },
  ]);
};

/**
 * Handle pointer move event - draw line with smooth preview
 * Optimized with throttling and efficient smoothing
 */
let lastMoveTime = 0;
const MOVE_THROTTLE = 16; // ~60fps

export const handlePointerMove = (e, lines, setLines, isDrawing) => {
  if (!isDrawing.current) return;

  // Throttle move events
  const now = Date.now();
  if (now - lastMoveTime < MOVE_THROTTLE) return;
  lastMoveTime = now;

  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  
  if (!point) return;

  const lastLine = lines[lines.length - 1];
  if (!lastLine) return;

  // Check minimum distance to avoid adding too many points
  const rawPoints = lastLine.rawPoints;
  if (rawPoints.length >= 2) {
    const lastX = rawPoints[rawPoints.length - 2];
    const lastY = rawPoints[rawPoints.length - 1];
    const dist = Math.sqrt((point.x - lastX) ** 2 + (point.y - lastY) ** 2);
    
    // Only add point if it's far enough from last point
    if (dist < 2) return;
  }

  // Add to raw points
  const newRawPoints = rawPoints.concat([point.x, point.y]);

  // Apply exponential moving average for smooth preview
  const smoothedPoints = lightSmoothPoints(newRawPoints, 0.4);

  const updatedLine = {
    ...lastLine,
    points: smoothedPoints,
    rawPoints: newRawPoints,
  };

  const updatedLines = [...lines.slice(0, -1), updatedLine];
  setLines(updatedLines);
};

/**
 * Validate project existence
 */
const validateProject = async (projectId) => {
  if (!projectId) return null;

  try {
    const res = await fetchProjectById(projectId, { credentials: 'include' });
    if (!res || !res._id) return null;
    return res;
  } catch (err) {
    console.error('Project validation failed:', err);
    return null;
  }
};

/**
 * Create label features for the map
 */
const createLabelFeatures = (map, lastLine, closedMode, labelValue) => {
  const features = [];
  const [firstX, firstY] = lastLine.points;
  const firstLngLat = map.unproject([firstX, firstY]);

  if (closedMode) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [firstLngLat.lng, firstLngLat.lat] },
      properties: { text: String(labelValue) },
    });
  } else {
    const [lastX, lastY] = lastLine.points.slice(-2);
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

/**
 * Cleanup map layers and sources
 */
const cleanupMapArtifacts = (map, prefix, sourceId, layerId, labelSourceId, labelLayerId) => {
  try {
    // Remove label layers
    if (labelLayerId && map.getLayer(labelLayerId)) {
      map.removeLayer(labelLayerId);
    }
    if (labelSourceId && map.getSource(labelSourceId)) {
      map.removeSource(labelSourceId);
    }

    // Remove line layers
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Extra safety: clear any layers/sources with this prefix
    const style = map.getStyle();
    
    style.layers
      .filter((l) => l.id.startsWith(prefix + '_'))
      .forEach((l) => {
        try {
          map.removeLayer(l.id);
        } catch (e) {
          console.warn('Error removing layer:', e);
        }
      });

    Object.keys(style.sources)
      .filter((id) => id.startsWith(prefix + '_'))
      .forEach((id) => {
        try {
          map.removeSource(id);
        } catch (e) {
          console.warn('Error removing source:', e);
        }
      });
  } catch (e) {
    console.warn('cleanupMapArtifacts error:', e);
  }
};

/**
 * Handle pointer up event - finish drawing and save
 * Improved with better smoothing and error handling
 */
export const handlePointerUp = async (
  mapRef,
  lines,
  setLines,
  isDrawing,
  drawCounter,
  setDrawCounter,
  setLayersRef,
  createFeature,
  closedMode,
  lineCount,
  labelValue = 5,
  isDarkMode,
  openProjectModal
) => {
  const map = mapRef.current;
  if (!map) return;

  isDrawing.current = false;

  // Get user data
  const owner = JSON.parse(localStorage.getItem('user'));
  const projectId = localStorage.getItem('projectId');
  const token = localStorage.getItem('authToken');

  const lineColor = isDarkMode ? '#19b8b7' : '#000000';
  const textColor = isDarkMode ? '#ffffff' : '#19b8b7';

  // Smooth last line with final algorithm (Hermite splines)
  if (lines.length > 0) {
    const lastIndex = lines.length - 1;
    const lastLine = { ...lines[lastIndex] };
    
    if (lastLine.rawPoints?.length >= 4) {
      // Use Hermite spline smoothing for final output
      lastLine.points = smoothPoints(lastLine.rawPoints, 0.5);
    }
    
    const updatedLines = [...lines];
    updatedLines[lastIndex] = lastLine;
    setLines(updatedLines);
    lines = updatedLines;
  }

  // Close last line if in closed mode
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

  // Convert to GeoJSON and check size
  const geojson = convertToGeoJSON(lines, mapRef);
  const payloadSize = JSON.stringify(geojson).length;

  if (payloadSize > 100000) {
    await Swal.fire({
      icon: 'info',
      title: 'Feature Too Large',
      text: 'This feature is too large to save. Try simplifying it.',
      confirmButtonColor: isDarkMode ? '#6366f1' : '#3b82f6',
    });
    return;
  }

  // Prepare IDs
  const uniqueId = uuidv4();
  const prefix = closedMode ? 'WHC' : 'WHO';
  const sourceId = `${prefix}_${uniqueId}`;
  const layerId = `${prefix}_${uniqueId}`;
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;
  let labelLayerId = '';
  let labelSourceId = '';

  // Add line layer (visual feedback)
  map.addSource(sourceId, { 
    type: 'geojson', 
    data: geojson, 
    lineMetrics: true 
  });

  map.addLayer(
    {
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 
        'line-join': 'round', 
        'line-cap': 'round' 
      },
      slot: 'top',
      paint: {
        'line-color': lineColor,
        'line-opacity': 0.6,
        'line-width': 3,
        'line-dasharray': parseFloat(labelValue) < 2 ? [0.5, 0.5] : [],
        'line-blur': 0.3,
      },
    },
    beforeLayer
  );

  // Add labels
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

  // Keep custom-points-layer on top
  if (map.getLayer('custom-points-layer')) {
    try {
      map.moveLayer('custom-points-layer');
    } catch (e) {
      console.warn('Could not move custom-points-layer:', e);
    }
  }

  // Validate project
  const project = await validateProject(projectId);

  if (!project) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Project Selected',
      text: 'Please create or select a valid project before saving features.',
      confirmButtonColor: isDarkMode ? '#6366f1' : '#3b82f6',
    });

    cleanupMapArtifacts(map, prefix, sourceId, layerId, labelSourceId, labelLayerId);
    setLines([]);
    return;
  }

  // Compute unique name
  const baseName = 'Wave Height Layer';
  let computedName = baseName;

  if (typeof setLayersRef?.current === 'function') {
    setLayersRef.current((prevLayers) => {
      const existingNames = prevLayers.map((l) => l.name);
      let counter = 1;
      while (existingNames.includes(computedName)) {
        computedName = `${baseName} ${counter++}`;
      }
      return prevLayers;
    });
  }

  if (!computedName) {
    computedName = `${baseName} ${uniqueId.slice(0, 6)}`;
  }

  // Save feature
  if (geojson.features.length > 0) {
    const feature = geojson.features[0];

    try {
      await createFeature(
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

      // Add layer entry to UI state
      if (typeof setLayersRef?.current === 'function') {
        setLayersRef.current((prevLayers) => {
          let nameToInsert = computedName;
          const existingNames = prevLayers.map((l) => l.name);
          
          if (existingNames.includes(nameToInsert)) {
            let counter = 1;
            while (existingNames.includes(`${nameToInsert} ${counter}`)) {
              counter++;
            }
            nameToInsert = `${nameToInsert} ${counter}`;
          }

          return [
            ...prevLayers,
            {
              id: layerId,
              sourceID: sourceId,
              name: nameToInsert,
              visible: true,
              locked: false,
            },
          ];
        });
      }

      // Optional: Show success message
      // await Swal.fire({
      //   icon: 'success',
      //   title: 'Saved!',
      //   text: 'Wave height layer saved successfully.',
      //   timer: 1500,
      //   showConfirmButton: false,
      // });

    } catch (err) {
      console.error('Error saving feature:', err);
      
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Could not save feature. The visual layers will be removed.',
        confirmButtonColor: isDarkMode ? '#6366f1' : '#3b82f6',
      });

      cleanupMapArtifacts(map, prefix, sourceId, layerId, labelSourceId, labelLayerId);
    }
  }

  // Clear lines
  setLines([]);
};