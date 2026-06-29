const MARKER_TYPES = new Set(['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note']);

function addValue(values, value) {
  const text = String(value || '').trim();
  if (text) values.add(text);
}

function addValues(values, list = []) {
  if (!Array.isArray(list)) return;
  list.forEach((value) => addValue(values, value));
}

export function getMarkerType(layer = {}) {
  return layer.markerType || layer.type || layer.properties?.markerType || layer.properties?.type || '';
}

export function markerLayerId(layer = {}, nameOverride) {
  const markerType = getMarkerType(layer);
  const name = nameOverride ?? layer.name;

  if (!MARKER_TYPES.has(markerType) || !name) return null;
  return `${markerType}_${name}`;
}

export function getLayerAliases(layer = {}) {
  const values = new Set();
  const props = layer.properties || {};

  addValues(values, props.layerAliases);
  addValue(values, props.previousName);
  addValue(values, props.originalName);
  addValue(values, props.previousMapLayerId);
  addValue(values, props.previousSourceId);
  addValue(values, markerLayerId(layer, props.previousName));
  addValue(values, markerLayerId(layer, props.originalName));
  addValue(values, markerLayerId(layer, props.displayName));
  addValue(values, markerLayerId(layer, props.name));

  return Array.from(values);
}

export function getCandidateIds(layer = {}) {
  const id = layer.id;
  const cleanedId = typeof id === 'string' && id.endsWith('_dash') ? id.slice(0, -5) : id;
  const props = layer.properties || {};
  const values = new Set();

  [
    layer.id,
    layer.sourceID,
    layer.sourceId,
    layer.source,
    layer.mapLayerId,
    props.sourceID,
    props.sourceId,
    props.source,
    props.stableId,
    props.annotationId,
    props.mapLayerId,
    cleanedId,
    markerLayerId(layer),
    layer.fillId,
    layer.lineId,
  ].forEach((value) => addValue(values, value));

  addValues(values, getLayerAliases(layer));

  return Array.from(values);
}

function getGeoJsonSourceData(source) {
  return source?._data || source?.serialize?.()?.data || null;
}

function getFeatures(data) {
  if (!data) return [];
  if (data.type === 'FeatureCollection') return data.features || [];
  if (data.type === 'Feature') return [data];
  return [];
}

function getIdentityValues(layer = {}) {
  const props = layer.properties || {};
  const values = new Set(getCandidateIds(layer));

  [
    layer.name,
    props.name,
    props.displayName,
    props.title,
    props.labelValue,
    props.previousName,
    props.originalName,
  ].forEach((value) => addValue(values, value));

  addValues(values, props.layerAliases);

  return values;
}

function sourceDataMatchesLayer(map, sourceId, layer) {
  const source = sourceId ? map?.getSource(sourceId) : null;
  const data = getGeoJsonSourceData(source);
  const identityValues = getIdentityValues(layer);

  return getFeatures(data).some((feature) => {
    const props = feature.properties || {};
    return [
      props.sourceID,
      props.sourceId,
      props.source,
      props.stableId,
      props.annotationId,
      props.mapLayerId,
      props.name,
      props.displayName,
      props.title,
      props.labelValue,
    ].some((value) => identityValues.has(String(value || '').trim()));
  });
}

export function getLiveMapboxLayerIds(map, layer = {}) {
  if (!map?.getStyle) return getCandidateIds(layer);

  const candidateIds = new Set(getCandidateIds(layer));
  const matchedIds = new Set(candidateIds);
  const style = map.getStyle();

  (style?.layers || []).forEach((mapLayer) => {
    if (!mapLayer?.id) return;

    if (candidateIds.has(mapLayer.id) || candidateIds.has(mapLayer.source)) {
      matchedIds.add(mapLayer.id);
      if (mapLayer.source) matchedIds.add(mapLayer.source);
      return;
    }

    if (sourceDataMatchesLayer(map, mapLayer.source, layer)) {
      matchedIds.add(mapLayer.id);
      if (mapLayer.source) matchedIds.add(mapLayer.source);
    }
  });

  return Array.from(matchedIds);
}

export function matchesLayerIdentity(targetLayer, currentLayer) {
  const targetIds = getCandidateIds(targetLayer);
  const currentIds = getCandidateIds(currentLayer);
  return currentIds.some((id) => targetIds.includes(id));
}
