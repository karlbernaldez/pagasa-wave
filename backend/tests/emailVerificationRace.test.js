import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'crypto';

import User from '../models/User.js';
import { verifyEmail } from '../controllers/auth/verifyEmail.js';

function makeResponse() {
  const state = { statusCode: 200, body: null, clearedCookies: [] };

  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    clearCookie(name) {
      state.clearedCookies.push(name);
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

const makeRequest = (token) => ({
  query: { token },
  ip: '10.0.0.8',
  headers: { 'user-agent': 'test-agent' },
});

test('registration verification atomically consumes the still-current token', async () => {
  const token = 'verification-token';
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  let call;
  const res = makeResponse();

  await withUserMocks(
    {
      findOneAndUpdate: (filter, update, options) => {
        call = { filter, update, options };
        return selectedQuery({
          _id: '507f1f77bcf86cd799439011',
          email: 'verified@example.com',
        });
      },
    },
    async () => {
      await verifyEmail(makeRequest(token), res);
    }
  );

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.kind, 'registration');
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
  assert.deepEqual(res.state.clearedCookies, []);
});

test('pending email verification promotes only the exact active pending identity', async () => {
  const token = 'pending-email-token';
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const userId = '507f1f77bcf86cd799439011';
  const res = makeResponse();
  const updateCalls = [];
  let pendingLookup;

  await withUserMocks(
    {
      findOne: (filter) => {
        pendingLookup = filter;
        return selectedQuery({
          _id: userId,
          email: 'old@example.com',
          pendingEmail: 'new@example.com',
        });
      },
      findOneAndUpdate: (filter, update, options) => {
        updateCalls.push({ filter, update, options });
        if (updateCalls.length === 1) return selectedQuery(null);
        return selectedQuery({ _id: userId, email: 'new@example.com' });
      },
    },
    async () => {
      await verifyEmail(makeRequest(token), res);
    }
  );

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.kind, 'email_change');
  assert.equal(res.state.body.email, 'new@example.com');
  assert.equal(res.state.body.sessionRevoked, true);
  assert.deepEqual(res.state.clearedCookies.sort(), ['accessToken', 'refreshToken']);
  assert.equal(pendingLookup.status, 'active');
  assert.equal(pendingLookup.pendingEmailVerificationToken, hashedToken);

  const promotion = updateCalls[1];
  assert.deepEqual(
    {
      _id: promotion.filter._id,
      email: promotion.filter.email,
      pendingEmail: promotion.filter.pendingEmail,
      pendingEmailVerificationToken: promotion.filter.pendingEmailVerificationToken,
      status: promotion.filter.status,
      deletedAt: promotion.filter.deletedAt,
    },
    {
      _id: userId,
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
      pendingEmailVerificationToken: hashedToken,
      status: 'active',
      deletedAt: null,
    }
  );
  assert.equal(promotion.update.$set.email, 'new@example.com');
  assert.equal(promotion.update.$set.emailVerified, true);
  assert.deepEqual(promotion.update.$inc, { sessionVersion: 1 });
  assert.equal(promotion.update.$unset.pendingEmail, '');
  assert.equal(promotion.update.$unset.pendingEmailVerificationToken, '');
  assert.equal(promotion.update.$unset.passwordResetToken, '');
  assert.deepEqual(promotion.options, { new: true, runValidators: true });
});

test('pending email verification does not promote an unavailable account', async () => {
  const res = makeResponse();
  let pendingLookup;
  let updateCount = 0;

  await withUserMocks(
    {
      findOne: (filter) => {
        pendingLookup = filter;
        return selectedQuery(null);
      },
      findOneAndUpdate: () => {
        updateCount += 1;
        return selectedQuery(null);
      },
    },
    async () => {
      await verifyEmail(makeRequest('pending-token'), res);
    }
  );

  assert.equal(pendingLookup.status, 'active');
  assert.equal(updateCount, 1);
  assert.equal(res.state.statusCode, 400);
  assert.equal(res.state.body.message, 'Invalid or expired verification token.');
});

test('verification fails if the token is invalid, expired, cancelled, or already consumed', async () => {
  const res = makeResponse();

  await withUserMocks(
    {
      findOne: () => selectedQuery(null),
      findOneAndUpdate: () => selectedQuery(null),
    },
    async () => {
      await verifyEmail(makeRequest('stale-token'), res);
    }
  );

  assert.equal(res.state.statusCode, 400);
  assert.equal(res.state.body.message, 'Invalid or expired verification token.');
});
