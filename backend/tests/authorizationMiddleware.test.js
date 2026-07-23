import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAdmin,
  isOwnerOnly,
  isOwnerOrAdmin,
  requireRole,
} from '../middleware/adminMiddleware.js';

const makeRes = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const runMiddleware = (middleware, req) => {
  const res = makeRes();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
};

test('role authorization requires an authenticated user', () => {
  const result = runMiddleware(isAdmin, {});
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});

test('admin authorization rejects non-admin users', () => {
  const result = runMiddleware(isAdmin, { user: { role: 'forecaster' } });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});

test('admin authorization allows admins', () => {
  const result = runMiddleware(isAdmin, { user: { role: 'admin' } });
  assert.equal(result.nextCalled, true);
});

test('requireRole supports multiple allowed roles', () => {
  const middleware = requireRole('admin', 'forecaster');
  assert.equal(runMiddleware(middleware, { user: { role: 'forecaster' } }).nextCalled, true);
  assert.equal(runMiddleware(middleware, { user: { role: 'user' } }).res.statusCode, 403);
});

test('owner-or-admin allows the account owner', () => {
  const result = runMiddleware(isOwnerOrAdmin, {
    params: { userId: 'user-1' },
    user: { _id: 'user-1', role: 'user' },
  });
  assert.equal(result.nextCalled, true);
});

test('owner-or-admin allows an admin to access another account', () => {
  const result = runMiddleware(isOwnerOrAdmin, {
    params: { userId: 'user-2' },
    user: { _id: 'admin-1', role: 'admin' },
  });
  assert.equal(result.nextCalled, true);
});

test('owner-or-admin rejects another non-admin user', () => {
  const result = runMiddleware(isOwnerOrAdmin, {
    params: { userId: 'user-2' },
    user: { _id: 'user-1', role: 'user' },
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});

test('owner-only does not grant an admin bypass', () => {
  const result = runMiddleware(isOwnerOnly, {
    params: { userId: 'user-2' },
    user: { _id: 'admin-1', role: 'admin' },
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});
