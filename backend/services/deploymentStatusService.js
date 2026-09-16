import fs from 'node:fs/promises';

const DEFAULT_STATUS_FILE = '/var/lib/wavelab/deployment-status/latest.json';
const ALLOWED_RESULT = new Set(['PASS', 'WARN', 'FAIL', 'UNKNOWN']);
const ALLOWED_CHECK_STATUS = new Set(['PASS', 'WARN', 'FAIL', 'UNKNOWN']);

function asString(value, fallback = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function asStateMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => /^[a-z0-9_]+$/i.test(key))
      .map(([key, state]) => [key, asString(state, 'unavailable')])
  );
}

function normalizeChecks(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((check) => ({
    key: asString(check?.key, 'unknown'),
    label: asString(check?.label, 'Unnamed check'),
    status: ALLOWED_CHECK_STATUS.has(check?.status) ? check.status : 'UNKNOWN',
    detail: asString(check?.detail),
  }));
}

export function sanitizeDeploymentStatus(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { available: false, schemaVersion: 1 };
  }

  return {
    available: value.available !== false,
    schemaVersion: 1,
    generatedAt: asString(value.generatedAt),
    reportId: asString(value.reportId),
    result: ALLOWED_RESULT.has(value.result) ? value.result : 'UNKNOWN',
    host: asString(value.host),
    revision: asString(value.revision),
    shortRevision: asString(value.shortRevision),
    branch: asString(value.branch),
    backendEnvironment: asString(value.backendEnvironment, 'unset'),
    backend: {
      startedAt: asString(value.backend?.startedAt),
      recentErrorCount: asCount(value.backend?.recentErrorCount),
    },
    services: asStateMap(value.services),
    timers: asStateMap(value.timers),
    checks: normalizeChecks(value.checks),
  };
}

export async function getDeploymentStatus(
  statusFile = process.env.WAVELAB_DEPLOYMENT_STATUS_FILE || DEFAULT_STATUS_FILE
) {
  try {
    const document = JSON.parse(await fs.readFile(statusFile, 'utf8'));
    return sanitizeDeploymentStatus(document);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES' || error instanceof SyntaxError) {
      return {
        available: false,
        schemaVersion: 1,
        result: 'UNKNOWN',
        generatedAt: null,
        checks: [],
        services: {},
        timers: {},
      };
    }
    throw error;
  }
}
