import { createFeature } from '@/api/featureServices';
import Swal from 'sweetalert2';

export const handleDrawModeChange = (mode, draw, setLayersRef) => {
  if (draw?.changeMode) {
    if (mode === 'typhoon') { mode = 'draw_point'; } // Normalize to draw_point for typhoon
    // console.log(`Changing draw mode to: ${mode}`);
    draw.changeMode(mode, {
      setLayersRef,
    });
  }
};

const MARKER_TYPE_ALIASES = {
  typhoon: 'typhoon',
  hurricane: 'typhoon',
  storm: 'typhoon',
  tropical_cyclone: 'typhoon',
  tropicalcyclone: 'typhoon',
  low_pressure: 'low_pressure',
  lowpressure: 'low_pressure',
  lpa: 'low_pressure',
  high_pressure: 'high_pressure',
  highpressure: 'high_pressure',
  hpa: 'high_pressure',
  less_1: 'less_1',
  less1: 'less_1',
  less_than_1m: 'less_1',
  lessthan1m: 'less_1',
  low_waves: 'less_1',
  text: 'text_note',
  text_note: 'text_note',
  label: 'text_note',
  map_label: 'text_note',
};

export function normalizeMarkerType(value) {
  const normalized = String(value || 'typhoon')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return MARKER_TYPE_ALIASES[normalized] || normalized || 'typhoon';
}

function getCoordinatePair(coords) {
  if (!coords) return null;

  if (Array.isArray(coords)) {
    const [lng, lat] = coords;
    return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
  }

  if (typeof coords === 'object') {
    const lng = coords.lng;
    const lat = coords.lat;
    return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
  }

  return null;
}

function makeSafeSourceId(type, name) {
  const safeType = String(type || 'marker').trim() || 'marker';
  const safeName = String(name || 'Untitled Layer')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '') || 'Untitled_Layer';

  return `${safeType}_${safeName}_${Date.now()}`;
}

function getActiveProjectId(projectId) {
  const explicitProjectId = String(projectId || '').trim();
  if (explicitProjectId) return explicitProjectId;

  try {
    return String(window.localStorage.getItem('projectId') || '').trim();
  } catch {
    return '';
  }
}

function notifyFeatureSaved(baseName) {
  Swal.fire({
    icon: 'success',
    title: 'Feature saved!',
    text: `"${baseName}" has been added successfully.`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
  });
}

function notifyFeatureSaveFailed(err) {
  Swal.fire({
    icon: 'error',
    title: 'Failed to save feature',
    text: err?.message || 'An unknown error occurred.',
    confirmButtonColor: '#d33',
  });
}

function buildPointFeaturePayload({ feature, baseName, closedMode, activeProjectId, markerType, sourceId }) {
  return {
    geometry: feature.geometry,
    properties: {
      labelValue: baseName,
      closedMode,
      isFront: false,
      project: activeProjectId,
      title: baseName,
      name: baseName,
      type: markerType,
      markerType,
      symbolType: markerType,
      mapLayerId: feature.properties.mapLayerId,
    },
    name: baseName,
    sourceId,
  };
}

export function savePointFeature({ coords, title, selectedType, setLayersRef, projectId }) {
  const normalizedCoords = getCoordinatePair(coords);
  if (!normalizedCoords) {
    console.error('❌ Invalid coords passed to savePointFeature:', coords);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Invalid marker coordinates.',
      showConfirmButton: false,
      timer: 3000,
    });
    return;
  }

  const activeProjectId = getActiveProjectId(projectId);
  if (!activeProjectId) {
    console.error('❌ Missing projectId when saving marker feature.');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No active project selected. Please reopen the project and try again.',
      showConfirmButton: false,
      timer: 3500,
    });
    return;
  }

  const markerType = normalizeMarkerType(selectedType);
  const baseName = title?.trim() || 'Untitled Layer';
  const sourceId = makeSafeSourceId(markerType, baseName);
  const mapLayerId = `${markerType}_${baseName}`;
  const panelId = sourceId;
  const closedMode = false;

  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: normalizedCoords,
    },
    properties: {
      title: baseName,
      name: baseName,
      type: markerType,
      markerType,
      symbolType: markerType,
      mapLayerId,
    },
  };

  const panelLayer = {
    id: panelId,
    sourceID: sourceId,
    name: baseName,
    visible: true,
    locked: false,
    type: markerType,
    markerType,
    mapLayerId,
  };

  const persistFeature = () => createFeature(buildPointFeaturePayload({
    feature,
    baseName,
    closedMode,
    activeProjectId,
    markerType,
    sourceId,
  }))
    .then(() => {
      notifyFeatureSaved(baseName);
    })
    .catch(notifyFeatureSaveFailed);

  const updateLayers = typeof setLayersRef?.current === 'function' ? setLayersRef.current : null;

  if (!updateLayers) {
    persistFeature();
    return;
  }

  updateLayers((prevLayers) => {
    const existingNames = prevLayers.map((layer) => layer.name);

    if (existingNames.includes(baseName)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `The marker named "${baseName}" already exists.`,
        showConfirmButton: false,
        timer: 3000,
      });
      return prevLayers;
    }

    persistFeature();
    return [...prevLayers, panelLayer];
  });
}


// export const handleKeyPress = (
//   event, tools, draw, isDrawing, toggleDrawing, 
//   startDrawing, stopDrawing, setIsDrawing, 
//   onToggleCanvas, onToggleFlagCanvas, map, setLayersRef
// ) => {
//   const key = event.key.toLowerCase();
//   const tool = tools.find(t => t.hotkey === key);

//   // Handle drawing mode change (if tool is pressed)r
//   if (tool) {
//     if (tool.id === 'low_pressure') {tool.id = 'draw_point';} // Normalize to draw_point for low_pressure
//     handleDrawModeChange(tool.id, draw, setLayersRef);
//   }

//   // Handle delete/backspace to remove a layer
//   if ((event.key === 'Backspace' || event.key === 'Delete') && draw?.trash) {
//     const selectedFeatures = draw.getSelected();

//     if (selectedFeatures?.features?.length) {
//       selectedFeatures.features.forEach(feature => {
//         console.log("FEATURE PROPERTIES: ", feature.properties)
//         const featureID = feature.properties?.featureID;
//         const layerID = feature.properties?.layerID

//         if (layerID) {
//           setLayersRef((prevLayers) => prevLayers.filter((l) => l.id !== layerID));
//           removeFeature(draw, layerID, featureID)
//         } else {
//           console.warn("Deleted feature is missing sourceId in properties.");
//         }
//       });
//     } else {
//       console.error("No features selected for deletion.");
//     }
//   }

//   // Handle start/stop drawing (toggle with 'f')
//   if (key === 'f') toggleDrawing(isDrawing, setIsDrawing, onToggleCanvas);

//   // Handle stop drawing with 'x'
//   if (key === 'x' && isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);


// };

export const toggleDrawing = (isDrawing, setIsDrawing, onToggleCanvas) => {
  isDrawing ? stopDrawing(setIsDrawing, onToggleCanvas) : startDrawing(setIsDrawing, onToggleCanvas);
};

export const toggleFlagDrawing = (isFlagDrawing, setIsFlagDrawing, onToggleFlagCanvas) => {
  isFlagDrawing ? stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas) : startFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
};

export const startDrawing = (setIsDrawing, onToggleCanvas) => {
  setIsDrawing(true);
  onToggleCanvas?.(true);
};

export const startFlagDrawing = (setIsFlagDrawing, onToggleFlagCanvas) => {
  setIsFlagDrawing(true);
  onToggleFlagCanvas?.(true);
};

export const stopDrawing = (setIsDrawing, onToggleFlagCanvas) => {
  setIsDrawing(false);
  onToggleFlagCanvas?.(false);
};

export const stopFlagDrawing = (setIsFlagDrawing, onToggleFlagCanvas) => {
  setIsFlagDrawing(false);
  onToggleFlagCanvas?.(false);
};

export const toggleCollapse = (setIsCollapsed) => {
  setIsCollapsed(prev => !prev);
};
