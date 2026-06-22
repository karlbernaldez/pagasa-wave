import test from 'node:test';
import assert from 'node:assert/strict';

const USER_ID = 'user-1';

async function loadModules() {
  const workflow = await import('../utils/' + 'forecast' + 'Package.js');
  const controller = await import('../controllers/' + 'forecast' + 'PackageController.js');
  const packageModel = await import('../models/' + 'Forecast' + 'Package.js');
  const projectModel = await import('../models/Project.js');
  const projectWorkflow = await import('../utils/projectWorkflow.js');
  return {
    workflow,
    controller,
    PackageModel: packageModel.default,
    Project: projectModel.default,
    PROJECT_STATUS: projectWorkflow.PROJECT_STATUS,
  };
}

function createQuery(result) {
  return {
    populate() { return this; },
    lean() { return Promise.resolve(result); },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
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

test('package create action writes one project for each required chart', async () => {
  const modules = await loadModules();
  const { workflow, controller, PackageModel, Project, PROJECT_STATUS } = modules;
  const originalFindOne = PackageModel.findOne;
  const originalPackageCreate = PackageModel.create;
  const originalFindById = PackageModel.findById;
  const originalProjectCreate = Project.create;
  const createdProjects = [];
  let packagePayload;

  try {
    PackageModel.findOne = () => createQuery(null);
    Project.create = async (payload) => {
      const project = { _id: `project-${createdProjects.length + 1}`, ...payload };
      createdProjects.push(project);
      return project;
    };
    PackageModel.create = async (payload) => {
      packagePayload = payload;
      return { _id: 'package-1', ...payload };
    };
    PackageModel.findById = () => createQuery({
      _id: 'package-1',
      status: workflow.FORECAST_PACKAGE_STATUS.DRAFT,
      chartCompletion: packagePayload.chartCompletion,
      toObject() { return this; },
    });

    const res = await run(controller.createForecastPackage, {
      params: {},
      query: {},
      body: { forecastDate: '2026-06-22' },
      user: { id: USER_ID, role: 'forecaster' },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(createdProjects.length, workflow.REQUIRED_FORECAST_CHART_TYPES.length);
    assert.equal(createdProjects[0].status, PROJECT_STATUS.DRAFT);
    assert.deepEqual(
      createdProjects.map((project) => project.chartType),
      workflow.REQUIRED_FORECAST_CHART_TYPES
    );
    assert.deepEqual(
      packagePayload.charts.map((chart) => chart.chartType),
      workflow.REQUIRED_FORECAST_CHART_TYPES
    );
  } finally {
    PackageModel.findOne = originalFindOne;
    PackageModel.create = originalPackageCreate;
    PackageModel.findById = originalFindById;
    Project.create = originalProjectCreate;
  }
});
