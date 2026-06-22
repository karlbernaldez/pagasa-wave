import test from 'node:test';
import assert from 'node:assert/strict';

const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';

async function loadModules() {
  const workflow = await import('../utils/' + 'forecast' + 'Package.js');
  const controller = await import('../controllers/' + 'forecast' + 'PackageController.js');
  const packageModel = await import('../models/' + 'Forecast' + 'Package.js');
  const projectModel = await import('../models/Project.js');
  return { workflow, controller, PackageModel: packageModel.default, Project: projectModel.default };
}

function ownerId(value = USER_ID) { return { toString: () => value }; }
function createQuery(result) { return { populate() { return this; }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } }; }

function createPkg(workflow, ready, status = workflow.FORECAST_PACKAGE_STATUS.DRAFT) {
  return {
    _id: 'package-1',
    owner: ownerId(),
    status,
    charts: workflow.REQUIRED_FORECAST_CHART_TYPES.map((chartType, index) => ({
      chartType,
      project: `project-${index + 1}`,
      activeEditors: [],
      claimedBy: null,
      claimedAt: null,
      readyBy: null,
      readyAt: null,
    })),
    chartCompletion: workflow.REQUIRED_FORECAST_CHART_TYPES.map((chartType) => ({ chartType, isComplete: ready })),
    auditLogs: [],
    saveCalls: 0,
    async save() { this.saveCalls += 1; return this; },
    toObject() {
      return {
        _id: this._id,
        owner: this.owner,
        status: this.status,
        charts: this.charts,
        chartCompletion: this.chartCompletion,
        auditLogs: this.auditLogs,
        submittedAt: this.submittedAt,
        reviewedAt: this.reviewedAt,
        reviewComment: this.reviewComment,
      };
    },
  };
}

async function run(handler, req) {
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(payload) { this.body = payload; resolve(this); return this; } };
    handler(req, res, (error) => { if (error) reject(error); else resolve(res); });
  });
}

function req(overrides = {}) {
  return { params: { id: 'package-1' }, body: {}, query: {}, user: { id: USER_ID, role: 'forecaster' }, ...overrides };
}

test('package submit action rejects an unfinished package', async () => {
  const { workflow, controller, PackageModel, Project } = await loadModules();
  const originalFindById = PackageModel.findById;
  const originalUpdateMany = Project.updateMany;
  const pkg = createPkg(workflow, false);
  let updateManyCalls = 0;
  try {
    PackageModel.findById = () => pkg;
    Project.updateMany = async () => { updateManyCalls += 1; };
    await assert.rejects(() => run(controller.submitForecastPackage, req()), { status: 400 });
    assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.DRAFT);
    assert.equal(pkg.saveCalls, 0);
    assert.equal(updateManyCalls, 0);
  } finally {
    PackageModel.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
});

test('package chart completion enforces the operational chart sequence', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, false);
  try {
    PackageModel.findById = () => pkg;
    await assert.rejects(
      () => run(controller.updateForecastChartCompletion, req({ params: { id: 'package-1', chartType: 'forecast_24h' }, body: { isComplete: true } })),
      { status: 400, message: 'Wave Analysis must be certified before 24h Wave Forecast' }
    );
    assert.equal(pkg.saveCalls, 0);
    assert.equal(pkg.chartCompletion.find((row) => row.chartType === 'forecast_24h').isComplete, false);
  } finally {
    PackageModel.findById = originalFindById;
  }
});

test('forecaster can join the active unlocked chart for editing', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindOne = PackageModel.findOne;
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, false);
  const forecasterId = 'forecaster-2';
  try {
    PackageModel.findOne = () => pkg;
    PackageModel.findById = () => createQuery(pkg);
    const res = await run(controller.claimForecastPackageChartByProject, req({ params: { projectId: 'project-1' }, user: { id: forecasterId, role: 'forecaster' } }));
    assert.equal(pkg.charts[0].activeEditors.length, 1);
    assert.equal(pkg.charts[0].activeEditors[0].user, forecasterId);
    assert.equal(pkg.charts[0].claimedBy, forecasterId);
    assert.ok(pkg.charts[0].claimedAt instanceof Date);
    assert.equal(pkg.saveCalls, 1);
    assert.equal(pkg.auditLogs.at(-1).action, 'chart_claimed');
    assert.equal(res.body.claim.claimedByCurrentUser, true);
  } finally {
    PackageModel.findOne = originalFindOne;
    PackageModel.findById = originalFindById;
  }
});

test('multiple forecasters can join the same chart editing session', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindOne = PackageModel.findOne;
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, false);
  pkg.charts[0].activeEditors = [{ user: ownerId('forecaster-2'), startedAt: new Date() }];
  pkg.charts[0].claimedBy = ownerId('forecaster-2');
  pkg.charts[0].claimedAt = new Date();
  try {
    PackageModel.findOne = () => pkg;
    PackageModel.findById = () => createQuery(pkg);
    const res = await run(controller.claimForecastPackageChartByProject, req({ params: { projectId: 'project-1' }, user: { id: 'forecaster-3', role: 'forecaster' } }));
    assert.equal(pkg.charts[0].activeEditors.length, 2);
    assert.equal(pkg.charts[0].activeEditors.some((editor) => String(editor.user) === 'forecaster-3'), true);
    assert.equal(pkg.saveCalls, 1);
    assert.equal(res.body.claim.activeEditorCount, 2);
  } finally {
    PackageModel.findOne = originalFindOne;
    PackageModel.findById = originalFindById;
  }
});

test('chart readiness is blocked while multiple forecasters are actively editing', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindOne = PackageModel.findOne;
  const pkg = createPkg(workflow, false);
  pkg.charts[0].activeEditors = [
    { user: ownerId('forecaster-2'), startedAt: new Date() },
    { user: ownerId('forecaster-3'), startedAt: new Date() },
  ];
  try {
    PackageModel.findOne = () => pkg;
    await assert.rejects(
      () => run(controller.updateForecastChartCompletionByProject, req({ params: { projectId: 'project-1' }, body: { isComplete: true }, user: { id: 'forecaster-2', role: 'forecaster' } })),
      { status: 409 }
    );
    assert.equal(pkg.saveCalls, 0);
    assert.equal(pkg.chartCompletion[0].isComplete, false);
  } finally {
    PackageModel.findOne = originalFindOne;
  }
});

test('marking an earlier chart incomplete clears downstream certifications', async () => {
  const { workflow, controller, PackageModel } = await loadModules();
  const originalFindById = PackageModel.findById;
  const pkg = createPkg(workflow, true);
  let calls = 0;
  try {
    PackageModel.findById = () => { calls += 1; return calls === 1 ? pkg : createQuery(pkg); };
    const res = await run(controller.updateForecastChartCompletion, req({ params: { id: 'package-1', chartType: 'forecast_24h' }, body: { isComplete: false } }));
    assert.equal(pkg.saveCalls, 1);
    assert.equal(pkg.chartCompletion.find((row) => row.chartType === 'analysis').isComplete, true);
    assert.equal(pkg.chartCompletion.find((row) => row.chartType === 'forecast_24h').isComplete, false);
    assert.equal(pkg.chartCompletion.find((row) => row.chartType === 'forecast_36h').isComplete, false);
    assert.equal(pkg.chartCompletion.find((row) => row.chartType === 'forecast_48h').isComplete, false);
    assert.equal(pkg.auditLogs.at(-1).comment, '24h Wave Forecast and downstream charts marked incomplete');
    assert.equal(res.body.completion.completed, 1);
  } finally {
    PackageModel.findById = originalFindById;
  }
});

test('package submit action blocks while a chart still has active editors', async () => {
  const { workflow, controller, PackageModel, Project } = await loadModules();
  const originalFindById = PackageModel.findById;
  const originalUpdateMany = Project.updateMany;
  const pkg = createPkg(workflow, true);
  pkg.charts[0].activeEditors = [{ user: ownerId('forecaster-2'), startedAt: new Date() }];
  let updateManyCalls = 0;
  try {
    PackageModel.findById = () => pkg;
    Project.updateMany = async () => { updateManyCalls += 1; };
    await assert.rejects(() => run(controller.submitForecastPackage, req()), { status: 409 });
    assert.equal(updateManyCalls, 0);
    assert.equal(pkg.saveCalls, 0);
  } finally {
    PackageModel.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
});

test('package submit action submits and locks linked chart projects when every required chart is ready', async () => {
  const { workflow, controller, PackageModel, Project } = await loadModules();
  const originalFindById = PackageModel.findById;
  const originalUpdateMany = Project.updateMany;
  const pkg = createPkg(workflow, true);
  let calls = 0;
  let updateManyPayload;
  try {
    PackageModel.findById = () => { calls += 1; return calls === 1 ? pkg : createQuery(pkg); };
    Project.updateMany = async (filter, update) => { updateManyPayload = { filter, update }; return { modifiedCount: 4 }; };
    const res = await run(controller.submitForecastPackage, req());
    assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
    assert.ok(pkg.submittedAt instanceof Date);
    assert.equal(pkg.saveCalls, 1);
    assert.equal(pkg.auditLogs.at(-1).action, 'submitted');
    assert.deepEqual(updateManyPayload.filter._id.$in, ['project-1', 'project-2', 'project-3', 'project-4']);
    assert.equal(updateManyPayload.update.$set.status, 'Submitted');
    assert.equal(updateManyPayload.update.$push.auditLogs.action, 'submitted');
    assert.equal(res.body.completion.completed, 4);
    assert.equal(res.body.completion.isComplete, true);
  } finally {
    PackageModel.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
});

test('package revision request unlocks linked chart projects for forecaster edits', async () => {
  const { workflow, controller, PackageModel, Project } = await loadModules();
  const originalFindById = PackageModel.findById;
  const originalUpdateMany = Project.updateMany;
  const pkg = createPkg(workflow, true, workflow.FORECAST_PACKAGE_STATUS.UNDER_REVIEW);
  const comment = 'Please update the wave-height annotation on the 24h chart.';
  let calls = 0;
  let updateManyPayload;
  try {
    PackageModel.findById = () => { calls += 1; return calls === 1 ? pkg : createQuery(pkg); };
    Project.updateMany = async (filter, update) => { updateManyPayload = { filter, update }; return { modifiedCount: 4 }; };
    const res = await run(controller.requestForecastPackageRevision, req({ body: { comment }, user: { id: ADMIN_ID, role: 'admin' } }));
    assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED);
    assert.ok(pkg.reviewedAt instanceof Date);
    assert.equal(pkg.reviewComment, comment);
    assert.equal(pkg.saveCalls, 1);
    assert.equal(pkg.auditLogs.at(-1).action, 'revision_requested');
    assert.deepEqual(updateManyPayload.filter._id.$in, ['project-1', 'project-2', 'project-3', 'project-4']);
    assert.deepEqual(updateManyPayload.filter.status.$in, ['Submitted', 'Under Review']);
    assert.equal(updateManyPayload.update.$set.status, 'Revision Requested');
    assert.equal(updateManyPayload.update.$set.reviewComment, comment);
    assert.equal(updateManyPayload.update.$push.auditLogs.action, 'revision_requested');
    assert.equal(updateManyPayload.update.$push.auditLogs.comment, comment);
    assert.equal(res.body.status, workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED);
  } finally {
    PackageModel.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
});