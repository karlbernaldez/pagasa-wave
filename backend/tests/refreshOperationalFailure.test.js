import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

import Session from '../models/Session.js';
import { refreshAccessToken } from '../controllers/auth/refresh.js';

const REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';

function makeResponse() {
  const state = {
    statusCode: 200,
    body: null,
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
    clearCookie(name, options) {
      state.cleared.push({ name, options });
      return this;
    },
  };
}

test('refresh preserves cookies when session lookup fails operationally before rotation', async () => {
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const originalFindOne = Session.findOne;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

  const refreshToken = jwt.sign(
    {
      id: '507f1f77bcf86cd799439011',
      username: 'forecaster',
      email: 'forecaster@example.com',
      role: 'forecaster',
      sessionVersion: 4,
    },
    REFRESH_SECRET,
    { algorithm: 'HS512', expiresIn: '1h', jwtid: 'refresh-jti' }
  );

  Session.findOne = async () => {
    throw new Error('database unavailable');
  };

  const res = makeResponse();

  try {
    await refreshAccessToken({ cookies: { refreshToken } }, res);
  } finally {
    Session.findOne = originalFindOne;
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  }

  assert.equal(res.state.statusCode, 503);
  assert.deepEqual(res.state.cleared, []);
  assert.match(res.state.body.message, /try again/i);
});

test('refresh still clears cookies for an invalid JWT credential', async () => {
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

  const res = makeResponse();

  try {
    await refreshAccessToken({ cookies: { refreshToken: 'not-a-valid-jwt' } }, res);
  } finally {
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  }

  assert.equal(res.state.statusCode, 401);
  assert.equal(res.state.cleared.length, 2);
  assert.match(res.state.body.message, /invalid refresh token/i);
});
