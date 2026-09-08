import assert from 'node:assert/strict';
import test from 'node:test';

import { requirePermission } from '../middleware/permissionMiddleware.js';

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

test('requirePermission rejects unauthenticated requests', () => {
  const middleware = requirePermission('wave_models.view');
  const res = createResponse();
  let nextCalled = false;

  middleware({}, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body?.message, 'Authentication required.');
});

test('requirePermission rejects authenticated users without the permission', () => {
  const middleware = requirePermission('wave_models.view');
  const res = createResponse();
  let nextCalled = false;

  middleware({ user: { id: 'user-1' }, permissions: ['dashboard.view'] }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body?.message, 'You do not have permission to perform this action.');
});

test('requirePermission allows authenticated users with the permission', () => {
  const middleware = requirePermission('wave_models.view');
  const res = createResponse();
  let nextCalled = false;

  middleware(
    { user: { id: 'user-1' }, permissions: ['dashboard.view', 'wave_models.view'] },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
});
