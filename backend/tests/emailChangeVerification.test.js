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
const adminActor = {
  _id: { toString: () => '507f1f77bcf86cd799439012' },
  role: 'admin',
};

test('owner cannot bypass pending verification through generic profile update', async () => {
  const res = makeResponse();
  let databaseTouched = false;

  await withUserMocks(
    {
      findOne: () => {
        databaseTouched = true;
        return selectedQuery(null);
      },
      findById: () => {
        databaseTouched = true;
        return selectedQuery(null);
      },
      findOneAndUpdate: () => {
        databaseTouched = true;
        return selectedQuery(null);
      },
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

  assert.equal(res.state.statusCode, 400);
  assert.equal(res.state.body.message, 'No permitted fields provided');
  assert.equal(databaseTouched, false);
});

test('user manager changing another account email still invalidates verification and sessions', async () => {
  let call;
  const res = makeResponse();
  const updatedUser = {
    _id: userId,
    email: 'new@example.com',
    firstName: 'Wave',
    sessionVersion: 8,
    toObject() {
      return { ...this };
    },
  };

  await withUserMocks(
    {
      findOne: () => selectedQuery(null),
      findById: () => selectedQuery({ email: 'old@example.com' }),
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return selectedQuery(updatedUser);
      },
    },
    async () => {
      await updateUserDetails(
        {
          params: { userId },
          body: { email: ' New@Example.COM ' },
          user: adminActor,
          authorizedPermissions: ['users.edit'],
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
  assert.deepEqual(call.update.$inc, { sessionVersion: 1 });
  assert.equal(call.update.$unset.pendingEmail, '');
  assert.equal(call.update.$unset.pendingEmailVerificationToken, '');
  assert.equal(call.update.$unset.passwordResetToken, '');
  assert.deepEqual(call.options, { new: true, runValidators: true });
  assert.equal(res.state.body.sessionVersion, undefined);
});
