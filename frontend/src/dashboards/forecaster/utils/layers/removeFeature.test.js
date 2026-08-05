import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createFeature: vi.fn(),
  deleteFeature: vi.fn(),
  fetchFeatures: vi.fn(),
  publishAnnotationHistoryCommand: vi.fn(),
  requestAnnotationHistoryRefresh: vi.fn(),
}));

vi.mock('@/api/featureServices', () => ({
  createFeature: mocks.createFeature,
  deleteFeature: mocks.deleteFeature,
  fetchFeatures: mocks.fetchFeatures,
}));

vi.mock('@dashboards/forecaster/history/annotationHistoryEvents', () => ({
  publishAnnotationHistoryCommand: mocks.publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh: mocks.requestAnnotationHistoryRefresh,
}));

import { removeFeature } from './removeFeature';

describe('removeFeature deletion history snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('records undo history when the canonical source ID only exists in feature properties', async () => {
    const persistedFeature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [121.1, 14.6] },
      properties: {
        sourceId: 'annotation-1',
        stableId: 'annotation-1',
        project: 'project-1',
        displayName: 'Sample annotation',
        markerType: 'text_note',
      },
    };
    const draw = { delete: vi.fn() };

    mocks.fetchFeatures.mockResolvedValue([persistedFeature]);
    mocks.deleteFeature.mockResolvedValue({ success: true });
    mocks.createFeature.mockResolvedValue({ success: true });

    await removeFeature(draw, {
      id: 'annotation-1',
      properties: { sourceId: 'annotation-1', project: 'project-1' },
    });

    expect(mocks.fetchFeatures).toHaveBeenCalledWith('project-1');
    expect(mocks.deleteFeature).toHaveBeenCalledWith('annotation-1');
    expect(draw.delete).toHaveBeenCalledWith('annotation-1');
    expect(mocks.publishAnnotationHistoryCommand).toHaveBeenCalledTimes(1);

    const command = mocks.publishAnnotationHistoryCommand.mock.calls[0][0];
    expect(command.label).toBe('Delete Sample annotation');

    await command.undo();
    expect(mocks.createFeature).toHaveBeenCalledWith(
      {
        geometry: persistedFeature.geometry,
        properties: persistedFeature.properties,
        name: 'Sample annotation',
        sourceId: 'annotation-1',
      },
      { suppressHistory: true }
    );
    expect(mocks.requestAnnotationHistoryRefresh).toHaveBeenCalledWith('project-1');

    await command.redo();
    expect(mocks.deleteFeature).toHaveBeenLastCalledWith('annotation-1');
  });
});
