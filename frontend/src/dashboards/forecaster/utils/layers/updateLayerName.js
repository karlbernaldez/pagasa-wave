import { updateFeatureNameAPI } from '@/api/featureServices';
import Swal from 'sweetalert2';

const toast = (icon, title, text) =>
    Swal.fire({ icon, title, text, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });

function rebuildMapboxLayer(map, oldId, newId, suffix = '') {
    const style    = map.getStyle();
    const layerDef = style.layers.find((l) => l.id === `${oldId}${suffix}`);
    if (!layerDef) return;

    if (map.getLayer(`${oldId}${suffix}`)) map.removeLayer(`${oldId}${suffix}`);
    map.addLayer({ ...layerDef, id: `${newId}${suffix}` });
}

export function updateLayerName(layerId, newName, setLayers, map) {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        toast('error', 'Invalid name', 'Name cannot be empty.');
        return;
    }

    let expectedNewId = null;
    let layerType     = null;

    setLayers((prev) => {
        const target = prev.find((l) => l.id === layerId);
        if (!target) return prev;

        layerType = target.type ?? null;
        expectedNewId = layerType && layerType !== 'Wave Height'
            ? `${layerType}_${trimmedName}`
            : trimmedName;

        if (target.name === trimmedName && target.id === expectedNewId) {
            toast('info', 'No change', 'The name and ID are already the same.');
            return prev;
        }

        return prev.map((l) =>
            l.id === layerId
                ? { ...l, name: trimmedName, id: expectedNewId, source: expectedNewId }
                : l
        );
    });

    if (!map || !expectedNewId) return;

    const style    = map.getStyle();
    const layerDef = style.layers.find((l) => l.id === layerId);
    if (!layerDef) return;

    if (layerDef.type === 'line') {
        // Rebuild main layer + sub-labels
        for (const suffix of ['', '-0', '-1']) rebuildMapboxLayer(map, layerId, expectedNewId, suffix);
    } else {
        rebuildMapboxLayer(map, layerId, expectedNewId);
        if (layerDef.type === 'symbol' && !expectedNewId.startsWith('less_1')) {
            map.setLayoutProperty(expectedNewId, 'text-field', trimmedName);
        }
    }

    updateFeatureNameAPI(layerId, trimmedName)
        .then(()  => toast('success', 'Name Updated', `Layer renamed to "${trimmedName}".`))
        .catch(()  => toast('error',   'Update Failed', 'Could not update the layer name.'));
}