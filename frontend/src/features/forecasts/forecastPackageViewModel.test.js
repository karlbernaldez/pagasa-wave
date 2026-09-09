import { describe, expect, it } from 'vitest';

import { adaptForecastPackageModel, CHART_LABELS } from './forecastPackageViewModel';

describe('adaptForecastPackageModel', () => {
  it('normalizes package identity and orders required charts consistently', () => {
    const model = adaptForecastPackageModel({
      _id: 'package-1',
      name: 'Marine Forecast Test',
      status: 'Submitted',
      forecastDate: '2026-09-09T00:00:00+08:00',
      charts: [
        { chartType: 'forecast_48h', project: { _id: 'p48', status: 'Submitted' } },
        { chartType: 'analysis', project: { _id: 'pa', status: 'Submitted' } },
        { chartType: 'forecast_24h', project: { _id: 'p24', status: 'Submitted' } },
        { chartType: 'forecast_36h', project: { _id: 'p36', status: 'Submitted' } },
      ],
    });

    expect(model.id).toBe('package-1');
    expect(model.status).toBe('Submitted');
    expect(model.charts.map((chart) => chart.chartType)).toEqual([
      'analysis',
      'forecast_24h',
      'forecast_36h',
      'forecast_48h',
    ]);
    expect(model.charts[0].project.name).toBe(CHART_LABELS.analysis);
  });

  it('derives contributor information from shared package collaboration data', () => {
    const model = adaptForecastPackageModel({
      _id: 'package-2',
      status: 'Draft',
      charts: [
        {
          chartType: 'analysis',
          project: { _id: 'pa', status: 'Draft' },
          activeEditors: [{ user: { firstName: 'Ana', lastName: 'Reyes' } }],
        },
      ],
    });

    expect(model.contributorNames).toEqual(['Ana Reyes']);
    expect(model.contributorLabel).toBe('Ana Reyes');
  });
});
