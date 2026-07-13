import mongoose from 'mongoose';

import ForecastPackage from '../models/ForecastPackage.js';

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
