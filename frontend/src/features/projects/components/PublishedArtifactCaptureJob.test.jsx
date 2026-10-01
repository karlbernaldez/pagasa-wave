import { describe, expect, it } from 'vitest';

import { buildPublishedArtifactCaptureTasks } from './PublishedArtifactCaptureJob';

const charts = [
  { chartType: 'analysis', project: { _id: 'p-analysis' } },
  { chartType: 'forecast_24h', project: { _id: 'p-24' } },
  { chartType: 'forecast_36h', project: { _id: 'p-36' } },
  { chartType: 'forecast_48h', project: { _id: 'p-48' } },
];

describe('buildPublishedArtifactCaptureTasks', () => {
  it('skips snapshots already stored for the current publication', () => {
    const readiness = {
      styles: {
        'wave-wind': {
          readyChartTypes: ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'],
        },
        'wave-only': {
          readyChartTypes: ['analysis', 'forecast_24h'],
        },
        'visually-impaired': {
          readyChartTypes: [],
        },
      },
    };

    const plan = buildPublishedArtifactCaptureTasks(charts, readiness);

    expect(plan.allTasks).toHaveLength(12);
    expect(plan.completedCount).toBe(6);
    expect(plan.pendingTasks).toEqual([
      { style: 'wave-only', chartType: 'forecast_36h', projectId: 'p-36' },
      { style: 'wave-only', chartType: 'forecast_48h', projectId: 'p-48' },
      { style: 'visually-impaired', chartType: 'analysis', projectId: 'p-analysis' },
      { style: 'visually-impaired', chartType: 'forecast_24h', projectId: 'p-24' },
      { style: 'visually-impaired', chartType: 'forecast_36h', projectId: 'p-36' },
      { style: 'visually-impaired', chartType: 'forecast_48h', projectId: 'p-48' },
    ]);
  });

  it('captures all snapshots when no readiness exists yet', () => {
    const plan = buildPublishedArtifactCaptureTasks(charts);

    expect(plan.completedCount).toBe(0);
    expect(plan.pendingTasks).toHaveLength(12);
  });
});
