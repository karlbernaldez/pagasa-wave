import { throwError } from './errorHelper.js';

function buildSnapshotConditions(expectedStatus, expectedUpdatedAt) {
  const conditions = {};

  if (expectedStatus !== undefined) conditions.status = expectedStatus;
  if (expectedUpdatedAt) conditions.updatedAt = expectedUpdatedAt;

  return conditions;
}

export async function saveProjectSnapshot(
  project,
  {
    session = null,
    expectedStatus,
    expectedUpdatedAt,
    conflictMessage = 'Project changed while this operation was in progress. Reload and try again.',
  } = {}
) {
  project.$where = buildSnapshotConditions(expectedStatus, expectedUpdatedAt);

  try {
    return await project.save(session ? { session } : undefined);
  } catch (error) {
    if (error?.name === 'DocumentNotFoundError') {
      throwError(conflictMessage, 409);
    }
    throw error;
  } finally {
    project.$where = undefined;
  }
}
