import mongoose from 'mongoose';

import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  getForecastChartLabel,
  getPackageCompletion,
} from '../utils/forecastPackage.js';
import { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const EDITABLE_PACKAGE_STATUSES = [
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
];

function assertSubmitPermission(req) {
  if (!req.user) throwError('Unauthorized', 401);
  if (!(req.permissions || []).includes('projects.submit')) {
    throwError('You do not have permission to submit Forecast Packages.', 403);
  }
}

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function canSubmitPackage(status) {
  return EDITABLE_PACKAGE_STATUSES.includes(status);
}

function getActiveEditors(chart = {}) {
  const activeEditors = Array.isArray(chart.activeEditors) ? chart.activeEditors : [];
  const normalized = [...activeEditors];

  if (chart.claimedBy && !normalized.some((editor) => isSameId(editor.user, chart.claimedBy))) {
    normalized.push({ user: chart.claimedBy, startedAt: chart.claimedAt || null });
  }

  return normalized;
}

function getActiveEditingChartLabel(forecastPackage) {
  const chart = forecastPackage.charts?.find((item) => getActiveEditors(item).length > 0);
  return chart ? getForecastChartLabel(chart.chartType) : null;
}

function getLinkedProjectIds(forecastPackage) {
  return (forecastPackage.charts || [])
    .map((chart) => chart.project?._id || chart.project)
    .filter(Boolean);
}

function serializePackage(forecastPackage) {
  const plain =
    typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage;

  return {
    ...plain,
    completion: getPackageCompletion(plain.chartCompletion || []),
  };
}

async function populateForecastPackageById(id) {
  return ForecastPackage.findById(id)
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

async function lockLinkedChartProjects(forecastPackage, userId, previousStatus, session) {
  const projectIds = getLinkedProjectIds(forecastPackage);
  if (!projectIds.length) return;

  await Project.updateMany(
    {
      _id: { $in: projectIds },
      status: {
        $in: [PROJECT_STATUS.DRAFT, PROJECT_STATUS.REVISION_REQUESTED, PROJECT_STATUS.REJECTED],
      },
    },
    {
      $set: {
        status: PROJECT_STATUS.SUBMITTED,
        submittedAt: new Date(),
      },
      $push: {
        auditLogs: {
          action: 'submitted',
          performedBy: userId,
          previousStatus:
            previousStatus === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
              ? PROJECT_STATUS.REVISION_REQUESTED
              : PROJECT_STATUS.DRAFT,
          newStatus: PROJECT_STATUS.SUBMITTED,
          comment:
            previousStatus === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
              ? 'Revision resubmitted as part of Forecast Package submission'
              : 'Submitted as part of Forecast Package submission',
        },
      },
    },
    { session }
  );
}

export const submitForecastPackage = asyncHandler(async (req, res) => {
  assertSubmitPermission(req);

  const session = await mongoose.startSession();
  let packageId = null;

  try {
    await session.withTransaction(async () => {
      const forecastPackage = await ForecastPackage.findById(req.params.id, null, { session });
      if (!forecastPackage) throwError('Forecast Package not found', 404);

      if (!canSubmitPackage(forecastPackage.status)) {
        throwError(`Package cannot be submitted while it is ${forecastPackage.status}`, 403);
      }

      const completion = getPackageCompletion(forecastPackage.chartCompletion || []);
      if (!completion.isComplete) {
        throwError('All required charts must be marked complete before submitting', 400);
      }

      const activeEditingChart = getActiveEditingChartLabel(forecastPackage);
      if (activeEditingChart) {
        throwError(
          `${activeEditingChart} still has active editors. Release the chart before submitting`,
          409
        );
      }

      const previousStatus = forecastPackage.status;
      const expectedUpdatedAt = forecastPackage.updatedAt;
      forecastPackage.status = FORECAST_PACKAGE_STATUS.SUBMITTED;
      forecastPackage.submittedAt = new Date();
      forecastPackage.auditLogs.push({
        action: 'submitted',
        performedBy: req.user.id,
        previousStatus,
        newStatus: FORECAST_PACKAGE_STATUS.SUBMITTED,
        comment: 'Forecast Package submitted for review',
      });

      await saveForecastPackageSnapshot(forecastPackage, {
        session,
        expectedStatus: previousStatus,
        expectedUpdatedAt,
        conflictMessage:
          'Forecast Package changed while submission was in progress. Reload and submit again.',
      });
      await lockLinkedChartProjects(forecastPackage, req.user.id, previousStatus, session);
      packageId = forecastPackage._id;
    });
  } finally {
    await session.endSession();
  }

  const populated = await populateForecastPackageById(packageId);
  res.json(serializePackage(populated));
});
