import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  getForecastChartLabel,
  getPackageCompletion,
} from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const EDITABLE_PACKAGE_STATUSES = [
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
];

const SUBMIT_PARTICIPATION_AUDIT_ACTIONS = new Set([
  'chart_claimed',
  'chart_released',
  'chart_completion_updated',
]);

function assertAuthenticated(req) {
  if (!req.user) throwError('Unauthorized', 401);
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
  const plain = typeof forecastPackage.toObject === 'function'
    ? forecastPackage.toObject()
    : forecastPackage;

  return {
    ...plain,
    completion: getPackageCompletion(plain.chartCompletion || []),
  };
}

async function populateForecastPackageById(id) {
  return ForecastPackage.findById(id)
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

function hasPackageSubmitParticipation(user, forecastPackage) {
  const userId = user?.id;
  if (!userId) return false;

  if (isSameId(forecastPackage.owner, userId)) return true;

  const charts = Array.isArray(forecastPackage.charts) ? forecastPackage.charts : [];
  if (charts.some((chart) => (
    getActiveEditors(chart).some((editor) => isSameId(editor.user, userId))
    || isSameId(chart.claimedBy, userId)
    || isSameId(chart.readyBy, userId)
  ))) {
    return true;
  }

  const chartCompletion = Array.isArray(forecastPackage.chartCompletion) ? forecastPackage.chartCompletion : [];
  if (chartCompletion.some((row) => isSameId(row.completedBy, userId))) {
    return true;
  }

  const auditLogs = Array.isArray(forecastPackage.auditLogs) ? forecastPackage.auditLogs : [];
  return auditLogs.some((log) => (
    SUBMIT_PARTICIPATION_AUDIT_ACTIONS.has(log?.action)
    && isSameId(log?.performedBy, userId)
  ));
}

function canUserSubmitPackage(user, forecastPackage) {
  if (!user?.id || user.role === 'admin') return false;
  return hasPackageSubmitParticipation(user, forecastPackage);
}

async function lockLinkedChartProjects(forecastPackage, userId, previousStatus) {
  const projectIds = getLinkedProjectIds(forecastPackage);
  if (!projectIds.length) return;

  await Project.updateMany(
    {
      _id: { $in: projectIds },
      status: { $in: [PROJECT_STATUS.DRAFT, PROJECT_STATUS.REVISION_REQUESTED, PROJECT_STATUS.REJECTED] },
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
          previousStatus: previousStatus === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
            ? PROJECT_STATUS.REVISION_REQUESTED
            : PROJECT_STATUS.DRAFT,
          newStatus: PROJECT_STATUS.SUBMITTED,
          comment: previousStatus === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
            ? 'Revision resubmitted as part of Forecast Package submission'
            : 'Submitted as part of Forecast Package submission',
        },
      },
    }
  );
}

export const submitForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (!canUserSubmitPackage(req.user, forecastPackage)) {
    throwError('Only the package owner or a participating forecaster can submit this package', 403);
  }

  if (!canSubmitPackage(forecastPackage.status)) {
    throwError(`Package cannot be submitted while it is ${forecastPackage.status}`, 403);
  }

  const completion = getPackageCompletion(forecastPackage.chartCompletion || []);
  if (!completion.isComplete) {
    throwError('All required charts must be marked complete before submitting', 400);
  }

  const activeEditingChart = getActiveEditingChartLabel(forecastPackage);
  if (activeEditingChart) {
    throwError(`${activeEditingChart} still has active editors. Release the chart before submitting`, 409);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.SUBMITTED;
  forecastPackage.submittedAt = new Date();
  forecastPackage.auditLogs.push({
    action: 'submitted',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.SUBMITTED,
    comment: 'Forecast Package submitted for admin review',
  });

  await forecastPackage.save();
  await lockLinkedChartProjects(forecastPackage, req.user.id, previousStatus);

  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});
