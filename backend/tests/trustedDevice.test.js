import assert from 'node:assert/strict';
import test from 'node:test';

import TrustedDevice from '../models/TrustedDevice.js';
import {
  consumeTrustedDevice,
  hashTrustedDeviceToken,
  hashTrustedDeviceUserAgent,
  issueTrustedDevice,
  revokeAllTrustedDevices,
} from '../controllers/auth/utils/trustedDevice.js';

const originalCreate = TrustedDevice.create;
const originalFindOneAndUpdate = TrustedDevice.findOneAndUpdate;
const originalUpdateMany = TrustedDevice.updateMany;

const createResponse = () => {
  const cookies = [];
  return {
    cookies,
    cookie(name, value, options) {
      cookies.push({ name, value, options });
    },
    clearCookie(name, options) {
      cookies.push({ name, value: null, options, cleared: true });
    },
  };
};

test('issueTrustedDevice stores only a hash and writes an httpOnly cookie', async () => {
  let created;
  TrustedDevice.create = async (record) => {
    created = record;
    return record;
  };

  try {
    const user = { _id: 'user-1', sessionVersion: 4 };
    const req = { headers: { 'user-agent': 'Test Browser/1.0' } };
    const res = createResponse();

    const rawToken = await issueTrustedDevice(user, req, res);

    assert.ok(rawToken);
    assert.equal(created.user, 'user-1');
    assert.equal(created.tokenHash, hashTrustedDeviceToken(rawToken));
    assert.notEqual(created.tokenHash, rawToken);
    assert.equal(created.userAgentHash, hashTrustedDeviceUserAgent('Test Browser/1.0'));
    assert.equal(created.sessionVersion, 4);

    const cookie = res.cookies.find((item) => item.name === 'wavelabTrustedDevice');
    assert.ok(cookie);
    assert.equal(cookie.value, rawToken);
    assert.equal(cookie.options.httpOnly, true);
    assert.equal(cookie.options.path, '/api/auth');
  } finally {
    TrustedDevice.create = originalCreate;
  }
});

test('consumeTrustedDevice requires matching session version and user agent and rotates the credential', async () => {
  let query;
  let update;
  TrustedDevice.findOneAndUpdate = async (nextQuery, nextUpdate) => {
    query = nextQuery;
    update = nextUpdate;
    return { _id: 'trusted-device-1' };
  };

  try {
    const user = { _id: 'user-1', sessionVersion: 7 };
    const req = {
      cookies: { wavelabTrustedDevice: 'raw-device-token' },
      headers: { 'user-agent': 'Test Browser/2.0' },
    };
    const res = createResponse();

    const trusted = await consumeTrustedDevice(user, req, res);

    assert.equal(trusted, true);
    assert.equal(query.user, 'user-1');
    assert.equal(query.tokenHash, hashTrustedDeviceToken('raw-device-token'));
    assert.equal(query.userAgentHash, hashTrustedDeviceUserAgent('Test Browser/2.0'));
    assert.equal(query.sessionVersion, 7);
    assert.equal(query.revokedAt, null);
    assert.equal(update.$set.revokedReason, 'rotated');
  } finally {
    TrustedDevice.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('consumeTrustedDevice clears an invalid trusted-device cookie', async () => {
  TrustedDevice.findOneAndUpdate = async () => null;

  try {
    const req = {
      cookies: { wavelabTrustedDevice: 'invalid-token' },
      headers: { 'user-agent': 'Test Browser/3.0' },
    };
    const res = createResponse();

    const trusted = await consumeTrustedDevice({ _id: 'user-1', sessionVersion: 0 }, req, res);

    assert.equal(trusted, false);
    const cleared = res.cookies.find(
      (item) => item.name === 'wavelabTrustedDevice' && item.cleared
    );
    assert.ok(cleared);
  } finally {
    TrustedDevice.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('logout-all revokes all active trusted devices for the user', async () => {
  let query;
  let update;
  TrustedDevice.updateMany = async (nextQuery, nextUpdate) => {
    query = nextQuery;
    update = nextUpdate;
    return { modifiedCount: 2 };
  };

  try {
    await revokeAllTrustedDevices('user-1', 'logout_all');

    assert.deepEqual(query, { user: 'user-1', revokedAt: null });
    assert.equal(update.$set.revokedReason, 'logout_all');
    assert.ok(update.$set.revokedAt instanceof Date);
  } finally {
    TrustedDevice.updateMany = originalUpdateMany;
  }
});
