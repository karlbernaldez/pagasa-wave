import assert from 'node:assert/strict';
import test from 'node:test';

import AnnotationAudit from '../models/AnnotationAudit.js';
import Feature from '../models/Feature.js';
import { auditAnnotationMutation } from '../middleware/annotationAuditMiddleware.js';

const PROJECT_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439012';

function featureSnapshot(name, coordinates) {
  return {
    sourceId: 'annotation-1',
    name,
    geometry: { type: 'Point', coordinates },
    properties: {
      project: PROJECT_ID,
      stableId: 'stable-1',
      style: { size: 2 },
      labelValue: name,
    },
  };
}

function queryResult(value) {
  return {
    lean() {
      return Promise.resolve(value);
    },
  };
}

async function runAuditedResponse(action, before, after) {
  const originalFindOne = Feature.findOne;
  const originalAuditCreate = AnnotationAudit.create;
  let lookupCount = 0;
  let auditPayload;
  let resolveResponse;
  const responseSent = new Promise((resolve) => {
    resolveResponse = resolve;
  });

  Feature.findOne = () => {
    lookupCount += 1;
    return queryResult(lookupCount === 1 ? before : after);
  };
  AnnotationAudit.create = async (payload) => {
    auditPayload = payload;
    return payload;
  };

  const req = {
    params: { sourceId: 'annotation-1' },
    body: {},
    user: { id: USER_ID },
  };
  const res = {
    statusCode: 200,
    json(body) {
      resolveResponse(body);
      return this;
    },
  };

  try {
    await new Promise((resolve, reject) => {
      auditAnnotationMutation(action)(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({ ok: true });
    const body = await responseSent;
    return { auditPayload, body, lookupCount };
  } finally {
    Feature.findOne = originalFindOne;
    AnnotationAudit.create = originalAuditCreate;
  }
}

test('annotation move audit records actor and before/after state before responding', async () => {
  const before = featureSnapshot('Low', [120, 15]);
  const after = featureSnapshot('Low', [121, 16]);
  const { auditPayload, body, lookupCount } = await runAuditedResponse('moved', before, after);

  assert.deepEqual(body, { ok: true });
  assert.equal(lookupCount, 2);
  assert.equal(auditPayload.project, PROJECT_ID);
  assert.equal(auditPayload.performedBy, USER_ID);
  assert.equal(auditPayload.action, 'moved');
  assert.deepEqual(auditPayload.before.geometry.coordinates, [120, 15]);
  assert.deepEqual(auditPayload.after.geometry.coordinates, [121, 16]);
});

test('annotation delete audit preserves the deleted state and actor', async () => {
  const before = featureSnapshot('Typhoon', [125, 13]);
  const { auditPayload, body, lookupCount } = await runAuditedResponse('deleted', before, null);

  assert.deepEqual(body, { ok: true });
  assert.equal(lookupCount, 1);
  assert.equal(auditPayload.action, 'deleted');
  assert.equal(auditPayload.performedBy, USER_ID);
  assert.equal(auditPayload.before.name, 'Typhoon');
  assert.equal(auditPayload.after, null);
});
