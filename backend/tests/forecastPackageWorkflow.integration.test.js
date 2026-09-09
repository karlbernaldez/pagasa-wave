import test from 'node:test';
import assert from 'node:assert/strict';

const OWNER_ID = 'owner-1';
const ADMIN_ID = 'admin-1';
const PARTICIPANT_ID = 'forecaster-2';

async function loadModules() {
  const mongoose = await import('mongoose');
  const workflow = await import('../utils/' + 'forecast' + 'Package.js');
  const packageController = await import('../controllers/forecastPackageSubmitController.js');
  const reviewController = await import('../controllers/' + 'forecast' + 'PackageController.js');
  const packageModel = await import('../models/' + 'Forecast' + 'Package.js');
  const projectModel = await import('../models/Project.js');
  return {
    mongoose: mongoose.default,
    workflow,
    controller: {
      submitForecastPackage: packageController.submitForecastPackage,
      startForecastPackageReview: reviewController.startForecastPackageReview,
      requestForecastPackageRevision: reviewController.requestForecastPackageRevision,
    },
    ForecastPackage: packageModel.default,
    Project: projectModel.default,
  };
}

function ownerId(value = OWNER_ID) {
  return { toString: () => value };
}

function createQuery(result) {
  return {
    populate() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
}

function createPackage(workflow, status = workflow.FORECAST_PACKAGE_STATUS.DRAFT) {
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
    chartCompletion: workflow.REQUIRED_FORECAST_CHART_TYPES.map((chartType) => ({
      chartType,
      isComplete: true,
      completedBy: OWNER_ID,
      completedAt: new Date(),
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
        submittedAt: this.submittedAt,
        reviewStartedAt: this.reviewStartedAt,
        reviewStartedBy: this.reviewStartedBy,
        reviewedAt: this.reviewedAt,
        reviewComment: this.reviewComment,
        rejectedBy: this.rejectedBy,
      };
    },
  };
}

function req(overrides = {}) {
  return {
    params: { id: 'package-1' },
    body: {},
    query: {},
    user: { id: OWNER_ID, role: 'forecaster' },
    permissions: ['projects.submit'],
    ...overrides,
  };
}

async function run(handler, request) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve(this);
        return this;
      },
    };

    handler(request, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

async function withMockedModels(
  {
    mongoose,
    ForecastPackage,
    Project,
    packageFactory,
    updateMany = async () => ({ modifiedCount: 0 }),
  },
  fn,
) {
  const originalStartSession = mongoose.startSession;
  const originalFindById = ForecastPackage.findById;
  const originalUpdateMany = Project.updateMany;
  let findByIdCalls = 0;

  const session = {
    async withTransaction(callback) {
      return callback();
    },
    async endSession() {},
  };

  mongoose.startSession = async () => session;
  ForecastPackage.findById = () => {
    findByIdCalls += 1;
    const forecastPackage = packageFactory();
    return findByIdCalls === 1 ? forecastPackage : createQuery(forecastPackage);
  };
  Project.updateMany = updateMany;

  try {
    return await fn();
  } finally {
    mongoose.startSession = originalStartSession;
    ForecastPackage.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
}

test('forecast package can move from forecaster submission to reviewer review without exposing draft package state', async () => {
  const { mongoose, workflow, controller, ForecastPackage, Project } = await loadModules();
  const pkg = createPackage(workflow, workflow.FORECAST_PACKAGE_STATUS.DRAFT);
  let updateManyPayload;

  await withMockedModels(
    {
      mongoose,
      ForecastPackage,
      Project,
      packageFactory: () => pkg,
      updateMany: async (filter, update) => {
        updateManyPayload = { filter, update };
        return { modifiedCount: 4 };
      },
    },
    async () => {
      const submitResponse = await run(controller.submitForecastPackage, req());

      assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
      assert.equal(pkg.saveCalls, 1);
      assert.equal(submitResponse.body.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
      assert.deepEqual(updateManyPayload.filter.status.$in, [
        'Draft',
        'Revision Requested',
        'Rejected',
      ]);
      assert.equal(updateManyPayload.update.$set.status, 'Submitted');

      const reviewResponse = await run(
        controller.startForecastPackageReview,
        req({
          user: { id: ADMIN_ID, role: 'reviewer' },
          permissions: ['projects.review'],
        }),
      );

      assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.UNDER_REVIEW);
      assert.equal(pkg.reviewStartedBy, ADMIN_ID);
      assert.equal(pkg.saveCalls, 2);
      assert.equal(pkg.auditLogs.at(-1).action, 'review_started');
      assert.equal(reviewResponse.body.status, workflow.FORECAST_PACKAGE_STATUS.UNDER_REVIEW);
    },
  );
});

test('reviewer cannot start review until a package has been submitted', async () => {
  const { mongoose, workflow, controller, ForecastPackage, Project } = await loadModules();
  const pkg = createPackage(workflow, workflow.FORECAST_PACKAGE_STATUS.DRAFT);

  await withMockedModels(
    {
      mongoose,
      ForecastPackage,
      Project,
      packageFactory: () => pkg,
    },
    async () => {
      await assert.rejects(
        () =>
          run(
            controller.startForecastPackageReview,
            req({
              user: { id: ADMIN_ID, role: 'reviewer' },
              permissions: ['projects.review'],
            }),
          ),
        { status: 403, message: 'Only Submitted packages can be moved to Under Review' },
      );

      assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.DRAFT);
      assert.equal(pkg.saveCalls, 0);
      assert.equal(pkg.auditLogs.length, 0);
    },
  );
});

test('participating forecaster can resubmit a revision-requested package and relock linked chart projects', async () => {
  const { mongoose, workflow, controller, ForecastPackage, Project } = await loadModules();
  const pkg = createPackage(workflow, workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED);
  pkg.chartCompletion[1].completedBy = PARTICIPANT_ID;
  let updateManyPayload;

  await withMockedModels(
    {
      mongoose,
      ForecastPackage,
      Project,
      packageFactory: () => pkg,
      updateMany: async (filter, update) => {
        updateManyPayload = { filter, update };
        return { modifiedCount: 4 };
      },
    },
    async () => {
      const response = await run(
        controller.submitForecastPackage,
        req({
          user: { id: PARTICIPANT_ID, role: 'forecaster' },
          permissions: ['projects.submit'],
        }),
      );

      assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
      assert.equal(pkg.auditLogs.at(-1).performedBy, PARTICIPANT_ID);
      assert.deepEqual(updateManyPayload.filter._id.$in, [
        'project-1',
        'project-2',
        'project-3',
        'project-4',
      ]);
      assert.deepEqual(updateManyPayload.filter.status.$in, [
        'Draft',
        'Revision Requested',
        'Rejected',
      ]);
      assert.equal(
        updateManyPayload.update.$push.auditLogs.previousStatus,
        'Revision Requested',
      );
      assert.equal(
        updateManyPayload.update.$push.auditLogs.comment,
        'Revision resubmitted as part of Forecast Package submission',
      );
      assert.equal(response.body.status, workflow.FORECAST_PACKAGE_STATUS.SUBMITTED);
    },
  );
});

test('reviewer revision request returns package and linked submitted chart projects to revision requested', async () => {
  const { mongoose, workflow, controller, ForecastPackage, Project } = await loadModules();
  const pkg = createPackage(workflow, workflow.FORECAST_PACKAGE_STATUS.UNDER_REVIEW);
  const comment = 'Update the 36h forecast notes before resubmission.';
  let updateManyPayload;

  await withMockedModels(
    {
      mongoose,
      ForecastPackage,
      Project,
      packageFactory: () => pkg,
      updateMany: async (filter, update) => {
        updateManyPayload = { filter, update };
        return { modifiedCount: 4 };
      },
    },
    async () => {
      const response = await run(
        controller.requestForecastPackageRevision,
        req({
          body: { comment },
          user: { id: ADMIN_ID, role: 'reviewer' },
          permissions: ['projects.review'],
        }),
      );

      assert.equal(pkg.status, workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED);
      assert.equal(pkg.reviewComment, comment);
      assert.equal(pkg.rejectedBy, ADMIN_ID);
      assert.equal(pkg.saveCalls, 1);
      assert.deepEqual(updateManyPayload.filter.status.$in, ['Submitted', 'Under Review']);
      assert.equal(updateManyPayload.update.$set.status, 'Revision Requested');
      assert.equal(updateManyPayload.update.$set.reviewComment, comment);
      assert.equal(updateManyPayload.update.$push.auditLogs.action, 'revision_requested');
      assert.equal(response.body.status, workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED);
    },
  );
});
