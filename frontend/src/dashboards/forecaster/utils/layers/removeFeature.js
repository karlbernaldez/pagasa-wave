import { deleteFeature } from '@/api/featureServices';

function normalizePersistedSourceId(layerOrId) {
  const sourceId =
    layerOrId?.sourceID ||
    layerOrId?.sourceId ||
    layerOrId?.source ||
    layerOrId?.id ||
    layerOrId;

  if (typeof sourceId === 'string' && sourceId.endsWith('_dash')) {
    return sourceId.slice(0, -5);
  }

  return sourceId;
}

export async function removeFeature(drawOrLayerOrId, maybeLayerOrId) {
  const hasExplicitDrawArg = maybeLayerOrId !== undefined;
  const draw = hasExplicitDrawArg ? drawOrLayerOrId : null;
  const layerOrId = hasExplicitDrawArg ? maybeLayerOrId : drawOrLayerOrId;
  const persistedSourceId = normalizePersistedSourceId(layerOrId);
  const drawLayerId = layerOrId?.id || layerOrId;

  if (draw?.delete) {
    if (drawLayerId) draw.delete(drawLayerId);
    else draw.trash();
  }

  if (!persistedSourceId) return;

  try {
    await deleteFeature(persistedSourceId);
  } catch (err) {
    console.error(`Failed to delete feature "${persistedSourceId}" from backend.`, err);
  }
}
