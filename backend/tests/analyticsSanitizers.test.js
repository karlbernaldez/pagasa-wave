import assert from 'node:assert/strict';
import test from 'node:test';

import {
  serializeUserAnalytics,
  serializeUserExportRow,
  USER_ANALYTICS_ALLOWED_KEYS,
  USER_ANALYTICS_EXPORT_HEADERS,
  USER_ANALYTICS_SELECT,
} from '../utils/analyticsSanitizers.js';

const userWithPii = {
  _id: 'user-123',
  role: 'forecaster',
  status: 'active',
  createdAt: new Date('2026-09-15T00:00:00.000Z'),
  firstName: 'Private',
  lastName: 'Person',
  email: 'private@example.com',
  contact: '09171234567',
  address: 'Private address',
  agency: 'Private agency',
  position: 'Private position',
};

test('user analytics serializer exposes only the approved aggregate identity contract', () => {
  const result = serializeUserAnalytics(userWithPii);

  assert.deepEqual(Object.keys(result).sort(), [...USER_ANALYTICS_ALLOWED_KEYS].sort());
  assert.deepEqual(result, {
    id: 'user-123',
    role: 'forecaster',
    status: 'active',
    createdAt: userWithPii.createdAt,
  });
  assert.equal('email' in result, false);
  assert.equal('contact' in result, false);
  assert.equal('firstName' in result, false);
  assert.equal('lastName' in result, false);
});

test('user analytics database projection excludes profile and contact fields', () => {
  assert.equal(USER_ANALYTICS_SELECT, '_id role status createdAt');
  for (const blocked of ['email', 'contact', 'firstName', 'lastName', 'address', 'agency', 'position']) {
    assert.equal(USER_ANALYTICS_SELECT.includes(blocked), false);
  }
});

test('user analytics CSV export contains only the approved sanitized columns', () => {
  assert.deepEqual([...USER_ANALYTICS_EXPORT_HEADERS], [
    'user_id',
    'user_type',
    'status',
    'created_at',
  ]);
  assert.deepEqual(serializeUserExportRow(userWithPii), [
    'user-123',
    'forecaster',
    'active',
    userWithPii.createdAt,
  ]);
});
