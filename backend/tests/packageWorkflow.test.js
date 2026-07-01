import test from 'node:test';
import assert from 'node:assert/strict';

async function loadWorkflow() {
  const modulePath = '../utils/' + 'forecast' + 'Package.js';
  return import(modulePath);
}

function createChart(chartType, status) {
  return {
    chartType,
    project: { status },
  };
}

function createPackage(chartStatuses, overrides = {}) {
  const charts = [
    createChart('analysis', chartStatuses.analysis),
    createChart('forecast_24h', chartStatuses.forecast_24h),
    createChart('forecast_36h', chartStatuses.forecast_36h),
    createChart('forecast_48h', chartStatuses.forecast_48h),
  ].filter((chart) => chart.project.status !== undefined);

  return { charts, ...overrides };
}

test('package workflow has four required charts', async () => {
  const workflow = await loadWorkflow();
  assert.equal(workflow.REQUIRED_FORECAST_CHART_TYPES.length, 4);
});

test('package workflow has matching required chart metadata', async () => {
  const workflow = await loadWorkflow();
  assert.equal(workflow.REQUIRED_FORECAST_CHARTS.length, workflow.REQUIRED_FORECAST_CHART_TYPES.length);
});

test('package name uses the normalized local forecast date instead of a UTC date slice', async () => {
  const workflow = await loadWorkflow();
  const forecastDate = workflow.normalizeForecastDate('2026-06-22T09:30:00+08:00');
  const expectedDateKey = workflow.formatLocalDateKey(forecastDate);

  assert.equal(workflow.buildForecastPackageName(forecastDate), `Marine Forecast ${expectedDateKey}`);
});

test('package status becomes Published only when all required chart projects are published', async () => {
  const workflow = await loadWorkflow();

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Published',
      forecast_24h: 'Published',
      forecast_36h: 'Published',
      forecast_48h: 'Published',
    })),
    workflow.FORECAST_PACKAGE_STATUS.PUBLISHED
  );
});

test('package status becomes Approved when all required chart projects are approved or published', async () => {
  const workflow = await loadWorkflow();

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Published',
      forecast_36h: 'Approved',
      forecast_48h: 'Approved',
    })),
    workflow.FORECAST_PACKAGE_STATUS.APPROVED
  );
});

test('package status follows review precedence for rejected, revision, review, and submitted chart projects', async () => {
  const workflow = await loadWorkflow();

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Rejected',
      forecast_24h: 'Revision Requested',
      forecast_36h: 'Under Review',
      forecast_48h: 'Submitted',
    })),
    workflow.FORECAST_PACKAGE_STATUS.REJECTED
  );

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Revision Requested',
      forecast_36h: 'Under Review',
      forecast_48h: 'Submitted',
    })),
    workflow.FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
  );

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Approved',
      forecast_36h: 'Under Review',
      forecast_48h: 'Submitted',
    })),
    workflow.FORECAST_PACKAGE_STATUS.UNDER_REVIEW
  );

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Approved',
      forecast_36h: 'Approved',
      forecast_48h: 'Submitted',
    })),
    workflow.FORECAST_PACKAGE_STATUS.SUBMITTED
  );
});

test('package status falls back to Draft when any required chart project is missing or still draft', async () => {
  const workflow = await loadWorkflow();

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Approved',
      forecast_36h: 'Approved',
      forecast_48h: undefined,
    })),
    workflow.FORECAST_PACKAGE_STATUS.DRAFT
  );

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage({
      analysis: 'Approved',
      forecast_24h: 'Approved',
      forecast_36h: 'Approved',
      forecast_48h: 'Draft',
    })),
    workflow.FORECAST_PACKAGE_STATUS.DRAFT
  );
});

test('archived package status is preserved regardless of chart project statuses', async () => {
  const workflow = await loadWorkflow();

  assert.equal(
    workflow.deriveForecastPackageStatusFromCharts(createPackage(
      {
        analysis: 'Rejected',
        forecast_24h: 'Revision Requested',
        forecast_36h: 'Under Review',
        forecast_48h: 'Submitted',
      },
      { status: workflow.FORECAST_PACKAGE_STATUS.ARCHIVED }
    )),
    workflow.FORECAST_PACKAGE_STATUS.ARCHIVED
  );
});
