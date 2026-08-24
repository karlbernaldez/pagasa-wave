import { throwError } from './errorHelper.js';

function buildSnapshotConditions(expectedStatus, expectedUpdatedAt) {
  const conditions = {};

  if (expectedStatus !== undefined) conditions.status = expectedStatus;
  if (expectedUpdatedAt) conditions.updatedAt = expectedUpdatedAt;

  return conditions;
}

export async function saveForecastPackageSnapshot(
  forecastPackage,
  {
    session = null,
    expectedStatus,
    expectedUpdatedAt,
    conflictMessage = 'Forecast Package changed while this operation was in progress. Reload and try again.',
  } = {}
) {
  forecastPackage.$where = buildSnapshotConditions(expectedStatus, expectedUpdatedAt);

  try {
    return await forecastPackage.save(session ? { session } : undefined);
  } catch (error) {
    if (error?.name === 'DocumentNotFoundError') {
      throwError(conflictMessage, 409);
    }
    throw error;
  } finally {
    forecastPackage.$where = undefined;
  }
}
