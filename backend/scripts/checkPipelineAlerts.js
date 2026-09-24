import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluatePipelineAlerts,
  resolvePipelineAlertThresholds,
} from '../services/pipelineAlertService.js';
import { loadWavePipelineRunAnalytics } from '../services/wavePipelineHistoryService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WAVETILES_ROOT = process.env.WAVETILES_ROOT || path.join(PROJECT_ROOT, 'wavetiles');
const STATUS_ROOT =
  process.env.WAVE_PIPELINE_STATUS_ROOT ||
  path.join(WAVETILES_ROOT, '.normalized-product-stage', '.status');

async function loadCurrentStatusModels(statusRoot = STATUS_ROOT) {
  let entries;
  try {
    entries = await fs.readdir(statusRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const models = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const raw = JSON.parse(await fs.readFile(path.join(statusRoot, entry.name), 'utf8'));
      if (!raw?.model || !raw?.state) continue;
      models.push({
        code: raw.model,
        label: raw.modelLabel || raw.model,
        state: raw.state,
        lastCheckAt: raw.lastCheckAt || null,
      });
    } catch {
      // Runtime status corruption is handled by the existing readiness path.
      // Alert evaluation remains available from valid status files and run history.
    }
  }
  return models;
}

async function main() {
  const range = parseAnalyticsDateRange({}, new Date());
  const [history, models] = await Promise.all([
    loadWavePipelineRunAnalytics(range),
    loadCurrentStatusModels(),
  ]);
  const alerts = evaluatePipelineAlerts(
    { history, models },
    { thresholds: resolvePipelineAlertThresholds(process.env), now: new Date() }
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        ...alerts,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  process.stderr.write(
    `Pipeline alert evaluation failed: ${error?.stack || error?.message || String(error)}\n`
  );
  process.exitCode = 2;
});
