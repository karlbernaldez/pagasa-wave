import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHARTS,
  buildForecastPackageName,
  getPackageCompletion,
  normalizeForecastDate,
} from '../utils/forecastPackage.js';
import { applyForecastPackageDisplayNames } from '../utils/forecastPackageDisplayNames.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getForecastDateQuery(value) {
  const start = normalizeForecastDate(value);
  if (!start) return null;
  return { $gte: start, $lt: new Date(start.getTime() + ONE_DAY_MS) };
}

function serializePackage(forecastPackage) {
  const plain =
    typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage;
  const displayPackage = applyForecastPackageDisplayNames(plain);
  return {
    ...displayPackage,
    completion: getPackageCompletion(displayPackage.chartCompletion || []),
  };
}

function populatePackage(query) {
  return query
    .populate('charts.project')
    .populate('charts.activeEditors.user', 'firstName lastName email username')
    .populate('charts.participants.user', 'firstName lastName email username')
    .populate('charts.readyEditors.user', 'firstName lastName email username')
    .populate('charts.claimedBy', 'firstName lastName email username')
    .populate('charts.readyBy', 'firstName lastName email username')
    .populate('chartCompletion.completedBy', 'firstName lastName email username')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');
}

async function cleanupCreatedProjects(projectIds) {
  if (!projectIds.length) return;
  try {
    await Project.deleteMany({ _id: { $in: projectIds } });
  } catch (error) {
    console.error('[ForecastPackage] Failed to cleanup partially-created chart projects:', error);
  }
}

export const createForecastPackage = asyncHandler(async (req, res) => {
  const forecastDate = normalizeForecastDate(req.body?.forecastDate || new Date());
  if (!forecastDate) throwError('forecastDate must be a valid date', 400);

  const defaultName = buildForecastPackageName(forecastDate);
  const name = String(req.body?.name || defaultName || '').trim();
  if (!name) throwError('name is required', 400);

  const existingPackage = await ForecastPackage.findOne({
    forecastDate: getForecastDateQuery(forecastDate),
  }).lean();
  if (existingPackage) {
    throwError('A Forecast Package already exists for this forecast date', 409);
  }

  const createdProjectIds = [];

  try {
    const charts = [];
    for (const requiredChart of REQUIRED_FORECAST_CHARTS) {
      const project = await Project.create({
        name: `${name} - ${requiredChart.label}`,
        description: String(req.body?.description || '').trim(),
        chartType: requiredChart.chartType,
        forecastDate,
        status: PROJECT_STATUS.DRAFT,
        version: 1,
        auditLogs: [],
      });

      createdProjectIds.push(project._id);
      charts.push({
        chartType: requiredChart.chartType,
        project: project._id,
        sortOrder: requiredChart.sortOrder,
        activeEditors: [],
        participants: [],
        readyEditors: [],
      });
    }

    const chartCompletion = REQUIRED_FORECAST_CHARTS.map((requiredChart) => ({
      chartType: requiredChart.chartType,
      isComplete: false,
      completedAt: null,
      completedBy: null,
    }));

    const forecastPackage = await ForecastPackage.create({
      name,
      forecastDate,
      status: FORECAST_PACKAGE_STATUS.DRAFT,
      charts,
      chartCompletion,
      auditLogs: [],
    });

    await Project.updateMany(
      { _id: { $in: createdProjectIds } },
      { $set: { forecastPackage: forecastPackage._id } }
    );

    const populated = await populatePackage(ForecastPackage.findById(forecastPackage._id));
    return res.status(201).json(serializePackage(populated));
  } catch (error) {
    await cleanupCreatedProjects(createdProjectIds);
    if (error?.code === 11000) {
      throwError('A Forecast Package already exists for this date', 409);
    }
    throw error;
  }
});
