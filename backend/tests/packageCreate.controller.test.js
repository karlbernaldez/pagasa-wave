import test from 'node:test';
import assert from 'node:assert/strict';

async function loadModules() {
  const workflow = await import('../utils/' + 'forecast' + 'Package.js');
  const createController = await import('../controllers/forecastPackageCreateController.js');
  const currentController = await import('../controllers/currentForecastPackageController.js');
  const packageModel = await import('../models/' + 'Forecast' + 'Package.js');
  const projectModel = await import('../models/Project.js');
  const projectWorkflow = await import('../utils/projectWorkflow.js');
  return {
    workflow,
    createController,
    currentController,
    PackageModel: packageModel.default,
    Project: projectModel.default,
    PROJECT_STATUS: projectWorkflow.PROJECT_STATUS,
  };
}

function createQuery(result) {
  return {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    lean() {
      return Promise.resolve(result);
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function run(handler, req) {
  return new Promise((resolve, reject) => {
    const res = createResponse();
    res.json = function json(payload) {
      this.body = payload;
      resolve(this);
      return this;
    };
    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

test('package creation produces exactly Wave Analysis, 24h, 36h, and 48h without owners', async () => {
  const modules = await loadModules();
  const { workflow, createController, PackageModel, Project, PROJECT_STATUS } = modules;
  const originalFindOne = PackageModel.findOne;
  const originalPackageCreate = PackageModel.create;
  const originalFindById = PackageModel.findById;
  const originalProjectCreate = Project.create;
  const originalProjectUpdateMany = Project.updateMany;
  const createdProjects = [];
  let packagePayload;
  let linkedProjectUpdate;

  try {
    PackageModel.findOne = () => createQuery(null);
    Project.create = async (payload) => {
      const project = { _id: `project-${createdProjects.length + 1}`, ...payload };
      createdProjects.push(project);
      return project;
    };
    Project.updateMany = async (filter, update) => {
      linkedProjectUpdate = { filter, update };
      return { acknowledged: true, modifiedCount: createdProjects.length };
    };
    PackageModel.create = async (payload) => {
      packagePayload = payload;
      return { _id: 'package-1', ...payload };
    };
    PackageModel.findById = () =>
      createQuery({
        _id: 'package-1',
        name: packagePayload.name,
        forecastDate: packagePayload.forecastDate,
        status: workflow.FORECAST_PACKAGE_STATUS.DRAFT,
        charts: packagePayload.charts.map((chart, index) => ({
          ...chart,
          project: createdProjects[index],
        })),
        chartCompletion: packagePayload.chartCompletion,
        auditLogs: packagePayload.auditLogs,
        toObject() {
          return this;
        },
      });

    const res = await run(createController.createForecastPackage, {
      params: {},
      query: {},
      body: { forecastDate: '2026-06-22' },
      user: { id: 'forecaster-1', role: 'forecaster' },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(createdProjects.length, 4);
    assert.deepEqual(
      createdProjects.map((project) => project.chartType),
      workflow.REQUIRED_FORECAST_CHART_TYPES
    );
    assert.deepEqual(
      createdProjects.map((project) => project.name.split(' - ').at(-1)),
      ['Wave Analysis', '24h', '36h', '48h']
    );
    assert.ok(createdProjects.every((project) => project.status === PROJECT_STATUS.DRAFT));
    assert.ok(createdProjects.every((project) => project.owner === undefined));
    assert.ok(createdProjects.every((project) => project.auditLogs.length === 0));

    assert.equal(packagePayload.owner, undefined);
    assert.equal(packagePayload.createdBy, undefined);
    assert.deepEqual(packagePayload.auditLogs, []);
    assert.deepEqual(
      packagePayload.charts.map((chart) => chart.chartType),
      workflow.REQUIRED_FORECAST_CHART_TYPES
    );
    assert.equal(linkedProjectUpdate.update.$set.forecastPackage, 'package-1');
  } finally {
    PackageModel.findOne = originalFindOne;
    PackageModel.create = originalPackageCreate;
    PackageModel.findById = originalFindById;
    Project.create = originalProjectCreate;
    Project.updateMany = originalProjectUpdateMany;
  }
});

test('current package lookup is shared and does not filter by forecaster identity', async () => {
  const { workflow, currentController, PackageModel } = await loadModules();
  const originalFindOne = PackageModel.findOne;
  const pkg = {
    _id: 'package-1',
    name: 'Forecast Package - 2026-06-22',
    status: workflow.FORECAST_PACKAGE_STATUS.DRAFT,
    forecastDate: new Date('2026-06-22T00:00:00.000Z'),
    charts: [],
    chartCompletion: [],
    auditLogs: [],
    toObject() {
      return this;
    },
  };
  let lookupQuery;

  try {
    PackageModel.findOne = (query) => {
      lookupQuery = query;
      return createQuery(pkg);
    };

    const res = await run(currentController.getCurrentForecastPackage, {
      params: {},
      query: { forecastDate: '2026-06-22' },
      body: {},
      user: { id: 'different-forecaster', role: 'forecaster' },
    });

    assert.equal(res.body._id, 'package-1');
    assert.deepEqual(Object.keys(lookupQuery), ['forecastDate']);
    assert.equal(lookupQuery.owner, undefined);
  } finally {
    PackageModel.findOne = originalFindOne;
  }
});
