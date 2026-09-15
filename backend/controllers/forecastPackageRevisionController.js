import mongoose from 'mongoose';

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
import { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const REVISION_SOURCE_STATUSES = new Set([
  FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
  FORECAST_PACKAGE_STATUS.REJECTED,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
]);

const REVISION_PROJECT_STATUSES = new Set([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
  PROJECT_STATUS.REVISION_REQUESTED,
]);

function getId(value) {
  return String(value?._id || value || '');
}

function assertReviewPermission(req) {
  if (!req.user) throwError('Unauthorized', 401);
  if (!new Set(req.permissions || []).has('projects.review')) {
    throwError('You do not have permission to perform this action.', 403);
  }
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
    ) {
      continue;
    }

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

function cloneRevisionSnapshot(forecastPackage) {
  return {
    status: forecastPackage.status,
    reviewedAt: forecastPackage.reviewedAt,
    rejectedBy: forecastPackage.rejectedBy,
    reviewComment: forecastPackage.reviewComment,
    charts: forecastPackage.charts.map((chart) => chart.toObject?.() || structuredClone(chart)),
    chartCompletion: forecastPackage.chartCompletion.map(
      (row) => row.toObject?.() || structuredClone(row)
    ),
    auditLogLength: forecastPackage.auditLogs.length,
  };
}

function restoreRevisionSnapshot(forecastPackage, snapshot) {
  forecastPackage.status = snapshot.status;
  forecastPackage.reviewedAt = snapshot.reviewedAt;
  forecastPackage.rejectedBy = snapshot.rejectedBy;
  forecastPackage.reviewComment = snapshot.reviewComment;
  forecastPackage.charts = snapshot.charts;
  forecastPackage.chartCompletion = snapshot.chartCompletion;
  forecastPackage.auditLogs.splice(snapshot.auditLogLength);
}

function buildProjectRevisionOperations(projects, affectedProjectIds, userId, comment, reviewedAt) {
  const affected = new Set(affectedProjectIds.map(getId));

  return projects
    .filter(
      (project) => affected.has(getId(project)) && REVISION_PROJECT_STATUSES.has(project.status)
    )
    .map((project) => ({
      updateOne: {
        filter: { _id: project._id, status: project.status },
        update: {
          $set: {
            status: PROJECT_STATUS.REVISION_REQUESTED,
            reviewedAt,
            reviewComment: comment,
          },
          $push: {
            auditLogs: {
              action: 'revision_requested',
              performedBy: userId,
              previousStatus: project.status,
              newStatus: PROJECT_STATUS.REVISION_REQUESTED,
              comment,
            },
          },
        },
      },
    }));
}

async function loadRevisionState(packageId, session = null) {
  let packageQuery = ForecastPackage.findById(packageId);
  if (session) packageQuery = packageQuery.session(session);
  const forecastPackage = await packageQuery;

  if (!forecastPackage) throwError('Forecast Package not found', 404);
  if (!REVISION_SOURCE_STATUSES.has(forecastPackage.status)) {
    throwError(
      'Only packages under review, rejected, or already in revision can request chart revisions',
      403
    );
  }

  const projectIds = (forecastPackage.charts || []).map((chart) => chart.project).filter(Boolean);
  let projectQuery = Project.find({ _id: { $in: projectIds } })
    .select('_id owner status submittedAt reviewedAt reviewComment')
    .lean();
  if (session) projectQuery = projectQuery.session(session);
  const projects = await projectQuery;

  return { forecastPackage, projects };
}

async function applyTargetedRevision({
  packageId,
  affectedChartTypes,
  comment,
  userId,
  session = null,
  compensateOnFailure = false,
}) {
  const { forecastPackage, projects } = await loadRevisionState(packageId, session);
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

  const projectsById = new Map(projects.map((project) => [getId(project), project]));
  const affectedProjectIds = (forecastPackage.charts || [])
    .filter((chart) => affectedChartTypes.includes(chart.chartType))
    .map((chart) => chart.project)
    .filter(Boolean);
  const reviewedAt = new Date();
  const previousStatus = forecastPackage.status;
  const expectedUpdatedAt = forecastPackage.updatedAt;
  const snapshot = compensateOnFailure ? cloneRevisionSnapshot(forecastPackage) : null;

  forecastPackage.status = FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  forecastPackage.reviewedAt = reviewedAt;
  forecastPackage.rejectedBy = userId;
  forecastPackage.reviewComment = comment;

  restoreUnaffectedSubmittedCharts(forecastPackage, affectedChartTypes, projectsById);
  resetAffectedCharts(forecastPackage, affectedChartTypes);

  forecastPackage.auditLogs.push({
    action: 'revision_requested',
    performedBy: userId,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
    comment: `${comment} Affected charts: ${affectedChartTypes.map(getForecastChartLabel).join(', ')}.`,
  });

  await saveForecastPackageSnapshot(forecastPackage, {
    session,
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Forecast Package changed while the revision request was in progress. Reload and try again.',
  });
  const revisionUpdatedAt = forecastPackage.updatedAt;

  const projectOperations = buildProjectRevisionOperations(
    projects,
    affectedProjectIds,
    userId,
    comment,
    reviewedAt
  );

  try {
    if (projectOperations.length) {
      await Project.bulkWrite(projectOperations, session ? { session } : undefined);
    }
  } catch (error) {
    if (snapshot) {
      try {
        restoreRevisionSnapshot(forecastPackage, snapshot);
        await saveForecastPackageSnapshot(forecastPackage, {
          expectedStatus: FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
          expectedUpdatedAt: revisionUpdatedAt,
          conflictMessage:
            'Forecast Package changed before revision rollback completed. Reload before making further changes.',
        });
      } catch (rollbackError) {
        console.error('[ForecastPackageRevision] Compensation failed:', rollbackError);
      }
    }
    throw error;
  }

  return forecastPackage._id;
}

function isTransactionUnavailable(error) {
  const message = String(error?.message || '');
  return (
    error?.code === 20 ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('does not support retryable writes')
  );
}

async function runConsistentRevision(input) {
  const session = await mongoose.startSession();

  try {
    let packageId;
    await session.withTransaction(async () => {
      packageId = await applyTargetedRevision({ ...input, session });
    });
    return packageId;
  } catch (error) {
    if (!isTransactionUnavailable(error)) throw error;

    console.warn(
      '[ForecastPackageRevision] MongoDB transactions unavailable; using compensated revision update.'
    );
    return applyTargetedRevision({ ...input, compensateOnFailure: true });
  } finally {
    await session.endSession();
  }
}

async function sendTargetedRevision({ packageId, chartTypes, comment, userId }, res) {
  const affectedChartTypes = getRequestedChartTypes(chartTypes);
  const revisionComment = getRequiredComment(comment);
  const updatedPackageId = await runConsistentRevision({
    packageId,
    affectedChartTypes,
    comment: revisionComment,
    userId,
  });
  const populated = await populateForecastPackage(updatedPackageId);

  res.json({
    ...serializePackage(populated),
    affectedChartTypes,
  });
}

export const requestTargetedForecastPackageRevision = asyncHandler(async (req, res) => {
  assertReviewPermission(req);
  await sendTargetedRevision(
    {
      packageId: req.params.id,
      chartTypes: req.body?.chartTypes,
      comment: req.body?.comment,
      userId: req.user.id,
    },
    res
  );
});

export const requestForecastChartRevisionByProject = asyncHandler(async (req, res) => {
  assertReviewPermission(req);

  const forecastPackage = await ForecastPackage.findOne({ 'charts.project': req.params.projectId })
    .select('_id charts')
    .lean();
  if (!forecastPackage) throwError('Forecast Package not found for project', 404);

  const chart = (forecastPackage.charts || []).find(
    (item) => getId(item.project) === getId(req.params.projectId)
  );
  if (!chart) throwError('Forecast chart not found for project', 404);

  await sendTargetedRevision(
    {
      packageId: forecastPackage._id,
      chartTypes: [chart.chartType],
      comment: req.body?.comment,
      userId: req.user.id,
    },
    res
  );
});
