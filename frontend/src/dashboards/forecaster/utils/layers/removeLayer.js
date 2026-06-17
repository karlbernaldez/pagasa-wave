import { removeMarkerDrag } from '@dashboards/forecaster/map/layers/markerLayer';

function safeRemoveLayer(map, id) {
  if (id && map.getLayer(id)) map.removeLayer(id);
}

function safeRemoveSource(map, id) {
  if (id && map.getSource(id)) map.removeSource(id);
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

function removeCandidateArtifacts(map, id) {
  safeRemoveLayer(map, id);
  safeRemoveLayer(map, `${id}-0`);
  safeRemoveLayer(map, `${id}-1`);
  safeRemoveLayer(map, `${id}_bg`);
  safeRemoveLayer(map, `${id}_dash`);

  safeRemoveSource(map, id);
  safeRemoveSource(map, `${id}-0`);
  safeRemoveSource(map, `${id}-1`);

  removeMarkerDrag(id);
}

export function removeLayer(map, layer, setLayers) {
  if (!map || !layer) return;

  getCandidateIds(layer).forEach((id) => removeCandidateArtifacts(map, id));

  setLayers((prev) => prev.filter((l) => {
    const targetIds = getCandidateIds(layer);
    const currentIds = getCandidateIds(l);
    return !currentIds.some((id) => targetIds.includes(id));
  }));
}
