import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isWaveModelRuntimeConfigured,
  normalizeWaveModelRuntimeProfile,
} from '../services/waveModelRuntimeProfile.js';

const validProfile = {
  mode: 'managed_timestamp',
  cycleDayOffset: -1,
  cycleHourUtc: 18,
  forecastCadenceHours: 3,
  maxForecastHour: 60,
  rasterScheme: 'xyz',
  bounds: [100, -5, 180, 50],
  contoursEnabled: false,
};

test('normalizes a managed timestamp runtime profile', () => {
  const profile = normalizeWaveModelRuntimeProfile(validProfile);

  assert.deepEqual(profile, validProfile);
  assert.equal(isWaveModelRuntimeConfigured(profile), true);
});

test('allows clearing a runtime profile', () => {
  assert.equal(normalizeWaveModelRuntimeProfile(null), null);
  assert.equal(isWaveModelRuntimeConfigured(null), false);
});

test('rejects unsupported runtime modes', () => {
  assert.throws(
    () => normalizeWaveModelRuntimeProfile({ ...validProfile, mode: 'shell_command' }),
    /runtimeProfile\.mode must be managed_timestamp/
  );
});

test('rejects forecast ranges that do not align to cadence', () => {
  assert.throws(
    () => normalizeWaveModelRuntimeProfile({ ...validProfile, maxForecastHour: 61 }),
    /maxForecastHour must be divisible/
  );
});

test('rejects invalid geographic bounds', () => {
  assert.throws(
    () => normalizeWaveModelRuntimeProfile({ ...validProfile, bounds: [150, 20, 100, -5] }),
    /bounds must be valid geographic/
  );
});

test('rejects dynamic contour onboarding until its lifecycle is supported', () => {
  assert.throws(
    () => normalizeWaveModelRuntimeProfile({ ...validProfile, contoursEnabled: true }),
    /Dynamic contour onboarding is not supported yet/
  );
});
