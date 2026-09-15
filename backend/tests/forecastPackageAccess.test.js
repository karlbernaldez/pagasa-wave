import test from 'node:test';
import assert from 'node:assert/strict';

import ForecastPackage from '../models/ForecastPackage.js';
import {
  assertForecastPackageChartMutationAllowed,
  canAccessProject,
  getForecastPackageChartAccess,
} from '../utils/forecastPackageAccess.js';
import { FORECAST_PACKAGE_STATUS } from '../utils/forecastPackage.js';

const OWNER_ID = 'owner-1';
const PROJECT_ID = '507f1f77bcf86cd799439011';
const project = {
  _id: PROJECT_ID,
  owner: OWNER_ID,
};

function createForecastPackage({
  status = FORECAST_PACKAGE_STATUS.DRAFT,
  isComplete = false,
} = {}) {
  return {
    status,
    charts: [
      {
        project: PROJECT_ID,
        chartType: 'analysis',
      },
    ],
    chartCompletion: [
      {
        chartType: 'analysis',
        isComplete,
      },
    ],
  };
}

async function withMockedForecastPackageFindOne(result, fn) {
  const originalFindOne = ForecastPackage.findOne;
  ForecastPackage.findOne = async () => result;

  try {
    return await fn();
  } finally {
    ForecastPackage.findOne = originalFindOne;
  }
}

test('view-all users and permitted owners of non-package projects retain access', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => null;
    assert.equal(
      await canAccessProject({ id: 'reviewer-1', role: 'reviewer' }, project, [
        'projects.view_all',
      ]),
      true
    );
    assert.equal(
      await canAccessProject({ id: OWNER_ID, role: 'custom_forecaster' }, project, [
        'projects.view_own',
      ]),
      true
    );
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('projects.view grants read access to shared forecast-package charts', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => ({ _id: 'package-1' });
    assert.equal(
      await canAccessProject({ id: 'viewer-1', role: 'custom_viewer' }, project, ['projects.view']),
      true
    );
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('users with project editing or review permissions may collaborate on forecast-package charts', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => ({ _id: 'package-1' });
    assert.equal(
      await canAccessProject({ id: 'forecaster-2', role: 'custom_forecaster' }, project, [
        'projects.edit',
      ]),
      true
    );
    assert.equal(
      await canAccessProject({ id: 'reviewer-2', role: 'reviewer' }, project, ['projects.review']),
      true
    );
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('projects.view_own alone does not grant shared forecast-package access', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => ({ _id: 'package-1' });
    assert.equal(
      await canAccessProject({ id: OWNER_ID, role: 'legacy_owner' }, project, [
        'projects.view_own',
      ]),
      false
    );
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('users without project permissions do not inherit access from forecast-package membership', async () => {
  const originalExists = ForecastPackage.exists;
  let packageLookupCount = 0;
  try {
    ForecastPackage.exists = async () => {
      packageLookupCount += 1;
      return { _id: 'package-1' };
    };
    assert.equal(await canAccessProject({ id: 'user-2', role: 'user' }, project, []), false);
    assert.equal(packageLookupCount, 1);
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('forecast chart access returns null for projects outside forecast packages', async () => {
  await withMockedForecastPackageFindOne(null, async () => {
    assert.equal(await getForecastPackageChartAccess(PROJECT_ID), null);
    await assert.doesNotReject(() => assertForecastPackageChartMutationAllowed(PROJECT_ID));
  });
});

test('forecast chart annotations remain mutable while package is editable and chart is incomplete', async () => {
  const forecastPackage = createForecastPackage();

  await withMockedForecastPackageFindOne(forecastPackage, async () => {
    const access = await getForecastPackageChartAccess(PROJECT_ID);

    assert.equal(access.forecastPackage, forecastPackage);
    assert.equal(access.chart.chartType, 'analysis');
    assert.equal(access.completion.isComplete, false);
    await assert.doesNotReject(() => assertForecastPackageChartMutationAllowed(PROJECT_ID));
  });
});

test('certified forecast charts reject annotation mutations until reopened', async () => {
  await withMockedForecastPackageFindOne(createForecastPackage({ isComplete: true }), async () => {
    await assert.rejects(() => assertForecastPackageChartMutationAllowed(PROJECT_ID), {
      message:
        'Wave Analysis is certified ready and view only. Reopen the chart before editing annotations.',
      status: 403,
    });
  });
});

test('forecast chart annotations reject mutations after package leaves editing', async () => {
  await withMockedForecastPackageFindOne(
    createForecastPackage({ status: FORECAST_PACKAGE_STATUS.SUBMITTED }),
    async () => {
      await assert.rejects(() => assertForecastPackageChartMutationAllowed(PROJECT_ID), {
        message: 'Forecast chart annotations are view only after the package leaves editing.',
        status: 403,
      });
    }
  );
});
