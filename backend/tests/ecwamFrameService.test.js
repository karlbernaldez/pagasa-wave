import assert from 'node:assert/strict';
import test from 'node:test';

import { validateFrameRequest } from '../services/ecwamFrameService.js';

test('accepts ECWAM forecast hours from 0 through 48', () => {
  assert.equal(validateFrameRequest('2026-09-01', 0).valid, true);
  assert.equal(validateFrameRequest('2026-09-01', 25).valid, true);
  assert.equal(validateFrameRequest('2026-09-01', 48).valid, true);
});

test('rejects ECWAM forecast hours outside the supported range', () => {
  assert.equal(validateFrameRequest('2026-09-01', -1).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 49).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 2.5).valid, false);
});

test('rejects malformed and impossible package dates', () => {
  assert.equal(validateFrameRequest('20260901', 3).valid, false);
  assert.equal(validateFrameRequest('2026-02-30', 3).valid, false);
  assert.equal(validateFrameRequest('not-a-date', 3).valid, false);
});
