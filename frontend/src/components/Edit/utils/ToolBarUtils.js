import { m } from "framer-motion";
import { removeFeature } from "./layerUtils";
import { v4 as uuidv4 } from 'uuid';
import { saveFeature } from '../../../api/featureServices';
import Swal from 'sweetalert2';

export const handleDrawModeChange = (mode, draw, setLayersRef) => {
  if (draw?.changeMode) {
    if (mode === 'typhoon') { mode = 'draw_point'; } // Normalize to draw_point for typhoon
    draw.changeMode(mode, {
      setLayersRef,
    });
  }
};

export function savePointFeature({ coords, title, selectedType, setLayersRef }) {
  if (typeof setLayersRef?.current !== 'function') return;

  const feature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: coords,
    },
    properties: {
      title,
      type: selectedType,
    },
  };

  const baseName = title || 'Untitled Layer';
  const sourceId = `${selectedType}_${baseName}`;
  const layerId = `${selectedType}_${baseName}`;
  const closedMode = false;

  setLayersRef.current((prevLayers) => {
    const existingNames = prevLayers.map((l) => l.name);
    const owner = JSON.parse(localStorage.getItem("user"));
    const projectId = localStorage.getItem("projectId");

    // ❌ Block and alert if duplicate layer name exists
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

    const token = localStorage.getItem('authToken');

    saveFeature({
      geometry: feature.geometry,
      properties: {
        labelValue: baseName,
        closedMode,
        isFront: false,
        owner: owner?.id,
        project: projectId,
        title,
        type: selectedType,
      },
      name: baseName,
      sourceId,
    }, token)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Feature saved!',
          text: `"${baseName}" has been added successfully.`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3500,
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to save feature',
          text: err?.message || 'An unknown error occurred.',
          confirmButtonColor: '#d33',
        });
      });

    return [
      ...prevLayers,
      {
        id: layerId,
        sourceID: sourceId,
        name: baseName,
        visible: true,
        locked: false,
      },
    ];
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

