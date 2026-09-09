import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../models/User.js';
import { updateUserDetails, updateUserStatus } from '../controllers/userController.js';

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
    findById: User.findById,
    findOneAndUpdate: User.findOneAndUpdate,
  };

  User.findById = mocks.findById ?? originals.findById;
  User.findOneAndUpdate = mocks.findOneAndUpdate ?? originals.findOneAndUpdate;

  try {
    await work();
  } finally {
    User.findById = originals.findById;
    User.findOneAndUpdate = originals.findOneAndUpdate;
  }
}

const adminActor = {
  _id: { toString: () => '507f1f77bcf86cd799439012' },
  role: 'admin',
};

const updatedUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'forecaster@example.com',
  firstName: 'Wave',
  role: 'admin',
  status: 'active',
  sessionVersion: 9,
  toObject() {
    return { ...this };
  },
};

const userManageRequest = {
  user: adminActor,
  authorizedPermissions: ['users.edit'],
};

test('admin role change guards the role snapshot in the atomic authorization update', async () => {
  let call;
  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery({ email: updatedUser.email, role: 'forecaster' }),
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return selectedQuery(updatedUser);
      },
    },
    async () => {
      await updateUserDetails(
        {
          params: { userId: updatedUser._id },
          body: { role: 'admin' },
          ...userManageRequest,
        },
        res,
      );
    },
  );

  assert.equal(res.state.statusCode, 200);
  assert.deepEqual(call.filter, {
    _id: updatedUser._id,
    deletedAt: null,
    role: 'forecaster',
  });
  assert.deepEqual(call.update, {
    $set: { role: 'admin' },
    $inc: { sessionVersion: 1 },
  });
  assert.deepEqual(call.options, { new: true, runValidators: true });
});

test('stale admin role change is rejected when another authorization update wins first', async () => {
  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery({ email: updatedUser.email, role: 'forecaster' }),
      findOneAndUpdate: () => selectedQuery(null),
    },
    async () => {
      await updateUserDetails(
        {
          params: { userId: updatedUser._id },
          body: { role: 'admin' },
          ...userManageRequest,
        },
        res,
      );
    },
  );

  assert.equal(res.state.statusCode, 409);
  assert.equal(
    res.state.body.message,
    'Role changed concurrently. Reload the account and try again.',
  );
});

test('admin status change guards the status snapshot in the atomic authorization update', async () => {
  let call;
  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery({ status: 'active', activatedAt: new Date() }),
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return selectedQuery({ ...updatedUser, status: 'suspended' });
      },
    },
    async () => {
      await updateUserStatus(
        {
          params: { userId: updatedUser._id },
          body: { status: 'suspended' },
          user: adminActor,
        },
        res,
      );
    },
  );

  assert.equal(res.state.statusCode, 200);
  assert.deepEqual(call.filter, {
    _id: updatedUser._id,
    deletedAt: null,
    status: 'active',
  });
  assert.deepEqual(call.update, { $set: { status: 'suspended' } });
  assert.deepEqual(call.options, { new: true, runValidators: true });
});

test('stale admin status change is rejected when another authorization update wins first', async () => {
  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery({ status: 'active', activatedAt: new Date() }),
      findOneAndUpdate: () => selectedQuery(null),
    },
    async () => {
      await updateUserStatus(
        {
          params: { userId: updatedUser._id },
          body: { status: 'suspended' },
          user: adminActor,
        },
        res,
      );
    },
  );

  assert.equal(res.state.statusCode, 409);
  assert.equal(
    res.state.body.message,
    'Status changed concurrently. Reload the account and try again.',
  );
});
