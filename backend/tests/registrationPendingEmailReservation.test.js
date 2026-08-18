import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../models/User.js';
import { registerUser } from '../controllers/auth/register.js';

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
  };
}

test('registration treats a pending email change as an occupied address', async () => {
  const originalFindOne = User.findOne;
  const queries = [];
  let call = 0;

  User.findOne = (filter) => {
    queries.push(filter);
    call += 1;
    return selectedQuery(call === 1 ? null : { _id: '507f1f77bcf86cd799439099' });
  };

  const res = makeResponse();

  try {
    await registerUser(
      {
        body: {
          firstName: 'New',
          lastName: 'User',
          username: 'new-user',
          email: ' Reserved@Example.COM ',
          contact: '09171234567',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          address: 'Quezon City',
          agency: 'PAGASA',
          position: 'Forecaster',
          birthday: '1990-01-01',
        },
        ip: '10.0.0.8',
        headers: { 'user-agent': 'test-agent' },
      },
      res
    );
  } finally {
    User.findOne = originalFindOne;
  }

  assert.deepEqual(queries[1], {
    $or: [{ email: 'reserved@example.com' }, { pendingEmail: 'reserved@example.com' }],
  });
  assert.equal(res.state.statusCode, 409);
  assert.match(res.state.body.message, /pending verification/i);
});
