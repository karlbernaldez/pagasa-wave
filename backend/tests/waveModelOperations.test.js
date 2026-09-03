import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getWaveModelOperations,
  triggerWaveModelBuilder,
} from '../services/waveModelOperationsService.js';

test('unconfigured models expose operations as unsupported', async () => {
  const operations = await getWaveModelOperations('MRI3');

  assert.equal(operations.supported, false);
  assert.equal(operations.service, null);
  assert.equal(operations.timer, null);
  assert.equal(operations.manualRun.available, false);
});

test('manual builder requests reject models without an operational builder', async () => {
  await assert.rejects(
    () => triggerWaveModelBuilder('BMKG'),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /No operational builder is configured/);
      return true;
    }
  );
});
