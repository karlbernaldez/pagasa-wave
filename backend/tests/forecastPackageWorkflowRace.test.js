import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';
import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import { requestTargetedForecastPackageRevision } from '../controllers/forecastPackageRevisionController.js';
import { submitForecastPackage } from '../controllers/forecastPackageSubmitController.js';
import { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';

const PACKAGE_ID = 'package-1';
const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';
const UPDATED_AT = new Date('2026-08-12T03:30:00.000Z');
const CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];
const PROJECT_IDS = ['project-1', 'project-2', 'project-3', 'project-4'];

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

function createPackage(status = 'Draft') {
  const completedAt = new Date('2026-08-12T03:00:00.000Z');
  return {
    _id: PACKAGE_ID,
    owner: USER_ID,
    status,
    updatedAt: UPDATED_AT,
    submittedAt: completedAt,
    reviewedAt: null,
    rejectedBy: null,
    reviewComment: '',
    charts: CHART_TYPES.map((chartType, index) => ({
      chartType,
      project: PROJECT_IDS[index],
      readyAt: completedAt,
      readyBy: USER_ID,
      readyEditors: [],
      activeEditors: [],
      claimedBy: null,
      claimedAt: null,
    })),
    chartCompletion: CHART_TYPES.map((chartType) => ({
      chartType,
      isComplete: true,
      completedAt,
      completedBy: USER_ID,
    })),
    auditLogs: [],
    saveFilters: [],
    async save() {
      this.saveFilters.push(this.$where ? { ...this.$where } : null);
      this.updatedAt = new Date('2026-08-12T03:31:00.000Z');
      return this;
    },
    toObject() {
      return {
        _id: this._id,
        owner: this.owner,
        status: this.status,
        updatedAt: this.updatedAt,
        charts: this.charts,
        chartCompletion: this.chartCompletion,
        auditLogs: this.auditLogs,
        submittedAt: this.submittedAt,
        reviewedAt: this.reviewedAt,
        rejectedBy: this.rejectedBy,
        reviewComment: this.reviewComment,
      };
    },
  };
}

function createResponseRunner(handler, req) {
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

function mockSession() {
  return {
    async withTransaction(callback) {
      return callback();
    },
    async endSession() {},
  };
}

test('guarded package save converts a lost snapshot race into conflict', async () => {
  const document = {
    async save() {
      const error = new Error('No document found for guarded save');
      error.name = 'DocumentNotFoundError';
      throw error;
    },
  };

  await assert.rejects(
    () =>
      saveForecastPackageSnapshot(document, {
        expectedStatus: 'Draft',
        expectedUpdatedAt: UPDATED_AT,
        conflictMessage: 'Package changed concurrently',
      }),
    { status: 409, message: 'Package changed concurrently' },
  );
  assert.equal(document.$where, undefined);
});

test('submission save is guarded by the package status and timestamp that were validated', async () => {
  const originalStartSession = mongoose.startSession;
  const originalFindById = ForecastPackage.findById;
  const originalUpdateMany = Project.updateMany;
  const pkg = createPackage('Draft');
  let findByIdCalls = 0;

  try {
    mongoose.startSession = async () => mockSession();
    ForecastPackage.findById = () => {
      findByIdCalls += 1;
      return findByIdCalls === 1 ? pkg : createQuery(pkg);
    };
    Project.updateMany = async () => ({ modifiedCount: 4 });

    await createResponseRunner(submitForecastPackage, {
      params: { id: PACKAGE_ID },
      body: {},
      query: {},
      user: { id: USER_ID, role: 'forecaster' },
      permissions: ['projects.submit'],
    });

    assert.deepEqual(pkg.saveFilters[0], {
      status: 'Draft',
      updatedAt: UPDATED_AT,
    });
  } finally {
    mongoose.startSession = originalStartSession;
    ForecastPackage.findById = originalFindById;
    Project.updateMany = originalUpdateMany;
  }
});

test('targeted revision save is guarded before chart completion state is persisted', async () => {
  const originalStartSession = mongoose.startSession;
  const originalFindById = ForecastPackage.findById;
  const originalProjectFind = Project.find;
  const originalBulkWrite = Project.bulkWrite;
  const pkg = createPackage('Under Review');
  let findByIdCalls = 0;

  const projects = PROJECT_IDS.map((id) => ({
    _id: id,
    owner: USER_ID,
    status: 'Submitted',
    submittedAt: new Date('2026-08-12T03:00:00.000Z'),
  }));

  try {
    mongoose.startSession = async () => mockSession();
    ForecastPackage.findById = () => {
      findByIdCalls += 1;
      return findByIdCalls === 1 ? createQuery(pkg) : createQuery(pkg);
    };
    Project.find = () => createQuery(projects);
    Project.bulkWrite = async () => ({ modifiedCount: 1 });

    await createResponseRunner(requestTargetedForecastPackageRevision, {
      params: { id: PACKAGE_ID },
      body: { chartTypes: ['analysis'], comment: 'Revise the wave analysis.' },
      query: {},
      user: { id: ADMIN_ID, role: 'reviewer' },
      permissions: ['projects.review'],
    });

    assert.deepEqual(pkg.saveFilters[0], {
      status: 'Under Review',
      updatedAt: UPDATED_AT,
    });
    assert.equal(pkg.chartCompletion[0].isComplete, false);
    assert.equal(pkg.status, 'Revision Requested');
  } finally {
    mongoose.startSession = originalStartSession;
    ForecastPackage.findById = originalFindById;
    Project.find = originalProjectFind;
    Project.bulkWrite = originalBulkWrite;
  }
});
