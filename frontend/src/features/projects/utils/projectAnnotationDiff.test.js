import { describe, expect, it } from 'vitest';

import {
  DIFF_STATUS,
  buildAnnotationDiff,
  getDiffStatus,
  getFeatureKey,
} from './projectAnnotationDiff';

function feature({
  id,
  stableId = id,
  annotationId = stableId,
  sourceId = stableId,
  coordinates = [120, 15],
  name = 'Annotation',
  extraProperties = {},
} = {}) {
  return {
    type: 'Feature',
    id: stableId,
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: {
      stableId,
      annotationId,
      sourceId,
      name,
      ...extraProperties,
    },
  };
}

describe('projectAnnotationDiff', () => {
  it('classifies a new annotation as added', () => {
    const current = feature({ id: 'annotation-1' });

    const diff = buildAnnotationDiff([], [current]);

    expect(diff.previousCount).toBe(0);
    expect(diff.currentCount).toBe(1);
    expect(diff.added).toBe(1);
    expect(diff.changed).toBe(0);
    expect(diff.removed).toBe(0);
    expect(diff.unchanged).toBe(0);
    expect(diff.hasPreviousSnapshot).toBe(false);
    expect(diff.currentFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.ADDED);
  });

  it('classifies a missing old annotation as removed', () => {
    const previous = feature({ id: 'annotation-1' });

    const diff = buildAnnotationDiff([previous], []);

    expect(diff.previousCount).toBe(1);
    expect(diff.currentCount).toBe(0);
    expect(diff.added).toBe(0);
    expect(diff.changed).toBe(0);
    expect(diff.removed).toBe(1);
    expect(diff.unchanged).toBe(0);
    expect(diff.hasPreviousSnapshot).toBe(true);
    expect(diff.previousFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.REMOVED);
  });

  it('classifies same stableId and same content as unchanged', () => {
    const previous = feature({ id: 'annotation-1', sourceId: 'old-source' });
    const current = feature({ id: 'annotation-1', sourceId: 'new-source' });

    const diff = buildAnnotationDiff([previous], [current]);

    expect(diff.added).toBe(0);
    expect(diff.changed).toBe(0);
    expect(diff.removed).toBe(0);
    expect(diff.unchanged).toBe(1);
    expect(diff.currentFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.UNCHANGED);
    expect(diff.previousFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.UNCHANGED);
  });

  it('classifies same stableId with changed geometry as changed', () => {
    const previous = feature({ id: 'annotation-1', coordinates: [120, 15] });
    const current = feature({ id: 'annotation-1', coordinates: [121, 16] });

    const diff = buildAnnotationDiff([previous], [current]);

    expect(diff.added).toBe(0);
    expect(diff.changed).toBe(1);
    expect(diff.removed).toBe(0);
    expect(diff.unchanged).toBe(0);
    expect(diff.currentFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.CHANGED);
    expect(diff.previousFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.CHANGED);
  });

  it('classifies same stableId with renamed user-visible fields as changed, not added plus removed', () => {
    const previous = feature({
      id: 'annotation-1',
      sourceId: 'low_pressure_OLD',
      name: 'OLD',
      extraProperties: {
        title: 'OLD',
        labelValue: 'OLD',
      },
    });
    const current = feature({
      id: 'annotation-1',
      sourceId: 'low_pressure_NEW',
      name: 'NEW',
      extraProperties: {
        title: 'NEW',
        labelValue: 'NEW',
      },
    });

    const diff = buildAnnotationDiff([previous], [current]);

    expect(diff.added).toBe(0);
    expect(diff.changed).toBe(1);
    expect(diff.removed).toBe(0);
    expect(diff.unchanged).toBe(0);
    expect(diff.currentFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.CHANGED);
    expect(diff.previousFeatureCollection.features[0].properties.diffStatus).toBe(DIFF_STATUS.CHANGED);
  });

  it('uses legacy sourceId fallback when stable IDs are missing', () => {
    const previous = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [120, 15],
      },
      properties: {
        sourceId: 'legacy-annotation',
        name: 'Legacy Annotation',
      },
    };
    const current = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [121, 16],
      },
      properties: {
        sourceId: 'legacy-annotation',
        name: 'Legacy Annotation',
      },
    };

    const diff = buildAnnotationDiff([previous], [current]);

    expect(getFeatureKey(previous)).toBe('legacy-annotation');
    expect(getFeatureKey(current)).toBe('legacy-annotation');
    expect(diff.added).toBe(0);
    expect(diff.changed).toBe(1);
    expect(diff.removed).toBe(0);
  });

  it('ignores mutable sourceId and diffStatus when comparing otherwise equal features', () => {
    const previous = feature({
      id: 'annotation-1',
      sourceId: 'source-before-rename',
      extraProperties: {
        diffStatus: DIFF_STATUS.REMOVED,
      },
    });
    const current = feature({
      id: 'annotation-1',
      sourceId: 'source-after-rename',
      extraProperties: {
        diffStatus: DIFF_STATUS.ADDED,
      },
    });

    expect(getDiffStatus(previous, current)).toBe(DIFF_STATUS.UNCHANGED);
  });

  it('normalizes FeatureCollection input before diffing', () => {
    const previous = {
      type: 'FeatureCollection',
      features: [feature({ id: 'annotation-1' })],
    };
    const current = {
      type: 'FeatureCollection',
      features: [feature({ id: 'annotation-1' }), feature({ id: 'annotation-2' })],
    };

    const diff = buildAnnotationDiff(previous, current);

    expect(diff.previousCount).toBe(1);
    expect(diff.currentCount).toBe(2);
    expect(diff.added).toBe(1);
    expect(diff.unchanged).toBe(1);
    expect(diff.currentFeatureCollection.features.map((item) => item.properties.diffStatus)).toEqual([
      DIFF_STATUS.UNCHANGED,
      DIFF_STATUS.ADDED,
    ]);
  });
});
