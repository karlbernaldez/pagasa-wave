import assert from 'node:assert/strict';
import test from 'node:test';

import { buildVerificationUrl } from '../services/email/verificationUrl.js';

test('verification email points to the frontend verification route', () => {
  assert.equal(
    buildVerificationUrl('https://wavelab.example.com', 'abc123'),
    'https://wavelab.example.com/verify-email?token=abc123'
  );
});

test('verification URL trims trailing slashes and encodes the token', () => {
  assert.equal(
    buildVerificationUrl('https://wavelab.example.com///', 'token with/+?chars'),
    'https://wavelab.example.com/verify-email?token=token%20with%2F%2B%3Fchars'
  );
});

test('verification URL rejects a missing public app URL', () => {
  assert.throws(
    () => buildVerificationUrl(undefined, 'abc123'),
    /APP_URL must be set to the public WaveLab frontend URL/
  );
});

test('verification URL rejects non-absolute and unsupported URLs', () => {
  assert.throws(() => buildVerificationUrl('/relative', 'abc123'), /valid absolute URL/);
  assert.throws(() => buildVerificationUrl('ftp://wavelab.example.com', 'abc123'), /http or https/);
});
