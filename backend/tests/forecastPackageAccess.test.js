import test from 'node:test';
import assert from 'node:assert/strict';

import ForecastPackage from '../models/ForecastPackage.js';
import { canAccessProject } from '../utils/forecastPackageAccess.js';

const OWNER_ID = 'owner-1';
const project = {
  _id: '507f1f77bcf86cd799439011',
  owner: OWNER_ID,
};

test('admins and owners of non-package projects retain access', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => null;
    assert.equal(await canAccessProject({ id: 'admin-1', role: 'admin' }, project), true);
    assert.equal(await canAccessProject({ id: OWNER_ID, role: 'user' }, project), true);
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('all forecasters may collaborate on forecast-package charts', async () => {
  const originalExists = ForecastPackage.exists;
  try {
    ForecastPackage.exists = async () => ({ _id: 'package-1' });
    assert.equal(
      await canAccessProject({ id: 'forecaster-2', role: 'forecaster' }, project),
      true,
    );
  } finally {
    ForecastPackage.exists = originalExists;
  }
});

test('ordinary users do not inherit access from forecast-package membership', async () => {
  const originalExists = ForecastPackage.exists;
  let packageLookupCount = 0;
  try {
    ForecastPackage.exists = async () => {
      packageLookupCount += 1;
      return { _id: 'package-1' };
    };
    assert.equal(
      await canAccessProject({ id: 'user-2', role: 'user' }, project),
      false,
    );
    assert.equal(packageLookupCount, 1);
  } finally {
    ForecastPackage.exists = originalExists;
  }
});
