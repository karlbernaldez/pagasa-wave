import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'crypto';

import User from '../models/User.js';
import { verifyEmail } from '../controllers/auth/verifyEmail.js';

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

async function withFindOneAndUpdate(mock, work) {
  const original = User.findOneAndUpdate;
  User.findOneAndUpdate = mock;

  try {
    await work();
  } finally {
    User.findOneAndUpdate = original;
  }
}

const makeRequest = (token) => ({
  query: { token },
  ip: '10.0.0.8',
  headers: { 'user-agent': 'test-agent' },
});

test('email verification atomically consumes the still-current verification token', async () => {
  const token = 'verification-token';
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  let call;
  const verifiedUser = { _id: '507f1f77bcf86cd799439011' };
  const res = makeResponse();

  await withFindOneAndUpdate(
    async (filter, update, options) => {
      call = { filter, update, options };
      return verifiedUser;
    },
    async () => {
      await verifyEmail(makeRequest(token), res);
    }
  );

  assert.equal(res.state.statusCode, 200);
  assert.equal(call.filter.emailVerificationToken, hashedToken);
  assert.equal(call.filter.emailVerified, false);
  assert.equal(call.filter.deletedAt, null);
  assert.ok(call.filter.emailVerificationExpires.$gt instanceof Date);
  assert.deepEqual(call.update, {
    $set: { emailVerified: true },
    $unset: {
      emailVerificationToken: '',
      emailVerificationExpires: '',
    },
  });
  assert.deepEqual(call.options, { new: true });
});

test('email verification fails if a concurrent email change already cleared the token', async () => {
  const res = makeResponse();

  await withFindOneAndUpdate(
    async () => null,
    async () => {
      await verifyEmail(makeRequest('stale-token'), res);
    }
  );

  assert.equal(res.state.statusCode, 400);
  assert.equal(res.state.body.message, 'Invalid or expired verification token.');
});
