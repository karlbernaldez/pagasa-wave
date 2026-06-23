import { updateFeatureStyle } from '@/api/featureServices';

const pendingStyleTimers = new Map();
const STYLE_SAVE_DEBOUNCE_MS = 250;

export function getLayerSourceId(layerInfo) {
  return layerInfo?.sourceID || layerInfo?.sourceId || layerInfo?.source || layerInfo?.id;
}

export function getPersistedStyle(featureOrLayer) {
  return featureOrLayer?.properties?.style || featureOrLayer?.style || {};
}

export function getMergedStyle(featureOrLayer, runtimeStyle = {}) {
  return {
    ...getPersistedStyle(featureOrLayer),
    ...runtimeStyle,
  };
}

export function queuePersistAnnotationStyle(layerInfo, style) {
  const sourceId = getLayerSourceId(layerInfo);
  if (!sourceId || layerInfo?.canEdit === false) return;

  if (pendingStyleTimers.has(sourceId)) {
    window.clearTimeout(pendingStyleTimers.get(sourceId));
  }

  pendingStyleTimers.set(sourceId, window.setTimeout(async () => {
    pendingStyleTimers.delete(sourceId);
    try {
      await updateFeatureStyle(sourceId, style || {});
    } catch (error) {
      console.error('[STYLE SAVE ERROR]', error);
    }
  }, STYLE_SAVE_DEBOUNCE_MS));
}

function safeSetPaint(map, layerId, prop, value) {
  if (value === undefined || value === null || !map?.getLayer(layerId)) return;
  try { map.setPaintProperty(layerId, prop, value); } catch { }
}

function safeSetLayout(map, layerId, prop, value) {
  if (value === undefined || value === null || !map?.getLayer(layerId)) return;
  try { map.setLayoutProperty(layerId, prop, value); } catch { }
}

function markerLayerId(feature) {
  const props = feature?.properties || {};
  const markerType = props.markerType || props.type;
  const name = feature?.name || props.name || props.title || props.labelValue;
  if (!markerType || !name) return null;
  return props.mapLayerId || `${markerType}_${name}`;
}

function getAnnotationSourceId(feature) {
  const props = feature?.properties || {};
  return feature?.sourceId || props.sourceId || props.stableId || props.annotationId || feature?.id;
}

function frontLayerIds(feature) {
  const sourceId = getAnnotationSourceId(feature);
  return sourceId ? [`${sourceId}_dash`, `${sourceId}_secondary`, `${sourceId}_frontSymbols`, `${sourceId}_frontSymbolOutline`, sourceId] : [];
}

function genericLayerIds(feature) {
  const props = feature?.properties || {};
  const sourceId = getAnnotationSourceId(feature);
  return Array.from(new Set([
    props.mapLayerId,
    markerLayerId(feature),
    sourceId,
    sourceId ? `${sourceId}-0` : null,
    sourceId ? `${sourceId}-1` : null,
  ].filter(Boolean)));
}

export function applyAnnotationStyleToMap(map, feature) {
  const style = getPersistedStyle(feature);
  if (!map || !feature || !style || Object.keys(style).length === 0) return;

  const props = feature.properties || {};
  const isFront = Boolean(props.isFront || getAnnotationSourceId(feature)?.startsWith?.('SF_'));
  const candidateIds = isFront ? frontLayerIds(feature) : genericLayerIds(feature);

  candidateIds.forEach((layerId) => {
    const layer = map.getLayer(layerId);
    if (!layer) return;

    if (layer.type === 'symbol') {
      safeSetLayout(map, layerId, 'icon-size', style.iconSize);
      safeSetLayout(map, layerId, 'icon-rotate', style.iconRotate);
      safeSetLayout(map, layerId, 'text-size', style.textSize);
      safeSetLayout(map, layerId, 'text-letter-spacing', style.textLetterSpacing);
      safeSetLayout(map, layerId, 'text-transform', style.textTransform);
      safeSetPaint(map, layerId, 'icon-opacity', style.iconOpacity);
      safeSetPaint(map, layerId, 'text-color', style.textColor);
      safeSetPaint(map, layerId, 'text-halo-color', style.textHaloColor);
      safeSetPaint(map, layerId, 'text-halo-width', style.textHaloWidth);
    }

    if (layer.type === 'line') {
      safeSetPaint(map, layerId, 'line-color', style.lineColor);
      safeSetPaint(map, layerId, 'line-width', style.lineWidth);
      safeSetPaint(map, layerId, 'line-opacity', style.lineOpacity);
    }

    if (layer.type === 'fill') {
      safeSetPaint(map, layerId, 'fill-color', style.fillColor);
      safeSetPaint(map, layerId, 'fill-opacity', style.fillOpacity ?? style.symbolOpacity);
    }
  });
}

export function applyAnnotationStylesToMap(map, features = []) {
  features.forEach((feature) => applyAnnotationStyleToMap(map, feature));
}
