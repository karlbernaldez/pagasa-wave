import assert from 'node:assert/strict';
import test from 'node:test';

import ForecastPackage from '../models/ForecastPackage.js';
import { syncPackageStatusFromCharts } from '../routes/forecastPackageRoutes.js';

function createQuery(result) {
  return {
    populate() {
      return this;
    },
    lean() {
      return Promise.resolve(result);
    },
  };
}

test('status sync does not overwrite a concurrent package transition', async () => {
  const originalFindOneAndUpdate = ForecastPackage.findOneAndUpdate;
  const originalFindById = ForecastPackage.findById;
  let receivedFilter;
  let reloadCount = 0;

  try {
    ForecastPackage.findOneAndUpdate = (filter) => {
      receivedFilter = filter;
      return createQuery(null);
    };

    ForecastPackage.findById = () => {
      reloadCount += 1;
      return createQuery({
        _id: 'package-1',
        status: 'Published',
        charts: [],
      });
    };

    const result = await syncPackageStatusFromCharts(
      {
        _id: 'package-1',
        status: 'Under Review',
        charts: [
          { chartType: 'analysis', project: { status: 'Approved' } },
          { chartType: 'forecast_24h', project: { status: 'Approved' } },
          { chartType: 'forecast_36h', project: { status: 'Approved' } },
          { chartType: 'forecast_48h', project: { status: 'Approved' } },
        ],
      },
      'admin-1'
    );

    assert.deepEqual(receivedFilter, {
      _id: 'package-1',
      status: 'Under Review',
    });
    assert.equal(reloadCount, 1);
    assert.equal(result.status, 'Published');
  } finally {
    ForecastPackage.findOneAndUpdate = originalFindOneAndUpdate;
    ForecastPackage.findById = originalFindById;
  }
});
