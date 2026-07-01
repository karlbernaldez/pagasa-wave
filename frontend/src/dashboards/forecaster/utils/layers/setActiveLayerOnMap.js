import { getLiveMapboxLayerIds, getMarkerType } from './layerIdentity';

const ACTIVE_HIGHLIGHT_PREFIX = '__active_annotation_highlight__';
const ACTIVE_HIGHLIGHT_SOURCE = `${ACTIVE_HIGHLIGHT_PREFIX}_empty_source`;

const resolveSourceId = (layerInfo) => layerInfo?.sourceID || layerInfo?.sourceId || layerInfo?.source || layerInfo?.id;

const isFrontLayer = (layerInfo) => {
    const sourceId = resolveSourceId(layerInfo);
    const label = `${layerInfo?.type || ''} ${layerInfo?.name || ''}`.toLowerCase();

    return Boolean(
        layerInfo?.properties?.isFront ||
        layerInfo?.isFront ||
        sourceId?.startsWith?.('SF_') ||
        label.includes('front')
    );
};

const resolveFrontLayerIds = (layerInfo) => {
    const sourceId = resolveSourceId(layerInfo);
    if (!sourceId) return [];

    return [
        `${sourceId}_dash`,
        `${sourceId}_secondary`,
        `${sourceId}_frontSymbols`,
        `${sourceId}_frontSymbolOutline`,
        sourceId,
    ];
};

const resolveMapboxLayerIds = (map, layerInfo) => {
    if (isFrontLayer(layerInfo)) return resolveFrontLayerIds(layerInfo);

    if (layerInfo.type === 'Wave Height') {
        return [layerInfo.id, `${layerInfo.id}-0`, `${layerInfo.id}-1`];
    }

    if (getMarkerType(layerInfo)) {
        return getLiveMapboxLayerIds(map, layerInfo);
    }

    return [layerInfo.mapLayerId, layerInfo.id].filter(Boolean);
};

const removeActiveHighlightLayers = (map) => {
    if (!map?.getStyle) return;

    const style = map.getStyle();
    const highlightLayerIds = (style?.layers || [])
        .map((layer) => layer.id)
        .filter((id) => id.startsWith(ACTIVE_HIGHLIGHT_PREFIX));

    highlightLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
    });

    if (map.getSource(ACTIVE_HIGHLIGHT_SOURCE)) {
        map.removeSource(ACTIVE_HIGHLIGHT_SOURCE);
    }
};

const getSharedLayerDefinition = (mapLayer) => {
    const definition = {
        source: mapLayer.source,
        filter: mapLayer.filter,
        slot: mapLayer.slot,
    };

    if (mapLayer['source-layer']) definition['source-layer'] = mapLayer['source-layer'];
    if (mapLayer.sourceLayer) definition['source-layer'] = mapLayer.sourceLayer;

    Object.keys(definition).forEach((key) => {
        if (definition[key] === undefined) delete definition[key];
    });

    return definition;
};

const safeAddHighlightLayer = (map, layer, beforeId) => {
    if (!layer?.id || map.getLayer(layer.id)) return;

    try {
        map.addLayer(layer, beforeId && map.getLayer(beforeId) ? beforeId : undefined);
    } catch (error) {
        console.warn(`[setActiveLayerOnMap] Could not add active highlight layer "${layer.id}"`, error);
    }
};

const addActiveHighlightForLayer = (map, layerId, index) => {
    const mapLayer = map.getLayer(layerId);
    if (!mapLayer?.source) return;

    const shared = getSharedLayerDefinition(mapLayer);
    const highlightId = `${ACTIVE_HIGHLIGHT_PREFIX}_${index}_${mapLayer.type}`;

    if (mapLayer.type === 'line') {
        const existingWidth = map.getPaintProperty(layerId, 'line-width');
        const baseWidth = typeof existingWidth === 'number' ? existingWidth : 4;
        safeAddHighlightLayer(map, {
            id: highlightId,
            type: 'line',
            ...shared,
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                visibility: 'visible',
            },
            paint: {
                'line-color': '#22d3ee',
                'line-opacity': 0.55,
                'line-width': Math.max(baseWidth + 6, 8),
                'line-blur': 1.5,
            },
        }, layerId);
        return;
    }

    if (mapLayer.type === 'fill') {
        safeAddHighlightLayer(map, {
            id: highlightId,
            type: 'line',
            ...shared,
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                visibility: 'visible',
            },
            paint: {
                'line-color': '#22d3ee',
                'line-opacity': 0.8,
                'line-width': 3,
                'line-blur': 0.5,
            },
        }, layerId);
        return;
    }

    if (mapLayer.type === 'symbol') {
        safeAddHighlightLayer(map, {
            id: highlightId,
            type: 'circle',
            ...shared,
            filter: ['==', '$type', 'Point'],
            paint: {
                'circle-radius': 18,
                'circle-color': '#22d3ee',
                'circle-opacity': 0.16,
                'circle-stroke-color': '#67e8f9',
                'circle-stroke-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-blur': 0.2,
            },
        }, layerId);
    }
};

const addActiveHighlights = (map, mapboxLayerIds) => {
    removeActiveHighlightLayers(map);
    mapboxLayerIds.forEach((layerId, index) => addActiveHighlightForLayer(map, layerId, index));
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

    const mapboxLayerIds = resolveMapboxLayerIds(map, layerInfo).filter((lid) => map.getLayer(lid));
    if (!mapboxLayerIds.length) {
        console.warn(`[setActiveLayerOnMap] No Mapbox layers found for "${layerInfo.id}"`);
        return;
    }

    // Toggle off same layer. Do not mutate user style; only remove temporary highlights.
    if (activeLayerId === layerInfo.id) {
        removeActiveHighlightLayers(map);
        setActiveLayerId(null);
        setActiveMapboxLayerId?.([]);
        return;
    }

    // Activate new layer with a non-persistent highlight overlay.
    addActiveHighlights(map, mapboxLayerIds);

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
