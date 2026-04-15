export function toggleLayerLock(layer, setLayers) {
    setLayers((prev) =>
        prev.map((l) => (l.id === layer.id ? { ...l, locked: !l.locked } : l))
    );
}