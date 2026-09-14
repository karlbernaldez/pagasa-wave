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

test('defaults to the package-date 18Z source cycle', () => {
  assert.equal(requiredSourceCycle('2026-09-08'), '2026090818');
  assert.equal(requiredSourceCycle('2026-01-01'), '2026010118');
});

test('supports configured source cycle hours on the package date', () => {
  assert.equal(requiredSourceCycle('2026-09-14', 0), '2026091400');
  assert.equal(requiredSourceCycle('2026-09-14', 6), '2026091406');
  assert.equal(requiredSourceCycle('2026-09-14', 12), '2026091412');
  assert.equal(requiredSourceCycle('2026-09-14', 18), '2026091418');
});

test('formats the existing WaveLab package tag contract', () => {
  assert.equal(packageTag('2026-09-08'), '2026SEP08');
  assert.equal(packageTag('2026-01-01'), '2026JAN01');
});
