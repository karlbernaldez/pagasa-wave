// components/utils/layerUtils.js
import { deleteFeature, updateFeatureNameAPI } from '@/api/featureServices';
import Swal from 'sweetalert2';  // Import SweetAlert2

export function addGeoJsonLayer(map, file, layers, setLayers) {
    const reader = new FileReader();
    reader.onload = (e) => {
        let geojson;
        try {
            geojson = JSON.parse(e.target.result);
        } catch (err) {
            console.error("Invalid JSON:", err);
            return;
        }

        const timestamp = Date.now();
        const sourceId = `geojson-source-${timestamp}`;
        const fillLayerId = `geojson-fill-${timestamp}`;
        const lineLayerId = `geojson-line-${timestamp}`;

        map.addSource(sourceId, {
            type: "geojson",
            data: geojson,
        });

        map.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            slot: 'bottom',
            paint: {
                "fill-color": "#0080ff",
                "fill-opacity": 0.2,
            },
        });

        map.addLayer({
            id: lineLayerId,
            type: "line",
            source: sourceId,
            slot: 'bottom',
            paint: {
                "line-color": "#000",
                "line-width": 2,
            },
        });

        const baseName = file.name.replace(/\.[^/.]+$/, "") || "Layer";
        let counter = 1;
        let uniqueName = baseName;
        const existingNames = layers.map((l) => l.name);
        while (existingNames.includes(uniqueName)) {
            uniqueName = `${baseName} ${counter++}`;
        }

        setLayers((prev) => [
            ...prev,
            {
                id: sourceId,
                name: uniqueName,
                visible: true,
                locked: false,
                fillId: fillLayerId,
                lineId: lineLayerId,
            },
        ]);



    };

    reader.readAsText(file);
};

export function toggleLayerVisibility(map, layer, setLayers) {
    if (!map || !layer) return;

    const { name, id, fillId, lineId, visible } = layer;
    const newVisibility = visible ? 'none' : 'visible';

    const cleanedId = id.endsWith('_dash') ? id.slice(0, -5) : id;
    const bg = `${cleanedId}_bg`;
    const dash = `${cleanedId}_dash`;

    if (map.getLayer(name)) map.setLayoutProperty(name, 'visibility', newVisibility);
    if (map.getLayer(bg)) map.setLayoutProperty(bg, 'visibility', newVisibility);
    if (map.getLayer(dash)) map.setLayoutProperty(dash, 'visibility', newVisibility);

    // Toggle Draw-mode layers (e.g., lines and points)
    if (id && map.getLayer(id)) {
        const label0 = `${id}-0`;
        const label1 = `${id}-1`;
        const bg = `${id}_bg`;
        const dash = `${id}_dash`;

        map.setLayoutProperty(id, 'visibility', newVisibility);
        if (map.getLayer(label0)) map.setLayoutProperty(label0, 'visibility', newVisibility);
        if (map.getLayer(label1)) map.setLayoutProperty(label1, 'visibility', newVisibility);
    }

    // Toggle Polygon fill layer
    if (fillId && map.getLayer(fillId)) {
        map.setLayoutProperty(fillId, 'visibility', newVisibility);
    }

    // Toggle Polygon line layer
    if (lineId && map.getLayer(lineId)) {
        map.setLayoutProperty(lineId, 'visibility', newVisibility);
    }

    // Update visibility in state
    setLayers(prev =>
        prev.map(l =>
            l.id === id ? { ...l, visible: !visible } : l
        )
    );
};

export function toggleLayerLock(layer, setLayers) {
    setLayers((prev) =>
        prev.map((l) =>
            l.id === layer.id ? { ...l, locked: !l.locked } : l
        )
    );
};

export function removeLayer(map, layer, setLayers) {
    if (!map || !layer) return;

    const { name, id, fillId, lineId } = layer;
    const cleanedId = id.endsWith('_dash') ? id.slice(0, -5) : id;
    const bg = `${cleanedId}_bg`;
    const dash = `${cleanedId}_dash`;

    // Remove Draw-mode line and its label layers
    if (id) {
        const label0 = `${id}-0`;
        const label1 = `${id}-1`;

        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getLayer(label0)) map.removeLayer(label0);
        if (map.getLayer(label1)) map.removeLayer(label1);
        // if (map.getSource(layer.sourceId || name)) map.removeSource(layer.sourceId || name);
    }

    if (map.getLayer(name)) map.removeLayer(name);
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getLayer(bg)) map.removeLayer(bg);
    if (map.getLayer(dash)) map.removeLayer(dash);

    // Remove Polygon-specific layers
    if (fillId && map.getLayer(fillId)) map.removeLayer(fillId);
    if (lineId && map.getLayer(lineId)) map.removeLayer(lineId);

    // Remove source by id if exists
    if (id && map.getSource(id)) map.removeSource(id);

    // Update state
    setLayers((prev) => prev.filter((l) => l.id !== id));
};

export async function removeFeature(draw, layerID) {

    // Delete from Mapbox Draw
    if (draw && typeof draw.delete === 'function') {
        draw.trash();
        draw.delete(layerID)
    }

    // Delete from backend
    try {
        const token = localStorage.getItem('authToken');

        if (layerID) {
            const cleanedFeatureID = typeof layerID === 'string' && layerID.endsWith('_dash')
                ? layerID.slice(0, -5)
                : layerID;
            await deleteFeature(cleanedFeatureID, token);
        } else {
            await deleteFeature(layerID, token);
        }

    } catch (error) {
        console.error(`Failed to delete feature ${layerID} from backend.`, error);
    }
};

export function updateLayerName(layerId, newName, setLayers, map) {
    const trimmedName = newName.trim();

    if (!trimmedName) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid name',
            text: 'Name cannot be empty.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }

    let expectedNewId = null;
    let layerType = null;

    // 1️⃣ Update React state
    setLayers(prev => {
        const layerToUpdate = prev.find(layer => layer.id === layerId);
        if (!layerToUpdate) return prev;

        layerType = layerToUpdate.type ?? null;

        const newLayerKey = trimmedName;

        expectedNewId = layerType && layerType !== "Wave Height"
            ? `${layerType}_${newLayerKey}`
            : newLayerKey;
        if (
            layerToUpdate.name === trimmedName &&
            layerToUpdate.id === expectedNewId
        ) {
            Swal.fire({
                icon: 'info',
                title: 'No change',
                text: 'The new name and ID are the same as current.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
            });
            return prev;
        }

        return prev.map(layer =>
            layer.id === layerId
                ? { ...layer, name: trimmedName, id: expectedNewId, source: expectedNewId }
                : layer
        );
    });

    // 2️⃣ Update Mapbox layer
    if (map && expectedNewId) {
        const style = map.getStyle();
        const layerDef = style.layers.find(l => l.id === layerId);
        const layerDef0 = style.layers.find(l => l.id === `${layerId}-0`);
        const layerDef1 = style.layers.find(l => l.id === `${layerId}-1`);


        if (!layerDef) return;

        // Remove old layer(s) safely
        if (layerDef.type === 'line') {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getLayer(`${layerId}-0`)) map.removeLayer(`${layerId}-0`);
            if (map.getLayer(`${layerId}-1`)) map.removeLayer(`${layerId}-1`);
        } else {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
        }

        // Re-add with new ID safely
        if (layerDef.type === 'line') {
            if (layerDef) {
                map.addLayer({
                    ...layerDef,
                    id: expectedNewId,
                });
            }

            if (layerDef0) {
                map.addLayer({
                    ...layerDef0,
                    id: `${expectedNewId}-0`,
                });
            }

            if (layerDef1) {
                map.addLayer({
                    ...layerDef1,
                    id: `${expectedNewId}-1`,
                });
            }
        } else {
            if (layerDef) {
                map.addLayer({
                    ...layerDef,
                    id: expectedNewId,
                });
            }
        }

        if (
            layerDef.type === 'symbol' &&
            !expectedNewId.startsWith('less_1')
        ) {
            map.setLayoutProperty(expectedNewId, 'text-field', trimmedName);
        }
    }

    // 3️⃣ Backend update
    updateFeatureNameAPI(layerId, trimmedName)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Name Updated',
                text: `Layer name updated to "${trimmedName}".`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
            });
        })
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update the layer name.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
            });
        });
};

export const handleDragStart = (event, index, setDragging, setDraggedLayerIndex) => {
    setDragging(true);
    setDraggedLayerIndex(index); // Set the index of the layer being dragged
    event.dataTransfer.setData("text/plain", ""); // Necessary for the drag operation to work
};

export const handleDragOver = (event) => {
    event.preventDefault(); // Necessary to allow dropping
};

export const handleDrop = (event, index, draggedLayerIndex, layers, setLayers, setDragging) => {
    event.preventDefault(); // Prevent default behavior (e.g., opening the file)
    setDragging(false); // Stop the dragging state

    // Reorder layers after the drop event
    if (draggedLayerIndex !== null && draggedLayerIndex !== index) {
        const layersCopy = [...layers];
        const draggedLayer = layersCopy[draggedLayerIndex];
        layersCopy.splice(draggedLayerIndex, 1); // Remove dragged layer
        layersCopy.splice(index, 0, draggedLayer); // Insert it at the new position
        setLayers(layersCopy); // Update state with the new layer order
    }
};

export const setActiveLayerOnMap = ({
    id,
    mapRef,
    draw,
    layers,
    activeLayerId,
    setActiveLayerId,
    setActiveMapboxLayerId,
}) => {

    const layer = layers.find((l) => l.id === id);
    if (!layer || !mapRef?.current) {
        console.warn(`[setActiveLayerOnMap] Layer with ID ${id} not found or map not ready.`);
        return;
    }

    const map = mapRef.current;
    let activeLayer = map.getLayer(layer.id) || map.getLayer(layer.name);
    if (!activeLayer) {
        console.warn(`[setActiveLayerOnMap] Layer ${layer.id} or ${layer.name} not found on map.`);
        return;
    }

    const getIconSize = (markerType, isActive) => {
        const sizes = {
            typhoon: { original: 0.03, active: 0.1 },
            low_pressure: { original: 0.015, active: 0.06 },
            high_pressure: { original: 0.015, active: 0.06 },
            less_1: { original: 0.28, active: 0.6 },
        };
        const defaultSize = { original: 0.07, active: 0.1 };
        const size = sizes[markerType] || defaultSize;
        return isActive ? size.active : size.original;
    };

    const resetLayerStyle = (layerIdToReset) => {
        const prevLayer = map.getLayer(layerIdToReset);
        if (!prevLayer) return;

        const prevLayerInfo = layers.find((l) => l.id === prevLayer.id || l.name === prevLayer.id);
        const prevMarkerType = prevLayerInfo?.type;

        if (prevLayer.type === "line") {
            map.setPaintProperty(prevLayer.id, "line-width", 3);
        } else if (prevLayer.type === "symbol") {
            const originalSize = getIconSize(prevMarkerType, false);
            map.setLayoutProperty(prevLayer.id, "icon-size", originalSize);
        }

    };

    const applyActiveLayerStyle = (layerToActivate) => {
        if (layerToActivate.type === "line") {
            map.setPaintProperty(layerToActivate.id, "line-width", 8);
        } else if (layerToActivate.type === "symbol") {
            const activeSize = getIconSize(layer.type, true);
            map.setLayoutProperty(layerToActivate.id, "icon-size", activeSize);
        }

    };

    const selectFeatureInDraw = (layerToSelect) => {
        if (draw?.get && draw?.changeMode) {
            const feature = draw.get(layerToSelect.id);
            if (feature) {
                draw.changeMode("simple_select", { featureIds: [layerToSelect.id] });
            }
        }
    };

    // ✅ Toggle logic: if clicked same layer, reset and deactivate
    if (activeLayerId === layer.id) {
        resetLayerStyle(activeLayer.id);
        setActiveLayerId(null);
        if (setActiveMapboxLayerId) setActiveMapboxLayerId(null);
        return;
    }

    // Reset previous layer if exists
    if (activeLayerId) resetLayerStyle(activeLayerId);

    // Apply new active style
    applyActiveLayerStyle(activeLayer);
    selectFeatureInDraw(activeLayer);

    // Update active state
    setActiveLayerId(layer.id);
    if (setActiveMapboxLayerId) setActiveMapboxLayerId(activeLayer.id);

};