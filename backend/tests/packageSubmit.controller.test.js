import test from 'node:test';
import assert from 'node:assert/strict';

const USER_ID = 'user-1';

async function loadModules() {
  const workflow = await import('../utils/' + 'forecast' + 'Package.js');
  const controller = await import('../controllers/' + 'forecast' + 'PackageController.js');
  const packageModel = await import('../models/' + 'Forecast' + 'Package.js');
  return { workflow, controller, PackageModel: packageModel.default };
}

function ownerId(value = USER_ID) {
  return { toString: () => value };
}

function createQuery(result) {
  return {
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
}

function createPkg(workflow, ready) {
  return {
    _id: 'package-1',
    owner: ownerId(),
    status: workflow.FORECAST_PACKAGE_STATUS.DRAFT,
    chartCompletion: workflow.REQUIRED_FORECAST_CHART_TYPES.map((chartType) => ({ chartType, isComplete: ready })),
    auditLogs: [],
    saveCalls: 0,
    async save() { this.saveCalls += 1; return this; },
    toObject() {
      return {
        _id: this._id,
        owner: this.owner,
        status: this.status,
        chartCompletion: this.chartCompletion,
        auditLogs: this.auditLogs,
        submittedAt: this.submittedAt,
      };
    },
  };
}

async function run(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: undefined,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; resolve(this); return this; },
    };
    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

function req() {
  return {
    params: { id: 'package-1' },
    body: {},
    query: {},
    user: { id: USER_ID, role: 'forecaster' },
  };
}

test('package submit action rejects an unfinished package', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, false);

  try {
    PackageModel.findById = () => pkg;

    await assert.rejects(
      () => run(controller.submitForecastPackage, req()),
      { status: 400 }
    );

    assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.DRAFT);
    assert.equal(pkg.saveCalls, 0);
  } finally {
    PackageModel.findById = originalFindById;
  }
});

test('package submit action submits when every required chart is ready', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, true);
  let calls = 0;

  try {
    PackageModel.findById = () => {
      calls += 1;
      return calls === 1 ? pkg : createQuery(pkg);
    };

    const res = await run(controller.submitForecastPackage, req());

    assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
    assert.ok(pkg.submittedAt instanceof Date);
    assert.equal(pkg.saveCalls, 1);
    assert.equal(pkg.auditLogs.at(-1).action, 'submitted');
    assert.equal(res.body.completion.completed, 4);
    assert.equal(res.body.completion.isComplete, true);
  } finally {
    PackageModel.findById = originalFindById;
  }
});
