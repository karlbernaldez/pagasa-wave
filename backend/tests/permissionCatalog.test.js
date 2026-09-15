import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ROLE_DEFINITIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_KEYS,
  PERMISSION_METADATA,
  expandEffectivePermissions,
  normalizePermissionKeys,
} from '../config/permissionCatalog.js';

const ADMIN_OPERATIONAL_PERMISSIONS = [
  'dashboard.view',
  'forecast.view',
  'forecast.review',
  'wave_models.manage',
  'wave_pipeline.view',
  'model_onboarding.view',
  'users.view',
  'roles.view',
  'analytics.view',
  'calendar.view',
  'settings.view',
];

test('permission catalog exposes unique stable canonical permission keys', () => {
  assert.ok(PERMISSION_KEYS.length > 0);
  assert.equal(new Set(PERMISSION_KEYS).size, PERMISSION_KEYS.length);
  assert.ok(PERMISSION_KEYS.includes('forecast.view'));
  assert.ok(PERMISSION_KEYS.includes('calendar.view'));
  assert.equal(PERMISSION_KEYS.includes('projects.view'), false);
  assert.equal(PERMISSION_KEYS.includes('projects.view_own'), false);
  assert.ok(PERMISSION_KEYS.includes('roles.edit'));
  assert.ok(PERMISSION_KEYS.includes('wave_models.delete_package'));
});

test('permission presentation metadata exactly covers canonical permissions', () => {
  assert.deepEqual(Object.keys(PERMISSION_METADATA).sort(), [...PERMISSION_KEYS].sort());

  const categoryKeys = PERMISSION_CATEGORIES.map((category) => category.key);
  assert.equal(new Set(categoryKeys).size, categoryKeys.length);

  for (const [permission, metadata] of Object.entries(PERMISSION_METADATA)) {
    assert.ok(categoryKeys.includes(metadata.category), `${permission} has an unknown category`);
    assert.ok(metadata.label.trim(), `${permission} is missing a label`);
    assert.ok(metadata.description.trim(), `${permission} is missing a description`);
    assert.equal(Number.isFinite(metadata.order), true, `${permission} is missing a stable order`);
    assert.ok(
      ['standard', 'elevated'].includes(metadata.sensitivity),
      `${permission} has an unsupported sensitivity`
    );
  }
});

test('permission categories have unique stable ordering', () => {
  const orders = PERMISSION_CATEGORIES.map((category) => category.order);
  assert.equal(new Set(orders).size, orders.length);
  assert.deepEqual(
    orders,
    [...orders].sort((left, right) => left - right)
  );
});

test('high-impact permissions are marked elevated for the management UI', () => {
  for (const permission of [
    'forecast.publish',
    'wave_models.delete_package',
    'users.delete',
    'roles.edit',
    'settings.manage',
  ]) {
    assert.equal(PERMISSION_METADATA[permission]?.sensitivity, 'elevated');
  }
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

test('administrator default role keeps canonical catalog plus legacy view-all compatibility', () => {
  const admin = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'admin');
  assert.ok(admin);
  assert.deepEqual(new Set(admin.permissions), new Set([...PERMISSION_KEYS, 'projects.view_all']));
  assert.equal(admin.system, true);
  assert.equal(admin.enabled, true);
});

test('administrator receives every operational navigation permission through its bundle', () => {
  const admin = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'admin');
  assert.ok(admin);

  const effective = new Set(expandEffectivePermissions(admin.permissions));
  for (const permission of ADMIN_OPERATIONAL_PERMISSIONS) {
    assert.equal(
      effective.has(permission),
      true,
      `expected Administrator to receive ${permission}`
    );
  }
});

test('arbitrary permission bundles expand independently of User Type names', () => {
  const admin = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'admin');
  assert.ok(admin);

  const administratorEffective = expandEffectivePermissions(admin.permissions);
  const customTypeEffective = expandEffectivePermissions([...admin.permissions]);

  assert.deepEqual(customTypeEffective, administratorEffective);
});

test('forecaster default role can view shared packages and legacy standalone projects', () => {
  const forecaster = DEFAULT_ROLE_DEFINITIONS.find((role) => role.key === 'forecaster');
  assert.ok(forecaster);
  assert.ok(forecaster.permissions.includes('forecast.view'));
  assert.ok(forecaster.permissions.includes('projects.view_own'));

  const effective = new Set(expandEffectivePermissions(forecaster.permissions));
  assert.ok(effective.has('projects.view'));
  assert.ok(effective.has('projects.view_own'));
});
