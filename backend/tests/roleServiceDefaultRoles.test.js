import assert from 'node:assert/strict';
import test from 'node:test';

import Role from '../models/Role.js';
import { PERMISSION_KEYS } from '../config/permissionCatalog.js';
import { ensureDefaultRoles } from '../services/roleService.js';

test('ensureDefaultRoles keeps an existing administrator synced to the full permission catalog', async () => {
  const originalUpdateOne = Role.updateOne;
  const calls = [];

  try {
    Role.updateOne = async (filter, update, options) => {
      calls.push({ filter, update, options });
      return { acknowledged: true };
    };

    await ensureDefaultRoles();

    const adminCall = calls.find((call) => call.filter?.key === 'admin');
    assert.ok(adminCall);
    assert.deepEqual(adminCall.update?.$set?.permissions, [...PERMISSION_KEYS]);
    assert.equal(adminCall.update?.$set?.system, true);
    assert.equal(adminCall.update?.$set?.enabled, true);
    assert.equal(adminCall.options?.upsert, true);
    assert.ok(adminCall.update.$set.permissions.includes('studio.edit_any_annotation'));

    const forecasterCall = calls.find((call) => call.filter?.key === 'forecaster');
    assert.ok(forecasterCall);
    assert.equal(forecasterCall.update?.$set, undefined);
  } finally {
    Role.updateOne = originalUpdateOne;
  }
});
