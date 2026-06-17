const SYMBOL_SIZES = {
    typhoon: { icon: { original: 0.03, active: 0.1 }, text: { original: 12, active: 16 } },
    low_pressure: { icon: { original: 0.015, active: 0.06 }, text: { original: 11, active: 14 } },
    high_pressure: { icon: { original: 0.015, active: 0.06 }, text: { original: 11, active: 14 } },
    less_1: { icon: { original: 0.28, active: 0.6 }, text: { original: 12, active: 18 } },
    text_note: { icon: { original: 0.01, active: 0.01 }, text: { original: 16, active: 22 } },
    'Wave Height': { icon: { original: 0.12, active: 0.12 }, text: { original: 18, active: 24 } },
    default: { icon: { original: 0.07, active: 0.1 }, text: { original: 18, active: 24 } },
};

const MARKER_TYPES = new Set(['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note']);

const getSymbolSizes = (markerType, isActive) => {
    const cfg = SYMBOL_SIZES[markerType] ?? SYMBOL_SIZES.default;
    return {
        iconSize: isActive ? cfg.icon.active : cfg.icon.original,
        textSize: isActive ? cfg.text.active : cfg.text.original,
    };
};

const resolveMarkerLayerId = (layerInfo) => {
    const markerType = layerInfo?.markerType || layerInfo?.type;
    const name = layerInfo?.name;

    if (!MARKER_TYPES.has(markerType) || !name) return null;
    return `${markerType}_${name}`;
};

const resolveMapboxLayerIds = (layerInfo) => {
    if (layerInfo.type === 'Wave Height') {
        return [layerInfo.id, `${layerInfo.id}-0`, `${layerInfo.id}-1`];
    }

    return [
        layerInfo.mapLayerId,
        resolveMarkerLayerId(layerInfo),
        layerInfo.id,
    ].filter(Boolean);
};

const setLayerStyles = (map, mapboxLayerIds, markerType, isActive) => {
    for (const lid of mapboxLayerIds) {
        const mapLayer = map.getLayer(lid);
        if (!mapLayer) continue;

        if (mapLayer.type === 'line') {
            map.setPaintProperty(lid, 'line-width', isActive ? 8 : 3);
        } else if (mapLayer.type === 'symbol') {
            const { iconSize, textSize } = getSymbolSizes(markerType, isActive);
            if (map.getLayoutProperty(lid, 'icon-image')) {
                map.setLayoutProperty(lid, 'icon-size', iconSize);
            }
            map.setLayoutProperty(lid, 'text-size', textSize);
        }
    }
};

export const setActiveLayerOnMap = ({
    id, mapRef, draw, layers,
    activeLayerId, setActiveLayerId, setActiveMapboxLayerId,
}) => {
    const layerInfo = layers.find((l) => l.id === id);
    const map = mapRef?.current;

    if (!layerInfo || !map) {
        console.warn(`[setActiveLayerOnMap] Layer "${id}" not found or map not ready.`);
        return;
    }

    const mapboxLayerIds = resolveMapboxLayerIds(layerInfo).filter((lid) => map.getLayer(lid));
    if (!mapboxLayerIds.length) {
        console.warn(`[setActiveLayerOnMap] No Mapbox layers found for "${layerInfo.id}"`);
        return;
    }

    // Toggle off same layer
    if (activeLayerId === layerInfo.id) {
        setLayerStyles(map, mapboxLayerIds, layerInfo.type, false);
        setActiveLayerId(null);
        setActiveMapboxLayerId?.([]);
        return;
    }

    // Reset previous
    if (activeLayerId) {
        const prev = layers.find((l) => l.id === activeLayerId);
        if (prev) {
            const prevIds = resolveMapboxLayerIds(prev).filter((lid) => map.getLayer(lid));
            setLayerStyles(map, prevIds, prev.type, false);
        }
    }

    // Activate new
    setLayerStyles(map, mapboxLayerIds, layerInfo.type, true);

    if (draw?.get && draw?.changeMode) {
        for (const lid of mapboxLayerIds) {
            if (draw.get(lid)) {
                draw.changeMode('simple_select', { featureIds: [lid] });
                break;
            }
        }
    }

    setActiveLayerId(layerInfo.id);
    setActiveMapboxLayerId?.(mapboxLayerIds);
};
