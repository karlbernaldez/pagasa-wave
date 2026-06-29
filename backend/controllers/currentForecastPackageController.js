import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHARTS,
  buildForecastChartProjectName,
  buildForecastPackageName,
  deriveForecastPackageStatusFromCharts,
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

async function syncPackageStatusFromCharts(forecastPackage, userId) {
  const nextStatus = deriveForecastPackageStatusFromCharts(forecastPackage);
  if (!nextStatus || nextStatus === forecastPackage?.status) return forecastPackage;

  const update = {
    $set: { status: nextStatus },
    $push: {
      auditLogs: {
        action: nextStatus === FORECAST_PACKAGE_STATUS.APPROVED ? 'approved' : 'chart_completion_updated',
        performedBy: userId,
        previousStatus: forecastPackage.status,
        newStatus: nextStatus,
        comment: 'Forecast Package status synced from chart project statuses',
      },
    },
  };

  if (nextStatus === FORECAST_PACKAGE_STATUS.UNDER_REVIEW && !forecastPackage.reviewStartedAt) {
    update.$set.reviewStartedAt = new Date();
    update.$set.reviewStartedBy = userId;
  }

  if (nextStatus === FORECAST_PACKAGE_STATUS.APPROVED) {
    update.$set.reviewedAt = new Date();
    update.$set.approvedBy = userId;
  }

  const updatedPackage = await ForecastPackage.findByIdAndUpdate(forecastPackage._id, update, { new: true });
  return populateForecastPackage(ForecastPackage.findById(updatedPackage?._id || forecastPackage._id));
}

async function ensureDailyChartProject({ forecastDate, user, requiredChart, packageName }) {
  const name = buildForecastChartProjectName(forecastDate, requiredChart.label);
  const query = {
    owner: user.id,
    chartType: requiredChart.chartType,
    forecastDate: getForecastDateQuery(forecastDate),
  };

  const existing = await Project.findOne(query).sort({ updatedAt: -1 });
  if (existing) {
    const patch = {};
    if (existing.name !== name) patch.name = name;
    if (!existing.status) patch.status = PROJECT_STATUS.DRAFT;
    if (Object.keys(patch).length) {
      await Project.updateOne({ _id: existing._id }, { $set: patch });
      Object.assign(existing, patch);
    }
    return existing;
  }

  try {
    return await Project.create({
      name,
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
          comment: `Auto-created from daily Forecast Package: ${packageName}`,
        },
      ],
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;

    const conflictingProject = await Project.findOne({ owner: user.id, name });
    if (!conflictingProject) throw error;

    await Project.updateOne(
      { _id: conflictingProject._id },
      {
        $set: {
          chartType: requiredChart.chartType,
          forecastDate,
          status: conflictingProject.status || PROJECT_STATUS.DRAFT,
        },
      }
    );

    conflictingProject.chartType = requiredChart.chartType;
    conflictingProject.forecastDate = forecastDate;
    if (!conflictingProject.status) conflictingProject.status = PROJECT_STATUS.DRAFT;
    return conflictingProject;
  }
}

async function createDailyForecastPackage({ forecastDate, user }) {
  const name = buildForecastPackageName(forecastDate);
  if (!name) throwError('forecastDate must be a valid date', 400);

  const charts = [];

  for (const requiredChart of REQUIRED_FORECAST_CHARTS) {
    const project = await ensureDailyChartProject({ forecastDate, user, requiredChart, packageName: name });
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

  try {
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
  const syncedPackage = await syncPackageStatusFromCharts(forecastPackage, req.user.id);

  res.json({
    package: serializePackage(syncedPackage),
    autoCreated: !existingPackage,
  });
});
