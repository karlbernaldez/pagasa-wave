import { updateFeatureNameAPI } from '@/api/featureServices';
import Swal from 'sweetalert2';

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, text, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });

function getLayerIdsForFeature(layer) {
  return Array.from(new Set([
    layer?.id,
    layer?.sourceID,
    layer?.sourceId,
    layer?.source,
  ].filter(Boolean)));
}

function getMapSourceId(map, layerId) {
  const layer = layerId ? map?.getLayer(layerId) : null;
  return layer?.source || layerId;
}

function getGeoJsonSourceData(source) {
  return source?._data || source?.serialize?.()?.data || null;
}

function updateGeoJsonLabelFields(data, newName) {
  if (!data) return data;

  const updateFeature = (feature) => ({
    ...feature,
    properties: {
      ...(feature.properties || {}),
      title: newName,
      name: newName,
      labelValue: newName,
      text: newName,
    },
  });

  if (data.type === 'FeatureCollection') {
    return {
      ...data,
      features: (data.features || []).map(updateFeature),
    };
  }

  if (data.type === 'Feature') {
    return updateFeature(data);
  }

  return data;
}

function updateSourceDataLabel(map, sourceId, newName) {
  const source = sourceId ? map?.getSource(sourceId) : null;
  if (!source?.setData) return false;

  const data = getGeoJsonSourceData(source);
  if (!data) return false;

  source.setData(updateGeoJsonLabelFields(data, newName));
  return true;
}

function updateLayerTextField(map, layerId, newName) {
  if (!map?.getLayer(layerId)) return false;

  try {
    map.setLayoutProperty(layerId, 'text-field', newName);
    return true;
  } catch {
    return false;
  }
}

function syncMapLabel(map, layer, newName) {
  if (!map || !layer) return;

  const candidateIds = getLayerIdsForFeature(layer);

  candidateIds.forEach((candidateId) => {
    const sourceId = getMapSourceId(map, candidateId);
    updateSourceDataLabel(map, sourceId, newName);
    updateLayerTextField(map, candidateId, newName);

    // Wave-height lines use separate label sources/layers with numeric suffixes.
    for (const suffix of ['-0', '-1']) {
      updateSourceDataLabel(map, `${sourceId}${suffix}`, newName);
      updateLayerTextField(map, `${candidateId}${suffix}`, newName);
    }
  });
}

export async function updateLayerName(layerId, newName, setLayers, map) {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    toast('error', 'Invalid name', 'Name cannot be empty.');
    return;
  }

  let targetLayer = null;

  setLayers((prev) => {
    targetLayer = prev.find((l) => l.id === layerId || l.sourceID === layerId || l.sourceId === layerId || l.source === layerId);

    if (!targetLayer) return prev;

    if (targetLayer.name === trimmedName) {
      toast('info', 'No change', 'The annotation name is already the same.');
      return prev;
    }

    return prev.map((l) =>
      l === targetLayer
        ? { ...l, name: trimmedName }
        : l
    );
  });

  if (!targetLayer) return;

  // Update visible Mapbox labels immediately. The backend update below makes the
  // same label survive refresh/reload.
  syncMapLabel(map, targetLayer, trimmedName);

  try {
    const persistedId = targetLayer.sourceID || targetLayer.sourceId || targetLayer.source || targetLayer.id;
    const result = await updateFeatureNameAPI(persistedId, trimmedName);
    const updatedFeature = result?.feature;

    setLayers((prev) => prev.map((l) => {
      const matchesTarget =
        l.id === targetLayer.id ||
        l.sourceID === persistedId ||
        l.sourceId === persistedId ||
        l.source === persistedId;

      if (!matchesTarget) return l;

      return {
        ...l,
        name: updatedFeature?.name || trimmedName,
        sourceID: updatedFeature?.sourceId || l.sourceID,
        sourceId: updatedFeature?.sourceId || l.sourceId,
        source: updatedFeature?.sourceId || l.source,
      };
    }));

    toast('success', 'Name Updated', `Annotation renamed to "${trimmedName}".`);
  } catch (error) {
    toast('error', 'Update Failed', error?.message || 'Could not update the annotation name.');
  }
}
