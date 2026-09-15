import test from 'node:test';
import assert from 'node:assert/strict';

import { validateChatRequest } from '../validators/chatSchemas.js';
import { requireInternalChatAccess } from '../middleware/internalChatMiddleware.js';
import { resolveChatTier } from '../chat/services/chatService.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';

const makeRes = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const runMiddleware = (middleware, req) => {
  const res = makeRes();
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

test('public chat accepts only the public model', () => {
  assert.deepEqual(
    validateChatRequest(
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'hello' }],
      },
      'public'
    ),
    {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'hello' }],
    }
  );

  assert.throws(
    () =>
      validateChatRequest(
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }],
        },
        'public'
      ),
    /Unsupported chat model/
  );
});

test('internal chat middleware requires chat.use_internal regardless of role name', () => {
  let result = runMiddleware(requireInternalChatAccess, { user: null, permissions: [] });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);

  result = runMiddleware(requireInternalChatAccess, {
    user: { role: 'admin' },
    permissions: [],
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);

  result = runMiddleware(requireInternalChatAccess, {
    user: { role: 'custom_reviewer' },
    permissions: ['chat.use_internal'],
  });
  assert.equal(result.nextCalled, true);
  assert.equal(result.res.statusCode, null);
});

test('chat tier is resolved from explicit knowledge permissions', () => {
  assert.equal(resolveChatTier(null, []), 'public');
  assert.equal(resolveChatTier({ role: 'admin' }, []), null);
  assert.equal(resolveChatTier({ role: 'custom' }, ['chat.use_internal']), null);
  assert.equal(
    resolveChatTier({ role: 'custom_forecaster' }, [
      'chat.use_internal',
      'chat.forecaster_knowledge',
    ]),
    'forecaster'
  );
  assert.equal(
    resolveChatTier({ role: 'custom_admin_assistant' }, [
      'chat.use_internal',
      'chat.forecaster_knowledge',
      'chat.admin_knowledge',
    ]),
    'admin'
  );
});

test('csrf protection allows safe methods without origin', () => {
  const result = runMiddleware(csrfProtection, {
    method: 'GET',
    headers: {},
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.res.statusCode, null);
});

test('csrf protection rejects unsafe methods without origin', () => {
  const result = runMiddleware(csrfProtection, {
    method: 'POST',
    headers: {},
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});

test('csrf protection rejects untrusted origins and allows configured origins', () => {
  const previousAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
  process.env.CORS_ALLOWED_ORIGINS = 'https://wavelab.example.com';

  try {
    let result = runMiddleware(csrfProtection, {
      method: 'POST',
      headers: { origin: 'https://attacker.example.com' },
    });
    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 403);

    result = runMiddleware(csrfProtection, {
      method: 'POST',
      headers: { origin: 'https://wavelab.example.com' },
    });
    assert.equal(result.nextCalled, true);
    assert.equal(result.res.statusCode, null);
  } finally {
    if (previousAllowedOrigins === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = previousAllowedOrigins;
    }
  }
});
