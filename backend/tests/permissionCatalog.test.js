import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ROLE_DEFINITIONS,
  PERMISSION_KEYS,
  normalizePermissionKeys,
} from '../config/permissionCatalog.js';

test('permission catalog exposes unique stable permission keys', () => {
  assert.ok(PERMISSION_KEYS.length > 0);
  assert.equal(new Set(PERMISSION_KEYS).size, PERMISSION_KEYS.length);
  assert.ok(PERMISSION_KEYS.includes('projects.view'));
  assert.ok(PERMISSION_KEYS.includes('projects.view_own'));
  assert.ok(PERMISSION_KEYS.includes('roles.edit'));
  assert.ok(PERMISSION_KEYS.includes('wave_models.delete_package'));
});

test('permission normalization removes duplicates and rejects unknown capabilities', () => {
  assert.deepEqual(normalizePermissionKeys(['users.view', 'users.view', 'roles.view']), [
    'roles.view',
    'users.view',
  ]);

  assert.throws(
    () => normalizePermissionKeys(['users.view', 'system.superuser']),
    /Unknown permission keys/
  );
});

test('administrator default role keeps the complete permission catalog', () => {
  const admin = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'admin');
  assert.ok(admin);
  assert.deepEqual(new Set(admin.permissions), new Set(PERMISSION_KEYS));
  assert.equal(admin.system, true);
  assert.equal(admin.enabled, true);
});

test('forecaster default role can view shared packages and legacy standalone projects', () => {
  const forecaster = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'forecaster');
  assert.ok(forecaster);
  assert.ok(forecaster.permissions.includes('projects.view'));
  assert.ok(forecaster.permissions.includes('projects.view_own'));
});
