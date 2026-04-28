export function toggleLayerVisibility(map, layer, setLayers) {
    if (!map || !layer) return;

    const { id, fillId, lineId, visible } = layer;
    const newVisibility = visible ? 'none' : 'visible';

    const cleanedId = id.endsWith('_dash') ? id.slice(0, -5) : id;
    const bgId   = `${cleanedId}_bg`;
    const dashId = `${cleanedId}_dash`;

    // Named layer (legacy)
    if (map.getLayer(layer.name)) map.setLayoutProperty(layer.name, 'visibility', newVisibility);

    // Derived variants
    for (const lid of [bgId, dashId]) {
        if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', newVisibility);
    }

    // Draw-mode layers + sub-labels
    if (id && map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', newVisibility);
        for (const sub of [`${id}-0`, `${id}-1`]) {
            if (map.getLayer(sub)) map.setLayoutProperty(sub, 'visibility', newVisibility);
        }
    }

    // GeoJSON polygon layers
    if (fillId && map.getLayer(fillId)) map.setLayoutProperty(fillId, 'visibility', newVisibility);
    if (lineId && map.getLayer(lineId)) map.setLayoutProperty(lineId, 'visibility', newVisibility);

    setLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, visible: !visible } : l))
    );
}