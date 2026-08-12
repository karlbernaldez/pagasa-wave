import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../models/User.js';
import { MAX_FAILED_ATTEMPTS } from '../controllers/auth/constants/auth.js';
import { recordFailedLogin } from '../controllers/auth/login/loginCredentials.js';

async function withFindOneAndUpdate(mock, work) {
  const original = User.findOneAndUpdate;
  User.findOneAndUpdate = mock;

  try {
    await work();
  } finally {
    User.findOneAndUpdate = original;
  }
}

test('failed login increments from database state in one atomic update', async () => {
  let call;
  const returnedUser = {
    _id: 'user-1',
    status: 'active',
    failedLoginAttempts: 4,
    lockUntil: null,
  };

  await withFindOneAndUpdate(async (filter, update, options) => {
    call = { filter, update, options };
    return returnedUser;
  }, async () => {
    const result = await recordFailedLogin('user-1');
    assert.equal(result, returnedUser);
  });

  assert.deepEqual(call.filter, { _id: 'user-1', deletedAt: null });
  assert.deepEqual(call.options, { new: true });
  assert.equal(call.update.length, 2);
  assert.deepEqual(call.update[0].$set.failedLoginAttempts, {
    $cond: [
      { $eq: ['$status', 'active'] },
      { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] },
      '$failedLoginAttempts',
    ],
  });
});

test('failed login atomically locks at the threshold and invalidates sessions', async () => {
  let pipeline;

  await withFindOneAndUpdate(async (_filter, update) => {
    pipeline = update;
    return {
      _id: 'user-1',
      status: 'locked',
      failedLoginAttempts: MAX_FAILED_ATTEMPTS,
      lockUntil: new Date(),
    };
  }, async () => {
    await recordFailedLogin('user-1');
  });

  const transition = pipeline[1].$set;
  const thresholdCondition = {
    $and: [
      { $eq: ['$status', 'active'] },
      { $gte: ['$failedLoginAttempts', MAX_FAILED_ATTEMPTS] },
    ],
  };

  assert.deepEqual(transition.status.$cond.slice(0, 2), [thresholdCondition, 'locked']);
  assert.deepEqual(transition.lockUntil.$cond[0], thresholdCondition);
  assert.ok(transition.lockUntil.$cond[1] instanceof Date);
  assert.deepEqual(transition.sessionVersion, {
    $cond: [
      thresholdCondition,
      { $add: [{ $ifNull: ['$sessionVersion', 0] }, 1] },
      '$sessionVersion',
    ],
  });
});

test('failed login update does not increment attempts for non-active accounts', async () => {
  let pipeline;

  await withFindOneAndUpdate(async (_filter, update) => {
    pipeline = update;
    return {
      _id: 'user-1',
      status: 'suspended',
      failedLoginAttempts: 2,
      lockUntil: null,
    };
  }, async () => {
    await recordFailedLogin('user-1');
  });

  assert.deepEqual(pipeline[0].$set.failedLoginAttempts.$cond[0], {
    $eq: ['$status', 'active'],
  });
  assert.equal(pipeline[0].$set.failedLoginAttempts.$cond[2], '$failedLoginAttempts');
});
