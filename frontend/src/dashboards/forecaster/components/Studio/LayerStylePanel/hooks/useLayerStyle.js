import { useCallback } from 'react';

function resolveLayerIds(map, candidateIds = []) {
    const resolved = new Set();
    const layers = map?.getStyle?.()?.layers || [];

    for (const id of candidateIds) {
        if (!id) continue;
        if (map.getLayer?.(id)) resolved.add(id);

        for (const layer of layers) {
            if (layer?.source === id) resolved.add(layer.id);
        }
    }

    return Array.from(resolved);
}

export function useLayerStyle(mapRef) {
    const setPaint = useCallback((layerIds, property, value) => {
        const map = mapRef?.current;
        if (!map || !layerIds?.length || value === undefined) return;

        for (const id of resolveLayerIds(map, layerIds)) {
            try {
                map.setPaintProperty(id, property, value);
            } catch {
                // Some resolved layers do not support every paint property.
            }
        }
    }, [mapRef]);

    const setLayout = useCallback((layerIds, property, value) => {
        const map = mapRef?.current;
        if (!map || !layerIds?.length || value === undefined) return;

        for (const id of resolveLayerIds(map, layerIds)) {
            try {
                map.setLayoutProperty(id, property, value);
            } catch {
                // Some resolved layers do not support every layout property.
            }
        }
    }, [mapRef]);

    return { setPaint, setLayout };
}
