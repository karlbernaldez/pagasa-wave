import { updateFeatureNameAPI } from '@/api/featureServices';
import Swal from 'sweetalert2';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';
import {
  getCandidateIds,
  getLayerAliases,
  getLiveMapboxLayerIds,
  markerLayerId,
  matchesLayerIdentity,
} from './layerIdentity';

const toast = (icon, title, text) =>
  Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
  });

function getStableLayerId(layer) {
  return (
    layer?.sourceID ||
    layer?.sourceId ||
    layer?.source ||
    layer?.id ||
    layer?.properties?.sourceId ||
    layer?.properties?.stableId
  );
}

function getLayerIdsForFeature(layer) {
  return getCandidateIds(layer);
}

function getMapSourceId(map, layerId) {
  const layer = layerId ? map?.getLayer(layerId) : null;
  return layer?.source || layerId;
}

function getGeoJsonSourceData(source) {
  return source?._data || source?.serialize?.()?.data || null;
}

function getLayerType(layer) {
  return (
    layer?.markerType ||
    layer?.type ||
    layer?.properties?.markerType ||
    layer?.properties?.type ||
    ''
  );
}

function uniqueAliases(values = []) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function getRenameAliases(layer, stableId) {
  const props = layer?.properties || {};
  return uniqueAliases([
    ...getLayerAliases(layer),
    layer?.id,
    layer?.sourceID,
    layer?.sourceId,
    layer?.source,
    layer?.mapLayerId,
    props.sourceID,
    props.sourceId,
    props.source,
    props.stableId,
    props.annotationId,
    props.mapLayerId,
    layer?.name,
    props.name,
    props.displayName,
    props.title,
    markerLayerId(layer),
    markerLayerId(layer, layer?.name),
    markerLayerId(layer, props.name),
    markerLayerId(layer, props.displayName),
    stableId,
  ]);
}

function updateGeoJsonLabelFields(data, newName, layer, stableId) {
  if (!data) return data;

  const layerType = getLayerType(layer);
  const isLowWaveMarker = layerType === 'less_1';
  const aliases = getRenameAliases(layer, stableId);

  const updateFeature = (feature) => {
    const existingProps = feature.properties || {};
    return {
      ...feature,
      properties: {
        ...existingProps,
        title: isLowWaveMarker ? existingProps.title || '<1' : newName,
        name: newName,
        displayName: newName,
        text: newName,
        labelValue: isLowWaveMarker ? existingProps.labelValue || '<1' : newName,
        sourceId: existingProps.sourceId || stableId,
        stableId: existingProps.stableId || stableId,
        annotationId: existingProps.annotationId || stableId,
        mapLayerId: existingProps.mapLayerId || stableId,
        layerAliases: uniqueAliases([...(existingProps.layerAliases || []), ...aliases]),
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

function updateSourceDataLabel(map, sourceId, newName, layer, stableId) {
  const source = sourceId ? map?.getSource(sourceId) : null;
  if (!source?.setData) return false;

  const data = getGeoJsonSourceData(source);
  if (!data) return false;

  source.setData(updateGeoJsonLabelFields(data, newName, layer, stableId));
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

function syncMapLabel(map, layer, newName, stableId) {
  if (!map || !layer) return;

  const candidateIds = getLiveMapboxLayerIds(map, layer);

  candidateIds.forEach((candidateId) => {
    const sourceId = getMapSourceId(map, candidateId);
    updateSourceDataLabel(map, sourceId, newName, layer, stableId);
    updateLayerTextField(map, candidateId, newName, layer);

    for (const suffix of ['-0', '-1']) {
      updateSourceDataLabel(map, `${sourceId}${suffix}`, newName, layer, stableId);
      updateLayerTextField(map, `${candidateId}${suffix}`, newName, layer);
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
  let stableId = null;
  let aliases = [];

  setLayers((prev) => {
    targetLayer = prev.find((layer) => getLayerIdsForFeature(layer).includes(layerId));
    stableId = getStableLayerId(targetLayer);
    aliases = getRenameAliases(targetLayer, stableId);

    if (!targetLayer) return prev;

    if (targetLayer.name === trimmedName) {
      toast('info', 'No change', 'The annotation name is already the same.');
      return prev;
    }

    return prev.map((layer) =>
      matchesLayerIdentity(targetLayer, layer)
        ? {
            ...layer,
            name: trimmedName,
            id: layer.id || stableId,
            sourceID: layer.sourceID || stableId,
            sourceId: layer.sourceId || stableId,
            source: layer.source || stableId,
            mapLayerId: layer.mapLayerId || stableId,
            properties: {
              ...(layer.properties || {}),
              name: trimmedName,
              title:
                getLayerType(layer) === 'less_1'
                  ? layer.properties?.title || '<1'
                  : trimmedName,
              displayName: trimmedName,
              labelValue:
                getLayerType(layer) === 'less_1'
                  ? layer.properties?.labelValue || '<1'
                  : trimmedName,
              sourceId: layer.properties?.sourceId || stableId,
              stableId: layer.properties?.stableId || stableId,
              annotationId: layer.properties?.annotationId || stableId,
              mapLayerId: layer.properties?.mapLayerId || stableId,
              previousName: targetLayer.name,
              previousMapLayerId: targetLayer.mapLayerId || markerLayerId(targetLayer),
              layerAliases: uniqueAliases([...(layer.properties?.layerAliases || []), ...aliases]),
            },
          }
        : layer
    );
  });

  if (!targetLayer || !stableId || targetLayer.name === trimmedName) return;

  const previousName = targetLayer.name;
  const projectId =
    targetLayer?.project ||
    targetLayer?.properties?.project ||
    targetLayer?.properties?.projectId ||
    localStorage.getItem('projectId') ||
    '';

  syncMapLabel(map, targetLayer, trimmedName, stableId);

  try {
    await updateFeatureNameAPI(stableId, trimmedName);

    setLayers((prev) =>
      prev.map((layer) => {
        if (!matchesLayerIdentity(targetLayer, layer)) return layer;

        return {
          ...layer,
          name: trimmedName,
          id: layer.id || stableId,
          sourceID: layer.sourceID || stableId,
          sourceId: layer.sourceId || stableId,
          source: layer.source || stableId,
          mapLayerId: layer.mapLayerId || stableId,
          properties: {
            ...(layer.properties || {}),
            name: trimmedName,
            title:
              getLayerType(layer) === 'less_1'
                ? layer.properties?.title || '<1'
                : trimmedName,
            displayName: trimmedName,
            labelValue:
              getLayerType(layer) === 'less_1'
                ? layer.properties?.labelValue || '<1'
                : trimmedName,
            sourceId: layer.properties?.sourceId || stableId,
            stableId: layer.properties?.stableId || stableId,
            annotationId: layer.properties?.annotationId || stableId,
            mapLayerId: layer.properties?.mapLayerId || stableId,
            previousName: layer.properties?.previousName || previousName,
            previousMapLayerId:
              layer.properties?.previousMapLayerId ||
              targetLayer.mapLayerId ||
              markerLayerId(targetLayer),
            layerAliases: uniqueAliases([...(layer.properties?.layerAliases || []), ...aliases]),
          },
        };
      })
    );

    publishAnnotationHistoryCommand({
      label: `Rename ${previousName || 'annotation'}`,
      undo: async () => {
        await updateFeatureNameAPI(stableId, previousName);
        requestAnnotationHistoryRefresh(projectId);
      },
      redo: async () => {
        await updateFeatureNameAPI(stableId, trimmedName);
        requestAnnotationHistoryRefresh(projectId);
      },
    });

    toast('success', 'Name Updated', `Annotation renamed to "${trimmedName}".`);
  } catch (error) {
    syncMapLabel(map, targetLayer, previousName, stableId);
    requestAnnotationHistoryRefresh(projectId);
    toast('error', 'Update Failed', error?.message || 'Could not update the annotation name.');
  }
}
