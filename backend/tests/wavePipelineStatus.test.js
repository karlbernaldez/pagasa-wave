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

test('automatic mode keeps 00Z on package date and earlier operational cycles on previous date', () => {
  assert.equal(requiredSourceCycle('2026-09-14', 0), '2026091400');
  assert.equal(requiredSourceCycle('2026-09-14', 6), '2026091306');
  assert.equal(requiredSourceCycle('2026-09-14', 12), '2026091312');
  assert.equal(requiredSourceCycle('2026-09-14', 18), '2026091318');
});

test('automatic mode preserves date boundaries', () => {
  assert.equal(requiredSourceCycle('2026-01-01', 0), '2026010100');
  assert.equal(requiredSourceCycle('2026-01-01', 18), '2025123118');
});

test('same-day mode anchors every selected cycle to the package date', () => {
  assert.equal(requiredSourceCycle('2026-09-14', 0, 'same_day'), '2026091400');
  assert.equal(requiredSourceCycle('2026-09-14', 6, 'same_day'), '2026091406');
  assert.equal(requiredSourceCycle('2026-09-14', 12, 'same_day'), '2026091412');
  assert.equal(requiredSourceCycle('2026-09-14', 18, 'same_day'), '2026091418');
});

test('previous-day mode anchors every selected cycle to the previous date', () => {
  assert.equal(requiredSourceCycle('2026-09-14', 0, 'previous_day'), '2026091300');
  assert.equal(requiredSourceCycle('2026-09-14', 6, 'previous_day'), '2026091306');
  assert.equal(requiredSourceCycle('2026-09-14', 12, 'previous_day'), '2026091312');
  assert.equal(requiredSourceCycle('2026-09-14', 18, 'previous_day'), '2026091318');
});

test('formats the existing WaveLab package tag contract', () => {
  assert.equal(packageTag('2026-09-08'), '2026SEP08');
  assert.equal(packageTag('2026-01-01'), '2026JAN01');
});
