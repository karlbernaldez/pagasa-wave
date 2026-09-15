import assert from 'node:assert/strict';
import test from 'node:test';

import { requiredEcwamSourceCycle, validateFrameRequest } from '../services/ecwamFrameService.js';

test('accepts ECWAM forecast hours from 0 through 60 on the 3-hour cadence', () => {
  assert.equal(validateFrameRequest('2026-09-01', 0).valid, true);
  assert.equal(validateFrameRequest('2026-09-01', 27).valid, true);
  assert.equal(validateFrameRequest('2026-09-01', 48).valid, true);
  assert.equal(validateFrameRequest('2026-09-01', 60).valid, true);
});

test('rejects ECWAM forecast hours outside the supported cadence', () => {
  assert.equal(validateFrameRequest('2026-09-01', -3).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 1).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 25).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 61).valid, false);
  assert.equal(validateFrameRequest('2026-09-01', 2.5).valid, false);
});

test('rejects malformed and impossible package dates', () => {
  assert.equal(validateFrameRequest('20260901', 3).valid, false);
  assert.equal(validateFrameRequest('2026-02-30', 3).valid, false);
  assert.equal(validateFrameRequest('not-a-date', 3).valid, false);
});

test('requires the previous-day 18Z ECWAM source cycle', () => {
  assert.equal(requiredEcwamSourceCycle('2026-09-03'), '2026090218');
  assert.equal(requiredEcwamSourceCycle('2027-01-01'), '2026123118');
  assert.equal(requiredEcwamSourceCycle('not-a-date'), null);
});
