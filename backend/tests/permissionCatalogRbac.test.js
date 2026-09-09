import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PERMISSION_CATALOG,
  expandEffectivePermissions,
  normalizePermissionKeys,
} from '../config/permissionCatalog.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const runMiddleware = (middleware, req) => {
  const res = {
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
  };
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

test('permission catalog exposes canonical forecast permissions and not legacy projects domain', () => {
  assert.deepEqual(PERMISSION_CATALOG.forecast, [
    'view',
    'edit',
    'submit',
    'review',
    'approve',
    'publish',
    'archive',
  ]);
  assert.equal(Object.hasOwn(PERMISSION_CATALOG, 'projects'), false);
});

test('legacy project workflow permissions normalize to canonical forecast permissions', () => {
  assert.deepEqual(
    normalizePermissionKeys([
      'projects.view',
      'projects.edit',
      'projects.submit',
      'projects.review',
      'projects.approve',
      'projects.publish',
    ]),
    [
      'forecast.approve',
      'forecast.edit',
      'forecast.publish',
      'forecast.review',
      'forecast.submit',
      'forecast.view',
    ]
  );
});

test('forecast permission implications add required prerequisite capabilities', () => {
  assert.deepEqual(normalizePermissionKeys(['forecast.approve']), [
    'forecast.approve',
    'forecast.review',
    'forecast.view',
  ]);

  assert.deepEqual(normalizePermissionKeys(['forecast.edit']), [
    'forecast.edit',
    'forecast.view',
  ]);
});

test('canonical forecast permissions expand to legacy route permissions during migration', () => {
  const effective = new Set(
    expandEffectivePermissions(['forecast.review', 'forecast.approve', 'forecast.publish'])
  );

  for (const permission of [
    'forecast.view',
    'forecast.review',
    'forecast.approve',
    'forecast.publish',
    'projects.view',
    'projects.review',
    'projects.approve',
    'projects.publish',
  ]) {
    assert.equal(effective.has(permission), true, `expected ${permission}`);
  }
});

test('forecast.view does not imply legacy projects.view_all or projects.view_own scope', () => {
  const effective = new Set(expandEffectivePermissions(['forecast.view']));

  assert.equal(effective.has('projects.view'), true);
  assert.equal(effective.has('projects.view_all'), false);
  assert.equal(effective.has('projects.view_own'), false);
});

test('legacy project scope permissions are preserved without broadening them', () => {
  const own = new Set(expandEffectivePermissions(['projects.view_own']));
  assert.equal(own.has('projects.view_own'), true);
  assert.equal(own.has('projects.view_all'), false);

  const all = new Set(expandEffectivePermissions(['projects.view_all']));
  assert.equal(all.has('projects.view_all'), true);
  assert.equal(all.has('projects.view_own'), false);
});

test('permission middleware ignores User Type name when effective permissions are identical', () => {
  const reviewerPermission = 'forecast.review';
  const middleware = requirePermission(reviewerPermission);

  for (const role of ['admin', 'forecaster', 'duty_reviewer', 'shift-lead', 'marine_ops']) {
    const result = runMiddleware(middleware, {
      user: { id: `user-${role}`, role },
      permissions: ['forecast.view', reviewerPermission],
    });
    assert.equal(result.nextCalled, true, `${role} should be authorized by permission`);
  }
});

test('permission middleware rejects any User Type that lacks the required permission', () => {
  const middleware = requirePermission('forecast.review');

  for (const role of ['admin', 'forecaster', 'duty_reviewer', 'shift-lead']) {
    const result = runMiddleware(middleware, {
      user: { id: `user-${role}`, role },
      permissions: ['forecast.view'],
    });
    assert.equal(result.nextCalled, false, `${role} should not bypass missing permission`);
    assert.equal(result.res.statusCode, 403);
  }
});
