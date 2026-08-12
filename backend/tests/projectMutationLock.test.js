import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';

import featureRoutes from '../routes/featureRoutes.js';
import forecastPackageRoutes from '../routes/forecastPackageRoutes.js';
import { lockProjectParamMutation } from '../middleware/projectMutationLockMiddleware.js';
import { withProjectMutationLock } from '../utils/projectMutationLock.js';

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function routeHandlerNames(router, path, method) {
  const layer = router.stack.find(
    (candidate) => candidate.route?.path === path && candidate.route?.methods?.[method]
  );
  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} route`);
  return layer.route.stack.map((handler) => handler.handle.name);
}

function createResponse() {
  const response = new EventEmitter();
  response.off = response.removeListener.bind(response);
  return response;
}

test('same-project mutations are serialized until the first operation releases', async () => {
  const firstEntered = deferred();
  const releaseFirst = deferred();
  const events = [];

  const first = withProjectMutationLock('project-a', async () => {
    events.push('first-enter');
    firstEntered.resolve();
    await releaseFirst.promise;
    events.push('first-exit');
  });

  await firstEntered.promise;

  const second = withProjectMutationLock('project-a', async () => {
    events.push('second-enter');
  });

  await Promise.resolve();
  assert.deepEqual(events, ['first-enter']);

  releaseFirst.resolve();
  await Promise.all([first, second]);

  assert.deepEqual(events, ['first-enter', 'first-exit', 'second-enter']);
});

test('different projects can mutate concurrently', async () => {
  const releaseFirst = deferred();
  let secondEntered = false;

  const first = withProjectMutationLock('project-a', async () => {
    await releaseFirst.promise;
  });

  const second = withProjectMutationLock('project-b', async () => {
    secondEntered = true;
  });

  await second;
  assert.equal(secondEntered, true);
  releaseFirst.resolve();
  await first;
});

test('project-id route middleware holds the lock through response completion', async () => {
  const firstResponse = createResponse();
  const secondResponse = createResponse();
  let firstNextCalled = false;
  let secondNextCalled = false;

  await lockProjectParamMutation(
    { params: { projectId: 'project-response-lock' } },
    firstResponse,
    () => {
      firstNextCalled = true;
    }
  );
  assert.equal(firstNextCalled, true);

  const secondLock = lockProjectParamMutation(
    { params: { projectId: 'project-response-lock' } },
    secondResponse,
    () => {
      secondNextCalled = true;
    }
  );

  await Promise.resolve();
  assert.equal(secondNextCalled, false);

  firstResponse.emit('finish');
  await secondLock;
  assert.equal(secondNextCalled, true);
  secondResponse.emit('finish');
});

test('all annotation mutation routes use the project mutation lock', () => {
  const guardedRoutes = [
    ['/', 'post'],
    ['/requests/:notificationId/approve', 'post'],
    ['/:sourceId/request-change', 'post'],
    ['/:sourceId', 'delete'],
    ['/:sourceId/coordinates', 'patch'],
    ['/:sourceId/style', 'patch'],
    ['/:sourceId', 'patch'],
  ];

  guardedRoutes.forEach(([path, method]) => {
    assert.ok(
      routeHandlerNames(featureRoutes, path, method).includes('lockFeatureProjectMutation'),
      `${method.toUpperCase()} ${path} must use lockFeatureProjectMutation`
    );
  });
});

test('both chart certification routes share the project mutation boundary', () => {
  assert.ok(
    routeHandlerNames(
      forecastPackageRoutes,
      '/charts/project/:projectId/completion',
      'patch'
    ).includes('lockProjectParamMutation')
  );
  assert.ok(
    routeHandlerNames(
      forecastPackageRoutes,
      '/:id/charts/:chartType/completion',
      'patch'
    ).includes('lockPackageChartMutation')
  );
});
