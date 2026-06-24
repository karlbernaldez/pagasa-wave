import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHARTS,
  buildForecastChartProjectName,
  buildForecastPackageName,
  getPackageCompletion,
  normalizeForecastDate,
} from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function assertAuthenticated(req) {
  if (!req.user) throwError('Unauthorized', 401);
}

function getForecastDateQuery(value) {
  const start = normalizeForecastDate(value || new Date());
  if (!start) return null;
  return { $gte: start, $lt: new Date(start.getTime() + ONE_DAY_MS) };
}

function serializePackage(forecastPackage) {
  const plain = typeof forecastPackage.toObject === 'function'
    ? forecastPackage.toObject()
    : forecastPackage;

  return {
    ...plain,
    completion: getPackageCompletion(plain.chartCompletion || []),
  };
}

function populateForecastPackage(query) {
  return query
    .populate('owner', 'firstName lastName email username')
    .populate('charts.project')
    .populate('charts.activeEditors.user', 'firstName lastName email username')
    .populate('charts.claimedBy', 'firstName lastName email username')
    .populate('charts.readyBy', 'firstName lastName email username')
    .populate('chartCompletion.completedBy', 'firstName lastName email username')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');
}

async function findPackageForDate(forecastDate) {
  return populateForecastPackage(
    ForecastPackage.findOne({ forecastDate: getForecastDateQuery(forecastDate) })
  );
}

async function createDailyForecastPackage({ forecastDate, user }) {
  const name = buildForecastPackageName(forecastDate);
  if (!name) throwError('forecastDate must be a valid date', 400);

  const createdProjectIds = [];

  try {
    const charts = [];

    for (const requiredChart of REQUIRED_FORECAST_CHARTS) {
      const project = await Project.create({
        name: buildForecastChartProjectName(forecastDate, requiredChart.label),
        description: 'Automatically created for daily operational forecast production.',
        chartType: requiredChart.chartType,
        forecastDate,
        owner: user.id,
        status: PROJECT_STATUS.DRAFT,
        version: 1,
        auditLogs: [
          {
            action: 'created',
            performedBy: user.id,
            previousStatus: null,
            newStatus: PROJECT_STATUS.DRAFT,
            comment: `Auto-created from daily Forecast Package: ${name}`,
          },
        ],
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
      owner: user.id,
      status: FORECAST_PACKAGE_STATUS.DRAFT,
      charts,
      chartCompletion,
      auditLogs: [
        {
          action: 'created',
          performedBy: user.id,
          previousStatus: null,
          newStatus: FORECAST_PACKAGE_STATUS.DRAFT,
          comment: 'Daily Forecast Package auto-created with required charts',
        },
      ],
    });

    return populateForecastPackage(ForecastPackage.findById(forecastPackage._id));
  } catch (error) {
    await Project.deleteMany({ _id: { $in: createdProjectIds } }).catch((cleanupError) => {
      console.error('[ForecastPackage] Failed to cleanup auto-created chart projects:', cleanupError);
    });

    if (error?.code === 11000) {
      const existing = await findPackageForDate(forecastDate);
      if (existing) return existing;
    }

    throw error;
  }
}

export const getCurrentForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const requestedDate = req.query?.forecastDate
    ? normalizeForecastDate(req.query.forecastDate)
    : normalizeForecastDate(new Date());

  if (!requestedDate) throwError('forecastDate must be a valid date', 400);

  const existingPackage = await findPackageForDate(requestedDate);
  const forecastPackage = existingPackage || await createDailyForecastPackage({
    forecastDate: requestedDate,
    user: req.user,
  });

  res.json({
    package: serializePackage(forecastPackage),
    autoCreated: !existingPackage,
  });
});
