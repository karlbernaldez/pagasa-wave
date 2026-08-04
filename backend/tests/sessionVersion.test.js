import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAuthPayload } from '../controllers/auth/utils/session.js';

test('auth payload includes the current session version', () => {
  const payload = buildAuthPayload({
    _id: 'user-123',
    email: 'forecaster@example.com',
    username: 'forecaster',
    role: 'forecaster',
    sessionVersion: 4,
  });

  assert.deepEqual(payload, {
    id: 'user-123',
    email: 'forecaster@example.com',
    username: 'forecaster',
    role: 'forecaster',
    sessionVersion: 4,
  });
});

test('legacy users default to session version zero', () => {
  const payload = buildAuthPayload({
    _id: 'legacy-user',
    email: 'legacy@example.com',
    username: 'legacy',
    role: 'user',
  });

  assert.equal(payload.sessionVersion, 0);
});
