import { useCallback } from 'react';

export function useLayerStyle(mapRef) {
    const setPaint = useCallback((layerIds, property, value) => {
        const map = mapRef?.current;
        if (!map || !layerIds?.length || value === undefined) return;
        for (const id of layerIds) {
            if (!id) continue;
            if (map.getLayer(id)) map.setPaintProperty(id, property, value);
        }
    }, [mapRef]);

    const setLayout = useCallback((layerIds, property, value) => {
        const map = mapRef?.current;
        if (!map || !layerIds?.length || value === undefined) return;
        for (const id of layerIds) {
            if (!id) continue;
            if (map.getLayer(id)) map.setLayoutProperty(id, property, value);
        }
    }, [mapRef]);

    return { setPaint, setLayout };
}