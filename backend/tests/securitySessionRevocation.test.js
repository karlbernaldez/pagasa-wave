import assert from 'node:assert/strict';
import test from 'node:test';

import Session from '../models/Session.js';
import TrustedDevice from '../models/TrustedDevice.js';
import { revokeUserSecurityState } from '../services/securitySessionRevocation.js';

test('security-state revocation clears stored credentials and disconnects active sockets', async () => {
  const originalSessionUpdateMany = Session.updateMany;
  const originalTrustedDeviceUpdateMany = TrustedDevice.updateMany;
  const originalIo = globalThis.__socketIo;

  const calls = {};
  let disconnected = false;

  Session.updateMany = async (filter, update) => {
    calls.session = { filter, update };
    return { modifiedCount: 2 };
  };

  TrustedDevice.updateMany = async (filter, update) => {
    calls.trustedDevice = { filter, update };
    return { modifiedCount: 3 };
  };

  globalThis.__socketIo = {
    in(room) {
      calls.room = room;
      return {
        disconnectSockets(close) {
          disconnected = close;
        },
      };
    },
  };

  try {
    const result = await revokeUserSecurityState('user-1', 'role_permissions_changed');

    assert.equal(result.refreshSessionsRevoked, true);
    assert.equal(result.trustedDevicesRevoked, true);
    assert.deepEqual(calls.session.filter, { user: 'user-1', revokedAt: null });
    assert.equal(calls.session.update.$set.revokedReason, 'role_permissions_changed');
    assert.ok(calls.session.update.$set.revokedAt instanceof Date);
    assert.deepEqual(calls.trustedDevice.filter, { user: 'user-1', revokedAt: null });
    assert.equal(calls.trustedDevice.update.$set.revokedReason, 'role_permissions_changed');
    assert.equal(
      calls.trustedDevice.update.$set.revokedAt.getTime(),
      calls.session.update.$set.revokedAt.getTime()
    );
    assert.equal(calls.room, 'user:user-1');
    assert.equal(disconnected, true);
  } finally {
    Session.updateMany = originalSessionUpdateMany;
    TrustedDevice.updateMany = originalTrustedDeviceUpdateMany;
    globalThis.__socketIo = originalIo;
  }
});

test('security-state revocation still disconnects sockets when stored cleanup fails', async () => {
  const originalSessionUpdateMany = Session.updateMany;
  const originalTrustedDeviceUpdateMany = TrustedDevice.updateMany;
  const originalIo = globalThis.__socketIo;

  let disconnected = false;

  Session.updateMany = async () => {
    throw new Error('session cleanup unavailable');
  };
  TrustedDevice.updateMany = async () => ({ modifiedCount: 1 });
  globalThis.__socketIo = {
    in() {
      return {
        disconnectSockets() {
          disconnected = true;
        },
      };
    },
  };

  try {
    const result = await revokeUserSecurityState('user-2', 'password_changed');

    assert.equal(result.refreshSessionsRevoked, false);
    assert.equal(result.trustedDevicesRevoked, true);
    assert.equal(disconnected, true);
  } finally {
    Session.updateMany = originalSessionUpdateMany;
    TrustedDevice.updateMany = originalTrustedDeviceUpdateMany;
    globalThis.__socketIo = originalIo;
  }
});
