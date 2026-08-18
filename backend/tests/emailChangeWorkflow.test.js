import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import {
  buildPendingEmailChangeMutation,
  requestEmailChange,
} from '../controllers/emailChangeController.js';

function makeResponse() {
  const state = { statusCode: 200, body: null };

  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
  };
}

function selectedQuery(value) {
  return {
    select() {
      return this;
    },
    lean() {
      return Promise.resolve(value);
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}

async function withUserMocks(mocks, work) {
  const originals = {
    findOne: User.findOne,
    findOneAndUpdate: User.findOneAndUpdate,
  };

  User.findOne = mocks.findOne ?? originals.findOne;
  User.findOneAndUpdate = mocks.findOneAndUpdate ?? originals.findOneAndUpdate;

  try {
    await work();
  } finally {
    User.findOne = originals.findOne;
    User.findOneAndUpdate = originals.findOneAndUpdate;
  }
}

const userId = '507f1f77bcf86cd799439011';
const makeRequest = (body) => ({
  params: { userId },
  body,
  ip: '10.0.0.8',
  headers: { 'user-agent': 'test-agent' },
});

test('email change requires the current password before any pending identity write', async () => {
  const currentPassword = 'CurrentPassword123!';
  const passwordHash = await bcrypt.hash(currentPassword, 4);
  let updateCalled = false;
  const res = makeResponse();

  await withUserMocks(
    {
      findOne: () =>
        selectedQuery({
          _id: userId,
          email: 'old@example.com',
          firstName: 'Wave',
          password: passwordHash,
        }),
      findOneAndUpdate: () => {
        updateCalled = true;
        return selectedQuery(null);
      },
    },
    async () => {
      await requestEmailChange(
        makeRequest({
          newEmail: 'new@example.com',
          currentPassword: 'WrongPassword123!',
        }),
        res
      );
    }
  );

  assert.equal(res.state.statusCode, 400);
  assert.match(res.state.body.message, /incorrect current password/i);
  assert.equal(updateCalled, false);
});

test('pending email mutation preserves the canonical email and session generation', () => {
  const expiresAt = new Date('2026-08-13T04:00:00.000Z');
  const requestedAt = new Date('2026-08-13T03:00:00.000Z');

  const mutation = buildPendingEmailChangeMutation({
    userId,
    currentEmail: 'old@example.com',
    passwordHash: 'verified-password-hash',
    newEmail: 'new@example.com',
    tokenHash: 'pending-token-hash',
    expiresAt,
    requestedAt,
  });

  assert.deepEqual(mutation.filter, {
    _id: userId,
    status: 'active',
    deletedAt: null,
    email: 'old@example.com',
    password: 'verified-password-hash',
  });
  assert.deepEqual(mutation.update, {
    $set: {
      pendingEmail: 'new@example.com',
      pendingEmailVerificationToken: 'pending-token-hash',
      pendingEmailVerificationExpires: expiresAt,
      pendingEmailRequestedAt: requestedAt,
    },
  });
  assert.equal(mutation.update.$set.email, undefined);
  assert.equal(mutation.update.$inc, undefined);
  assert.deepEqual(mutation.options, { new: true, runValidators: true });
});
