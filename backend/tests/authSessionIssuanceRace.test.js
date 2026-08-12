import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../models/User.js';
import { finalizeLoginUser } from '../controllers/auth/login/loginFinalization.js';
import { resetFailedAttempts } from '../controllers/auth/login/loginCredentials.js';
import { autoUnlockIfExpired } from '../controllers/auth/login/loginGuards.js';

async function withUserMocks({ findOneAndUpdate, updateOne }, work) {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const originalUpdateOne = User.updateOne;

  if (findOneAndUpdate) User.findOneAndUpdate = findOneAndUpdate;
  if (updateOne) User.updateOne = updateOne;

  try {
    await work();
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
    User.updateOne = originalUpdateOne;
  }
}

function queryReturning(value, onSelect) {
  return {
    select(selection) {
      onSelect?.(selection);
      return Promise.resolve(value);
    },
  };
}

test('trusted-device finalization rechecks active verified account state before token issuance', async () => {
  let call;
  let selected;
  const returnedUser = { _id: 'user-1', status: 'active', sessionVersion: 7 };

  await withUserMocks(
    {
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return queryReturning(returnedUser, (value) => {
          selected = value;
        });
      },
    },
    async () => {
      const result = await finalizeLoginUser({
        userId: 'user-1',
        ip: '192.168.1.10',
        userAgent: 'test-agent',
        coordinates: { lat: 14.6, lng: 121.0, accuracyM: 25 },
      });

      assert.equal(result, returnedUser);
    }
  );

  assert.deepEqual(call.filter, {
    _id: 'user-1',
    deletedAt: null,
    status: 'active',
    emailVerified: true,
  });
  assert.equal(call.options.new, true);
  assert.equal(call.update.$set.failedLoginAttempts, 0);
  assert.equal(call.update.$set.lockUntil, null);
  assert.equal(call.update.$set.lastLoginIP, '192.168.1.10');
  assert.equal(call.update.$set.lastLoginUserAgent, 'test-agent');
  assert.deepEqual(call.update.$set.lastLoginLocation, {
    lat: 14.6,
    lng: 121.0,
    accuracyM: 25,
  });
  assert.ok(call.update.$set.lastLogin instanceof Date);
  assert.equal(selected, '+sessionVersion');
});

test('OTP finalization rechecks authorization by normalized email', async () => {
  let call;

  await withUserMocks(
    {
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return queryReturning(null);
      },
    },
    async () => {
      const result = await finalizeLoginUser({
        email: 'forecaster@example.com',
        ip: '10.0.0.8',
        userAgent: 'otp-agent',
      });

      assert.equal(result, null);
    }
  );

  assert.deepEqual(call.filter, {
    email: 'forecaster@example.com',
    deletedAt: null,
    status: 'active',
    emailVerified: true,
  });
});

test('successful password reset uses a narrow update that cannot reactivate a locked account', async () => {
  let call;
  let saveCalls = 0;
  const user = {
    _id: 'user-1',
    failedLoginAttempts: 2,
    lockUntil: null,
    async save() {
      saveCalls += 1;
    },
  };

  await withUserMocks(
    {
      updateOne: async (filter, update) => {
        call = { filter, update };
        return { matchedCount: 1, modifiedCount: 1 };
      },
    },
    async () => {
      await resetFailedAttempts(user);
    }
  );

  assert.equal(saveCalls, 0);
  assert.deepEqual(call.filter, {
    _id: 'user-1',
    deletedAt: null,
    status: 'active',
  });
  assert.deepEqual(call.update, {
    $set: {
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  });
});

test('expired lock cleanup only reactivates an account still locked in the database', async () => {
  let call;
  let saveCalls = 0;
  const user = {
    _id: 'user-1',
    status: 'locked',
    lockUntil: new Date(Date.now() - 60_000),
    failedLoginAttempts: 5,
    sessionVersion: 3,
    isLocked() {
      return this.lockUntil > Date.now();
    },
    async save() {
      saveCalls += 1;
    },
  };
  const unlocked = {
    status: 'active',
    lockUntil: null,
    failedLoginAttempts: 0,
    sessionVersion: 4,
  };

  await withUserMocks(
    {
      findOneAndUpdate: async (filter, update, options) => {
        call = { filter, update, options };
        return unlocked;
      },
    },
    async () => {
      await autoUnlockIfExpired(user);
    }
  );

  assert.equal(saveCalls, 0);
  assert.equal(call.filter._id, 'user-1');
  assert.equal(call.filter.status, 'locked');
  assert.equal(call.filter.deletedAt, null);
  assert.ok(call.filter.lockUntil.$lte instanceof Date);
  assert.equal(call.update.$set.status, 'active');
  assert.equal(call.options.new, true);
  assert.equal(user.status, 'active');
  assert.equal(user.lockUntil, null);
  assert.equal(user.failedLoginAttempts, 0);
  assert.equal(user.sessionVersion, 4);
});

test('expired lock cleanup leaves the stale object non-active when a concurrent status change wins', async () => {
  const user = {
    _id: 'user-1',
    status: 'locked',
    lockUntil: new Date(Date.now() - 60_000),
    failedLoginAttempts: 5,
    isLocked() {
      return this.lockUntil > Date.now();
    },
  };

  await withUserMocks(
    {
      findOneAndUpdate: async () => null,
    },
    async () => {
      await autoUnlockIfExpired(user);
    }
  );

  assert.equal(user.status, 'locked');
  assert.equal(user.failedLoginAttempts, 5);
});
