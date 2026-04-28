function safeRemoveLayer(map, id) {
    if (id && map.getLayer(id)) map.removeLayer(id);
}

function safeRemoveSource(map, id) {
    if (id && map.getSource(id)) map.removeSource(id);
}

export function removeLayer(map, layer, setLayers) {
    if (!map || !layer) return;

    const { name, id, fillId, lineId } = layer;
    const cleanedId = id.endsWith('_dash') ? id.slice(0, -5) : id;

    // Draw-mode layer + sub-labels
    safeRemoveLayer(map, id);
    safeRemoveLayer(map, `${id}-0`);
    safeRemoveLayer(map, `${id}-1`);

    // Derived variants
    safeRemoveLayer(map, name);
    safeRemoveLayer(map, `${cleanedId}_bg`);
    safeRemoveLayer(map, `${cleanedId}_dash`);

    // GeoJSON polygon layers
    safeRemoveLayer(map, fillId);
    safeRemoveLayer(map, lineId);

    // Source cleanup
    safeRemoveSource(map, id);

    setLayers((prev) => prev.filter((l) => l.id !== id));
}