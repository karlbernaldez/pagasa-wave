import { removeMarkerDrag } from '@dashboards/forecaster/map/layers/markerLayer';
import { getLiveMapboxLayerIds, matchesLayerIdentity } from './layerIdentity';

const SURFACE_FRONT_SUFFIXES = ['_bg', '_dash', '_secondary', '_triangles', '_circles', '_frontSymbols'];

function safeRemoveLayer(map, id) {
  if (id && map.getLayer(id)) map.removeLayer(id);
}

function safeRemoveSource(map, id) {
  if (id && map.getSource(id)) map.removeSource(id);
}

function removeCandidateArtifacts(map, id) {
  safeRemoveLayer(map, id);
  safeRemoveLayer(map, `${id}-0`);
  safeRemoveLayer(map, `${id}-1`);
  SURFACE_FRONT_SUFFIXES.forEach((suffix) => safeRemoveLayer(map, `${id}${suffix}`));

  safeRemoveSource(map, id);
  safeRemoveSource(map, `${id}-0`);
  safeRemoveSource(map, `${id}-1`);

  removeMarkerDrag(id);
}

export function removeLayer(map, layer, setLayers) {
  if (!map || !layer) return;

  const targetIds = getLiveMapboxLayerIds(map, layer);
  targetIds.forEach((id) => removeCandidateArtifacts(map, id));

  setLayers((prev) => prev.filter((currentLayer) => !matchesLayerIdentity(layer, currentLayer)));
}
