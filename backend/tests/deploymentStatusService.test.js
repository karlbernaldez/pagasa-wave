import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  getDeploymentStatus,
  sanitizeDeploymentStatus,
} from '../services/deploymentStatusService.js';

test('sanitizeDeploymentStatus exposes only the operational status contract', () => {
  const sanitized = sanitizeDeploymentStatus({
    available: true,
    generatedAt: '2026-09-16T08:00:00.000Z',
    reportId: 'report-1',
    result: 'PASS',
    host: 'vote3',
    revision: 'abcdef1234567890',
    shortRevision: 'abcdef123456',
    branch: 'main',
    backendEnvironment: 'production',
    secret: 'must-not-leak',
    services: { wavelab_backend: 'active', invalid$key: 'ignored' },
    timers: { ww3_package_builder: 'active' },
    backend: { startedAt: '2026-09-16 16:02:24 PST', recentErrorCount: 2, token: 'hidden' },
    checks: [
      { key: 'backend_http', label: 'Backend /status', status: 'PASS', detail: 'reachable' },
    ],
  });

  assert.deepEqual(sanitized, {
    available: true,
    schemaVersion: 1,
    generatedAt: '2026-09-16T08:00:00.000Z',
    reportId: 'report-1',
    result: 'PASS',
    host: 'vote3',
    revision: 'abcdef1234567890',
    shortRevision: 'abcdef123456',
    branch: 'main',
    backendEnvironment: 'production',
    backend: {
      startedAt: '2026-09-16 16:02:24 PST',
      recentErrorCount: 2,
    },
    services: { wavelab_backend: 'active' },
    timers: { ww3_package_builder: 'active' },
    checks: [
      { key: 'backend_http', label: 'Backend /status', status: 'PASS', detail: 'reachable' },
    ],
  });
  assert.equal('secret' in sanitized, false);
  assert.equal('token' in sanitized.backend, false);
});

test('getDeploymentStatus returns unavailable status when report is missing', async () => {
  const missing = path.join(os.tmpdir(), `wavelab-missing-${Date.now()}.json`);
  const status = await getDeploymentStatus(missing);

  assert.equal(status.available, false);
  assert.equal(status.result, 'UNKNOWN');
  assert.deepEqual(status.services, {});
  assert.deepEqual(status.timers, {});
});

test('getDeploymentStatus reads and sanitizes a generated report', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wavelab-deploy-status-'));
  const target = path.join(directory, 'latest.json');
  await fs.writeFile(
    target,
    JSON.stringify({
      available: true,
      result: 'WARN',
      branch: 'main',
      backendEnvironment: 'development',
      services: { nginx: 'active' },
      dangerousSecret: 'not-returned',
    })
  );

  try {
    const status = await getDeploymentStatus(target);
    assert.equal(status.available, true);
    assert.equal(status.result, 'WARN');
    assert.equal(status.branch, 'main');
    assert.deepEqual(status.services, { nginx: 'active' });
    assert.equal('dangerousSecret' in status, false);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
