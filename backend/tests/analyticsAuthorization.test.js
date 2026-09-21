import assert from 'node:assert/strict';
import test from 'node:test';

import { ANALYTICS_ROUTE_ACCESS } from '../routes/analyticsRoutes.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const responseRecorder = () => {
  const state = { status: 200, body: null };
  return {
    state,
    res: {
      status(code) {
        state.status = code;
        return this;
      },
      json(body) {
        state.body = body;
        return this;
      },
    },
  };
};

const runPermissionChain = (requiredPermissions, grantedPermissions) => {
  const req = {
    user: { _id: 'analytics-test-user' },
    permissions: grantedPermissions,
  };
  const { state, res } = responseRecorder();
  let reachedHandler = false;

  const middleware = requiredPermissions.map((permission) => requirePermission(permission));

  const invoke = (index) => {
    if (index >= middleware.length) {
      reachedHandler = true;
      return;
    }
    middleware[index](req, res, () => invoke(index + 1));
  };

  invoke(0);
  return { ...state, reachedHandler, authorizedPermissions: req.authorizedPermissions || [] };
};

test('analytics route access contract keeps subsection reads independently permission scoped', () => {
  const contract = Object.fromEntries(
    ANALYTICS_ROUTE_ACCESS.map(({ path, permissions }) => [path, [...permissions]])
  );

  assert.deepEqual(contract['/forecast'], ['analytics_forecast.view']);
  assert.deepEqual(contract['/users'], ['analytics_users.view']);
  assert.deepEqual(contract['/system'], ['analytics_system.view']);
});

test('analytics export routes require subsection access plus analytics.export', () => {
  const contract = Object.fromEntries(
    ANALYTICS_ROUTE_ACCESS.map(({ path, permissions }) => [path, [...permissions]])
  );

  assert.deepEqual(contract['/forecast/export'], [
    'analytics_forecast.view',
    'analytics.export',
  ]);
  assert.deepEqual(contract['/users/export'], ['analytics_users.view', 'analytics.export']);
  assert.deepEqual(contract['/system/export'], ['analytics_system.view', 'analytics.export']);
});

for (const route of ANALYTICS_ROUTE_ACCESS) {
  test(`${route.path} rejects a signed-in user missing required analytics permissions`, () => {
    const result = runPermissionChain(route.permissions, []);

    assert.equal(result.reachedHandler, false);
    assert.equal(result.status, 403);
    assert.deepEqual(result.body, {
      message: 'You do not have permission to perform this action.',
    });
  });

  test(`${route.path} reaches its handler only with the complete permission set`, () => {
    const result = runPermissionChain(route.permissions, [...route.permissions]);

    assert.equal(result.reachedHandler, true);
    assert.equal(result.status, 200);
    assert.deepEqual(result.authorizedPermissions, [...route.permissions]);
  });
}

for (const route of ANALYTICS_ROUTE_ACCESS.filter(({ path }) => path.endsWith('/export'))) {
  test(`${route.path} rejects analytics.export when subsection access is absent`, () => {
    const result = runPermissionChain(route.permissions, ['analytics.export']);

    assert.equal(result.reachedHandler, false);
    assert.equal(result.status, 403);
  });

  test(`${route.path} rejects subsection access when analytics.export is absent`, () => {
    const subsectionPermission = route.permissions.find(
      (permission) => permission !== 'analytics.export'
    );
    const result = runPermissionChain(route.permissions, [subsectionPermission]);

    assert.equal(result.reachedHandler, false);
    assert.equal(result.status, 403);
  });
}
