import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import { changePassword } from '../controllers/userController.js';

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
      return Promise.resolve(value);
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

const makeRequest = (currentPassword, newPassword) => ({
  params: { userId: '507f1f77bcf86cd799439011' },
  body: { currentPassword, newPassword },
  user: {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    role: 'forecaster',
  },
});

test('password change is conditional on the exact password hash that was verified', async () => {
  const currentPassword = 'CurrentPassword123!';
  const verifiedPasswordHash = await bcrypt.hash(currentPassword, 4);
  const loadedUser = {
    _id: '507f1f77bcf86cd799439011',
    password: verifiedPasswordHash,
    sessionVersion: 7,
  };

  let updateFilter;
  let updateDocument;

  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery(loadedUser),
      findOneAndUpdate: (filter, update) => {
        updateFilter = filter;
        updateDocument = update;
        return selectedQuery({ _id: loadedUser._id, sessionVersion: 8 });
      },
    },
    async () => {
      await changePassword(makeRequest(currentPassword, 'ReplacementPassword123!'), res);
    }
  );

  assert.equal(res.state.statusCode, 200);
  assert.equal(updateFilter._id, loadedUser._id);
  assert.equal(updateFilter.password, verifiedPasswordHash);
  assert.equal(updateFilter.deletedAt, null);
  assert.notEqual(updateDocument.$set.password, verifiedPasswordHash);
  assert.equal(await bcrypt.compare('ReplacementPassword123!', updateDocument.$set.password), true);
});

test('stale concurrent password change is rejected after the verified password hash changes', async () => {
  const currentPassword = 'CurrentPassword123!';
  const verifiedPasswordHash = await bcrypt.hash(currentPassword, 4);
  const loadedUser = {
    _id: '507f1f77bcf86cd799439011',
    password: verifiedPasswordHash,
    sessionVersion: 7,
  };

  const res = makeResponse();

  await withUserMocks(
    {
      findById: () => selectedQuery(loadedUser),
      findOneAndUpdate: () => selectedQuery(null),
    },
    async () => {
      await changePassword(makeRequest(currentPassword, 'AttackerReplacement123!'), res);
    }
  );

  assert.equal(res.state.statusCode, 409);
  assert.match(res.state.body.message, /changed concurrently/i);
});
