import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../models/User.js';
import { updateUserDetails } from '../controllers/userController.js';

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
    findById: User.findById,
    findOneAndUpdate: User.findOneAndUpdate,
  };

  User.findOne = mocks.findOne ?? originals.findOne;
  User.findById = mocks.findById ?? originals.findById;
  User.findOneAndUpdate = mocks.findOneAndUpdate ?? originals.findOneAndUpdate;

  try {
    await work();
  } finally {
    User.findOne = originals.findOne;
    User.findById = originals.findById;
    User.findOneAndUpdate = originals.findOneAndUpdate;
  }
}

const userId = '507f1f77bcf86cd799439011';
const ownerActor = {
  _id: { toString: () => userId },
  role: 'forecaster',
};

function updatedUser(email) {
  return {
    _id: userId,
    email,
    firstName: 'Wave',
    role: 'forecaster',
    status: 'active',
    sessionVersion: 8,
    emailVerified: false,
    toObject() {
      return { ...this };
    },
  };
}

test('email change clears inherited verification and recovery state while revoking sessions', async () => {
  let call;
  const res = makeResponse();

  await withUserMocks(
    {
      findOne: () => selectedQuery(null),
      findById: () => selectedQuery({ email: 'old@example.com' }),
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return selectedQuery(updatedUser('new@example.com'));
      },
    },
    async () => {
      await updateUserDetails(
        {
          params: { userId },
          body: { email: ' New@Example.COM ' },
          user: ownerActor,
        },
        res
      );
    }
  );

  assert.equal(res.state.statusCode, 200);
  assert.deepEqual(call.filter, {
    _id: userId,
    deletedAt: null,
    email: 'old@example.com',
  });
  assert.equal(call.update.$set.email, 'new@example.com');
  assert.equal(call.update.$set.emailVerified, false);
  assert.deepEqual(call.update.$unset, {
    emailVerificationToken: '',
    emailVerificationExpires: '',
    passwordResetToken: '',
    passwordResetExpires: '',
  });
  assert.deepEqual(call.update.$inc, { sessionVersion: 1 });
  assert.deepEqual(call.options, { new: true, runValidators: true });
  assert.equal(res.state.body.emailVerificationRequired, true);
  assert.equal(res.state.body.sessionVersion, undefined);
});

test('stale concurrent email change cannot overwrite a newer identity state', async () => {
  const res = makeResponse();

  await withUserMocks(
    {
      findOne: () => selectedQuery(null),
      findById: () => selectedQuery({ email: 'old@example.com' }),
      findOneAndUpdate: () => selectedQuery(null),
    },
    async () => {
      await updateUserDetails(
        {
          params: { userId },
          body: { email: 'new@example.com' },
          user: ownerActor,
        },
        res
      );
    }
  );

  assert.equal(res.state.statusCode, 409);
  assert.match(res.state.body.message, /email changed concurrently/i);
});
