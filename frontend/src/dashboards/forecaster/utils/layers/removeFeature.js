import { createFeature, deleteFeature, fetchFeatures } from '@/api/featureServices';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';

function normalizePersistedSourceId(layerOrId) {
  const sourceId =
    layerOrId?.sourceID ||
    layerOrId?.sourceId ||
    layerOrId?.source ||
    layerOrId?.properties?.sourceID ||
    layerOrId?.properties?.sourceId ||
    layerOrId?.properties?.stableId ||
    layerOrId?.properties?.annotationId ||
    layerOrId?.properties?.mapLayerId ||
    layerOrId?.id ||
    layerOrId;

  if (typeof sourceId === 'string' && sourceId.endsWith('_dash')) {
    return sourceId.slice(0, -5);
  }

  return sourceId;
}

function getProjectId(layerOrId) {
  return (
    layerOrId?.project ||
    layerOrId?.properties?.project ||
    layerOrId?.properties?.projectId ||
    localStorage.getItem('projectId') ||
    ''
  );
}

function toCreateFeaturePayload(feature) {
  const sourceId = normalizePersistedSourceId(feature);
  if (!feature?.geometry || !sourceId) return null;

  return {
    geometry: feature.geometry,
    properties: { ...(feature.properties || {}) },
    name: feature.name || feature.properties?.displayName || 'Annotation',
    sourceId: String(sourceId),
  };
}

async function loadFeatureSnapshot(projectId, sourceId) {
  if (!projectId || !sourceId) return null;

  const features = await fetchFeatures(projectId);
  const persistedFeature = (Array.isArray(features) ? features : []).find(
    (feature) => normalizePersistedSourceId(feature) === sourceId
  );

  return toCreateFeaturePayload(persistedFeature);
}

export async function removeFeature(drawOrLayerOrId, maybeLayerOrId) {
  const hasExplicitDrawArg = maybeLayerOrId !== undefined;
  const draw = hasExplicitDrawArg ? drawOrLayerOrId : null;
  const layerOrId = hasExplicitDrawArg ? maybeLayerOrId : drawOrLayerOrId;
  const persistedSourceId = normalizePersistedSourceId(layerOrId);
  const drawLayerId = layerOrId?.id || layerOrId;
  const projectId = getProjectId(layerOrId);

  if (!persistedSourceId) return;

  let snapshot = null;
  try {
    snapshot = await loadFeatureSnapshot(projectId, persistedSourceId);
  } catch (error) {
    console.warn(`Could not load deletion snapshot for "${persistedSourceId}".`, error);
  }

  await deleteFeature(persistedSourceId);

  if (draw?.delete) {
    if (drawLayerId) draw.delete(drawLayerId);
    else draw.trash();
  }

  if (!snapshot || typeof window === 'undefined') return;

  publishAnnotationHistoryCommand({
    label: `Delete ${snapshot.name || 'annotation'}`,
    undo: async () => {
      await createFeature(snapshot, { suppressHistory: true });
      requestAnnotationHistoryRefresh(projectId);
    },
    redo: async () => {
      await deleteFeature(persistedSourceId);
      requestAnnotationHistoryRefresh(projectId);
    },
  });
}
