import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import { requestEmailChange } from '../controllers/emailChangeController.js';

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

test('email change writes only pending identity state and preserves the current email and session version', async () => {
  const currentPassword = 'CurrentPassword123!';
  const passwordHash = await bcrypt.hash(currentPassword, 4);
  let findCount = 0;
  let write;
  const res = makeResponse();

  await withUserMocks(
    {
      findOne: (filter) => {
        findCount += 1;
        if (findCount === 1) {
          assert.equal(filter.status, 'active');
          return selectedQuery({
            _id: userId,
            email: 'old@example.com',
            firstName: 'Wave',
            password: passwordHash,
          });
        }
        return selectedQuery(null);
      },
      findOneAndUpdate: (filter, update, options) => {
        write = { filter, update, options };
        return selectedQuery({
          _id: userId,
          email: 'old@example.com',
          firstName: 'Wave',
          pendingEmail: 'new@example.com',
          pendingEmailVerificationExpires: new Date(Date.now() + 60_000),
        });
      },
    },
    async () => {
      await requestEmailChange(
        makeRequest({
          newEmail: ' New@Example.COM ',
          currentPassword,
        }),
        res
      );
    }
  );

  assert.equal(write.filter._id, userId);
  assert.equal(write.filter.status, 'active');
  assert.equal(write.filter.email, 'old@example.com');
  assert.equal(write.filter.password, passwordHash);
  assert.equal(write.update.$set.pendingEmail, 'new@example.com');
  assert.ok(write.update.$set.pendingEmailVerificationToken);
  assert.ok(write.update.$set.pendingEmailVerificationExpires instanceof Date);
  assert.equal(write.update.$set.email, undefined);
  assert.equal(write.update.$inc, undefined);
  assert.deepEqual(write.options, { new: true, runValidators: true });

  // Focused tests do not configure SMTP, so delivery fails after the guarded
  // pending-state write. That is expected here; the security invariant under
  // test is that requesting a change does not replace the canonical identity.
  assert.equal(res.state.statusCode, 502);
  assert.equal(res.state.body.pendingEmail, 'new@example.com');
});
