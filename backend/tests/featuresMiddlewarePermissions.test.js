import assert from 'node:assert/strict';
import test from 'node:test';

import Feature from '../models/Feature.js';
import { isFeatureOwnerOrAdmin } from '../middleware/featuresMiddleware.js';

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

async function runWithFeature(req, feature) {
  const originalFindOne = Feature.findOne;
  Feature.findOne = async () => feature;
  const res = createResponse();
  let nextCalled = false;

  try {
    await isFeatureOwnerOrAdmin(req, res, () => {
      nextCalled = true;
    });
    return { res, nextCalled };
  } finally {
    Feature.findOne = originalFindOne;
  }
}

const feature = {
  sourceId: 'annotation-1',
  properties: {
    owner: {
      toString() {
        return 'owner-1';
      },
    },
  },
};

test('annotation owner retains access without cross-owner permission', async () => {
  const { res, nextCalled } = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'owner-1', role: 'custom-forecaster' },
      permissions: ['studio.edit'],
    },
    feature
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('cross-owner annotation access requires studio.edit_any_annotation', async () => {
  const denied = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'editor-1', role: 'custom-editor' },
      permissions: ['studio.edit'],
    },
    feature
  );

  assert.equal(denied.nextCalled, false);
  assert.equal(denied.res.statusCode, 403);

  const allowed = await runWithFeature(
    {
      params: { sourceId: 'annotation-1' },
      user: { id: 'editor-1', role: 'custom-editor' },
      permissions: ['studio.edit', 'studio.edit_any_annotation'],
    },
    feature
  );

  assert.equal(allowed.nextCalled, true);
  assert.equal(allowed.res.statusCode, 200);
});
