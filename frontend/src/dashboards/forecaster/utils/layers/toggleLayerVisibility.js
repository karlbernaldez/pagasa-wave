import { getLiveMapboxLayerIds, matchesLayerIdentity } from './layerIdentity';

const SURFACE_FRONT_SUFFIXES = ['_bg', '_dash', '_secondary', '_triangles', '_circles', '_frontSymbols'];

function safeSetVisibility(map, id, visibility) {
  if (id && map.getLayer(id)) {
    map.setLayoutProperty(id, 'visibility', visibility);
    return true;
  }

  return false;
}

function setCandidateVisibility(map, id, visibility) {
  safeSetVisibility(map, id, visibility);
  safeSetVisibility(map, `${id}-0`, visibility);
  safeSetVisibility(map, `${id}-1`, visibility);
  SURFACE_FRONT_SUFFIXES.forEach((suffix) => safeSetVisibility(map, `${id}${suffix}`, visibility));
}

export function toggleLayerVisibility(map, layer, setLayers) {
  if (!map || !layer) return;

  const newVisible = !layer.visible;
  const newVisibility = newVisible ? 'visible' : 'none';

  getLiveMapboxLayerIds(map, layer).forEach((id) => setCandidateVisibility(map, id, newVisibility));

  setLayers((prev) =>
    prev.map((l) => (matchesLayerIdentity(layer, l) ? { ...l, visible: newVisible } : l))
  );
}
