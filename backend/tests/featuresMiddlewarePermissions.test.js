import assert from 'node:assert/strict';
import test from 'node:test';

import Feature from '../models/Feature.js';
import ForecastPackage from '../models/ForecastPackage.js';
import { isFeatureOwnerOrAdmin } from '../middleware/featuresMiddleware.js';

const PROJECT_ID = '507f1f77bcf86cd799439011';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function runWithFeature(req, feature, { packageChart = false } = {}) {
  const originalFeatureFindOne = Feature.findOne;
  const originalPackageExists = ForecastPackage.exists;
  Feature.findOne = async () => feature;
  ForecastPackage.exists = async () => (packageChart ? { _id: 'package-1' } : null);
  const res = createResponse();
  let nextCalled = false;

  try {
    await isFeatureOwnerOrAdmin(req, res, () => {
      nextCalled = true;
    });
    return { req, res, nextCalled };
  } finally {
    Feature.findOne = originalFeatureFindOne;
    ForecastPackage.exists = originalPackageExists;
  }
}

const standaloneFeature = {
  sourceId: 'annotation-1',
  properties: {
    owner: {
      toString() {
        return 'owner-1';
      },
    },
  },
};

const packageFeature = {
  sourceId: 'annotation-2',
  properties: {
    project: PROJECT_ID,
    owner: {
      toString() {
        return 'forecaster-a';
      },
    },
  },
};

test('standalone annotation creator retains access without cross-annotation permission', async () => {
  const { res, nextCalled } = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'owner-1', role: 'custom-forecaster' },
      permissions: ['studio.edit'],
    },
    standaloneFeature
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('standalone cross-creator editing still requires studio.edit_any_annotation', async () => {
  const denied = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'editor-1', role: 'custom-editor' },
      permissions: ['studio.edit'],
    },
    standaloneFeature
  );

  assert.equal(denied.nextCalled, false);
  assert.equal(denied.res.statusCode, 403);

  const allowed = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'editor-1', role: 'custom-editor' },
      permissions: ['studio.edit', 'studio.edit_any_annotation'],
    },
    standaloneFeature
  );

  assert.equal(allowed.nextCalled, true);
  assert.equal(allowed.res.statusCode, 200);
});

test('forecast package chart annotations are collaborative for studio editors regardless of creator', async () => {
  const request = {
    params: { sourceId: 'annotation-2' },
    user: { id: 'forecaster-b', role: 'forecaster' },
    permissions: ['studio.view', 'studio.edit', 'projects.edit'],
  };

  const { req, res, nextCalled } = await runWithFeature(request, packageFeature, {
    packageChart: true,
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.ok(req.permissions.includes('studio.edit_any_annotation'));
});
