import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

export const DIFF_STATUS = Object.freeze({
  ADDED: 'added',
  CHANGED: 'changed',
  REMOVED: 'removed',
  UNCHANGED: 'unchanged',
});

export function getFeatureKey(feature) {
  return (
    feature?.properties?.stableId ||
    feature?.properties?.annotationId ||
    feature?.id ||
    feature?._id ||
    feature?.properties?.id ||
    feature?.properties?.sourceId ||
    JSON.stringify(feature?.geometry || {})
  );
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      if (['owner', 'project', 'sourceId', 'diffStatus'].includes(key)) return acc;
      acc[key] = sortObject(value[key]);
      return acc;
    }, {});
}

export function getComparableFeatureSignature(feature) {
  return JSON.stringify({
    geometry: sortObject(feature?.geometry || null),
    properties: sortObject(feature?.properties || {}),
  });
}

function getFeatureMap(features) {
  return features.reduce((map, feature) => {
    map.set(getFeatureKey(feature), feature);
    return map;
  }, new Map());
}

function withDiffStatus(feature, diffStatus) {
  return {
    ...feature,
    properties: {
      ...(feature.properties || {}),
      diffStatus,
    },
  };
}

export function getDiffStatus(previousFeature, currentFeature) {
  if (!previousFeature && currentFeature) return DIFF_STATUS.ADDED;
  if (previousFeature && !currentFeature) return DIFF_STATUS.REMOVED;
  if (!previousFeature || !currentFeature) return DIFF_STATUS.UNCHANGED;

  return getComparableFeatureSignature(previousFeature) === getComparableFeatureSignature(currentFeature)
    ? DIFF_STATUS.UNCHANGED
    : DIFF_STATUS.CHANGED;
}

export function buildAnnotationDiff(previousFeatureSource, currentFeatureSource) {
  const previous = normalizeFeatureCollection(previousFeatureSource).features;
  const current = normalizeFeatureCollection(currentFeatureSource).features;

  const previousMap = getFeatureMap(previous);
  const currentMap = getFeatureMap(current);
  const counts = {
    previousCount: previous.length,
    currentCount: current.length,
    added: 0,
    changed: 0,
    removed: 0,
    unchanged: 0,
    hasPreviousSnapshot: previous.length > 0,
  };

  const previousFeatures = previous.map((feature) => {
    const key = getFeatureKey(feature);
    const currentFeature = currentMap.get(key);
    const status = getDiffStatus(feature, currentFeature);
    if (status === DIFF_STATUS.REMOVED) counts.removed += 1;
    return withDiffStatus(feature, status);
  });

  const currentFeatures = current.map((feature) => {
    const key = getFeatureKey(feature);
    const previousFeature = previousMap.get(key);
    const status = getDiffStatus(previousFeature, feature);

    if (status === DIFF_STATUS.ADDED) counts.added += 1;
    if (status === DIFF_STATUS.CHANGED) counts.changed += 1;
    if (status === DIFF_STATUS.UNCHANGED) counts.unchanged += 1;

    return withDiffStatus(feature, status);
  });

  return {
    ...counts,
    previousFeatureCollection: {
      type: 'FeatureCollection',
      features: previousFeatures,
    },
    currentFeatureCollection: {
      type: 'FeatureCollection',
      features: currentFeatures,
    },
  };
}
