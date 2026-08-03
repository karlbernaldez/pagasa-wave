import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHART_TYPES,
  getForecastChartLabel,
  getPackageCompletion,
} from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const REVISION_SOURCE_STATUSES = new Set([
  FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
  FORECAST_PACKAGE_STATUS.REJECTED,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
]);

function getId(value) {
  return String(value?._id || value || '');
}

function getRequiredComment(value) {
  const comment = String(value || '').trim();
  if (!comment) throwError('Revision comment is required', 400);
  if (comment.length > 1000) throwError('Revision comment must be 1000 characters or less', 400);
  return comment;
}

function getRequestedChartTypes(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throwError('At least one affected chart type is required', 400);
  }

  const chartTypes = [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  const invalidChartTypes = chartTypes.filter(
    (chartType) => !REQUIRED_FORECAST_CHART_TYPES.includes(chartType)
  );

  if (invalidChartTypes.length) {
    throwError(`Unsupported forecast chart type: ${invalidChartTypes.join(', ')}`, 400);
  }

  return chartTypes;
}

function resetAffectedCharts(forecastPackage, affectedChartTypes) {
  const affected = new Set(affectedChartTypes);

  forecastPackage.chartCompletion?.forEach((row) => {
    if (!affected.has(row.chartType)) return;
    row.isComplete = false;
    row.completedAt = null;
    row.completedBy = null;
  });

  forecastPackage.charts?.forEach((chart) => {
    if (!affected.has(chart.chartType)) return;
    chart.readyAt = null;
    chart.readyBy = null;
    chart.readyEditors = [];
    chart.activeEditors = [];
    chart.claimedBy = null;
    chart.claimedAt = null;
  });
}

function restoreUnaffectedSubmittedCharts(forecastPackage, affectedChartTypes, projectsById) {
  const affected = new Set(affectedChartTypes);
  const completionByType = new Map(
    (forecastPackage.chartCompletion || []).map((row) => [row.chartType, row])
  );

  for (const chart of forecastPackage.charts || []) {
    if (affected.has(chart.chartType)) continue;

    const project = projectsById.get(getId(chart.project));
    const completion = completionByType.get(chart.chartType);
    if (
      !project ||
      project.status !== PROJECT_STATUS.SUBMITTED ||
      !completion ||
      completion.isComplete
    )
      continue;

    const restoredAt = project.submittedAt || forecastPackage.submittedAt || new Date();
    const restoredBy = chart.readyBy || project.owner || forecastPackage.owner;

    completion.isComplete = true;
    completion.completedAt = restoredAt;
    completion.completedBy = restoredBy;
    chart.readyAt = restoredAt;
    chart.readyBy = restoredBy;
    chart.readyEditors = [];
    chart.activeEditors = [];
    chart.claimedBy = null;
    chart.claimedAt = null;
  }
}

function serializePackage(forecastPackage) {
  const plain =
    typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage;

  return {
    ...plain,
    completion: getPackageCompletion(plain.chartCompletion || []),
  };
}

function populateForecastPackage(id) {
  return ForecastPackage.findById(id)
    .populate('owner', 'firstName lastName email username')
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

export const requestTargetedForecastPackageRevision = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  if (req.user.role !== 'admin') throwError('Admin access required', 403);

  const comment = getRequiredComment(req.body?.comment);
  const affectedChartTypes = getRequestedChartTypes(req.body?.chartTypes);
  const forecastPackage = await ForecastPackage.findById(req.params.id);

  if (!forecastPackage) throwError('Forecast Package not found', 404);
  if (!REVISION_SOURCE_STATUSES.has(forecastPackage.status)) {
    throwError(
      'Only packages under review, rejected, or already in revision can request chart revisions',
      403
    );
  }

  const packageChartTypes = new Set((forecastPackage.charts || []).map((chart) => chart.chartType));
  const missingChartTypes = affectedChartTypes.filter(
    (chartType) => !packageChartTypes.has(chartType)
  );
  if (missingChartTypes.length) {
    throwError(
      `Forecast Package does not contain: ${missingChartTypes.map(getForecastChartLabel).join(', ')}`,
      400
    );
  }

  const projectIds = (forecastPackage.charts || []).map((chart) => chart.project).filter(Boolean);
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('_id owner status submittedAt')
    .lean();
  const projectsById = new Map(projects.map((project) => [getId(project), project]));
  const affectedProjectIds = (forecastPackage.charts || [])
    .filter((chart) => affectedChartTypes.includes(chart.chartType))
    .map((chart) => chart.project)
    .filter(Boolean);

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  forecastPackage.reviewedAt = new Date();
  forecastPackage.rejectedBy = req.user.id;
  forecastPackage.reviewComment = comment;

  restoreUnaffectedSubmittedCharts(forecastPackage, affectedChartTypes, projectsById);
  resetAffectedCharts(forecastPackage, affectedChartTypes);

  forecastPackage.auditLogs.push({
    action: 'revision_requested',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
    comment: `${comment} Affected charts: ${affectedChartTypes.map(getForecastChartLabel).join(', ')}.`,
  });

  await forecastPackage.save();

  await Project.updateMany(
    {
      _id: { $in: affectedProjectIds },
      status: {
        $in: [
          PROJECT_STATUS.SUBMITTED,
          PROJECT_STATUS.UNDER_REVIEW,
          PROJECT_STATUS.REVISION_REQUESTED,
        ],
      },
    },
    {
      $set: {
        status: PROJECT_STATUS.REVISION_REQUESTED,
        reviewedAt: new Date(),
        reviewComment: comment,
      },
      $push: {
        auditLogs: {
          action: 'revision_requested',
          performedBy: req.user.id,
          previousStatus: PROJECT_STATUS.SUBMITTED,
          newStatus: PROJECT_STATUS.REVISION_REQUESTED,
          comment,
        },
      },
    }
  );

  const populated = await populateForecastPackage(forecastPackage._id);
  res.json({
    ...serializePackage(populated),
    affectedChartTypes,
  });
});
