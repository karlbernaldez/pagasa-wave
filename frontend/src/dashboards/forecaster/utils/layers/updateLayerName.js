import { updateFeatureNameAPI } from '@/api/featureServices';
import Swal from 'sweetalert2';

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, text, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });

const MARKER_TYPES = new Set(['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note']);

function getStableLayerId(layer) {
  return layer?.sourceID || layer?.sourceId || layer?.source || layer?.id;
}

function getLayerIdsForFeature(layer) {
  return Array.from(new Set([
    layer?.id,
    layer?.sourceID,
    layer?.sourceId,
    layer?.source,
    layer?.mapLayerId,
  ].filter(Boolean)));
}

function getMapSourceId(map, layerId) {
  const layer = layerId ? map?.getLayer(layerId) : null;
  return layer?.source || layerId;
}

function getGeoJsonSourceData(source) {
  return source?._data || source?.serialize?.()?.data || null;
}

function getLayerType(layer) {
  return layer?.markerType || layer?.type || layer?.properties?.markerType || layer?.properties?.type || '';
}

function updateGeoJsonLabelFields(data, newName, layer) {
  if (!data) return data;

  const layerType = getLayerType(layer);
  const isLowWaveMarker = layerType === 'less_1';

  const updateFeature = (feature) => {
    const existingProps = feature.properties || {};
    return {
      ...feature,
      properties: {
        ...existingProps,
        title: isLowWaveMarker ? (existingProps.title || '<1') : newName,
        name: newName,
        displayName: newName,
        text: newName,
        labelValue: isLowWaveMarker ? (existingProps.labelValue || '<1') : newName,
      },
    };
  };

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

function updateSourceDataLabel(map, sourceId, newName, layer) {
  const source = sourceId ? map?.getSource(sourceId) : null;
  if (!source?.setData) return false;

  const data = getGeoJsonSourceData(source);
  if (!data) return false;

  source.setData(updateGeoJsonLabelFields(data, newName, layer));
  return true;
}

function updateLayerTextField(map, layerId, newName, layer) {
  if (!map?.getLayer(layerId)) return false;

  const layerType = getLayerType(layer);
  if (layerType === 'less_1') return false;

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
    updateSourceDataLabel(map, sourceId, newName, layer);
    updateLayerTextField(map, candidateId, newName, layer);

    // Wave-height lines use separate label sources/layers with numeric suffixes.
    for (const suffix of ['-0', '-1']) {
      updateSourceDataLabel(map, `${sourceId}${suffix}`, newName, layer);
      updateLayerTextField(map, `${candidateId}${suffix}`, newName, layer);
    }
  });
}

function matchesLayerIdentity(layer, targetLayer, stableId) {
  const layerIds = getLayerIdsForFeature(layer);
  const targetIds = getLayerIdsForFeature(targetLayer);
  if (stableId && layerIds.includes(stableId)) return true;
  return layerIds.some((id) => targetIds.includes(id));
}

export async function updateLayerName(layerId, newName, setLayers, map) {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    toast('error', 'Invalid name', 'Name cannot be empty.');
    return;
  }

  let targetLayer = null;
  let stableId = null;

  setLayers((prev) => {
    targetLayer = prev.find((l) => getLayerIdsForFeature(l).includes(layerId));
    stableId = getStableLayerId(targetLayer);

    if (!targetLayer) return prev;

    if (targetLayer.name === trimmedName) {
      toast('info', 'No change', 'The annotation name is already the same.');
      return prev;
    }

    return prev.map((l) =>
      matchesLayerIdentity(l, targetLayer, stableId)
        ? {
            ...l,
            name: trimmedName,
            mapLayerId: l.mapLayerId || stableId,
            properties: {
              ...(l.properties || {}),
              name: trimmedName,
              title: getLayerType(l) === 'less_1' ? (l.properties?.title || '<1') : trimmedName,
              displayName: trimmedName,
              labelValue: getLayerType(l) === 'less_1' ? (l.properties?.labelValue || '<1') : trimmedName,
            },
          }
        : l
    );
  });

  if (!targetLayer || !stableId) return;

  // Update visible Mapbox labels immediately. The backend update below makes the
  // same label survive refresh/reload.
  syncMapLabel(map, targetLayer, trimmedName);

  try {
    await updateFeatureNameAPI(stableId, trimmedName);

    setLayers((prev) => prev.map((l) => {
      if (!matchesLayerIdentity(l, targetLayer, stableId)) return l;

      // Rename is display-only. Never replace the stable IDs with a name-derived
      // ID from a backend response; hide/style/delete depend on stable identity.
      return {
        ...l,
        name: trimmedName,
        id: l.id || stableId,
        sourceID: l.sourceID || stableId,
        sourceId: l.sourceId || stableId,
        source: l.source || stableId,
        mapLayerId: l.mapLayerId || stableId,
        properties: {
          ...(l.properties || {}),
          name: trimmedName,
          title: getLayerType(l) === 'less_1' ? (l.properties?.title || '<1') : trimmedName,
          displayName: trimmedName,
          labelValue: getLayerType(l) === 'less_1' ? (l.properties?.labelValue || '<1') : trimmedName,
          sourceId: l.properties?.sourceId || stableId,
          stableId: l.properties?.stableId || stableId,
          annotationId: l.properties?.annotationId || stableId,
        },
      };
    }));

    toast('success', 'Name Updated', `Annotation renamed to "${trimmedName}".`);
  } catch (error) {
    toast('error', 'Update Failed', error?.message || 'Could not update the annotation name.');
  }
}
