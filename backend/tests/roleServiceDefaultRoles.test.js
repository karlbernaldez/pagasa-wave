import assert from 'node:assert/strict';
import test from 'node:test';

import Role from '../models/Role.js';
import { PERMISSION_KEYS } from '../config/permissionCatalog.js';
import { ensureDefaultRoles } from '../services/roleService.js';

async function withRoleUpdateMock(work) {
  const originalUpdateOne = Role.updateOne;
  const calls = [];

  try {
    Role.updateOne = async (filter, update, options) => {
      calls.push({ filter, update, options });
      return { acknowledged: true };
    };

    await work(calls);
  } finally {
    Role.updateOne = originalUpdateOne;
  }
}

test('ensureDefaultRoles keeps Administrator synced without conflicting Mongo update paths', async () => {
  await withRoleUpdateMock(async (calls) => {
    await ensureDefaultRoles();

    const adminCall = calls.find((call) => call.filter?.key === 'admin');
    assert.ok(adminCall);
    assert.deepEqual(adminCall.update?.$set?.permissions, [...PERMISSION_KEYS]);
    assert.equal(adminCall.update?.$set?.system, true);
    assert.equal(adminCall.update?.$set?.enabled, true);
    assert.equal(adminCall.options?.upsert, true);
    assert.ok(adminCall.update.$set.permissions.includes('studio.edit_any_annotation'));
    assert.ok(adminCall.update.$set.permissions.includes('chat.admin_knowledge'));

    assert.equal(
      Object.prototype.hasOwnProperty.call(adminCall.update.$setOnInsert, 'permissions'),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(adminCall.update.$setOnInsert, 'system'),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(adminCall.update.$setOnInsert, 'enabled'),
      false
    );
  });
});

test('ensureDefaultRoles keeps non-Administrator defaults insert-only', async () => {
  await withRoleUpdateMock(async (calls) => {
    await ensureDefaultRoles();

    const forecasterCall = calls.find((call) => call.filter?.key === 'forecaster');
    assert.ok(forecasterCall);
    assert.equal(forecasterCall.update?.$set, undefined);
    assert.equal(Array.isArray(forecasterCall.update?.$setOnInsert?.permissions), true);
  });
});
