import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentPackageDate,
  packageTag,
  requiredSourceCycle,
} from '../services/wavePipelineStatus.js';

test('uses Asia/Manila date for the operational package date', () => {
  const beforeMidnightUtc = new Date('2026-09-07T15:59:59Z');
  const afterMidnightManila = new Date('2026-09-07T16:00:00Z');

  assert.equal(currentPackageDate(beforeMidnightUtc), '2026-09-07');
  assert.equal(currentPackageDate(afterMidnightManila), '2026-09-08');
});

test('requires the previous-day 18Z source cycle', () => {
  assert.equal(requiredSourceCycle('2026-09-08'), '2026090718');
  assert.equal(requiredSourceCycle('2026-01-01'), '2025123118');
});

test('formats the existing WaveLab package tag contract', () => {
  assert.equal(packageTag('2026-09-08'), '2026SEP08');
  assert.equal(packageTag('2026-01-01'), '2026JAN01');
});
