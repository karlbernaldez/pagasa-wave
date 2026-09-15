import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deleteWaveModelPackage,
  getWavePackageRetentionStatus,
} from '../services/waveModelService.js';

const NOW = Date.UTC(2026, 8, 8, 12, 0, 0);

test('wave package retention protects packages that are not older than 10 days', () => {
  const status = getWavePackageRetentionStatus('WW3', '2026AUG30', NOW);

  assert.equal(status.retentionDays, 10);
  assert.equal(status.deletable, false);
  assert.equal(status.retentionRemainingDays, 1);
  assert.match(status.reason, /older than 10 days/);
});

test('wave package retention allows packages older than 10 days', () => {
  const status = getWavePackageRetentionStatus('ECWAM', '2026AUG28', NOW);

  assert.equal(status.deletable, true);
  assert.equal(status.retentionRemainingDays, 0);
  assert.equal(status.reason, null);
});

test('packages with unverifiable dates remain protected', () => {
  const status = getWavePackageRetentionStatus('MRI3', 'CUSTOM_001', NOW);

  assert.equal(status.deletable, false);
  assert.equal(status.deleteAfter, null);
  assert.match(status.reason, /cannot be verified/);
});

test('delete service rejects recent packages before filesystem mutation', async () => {
  await assert.rejects(
    () => deleteWaveModelPackage('WW3', '2099JAN01'),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /10-day retention policy/);
      return true;
    }
  );
});
