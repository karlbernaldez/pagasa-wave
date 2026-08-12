import assert from 'node:assert/strict';
import test from 'node:test';

const USER_ID = 'forecaster-1';
const PROJECT_ID = 'project-1';
const UPDATED_AT = new Date('2026-08-12T05:00:00.000Z');

function createPackage({ activeEditors = [], complete = false } = {}) {
  const pkg = {
    _id: 'package-1',
    owner: 'owner-1',
    status: 'Draft',
    updatedAt: UPDATED_AT,
    charts: [
      {
        chartType: 'analysis',
        project: PROJECT_ID,
        activeEditors,
        claimedBy: activeEditors[0]?.user || null,
        claimedAt: activeEditors[0]?.startedAt || null,
        readyBy: null,
        readyAt: null,
      },
    ],
    chartCompletion: [
      {
        chartType: 'analysis',
        isComplete: complete,
        completedAt: null,
        completedBy: null,
      },
    ],
    auditLogs: [],
    async save() {
      this.saveWhere = this.$where;
      const error = new Error('stale package snapshot');
      error.name = 'DocumentNotFoundError';
      throw error;
    },
  };

  return pkg;
}

function run(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve(this);
        return this;
      },
    };

    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

async function loadModules() {
  const controller = await import('../controllers/forecastPackageController.js');
  const packageModel = await import('../models/ForecastPackage.js');
  return {
    controller,
    ForecastPackage: packageModel.default,
  };
}

async function withPackageMock(ForecastPackage, pkg, fn) {
  const originalFindOne = ForecastPackage.findOne;
  const originalFindById = ForecastPackage.findById;

  ForecastPackage.findOne = () => pkg;
  ForecastPackage.findById = () => pkg;

  try {
    await fn();
  } finally {
    ForecastPackage.findOne = originalFindOne;
    ForecastPackage.findById = originalFindById;
  }
}

function request(body = {}) {
  return {
    params: { projectId: PROJECT_ID },
    body,
    user: { id: USER_ID, role: 'forecaster' },
  };
}

function assertSnapshotConflict(error, pkg) {
  assert.equal(error.status, 409);
  assert.deepEqual(pkg.saveWhere, {
    status: 'Draft',
    updatedAt: UPDATED_AT,
  });
  assert.equal(pkg.$where, undefined);
  return true;
}

test('chart join rejects a stale package snapshot instead of overwriting another editor', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const pkg = createPackage();

  await withPackageMock(ForecastPackage, pkg, async () => {
    await assert.rejects(
      () => run(controller.claimForecastPackageChartByProject, request()),
      (error) => assertSnapshotConflict(error, pkg)
    );
  });
});

test('chart release rejects a stale package snapshot instead of restoring stale editor state', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const pkg = createPackage({
    activeEditors: [{ user: USER_ID, startedAt: new Date('2026-08-12T04:55:00.000Z') }],
  });

  await withPackageMock(ForecastPackage, pkg, async () => {
    await assert.rejects(
      () => run(controller.releaseForecastPackageChartByProject, request()),
      (error) => assertSnapshotConflict(error, pkg)
    );
  });
});

test('chart certification rejects a stale package snapshot instead of overwriting newer readiness state', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const pkg = createPackage({
    activeEditors: [{ user: USER_ID, startedAt: new Date('2026-08-12T04:55:00.000Z') }],
  });

  await withPackageMock(ForecastPackage, pkg, async () => {
    await assert.rejects(
      () =>
        run(
          controller.updateForecastChartCompletionByProject,
          request({ isComplete: true })
        ),
      (error) => assertSnapshotConflict(error, pkg)
    );
  });
});
