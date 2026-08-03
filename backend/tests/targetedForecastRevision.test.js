import test from 'node:test';
import assert from 'node:assert/strict';

const ADMIN_ID = 'admin-1';
const PACKAGE_ID = 'package-1';
const PROJECT_IDS = ['project-1', 'project-2', 'project-3', 'project-4'];
const CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

function createQuery(result) {
  return {
    session() {
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
}

function createPackage() {
  const completedAt = new Date('2026-08-03T04:00:00.000Z');
  return {
    _id: PACKAGE_ID,
    owner: 'owner-1',
    status: 'Under Review',
    submittedAt: completedAt,
    reviewedAt: null,
    rejectedBy: null,
    reviewComment: '',
    charts: CHART_TYPES.map((chartType, index) => ({
      chartType,
      project: PROJECT_IDS[index],
      readyAt: completedAt,
      readyBy: 'owner-1',
      readyEditors: [],
      activeEditors: [],
      claimedBy: null,
      claimedAt: null,
    })),
    chartCompletion: CHART_TYPES.map((chartType) => ({
      chartType,
      isComplete: true,
      completedAt,
      completedBy: 'owner-1',
    })),
    auditLogs: [],
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
    toObject() {
      return {
        _id: this._id,
        owner: this.owner,
        status: this.status,
        charts: this.charts,
        chartCompletion: this.chartCompletion,
        auditLogs: this.auditLogs,
        reviewedAt: this.reviewedAt,
        rejectedBy: this.rejectedBy,
        reviewComment: this.reviewComment,
      };
    },
  };
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
  const mongooseModule = await import('mongoose');
  const controller = await import('../controllers/forecastPackageRevisionController.js');
  const packageModel = await import('../models/ForecastPackage.js');
  const projectModel = await import('../models/Project.js');
  return {
    mongoose: mongooseModule.default,
    controller,
    ForecastPackage: packageModel.default,
    Project: projectModel.default,
  };
}

async function withMocks({ mongoose, ForecastPackage, Project, pkg, projects }, fn) {
  const originals = {
    startSession: mongoose.startSession,
    findOne: ForecastPackage.findOne,
    findById: ForecastPackage.findById,
    projectFind: Project.find,
    bulkWrite: Project.bulkWrite,
  };
  const bulkWrites = [];

  mongoose.startSession = async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  });
  ForecastPackage.findOne = () => createQuery({ _id: PACKAGE_ID, charts: pkg.charts });
  ForecastPackage.findById = () => createQuery(pkg);
  Project.find = () => createQuery(projects);
  Project.bulkWrite = async (operations) => {
    bulkWrites.push(operations);
    return { modifiedCount: operations.length };
  };

  try {
    await fn(bulkWrites);
  } finally {
    mongoose.startSession = originals.startSession;
    ForecastPackage.findOne = originals.findOne;
    ForecastPackage.findById = originals.findById;
    Project.find = originals.projectFind;
    Project.bulkWrite = originals.bulkWrite;
  }
}

test('revision by project resets only the selected chart and records the true previous project status', async () => {
  const { mongoose, controller, ForecastPackage, Project } = await loadModules();
  const pkg = createPackage();
  const projects = PROJECT_IDS.map((id, index) => ({
    _id: id,
    owner: 'owner-1',
    status: index === 0 ? 'Under Review' : 'Submitted',
    submittedAt: new Date('2026-08-03T04:00:00.000Z'),
  }));

  await withMocks({ mongoose, ForecastPackage, Project, pkg, projects }, async (bulkWrites) => {
    const response = await run(controller.requestForecastChartRevisionByProject, {
      params: { projectId: PROJECT_IDS[0] },
      body: { comment: 'Revise the wave analysis.' },
      user: { id: ADMIN_ID, role: 'admin' },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'Revision Requested');
    assert.deepEqual(response.body.affectedChartTypes, ['analysis']);
    assert.equal(pkg.chartCompletion[0].isComplete, false);
    assert.equal(pkg.charts[0].readyAt, null);

    for (let index = 1; index < pkg.chartCompletion.length; index += 1) {
      assert.equal(pkg.chartCompletion[index].isComplete, true);
      assert.ok(pkg.charts[index].readyAt);
    }

    assert.equal(bulkWrites.length, 1);
    assert.equal(bulkWrites[0].length, 1);
    assert.equal(
      bulkWrites[0][0].updateOne.update.$push.auditLogs.previousStatus,
      'Under Review'
    );
  });
});

test('targeted revision rejects an empty chart selection before writing', async () => {
  const { controller } = await loadModules();

  await assert.rejects(
    () =>
      run(controller.requestTargetedForecastPackageRevision, {
        params: { id: PACKAGE_ID },
        body: { comment: 'Revise this chart.', chartTypes: [] },
        user: { id: ADMIN_ID, role: 'admin' },
      }),
    { status: 400, message: 'At least one affected chart type is required' }
  );
});

test('targeted revision rejects unsupported chart types before writing', async () => {
  const { controller } = await loadModules();

  await assert.rejects(
    () =>
      run(controller.requestTargetedForecastPackageRevision, {
        params: { id: PACKAGE_ID },
        body: { comment: 'Revise this chart.', chartTypes: ['forecast_72h'] },
        user: { id: ADMIN_ID, role: 'admin' },
      }),
    { status: 400, message: 'Unsupported forecast chart type: forecast_72h' }
  );
});
