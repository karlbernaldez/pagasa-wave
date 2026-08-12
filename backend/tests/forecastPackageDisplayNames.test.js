import assert from 'node:assert/strict';
import test from 'node:test';

import { applyForecastPackageDisplayNames } from '../utils/forecastPackageDisplayNames.js';

const FORECAST_DATE = new Date('2026-08-11T16:00:00.000Z');

function createPackage({
  name = 'Marine Forecast 2026-08-11',
  projectName = 'Marine Forecast 2026-08-11 - Wave Analysis',
} = {}) {
  return {
    _id: 'package-1',
    name,
    forecastDate: FORECAST_DATE,
    charts: [
      {
        chartType: 'analysis',
        project: {
          _id: 'project-1',
          name: projectName,
        },
      },
    ],
  };
}

test('legacy auto-generated names are normalized only in the returned display object', () => {
  const source = createPackage();
  const result = applyForecastPackageDisplayNames(source);

  assert.equal(result.name, 'Marine Forecast 2026-08-12');
  assert.equal(result.charts[0].project.name, 'Marine Forecast 2026-08-12 - Wave Analysis');
  assert.equal(source.name, 'Marine Forecast 2026-08-11');
  assert.equal(source.charts[0].project.name, 'Marine Forecast 2026-08-11 - Wave Analysis');
  assert.notEqual(result, source);
  assert.notEqual(result.charts[0].project, source.charts[0].project);
});

test('intentional custom package and chart names are preserved', () => {
  const source = createPackage({
    name: 'Storm Surge Operations',
    projectName: 'Wave Analysis - Special Briefing',
  });
  const result = applyForecastPackageDisplayNames(source);

  assert.equal(result.name, 'Storm Surge Operations');
  assert.equal(result.charts[0].project.name, 'Wave Analysis - Special Briefing');
});
