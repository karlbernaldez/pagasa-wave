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

  const projectOwner = project.owner?._id || project.owner;
  if (String(projectOwner) === String(user.id)) return true;

  return isForecastPackageChartProject(project._id || project.id);
}
