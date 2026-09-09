import test from 'node:test';
import assert from 'node:assert/strict';

const ADMIN_ID = 'admin-1';
const PACKAGE_ID = 'package-1';
const UPDATED_AT = new Date('2026-08-12T04:00:00.000Z');
const CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];
const ADMIN_WORKFLOW_PERMISSIONS = ['projects.review', 'projects.approve', 'projects.publish'];

function createPackage(status) {
  let guardedConditions = null;

  const forecastPackage = {
    _id: PACKAGE_ID,
    owner: 'owner-1',
    status,
    updatedAt: UPDATED_AT,
    charts: CHART_TYPES.map((chartType, index) => ({
      chartType,
      project: `project-${index + 1}`,
      activeEditors: [],
      readyEditors: [],
      claimedBy: null,
      claimedAt: null,
      readyBy: 'owner-1',
      readyAt: UPDATED_AT,
    })),
    chartCompletion: CHART_TYPES.map((chartType) => ({
      chartType,
      isComplete: true,
      completedAt: UPDATED_AT,
      completedBy: 'owner-1',
    })),
    auditLogs: [],
    async save() {
      guardedConditions = this.$where;
      const error = new Error('No document found for guarded save');
      error.name = 'DocumentNotFoundError';
      throw error;
    },
  };

  return {
    forecastPackage,
    getGuardedConditions: () => guardedConditions,
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

function request(body = {}) {
  return {
    params: { id: PACKAGE_ID },
    body,
    query: {},
    user: { id: ADMIN_ID, role: 'admin' },
    permissions: ADMIN_WORKFLOW_PERMISSIONS,
  };
}

async function loadModules() {
  const controller = await import('../controllers/forecastPackageController.js');
  const packageModel = await import('../models/ForecastPackage.js');
  const projectModel = await import('../models/Project.js');

  return {
    controller,
    ForecastPackage: packageModel.default,
    Project: projectModel.default,
  };
}

const cases = [
  {
    name: 'start review rejects a stale package workflow snapshot',
    handler: 'startForecastPackageReview',
    sourceStatus: 'Submitted',
  },
  {
    name: 'legacy revision rejects a stale package workflow snapshot',
    handler: 'requestForecastPackageRevision',
    sourceStatus: 'Under Review',
    body: { comment: 'Revise the forecast package.' },
  },
  {
    name: 'approve rejects a stale package workflow snapshot',
    handler: 'approveForecastPackage',
    sourceStatus: 'Under Review',
  },
  {
    name: 'reject rejects a stale package workflow snapshot',
    handler: 'rejectForecastPackage',
    sourceStatus: 'Under Review',
    body: { comment: 'Forecast package requires correction.' },
  },
  {
    name: 'publish rejects a stale package workflow snapshot',
    handler: 'publishForecastPackage',
    sourceStatus: 'Approved',
  },
  {
    name: 'archive rejects a stale package workflow snapshot',
    handler: 'archiveForecastPackage',
    sourceStatus: 'Published',
  },
];

for (const scenario of cases) {
  test(scenario.name, async () => {
    const { controller, ForecastPackage, Project } = await loadModules();
    const originalFindById = ForecastPackage.findById;
    const originalUpdateMany = Project.updateMany;
    const { forecastPackage, getGuardedConditions } = createPackage(scenario.sourceStatus);
    let projectUpdateCalls = 0;

    try {
      ForecastPackage.findById = async () => forecastPackage;
      Project.updateMany = async () => {
        projectUpdateCalls += 1;
        return { modifiedCount: 4 };
      };

      await assert.rejects(() => run(controller[scenario.handler], request(scenario.body)), {
        status: 409,
        message:
          'Forecast Package workflow changed while this operation was in progress. Reload and try again.',
      });

      assert.deepEqual(getGuardedConditions(), {
        status: scenario.sourceStatus,
        updatedAt: UPDATED_AT,
      });
      assert.equal(forecastPackage.$where, undefined);

      if (scenario.handler === 'requestForecastPackageRevision') {
        assert.equal(projectUpdateCalls, 0);
      }
    } finally {
      ForecastPackage.findById = originalFindById;
      Project.updateMany = originalUpdateMany;
    }
  });
}
