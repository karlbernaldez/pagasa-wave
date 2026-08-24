import mongoose from 'mongoose';

import ForecastPackage from '../models/ForecastPackage.js';
import { throwError } from './errorHelper.js';
import { FORECAST_PACKAGE_STATUS, getForecastChartLabel } from './forecastPackage.js';

const EDITABLE_PACKAGE_STATUSES = new Set([
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
]);

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function getChartByProjectId(forecastPackage, projectId) {
  return forecastPackage?.charts?.find((chart) => isSameId(chart.project, projectId));
}

function getCompletionRow(forecastPackage, chartType) {
  return forecastPackage?.chartCompletion?.find((row) => row.chartType === chartType);
}

export async function getForecastPackageChartAccess(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return null;

  const forecastPackage = await ForecastPackage.findOne({ 'charts.project': projectId });
  if (!forecastPackage) return null;

  const chart = getChartByProjectId(forecastPackage, projectId);
  if (!chart) return null;

  return {
    forecastPackage,
    chart,
    completion: getCompletionRow(forecastPackage, chart.chartType) || null,
  };
}

export async function assertForecastPackageChartMutationAllowed(projectId) {
  const access = await getForecastPackageChartAccess(projectId);
  if (!access) return;

  const { forecastPackage, chart, completion } = access;
  if (!EDITABLE_PACKAGE_STATUSES.has(forecastPackage.status)) {
    throwError('Forecast chart annotations are view only after the package leaves editing.', 403);
  }

  if (completion?.isComplete) {
    throwError(
      `${getForecastChartLabel(chart.chartType)} is certified ready and view only. Reopen the chart before editing annotations.`,
      403
    );
  }
}

export async function isForecastPackageChartProject(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return false;

  const forecastPackage = await ForecastPackage.exists({ 'charts.project': projectId });
  return Boolean(forecastPackage);
}

export async function canAccessProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;

  const sharedForecastChart = await isForecastPackageChartProject(project._id || project.id);
  if (sharedForecastChart) {
    // Forecast-package charts are shared operational workspaces. Every authenticated
    // forecaster may collaborate, but ordinary user accounts must not retain access
    // even if they originally owned a project before it entered the package.
    return user.role === 'forecaster';
  }

  const projectOwner = project.owner?._id || project.owner;
  return String(projectOwner) === String(user.id);
}
