export const requireExpectedVersion = (req, _res, next) => {
  const raw = req.get('if-match') || req.body?.version;

  if (raw === undefined || raw === null || raw === '') {
    req.expectedVersion = null;
    return next();
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    const err = new Error('Invalid version for concurrency control');
    err.status = 400;
    return next(err);
  }

  req.expectedVersion = parsed;
  next();
};

export const assertVersionMatch = (project, expectedVersion) => {
  if (expectedVersion == null) return;

  if (project.version !== expectedVersion) {
    const err = new Error('Project has been modified by another user. Refresh and retry.');
    err.status = 409;
    throw err;
  }
};
