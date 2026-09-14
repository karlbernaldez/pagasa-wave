import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const moduleUrl = new URL('../services/waveSourceCyclePolicy.js', import.meta.url);

test('source cycle policy defaults, validates, preserves partial updates, and persists', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wavelab-cycle-policy-'));
  const policyPath = path.join(directory, 'source-cycle-policy.json');
  const previous = process.env.WAVE_SOURCE_CYCLE_POLICY_PATH;
  process.env.WAVE_SOURCE_CYCLE_POLICY_PATH = policyPath;

  try {
    const policyModule = await import(`${moduleUrl.href}?test=${Date.now()}`);

    const defaultPolicy = await policyModule.getWaveSourceCyclePolicy('WW3');
    assert.equal(defaultPolicy.preferredHourUtc, 18);
    assert.equal(defaultPolicy.cycleDateMode, 'automatic');
    assert.deepEqual(defaultPolicy.allowedHoursUtc, [0, 6, 12, 18]);
    assert.deepEqual(defaultPolicy.allowedCycleDateModes, [
      'automatic',
      'same_day',
      'previous_day',
    ]);
    assert.equal(defaultPolicy.fallbackEnabled, false);

    const hourUpdated = await policyModule.setWaveSourceCycleHour('WW3', 12);
    assert.equal(hourUpdated.preferredHourUtc, 12);
    assert.equal(hourUpdated.cycleDateMode, 'automatic');

    const modeUpdated = await policyModule.setWaveSourceCyclePolicy('WW3', {
      cycleDateMode: 'same_day',
    });
    assert.equal(modeUpdated.preferredHourUtc, 12);
    assert.equal(modeUpdated.cycleDateMode, 'same_day');

    const stored = JSON.parse(await fs.readFile(policyPath, 'utf8'));
    assert.equal(stored.schemaVersion, 1);
    assert.equal(stored.models.WW3.preferredHourUtc, 12);
    assert.equal(stored.models.WW3.cycleDateMode, 'same_day');

    await assert.rejects(
      () => policyModule.setWaveSourceCycleHour('WW3', 9),
      (error) => error.status === 400 && /00Z, 06Z, 12Z, 18Z/.test(error.message)
    );
    await assert.rejects(
      () => policyModule.setWaveSourceCyclePolicy('WW3', { cycleDateMode: 'tomorrow' }),
      (error) => error.status === 400 && /automatic, same_day, previous_day/.test(error.message)
    );
  } finally {
    if (previous === undefined) delete process.env.WAVE_SOURCE_CYCLE_POLICY_PATH;
    else process.env.WAVE_SOURCE_CYCLE_POLICY_PATH = previous;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
