import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_WAVE_MODEL_SCHEDULE,
  normalizeWaveModelSchedule,
} from '../services/waveModelSchedule.js';

test('normalizes interval schedules', () => {
  assert.deepEqual(normalizeWaveModelSchedule({ mode: 'interval', everyMinutes: 60 }), {
    mode: 'interval',
    everyMinutes: 60,
  });
});

test('normalizes and sorts daily schedules', () => {
  assert.deepEqual(
    normalizeWaveModelSchedule({
      mode: 'daily',
      times: ['18:00', '06:00', '18:00'],
      timezone: 'Asia/Manila',
    }),
    { mode: 'daily', times: ['06:00', '18:00'], timezone: 'Asia/Manila' }
  );
});

test('rejects intervals outside the supported range', () => {
  assert.throws(
    () => normalizeWaveModelSchedule({ mode: 'interval', everyMinutes: 5 }),
    /everyMinutes must be an integer from 15 to 1440/
  );
});

test('rejects arbitrary schedule modes and systemd expressions', () => {
  assert.throws(
    () => normalizeWaveModelSchedule({ mode: 'OnCalendar', value: '*-*-* *:*:00' }),
    /schedule.mode must be interval or daily/
  );
});

test('rejects invalid daily times', () => {
  assert.throws(
    () =>
      normalizeWaveModelSchedule({
        mode: 'daily',
        times: ['25:00'],
        timezone: 'Asia/Manila',
      }),
    /times must use 24-hour HH:MM format/
  );
});

test('rejects invalid timezones', () => {
  assert.throws(
    () =>
      normalizeWaveModelSchedule({
        mode: 'daily',
        times: ['06:00'],
        timezone: '../../etc/passwd',
      }),
    /timezone must be a valid IANA timezone name/
  );
});

test('keeps the deployed default schedule as hourly', () => {
  assert.deepEqual(DEFAULT_WAVE_MODEL_SCHEDULE, { mode: 'interval', everyMinutes: 60 });
});
