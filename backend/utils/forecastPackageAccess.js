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

function hasPermission(permissions, permission) {
  return Array.isArray(permissions) && permissions.includes(permission);
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

export async function canAccessProject(user, project, permissions = []) {
  if (!user || !project) return false;

  if (hasPermission(permissions, 'projects.view_all')) return true;

  const sharedForecastChart = await isForecastPackageChartProject(project._id || project.id);
  if (sharedForecastChart) {
    return (
      hasPermission(permissions, 'projects.view') ||
      hasPermission(permissions, 'projects.edit') ||
      hasPermission(permissions, 'projects.review') ||
      hasPermission(permissions, 'projects.approve') ||
      hasPermission(permissions, 'projects.publish')
    );
  }

  const projectOwner = project.owner?._id || project.owner;
  return (
    String(projectOwner) === String(user.id) &&
    (hasPermission(permissions, 'projects.view_own') || hasPermission(permissions, 'projects.edit'))
  );
}
