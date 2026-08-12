import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Session from '../models/Session.js';
import { refreshAccessToken } from '../controllers/auth/refresh.js';
import {
  isRefreshFamilyCompromised,
  markRefreshFamilyCompromised,
} from '../controllers/auth/utils/session.js';

const ACCESS_SECRET = 'test-access-secret-test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';

function makeResponse() {
  const state = {
    statusCode: 200,
    body: null,
    cookies: [],
    cleared: [],
  };

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
    cookie(name, value, options) {
      state.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      state.cleared.push({ name, options });
      return this;
    },
  };
}

function queryReturning(value) {
  return {
    select() {
      return Promise.resolve(value);
    },
  };
}

async function withModelMocks(mocks, work) {
  const originals = {
    sessionFindOne: Session.findOne,
    sessionFindOneAndUpdate: Session.findOneAndUpdate,
    sessionCreate: Session.create,
    sessionExists: Session.exists,
    sessionUpdateMany: Session.updateMany,
    sessionUpdateOne: Session.updateOne,
    userFindOne: User.findOne,
  };

  Object.assign(Session, {
    findOne: mocks.sessionFindOne ?? originals.sessionFindOne,
    findOneAndUpdate: mocks.sessionFindOneAndUpdate ?? originals.sessionFindOneAndUpdate,
    create: mocks.sessionCreate ?? originals.sessionCreate,
    exists: mocks.sessionExists ?? originals.sessionExists,
    updateMany: mocks.sessionUpdateMany ?? originals.sessionUpdateMany,
    updateOne: mocks.sessionUpdateOne ?? originals.sessionUpdateOne,
  });
  User.findOne = mocks.userFindOne ?? originals.userFindOne;

  try {
    await work();
  } finally {
    Session.findOne = originals.sessionFindOne;
    Session.findOneAndUpdate = originals.sessionFindOneAndUpdate;
    Session.create = originals.sessionCreate;
    Session.exists = originals.sessionExists;
    Session.updateMany = originals.sessionUpdateMany;
    Session.updateOne = originals.sessionUpdateOne;
    User.findOne = originals.userFindOne;
  }
}

test('refresh family compromise marker is persisted before active family sessions are revoked', async () => {
  const calls = [];

  await withModelMocks(
    {
      sessionUpdateMany: async (filter, update) => {
        calls.push({ filter, update });
        return { acknowledged: true };
      },
    },
    async () => {
      await markRefreshFamilyCompromised('user-1', 'family-1');
    }
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].filter, { user: 'user-1', familyId: 'family-1' });
  assert.ok(calls[0].update.$set.familyCompromisedAt instanceof Date);
  assert.deepEqual(calls[1].filter, {
    user: 'user-1',
    familyId: 'family-1',
    revokedAt: null,
  });
  assert.equal(calls[1].update.$set.revokedReason, 'refresh_token_reuse');
});

test('family compromise lookup is durable across replacement-session timing', async () => {
  let filter;

  await withModelMocks(
    {
      sessionExists: async (value) => {
        filter = value;
        return { _id: 'marker-session' };
      },
    },
    async () => {
      const result = await isRefreshFamilyCompromised('user-1', 'family-1');
      assert.ok(result);
    }
  );

  assert.deepEqual(filter, {
    user: 'user-1',
    familyId: 'family-1',
    familyCompromisedAt: { $ne: null },
  });
});

test('refresh winner revokes its replacement when concurrent reuse compromises the family before delivery', async () => {
  const originalAccessSecret = process.env.JWT_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

  const oldJti = 'old-refresh-jti';
  const familyId = 'family-1';
  const userId = '507f1f77bcf86cd799439011';
  const refreshToken = jwt.sign(
    {
      id: userId,
      username: 'forecaster',
      email: 'forecaster@example.com',
      role: 'forecaster',
      sessionVersion: 4,
    },
    REFRESH_SECRET,
    { algorithm: 'HS512', expiresIn: '1h', jwtid: oldJti }
  );

  const existingSession = {
    user: userId,
    jti: oldJti,
    familyId,
    revokedAt: null,
  };
  const user = {
    _id: userId,
    username: 'forecaster',
    email: 'forecaster@example.com',
    role: 'forecaster',
    status: 'active',
    sessionVersion: 4,
    passwordChangedAt: null,
  };

  let replacementCreated = false;
  let replacementRevoked = false;

  const req = {
    cookies: { refreshToken },
    ip: '10.0.0.9',
    get(name) {
      return name === 'user-agent' ? 'refresh-race-test' : '';
    },
  };
  const res = makeResponse();

  try {
    await withModelMocks(
      {
        sessionFindOne: async () => existingSession,
        userFindOne: () => queryReturning(user),
        sessionFindOneAndUpdate: async () => existingSession,
        sessionCreate: async () => {
          replacementCreated = true;
          return { _id: 'replacement-session' };
        },
        sessionExists: async () => {
          assert.equal(replacementCreated, true);
          return { _id: 'compromised-family-marker' };
        },
        sessionUpdateOne: async (filter, update) => {
          replacementRevoked = true;
          assert.equal(filter.user, userId);
          assert.equal(filter.revokedAt, null);
          assert.equal(update.$set.revokedReason, 'refresh_token_reuse');
          return { acknowledged: true, modifiedCount: 1 };
        },
      },
      async () => {
        await refreshAccessToken(req, res);
      }
    );
  } finally {
    if (originalAccessSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalAccessSecret;
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  }

  assert.equal(res.state.statusCode, 401);
  assert.equal(replacementCreated, true);
  assert.equal(replacementRevoked, true);
  assert.equal(res.state.cookies.length, 0);
  assert.equal(res.state.cleared.length, 2);
  assert.match(res.state.body.message, /reuse detected/i);
});
