import assert from 'node:assert/strict';
import test from 'node:test';

import { requireRole } from '../middleware/adminMiddleware.js';

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

test('requireRole returns 401 when no authenticated user exists', () => {
  const middleware = requireRole('forecaster', 'admin');
  const res = createResponse();
  let nextCalled = false;

  middleware({}, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Authentication required.');
});

test('requireRole rejects a basic user from operational APIs', () => {
  const middleware = requireRole('forecaster', 'admin');
  const req = { user: { id: 'user-1', role: 'user' } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'You do not have permission to perform this action.');
});

test('requireRole permits forecasters', () => {
  const middleware = requireRole('forecaster', 'admin');
  const req = { user: { id: 'forecaster-1', role: 'forecaster' } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('requireRole permits administrators', () => {
  const middleware = requireRole('forecaster', 'admin');
  const req = { user: { id: 'admin-1', role: 'admin' } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
