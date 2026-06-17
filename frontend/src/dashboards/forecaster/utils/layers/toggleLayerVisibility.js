function safeSetVisibility(map, id, visibility) {
  if (id && map.getLayer(id)) {
    map.setLayoutProperty(id, 'visibility', visibility);
    return true;
  }

  return false;
}

function markerLayerId(layer) {
  const markerType = layer?.markerType || layer?.type;
  const name = layer?.name;

  if (!markerType || !name) return null;
  if (!['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note'].includes(markerType)) return null;

  return `${markerType}_${name}`;
}

function getCandidateIds(layer) {
  const id = layer?.id;
  const cleanedId = typeof id === 'string' && id.endsWith('_dash') ? id.slice(0, -5) : id;

  return Array.from(new Set([
    layer?.id,
    layer?.sourceID,
    layer?.sourceId,
    layer?.source,
    layer?.mapLayerId,
    layer?.name,
    cleanedId,
    markerLayerId(layer),
    layer?.fillId,
    layer?.lineId,
  ].filter(Boolean)));
}

function setCandidateVisibility(map, id, visibility) {
  safeSetVisibility(map, id, visibility);
  safeSetVisibility(map, `${id}-0`, visibility);
  safeSetVisibility(map, `${id}-1`, visibility);
  safeSetVisibility(map, `${id}_bg`, visibility);
  safeSetVisibility(map, `${id}_dash`, visibility);
}

function matchesLayer(target, current) {
  const targetIds = getCandidateIds(target);
  const currentIds = getCandidateIds(current);
  return currentIds.some((id) => targetIds.includes(id));
}

export function toggleLayerVisibility(map, layer, setLayers) {
  if (!map || !layer) return;

  const newVisible = !layer.visible;
  const newVisibility = newVisible ? 'visible' : 'none';

  getCandidateIds(layer).forEach((id) => setCandidateVisibility(map, id, newVisibility));

  setLayers((prev) =>
    prev.map((l) => (matchesLayer(layer, l) ? { ...l, visible: newVisible } : l))
  );
}
