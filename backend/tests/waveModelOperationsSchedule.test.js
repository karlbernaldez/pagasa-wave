import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wavelab-wave-ops-'));
const fakeSudo = path.join(tempRoot, 'fake-sudo.mjs');

await writeFile(
  fakeSudo,
  `#!/usr/bin/env node
const args = process.argv.slice(2);
const action = args[2];
const model = args[3];
const payload = args[4] ? JSON.parse(args[4]) : null;
if (model === 'ECWAM' && action === 'set-schedule') {
  process.stderr.write('helper rejected schedule mutation');
  process.exit(1);
}
if (action === 'status') {
  process.stdout.write(JSON.stringify({ managed: false, schedule: { mode: 'interval', everyMinutes: 60 } }));
} else if (action === 'set-schedule') {
  process.stdout.write(JSON.stringify({ managed: true, schedule: payload }));
} else if (action === 'enable') {
  process.stdout.write(JSON.stringify({ enabled: true }));
} else if (action === 'disable') {
  process.stdout.write(JSON.stringify({ enabled: false }));
} else if (action === 'restore-schedule') {
  process.stdout.write(JSON.stringify({ managed: false, schedule: { mode: 'interval', everyMinutes: 60 } }));
} else {
  process.exit(2);
}
`
);
await chmod(fakeSudo, 0o755);

process.env.WAVELAB_SUDO_BIN = fakeSudo;
process.env.WAVELAB_WAVE_OPS_HELPER = '/usr/local/sbin/wavelab-wave-model-ops';

const { restoreWaveModelSchedule, setWaveModelSchedule, setWaveModelScheduleEnabled } =
  await import(`../services/waveModelOperationsService.js?test=${Date.now()}`);

after(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

test('updates an allowlisted model schedule through the restricted helper', async () => {
  const result = await setWaveModelSchedule('ww3', { mode: 'interval', everyMinutes: 90 });

  assert.deepEqual(result, {
    modelCode: 'WW3',
    managed: true,
    schedule: { mode: 'interval', everyMinutes: 90 },
  });
});

test('rejects unsupported models before invoking privileged operations', async () => {
  await assert.rejects(
    () => setWaveModelSchedule('TESTMODEL', { mode: 'interval', everyMinutes: 60 }),
    (error) => error.status === 409 && /No operational builder is configured/.test(error.message)
  );
});

test('rejects invalid schedules before invoking the helper', async () => {
  await assert.rejects(
    () => setWaveModelSchedule('WW3', { mode: 'shell', command: 'whoami' }),
    (error) => error.status === 400 && /schedule.mode must be interval or daily/.test(error.message)
  );
});

test('surfaces restricted helper failures as service unavailable', async () => {
  await assert.rejects(
    () => setWaveModelSchedule('ECWAM', { mode: 'interval', everyMinutes: 60 }),
    (error) => error.status === 503 && /helper rejected schedule mutation/.test(error.message)
  );
});

test('enables and disables schedules only for operational models', async () => {
  assert.deepEqual(await setWaveModelScheduleEnabled('WW3', true), {
    modelCode: 'WW3',
    enabled: true,
  });
  assert.deepEqual(await setWaveModelScheduleEnabled('WW3', false), {
    modelCode: 'WW3',
    enabled: false,
  });

  await assert.rejects(
    () => setWaveModelScheduleEnabled('CUSTOM', true),
    (error) => error.status === 409
  );
});

test('restores the repository default schedule through the helper', async () => {
  assert.deepEqual(await restoreWaveModelSchedule('WW3'), {
    modelCode: 'WW3',
    managed: false,
    schedule: { mode: 'interval', everyMinutes: 60 },
  });
});
