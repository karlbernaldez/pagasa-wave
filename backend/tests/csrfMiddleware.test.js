import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET ||= 'test-jwt-secret-for-csrf-tests';
process.env.CORS_ALLOWED_ORIGINS = 'https://wavelab.test';

const { csrfProtection, CSRF_COOKIE } = await import('../middleware/csrfMiddleware.js');

const createResponse = () => {
  const state = { statusCode: 200, body: null, cookies: [] };
  return {
    state,
    cookie(name, value, options) {
      state.cookies.push({ name, value, options });
      return this;
    },
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
  };
};

const runMiddleware = (req) =>
  new Promise((resolve) => {
    const res = createResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
      resolve({ res, nextCalled });
    };
    csrfProtection(req, res, next);
    if (!nextCalled && res.state.statusCode !== 200) resolve({ res, nextCalled });
  });

test('safe request issues a readable signed CSRF cookie', async () => {
  const { res, nextCalled } = await runMiddleware({
    method: 'GET',
    headers: {},
    cookies: {},
  });

  assert.equal(nextCalled, true);
  assert.equal(res.state.cookies.length, 1);
  assert.equal(res.state.cookies[0].name, CSRF_COOKIE);
  assert.equal(res.state.cookies[0].options.httpOnly, false);
  assert.match(res.state.cookies[0].value, /^[^.]+\.[^.]+$/);
});

test('authenticated unsafe request accepts matching signed cookie and header', async () => {
  const bootstrap = await runMiddleware({
    method: 'GET',
    headers: {},
    cookies: {},
  });
  const token = bootstrap.res.state.cookies[0].value;

  const { res, nextCalled } = await runMiddleware({
    method: 'POST',
    headers: {
      origin: 'https://wavelab.test',
      'x-csrf-token': token,
    },
    cookies: {
      accessToken: 'access-token',
      [CSRF_COOKIE]: token,
    },
  });

  assert.equal(nextCalled, true);
  assert.equal(res.state.statusCode, 200);
});

test('authenticated unsafe request rejects missing CSRF token', async () => {
  const { res, nextCalled } = await runMiddleware({
    method: 'PATCH',
    headers: { origin: 'https://wavelab.test' },
    cookies: { accessToken: 'access-token' },
  });

  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 403);
  assert.equal(res.state.body?.message, 'Invalid or missing CSRF token');
});

test('authenticated unsafe request rejects mismatched token', async () => {
  const bootstrap = await runMiddleware({
    method: 'GET',
    headers: {},
    cookies: {},
  });
  const token = bootstrap.res.state.cookies[0].value;

  const { res, nextCalled } = await runMiddleware({
    method: 'DELETE',
    headers: {
      origin: 'https://wavelab.test',
      'x-csrf-token': token,
    },
    cookies: {
      accessToken: 'access-token',
      [CSRF_COOKIE]: 'different.invalid-token',
    },
  });

  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 403);
});

test('unauthenticated unsafe request is allowed after origin validation and receives CSRF cookie', async () => {
  const { res, nextCalled } = await runMiddleware({
    method: 'POST',
    headers: { origin: 'https://wavelab.test' },
    cookies: {},
  });

  assert.equal(nextCalled, true);
  assert.equal(res.state.cookies[0].name, CSRF_COOKIE);
});

test('unsafe request from disallowed origin is rejected before token evaluation', async () => {
  const { res, nextCalled } = await runMiddleware({
    method: 'POST',
    headers: { origin: 'https://evil.example' },
    cookies: {},
  });

  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 403);
  assert.equal(res.state.body?.message, 'CSRF protection blocked request');
});
