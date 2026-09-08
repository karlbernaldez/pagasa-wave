import assert from 'node:assert/strict';
import test from 'node:test';

import {
  requireAnyPermission,
  requirePermission,
  requireSelfOrPermission,
} from '../middleware/permissionMiddleware.js';

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
  const req = { user: { id: 'user-1' }, permissions: ['dashboard.view', 'wave_models.view'] };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
  assert.deepEqual(req.authorizedPermissions, ['wave_models.view']);
});

test('requireAnyPermission allows one matching permission', () => {
  const middleware = requireAnyPermission('projects.view_own', 'projects.view_all', 'projects.review');
  const res = createResponse();
  let nextCalled = false;
  const req = { user: { id: 'reviewer-1' }, permissions: ['projects.review'] };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(req.authorizedPermissions, ['projects.review']);
});

test('requireAnyPermission rejects requests without any accepted permission', () => {
  const middleware = requireAnyPermission('projects.view_own', 'projects.view_all');
  const res = createResponse();
  let nextCalled = false;

  middleware({ user: { id: 'user-1' }, permissions: ['dashboard.view'] }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('requireSelfOrPermission rejects unauthenticated requests', () => {
  const middleware = requireSelfOrPermission('users.view');
  const res = createResponse();
  let nextCalled = false;

  middleware({ params: { userId: 'user-1' } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('requireSelfOrPermission allows self-service without management permission', () => {
  const middleware = requireSelfOrPermission('users.view');
  const res = createResponse();
  let nextCalled = false;
  const req = {
    user: { id: 'user-1' },
    params: { userId: 'user-1' },
    permissions: [],
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(req.authorizedPermissions, undefined);
});

test('requireSelfOrPermission allows another account with explicit management permission', () => {
  const middleware = requireSelfOrPermission('users.edit');
  const res = createResponse();
  let nextCalled = false;
  const req = {
    user: { id: 'manager-1' },
    params: { userId: 'user-2' },
    permissions: ['users.edit'],
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.authorizedPermissions, ['users.edit']);
});

test('requireSelfOrPermission rejects another account without management permission', () => {
  const middleware = requireSelfOrPermission('users.edit');
  const res = createResponse();
  let nextCalled = false;

  middleware(
    {
      user: { id: 'user-1' },
      params: { userId: 'user-2' },
      permissions: ['users.view'],
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
