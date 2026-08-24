const locksByProject = new Map();

function getProjectKey(projectId) {
  return String(projectId || '').trim();
}

export async function acquireProjectMutationLock(projectId) {
  const key = getProjectKey(projectId);
  if (!key) return () => {};

  const previous = locksByProject.get(key) || Promise.resolve();
  let releaseCurrent;
  const current = new Promise((resolve) => {
    releaseCurrent = resolve;
  });
  const tail = previous.then(() => current);
  locksByProject.set(key, tail);

  await previous;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseCurrent();
    if (locksByProject.get(key) === tail) locksByProject.delete(key);
  };
}

export async function withProjectMutationLock(projectId, operation) {
  const release = await acquireProjectMutationLock(projectId);
  try {
    return await operation();
  } finally {
    release();
  }
}
