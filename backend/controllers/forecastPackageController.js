import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHARTS,
  REQUIRED_FORECAST_CHART_TYPES,
  buildForecastPackageName,
  getForecastChartLabel,
  getPackageCompletion,
  normalizeForecastDate,
} from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const EDITABLE_PACKAGE_STATUSES = [
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
];

function assertAuthenticated(req) {
  if (!req.user) throwError('Unauthorized', 401);
}

function assertAdmin(req) {
  if (req.user?.role !== 'admin') throwError('Admin access required', 403);
}

function assertOwnerOrAdmin(req, forecastPackage) {
  const isOwner = String(forecastPackage.owner?._id || forecastPackage.owner) === String(req.user?.id);
  const isAdmin = req.user?.role === 'admin';
  if (!isOwner && !isAdmin) throwError('Forecast Package not found', 404);
}

function isPackageOwnerOrAdmin(user, forecastPackage) {
  const isOwner = String(forecastPackage.owner?._id || forecastPackage.owner) === String(user?.id);
  return isOwner || user?.role === 'admin';
}

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function getDisplayName(user) {
  if (!user) return '';
  if (typeof user === 'string') return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || user.email || '';
}

function getRequiredComment(value, label = 'Comment') {
  const comment = String(value || '').trim();
  if (!comment) throwError(`${label} is required`, 400);
  if (comment.length > 1000) throwError(`${label} must be 1000 characters or less`, 400);
  return comment;
}

function canSubmitPackage(status) {
  return EDITABLE_PACKAGE_STATUSES.includes(status);
}

function assertEditablePackage(forecastPackage) {
  if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) {
    throwError('Chart workflow can only be changed while the package is Draft or Revision Requested', 403);
  }
}

function getChartSequenceIndex(chartType) {
  return REQUIRED_FORECAST_CHART_TYPES.indexOf(chartType);
}

function getPreviousIncompleteChartType(chartCompletion = [], chartType) {
  const chartIndex = getChartSequenceIndex(chartType);
  if (chartIndex <= 0) return null;

  const previousChartTypes = REQUIRED_FORECAST_CHART_TYPES.slice(0, chartIndex);
  return previousChartTypes.find((previousChartType) => {
    const row = chartCompletion.find((item) => item.chartType === previousChartType);
    return !row?.isComplete;
  }) || null;
}

function resetChartAndDependents(forecastPackage, chartType) {
  const chartIndex = getChartSequenceIndex(chartType);
  if (chartIndex < 0) return 0;

  let resetCount = 0;
  const resetChartTypes = new Set(REQUIRED_FORECAST_CHART_TYPES.slice(chartIndex));

  forecastPackage.chartCompletion?.forEach((row) => {
    if (!resetChartTypes.has(row.chartType) || !row.isComplete) return;
    row.isComplete = false;
    row.completedAt = null;
    row.completedBy = null;
    resetCount += 1;
  });

  forecastPackage.charts?.forEach((chart) => {
    if (!resetChartTypes.has(chart.chartType)) return;
    chart.readyAt = null;
    chart.readyBy = null;
  });

  return resetCount;
}

function getChartRowByType(forecastPackage, chartType) {
  return forecastPackage.charts?.find((chart) => chart.chartType === chartType);
}

function getChartRowByProjectId(forecastPackage, projectId) {
  return forecastPackage.charts?.find((chart) => isSameId(chart.project, projectId));
}

function getCompletionRow(forecastPackage, chartType) {
  return forecastPackage.chartCompletion?.find((item) => item.chartType === chartType);
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

function serializeChartContext(forecastPackage, chart, user) {
  const serializedPackage = serializePackage(forecastPackage);
  const plainChart = typeof chart?.toObject === 'function' ? chart.toObject() : chart;
  const completionRow = serializedPackage.chartCompletion?.find((item) => item.chartType === plainChart?.chartType);
  const blockingChartType = completionRow?.isComplete
    ? null
    : getPreviousIncompleteChartType(serializedPackage.chartCompletion || [], plainChart?.chartType);
  const editable = EDITABLE_PACKAGE_STATUSES.includes(serializedPackage.status);
  const ownerOrAdmin = isPackageOwnerOrAdmin(user, serializedPackage);
  const claimedByCurrentUser = isSameId(plainChart?.claimedBy, user?.id);
  const claimedByOtherUser = Boolean(plainChart?.claimedBy && !claimedByCurrentUser && !ownerOrAdmin);
  const isReady = Boolean(completionRow?.isComplete);

  return {
    package: serializedPackage,
    chart: plainChart,
    chartType: plainChart?.chartType,
    completion: completionRow || null,
    blockingChartType,
    claim: {
      claimedByCurrentUser,
      claimedByOtherUser,
      claimedByLabel: getDisplayName(plainChart?.claimedBy),
      canClaim: editable && !isReady && !blockingChartType && !claimedByOtherUser,
      canRelease: editable && Boolean(plainChart?.claimedBy) && (claimedByCurrentUser || ownerOrAdmin),
      canCertify: editable && !isReady && !blockingChartType && (claimedByCurrentUser || ownerOrAdmin),
    },
  };
}

async function populateForecastPackage(query) {
  return query
    .populate('owner', 'firstName lastName email username')
    .populate('charts.project')
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

function getLinkedProjectIds(forecastPackage) {
  return (forecastPackage.charts || [])
    .map((chart) => chart.project?._id || chart.project)
    .filter(Boolean);
}

async function findForecastPackageByChartProjectId(projectId) {
  return ForecastPackage.findOne({ 'charts.project': projectId });
}

async function populateForecastPackageById(id) {
  return populateForecastPackage(ForecastPackage.findById(id));
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

async function requestLinkedChartProjectRevisions(forecastPackage, userId, comment) {
  const projectIds = getLinkedProjectIds(forecastPackage);
  if (!projectIds.length) return;

  await Project.updateMany(
    {
      _id: { $in: projectIds },
      status: { $in: [PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW] },
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
          performedBy: userId,
          previousStatus: PROJECT_STATUS.SUBMITTED,
          newStatus: PROJECT_STATUS.REVISION_REQUESTED,
          comment,
        },
      },
    }
  );
}

function updateForecastChartCompletionState(forecastPackage, chartType, isComplete, user) {
  assertEditablePackage(forecastPackage);

  const completionRow = getCompletionRow(forecastPackage, chartType);
  if (!completionRow) {
    throwError(`Unknown or unsupported chart type: ${chartType}`, 400);
  }

  const chartRow = getChartRowByType(forecastPackage, chartType);
  if (!chartRow) {
    throwError(`Forecast Package chart not found for type: ${chartType}`, 404);
  }

  const ownerOrAdmin = isPackageOwnerOrAdmin(user, forecastPackage);
  const claimedByCurrentUser = isSameId(chartRow.claimedBy, user?.id);
  const claimedByOtherUser = Boolean(chartRow.claimedBy && !claimedByCurrentUser && !ownerOrAdmin);
  if (claimedByOtherUser) {
    throwError(`${getForecastChartLabel(chartType)} is currently claimed by another forecaster`, 409);
  }

  const blockingChartType = isComplete
    ? getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chartType)
    : null;

  if (blockingChartType) {
    throwError(
      `${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chartType)}`,
      400
    );
  }

  if (isComplete && !claimedByCurrentUser && !ownerOrAdmin) {
    throwError(`${getForecastChartLabel(chartType)} must be claimed before it can be certified ready`, 409);
  }

  let comment;
  if (isComplete) {
    completionRow.isComplete = true;
    completionRow.completedAt = new Date();
    completionRow.completedBy = user.id;
    chartRow.readyAt = completionRow.completedAt;
    chartRow.readyBy = user.id;
    comment = `${getForecastChartLabel(chartType)} marked complete`;
  } else {
    const resetCount = resetChartAndDependents(forecastPackage, chartType);
    comment = resetCount > 1
      ? `${getForecastChartLabel(chartType)} and downstream charts marked incomplete`
      : `${getForecastChartLabel(chartType)} marked incomplete`;
  }

  forecastPackage.auditLogs.push({
    action: 'chart_completion_updated',
    performedBy: user.id,
    previousStatus: forecastPackage.status,
    newStatus: forecastPackage.status,
    comment,
  });
}

export const createForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastDate = normalizeForecastDate(req.body?.forecastDate || new Date());
  if (!forecastDate) throwError('forecastDate must be a valid date', 400);

  const name = String(req.body?.name || buildForecastPackageName(forecastDate) || '').trim();
  if (!name) throwError('name is required', 400);

  const existingPackage = await ForecastPackage.findOne({
    owner: req.user.id,
    forecastDate,
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
        description: req.body?.description?.trim?.() || '',
        chartType: requiredChart.chartType,
        forecastDate,
        owner: req.user.id,
        status: PROJECT_STATUS.DRAFT,
        version: 1,
        auditLogs: [
          {
            action: 'created',
            performedBy: req.user.id,
            previousStatus: null,
            newStatus: PROJECT_STATUS.DRAFT,
            comment: `Created from Forecast Package: ${name}`,
          },
        ],
      });

      createdProjectIds.push(project._id);
      charts.push({
        chartType: requiredChart.chartType,
        project: project._id,
        sortOrder: requiredChart.sortOrder,
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
      owner: req.user.id,
      status: FORECAST_PACKAGE_STATUS.DRAFT,
      charts,
      chartCompletion,
      auditLogs: [
        {
          action: 'created',
          performedBy: req.user.id,
          previousStatus: null,
          newStatus: FORECAST_PACKAGE_STATUS.DRAFT,
          comment: 'Forecast Package created with required charts',
        },
      ],
    });

    const populated = await populateForecastPackageById(forecastPackage._id);
    return res.status(201).json(serializePackage(populated));
  } catch (error) {
    await cleanupCreatedProjects(createdProjectIds);
    if (error?.code === 11000) {
      throwError('A Forecast Package or chart project already exists for this date', 409);
    }
    throw error;
  }
});

export const getUserForecastPackages = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const {
    page = 1,
    limit = 10,
    status = '',
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;
  const query = { owner: req.user.id };

  if (status && status !== 'All') {
    query.status = status;
  }

  const [packages, total] = await Promise.all([
    populateForecastPackage(
      ForecastPackage.find(query)
        .sort({ forecastDate: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
    ),
    ForecastPackage.countDocuments(query),
  ]);

  res.json({
    packages: packages.map(serializePackage),
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.max(1, Math.ceil(total / limitNumber)),
  });
});

export const getCurrentForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const requestedDate = req.query?.forecastDate
    ? normalizeForecastDate(req.query.forecastDate)
    : normalizeForecastDate(new Date());

  if (!requestedDate) throwError('forecastDate must be a valid date', 400);

  let forecastPackage = await populateForecastPackage(
    ForecastPackage.findOne({ owner: req.user.id, forecastDate: requestedDate })
  );

  if (!forecastPackage) {
    forecastPackage = await populateForecastPackage(
      ForecastPackage.findOne({ owner: req.user.id })
        .sort({ forecastDate: -1, updatedAt: -1 })
    );
  }

  if (!forecastPackage) {
    return res.json({ package: null, message: 'No Forecast Packages found for this user' });
  }

  res.json({ package: serializePackage(forecastPackage) });
});

export const getForecastPackageById = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await populateForecastPackage(ForecastPackage.findById(req.params.id));
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  assertOwnerOrAdmin(req, forecastPackage);
  res.json(serializePackage(forecastPackage));
});

export const getForecastPackageChartContextByProject = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await populateForecastPackage(findForecastPackageByChartProjectId(req.params.projectId));
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);

  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);

  res.json(serializeChartContext(forecastPackage, chart, req.user));
});

export const claimForecastPackageChartByProject = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await findForecastPackageByChartProjectId(req.params.projectId);
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);
  assertEditablePackage(forecastPackage);

  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);

  const completionRow = getCompletionRow(forecastPackage, chart.chartType);
  if (completionRow?.isComplete) throwError(`${getForecastChartLabel(chart.chartType)} is already certified ready`, 400);

  const blockingChartType = getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType);
  if (blockingChartType) {
    throwError(
      `${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chart.chartType)} can be claimed`,
      400
    );
  }

  const ownerOrAdmin = isPackageOwnerOrAdmin(req.user, forecastPackage);
  const claimedByCurrentUser = isSameId(chart.claimedBy, req.user.id);
  const claimedByOtherUser = Boolean(chart.claimedBy && !claimedByCurrentUser && !ownerOrAdmin);
  if (claimedByOtherUser) {
    throwError(`${getForecastChartLabel(chart.chartType)} is currently claimed by another forecaster`, 409);
  }

  chart.claimedBy = req.user.id;
  chart.claimedAt = new Date();
  forecastPackage.auditLogs.push({
    action: 'chart_claimed',
    performedBy: req.user.id,
    previousStatus: forecastPackage.status,
    newStatus: forecastPackage.status,
    comment: `${getForecastChartLabel(chart.chartType)} claimed for editing`,
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const releaseForecastPackageChartByProject = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await findForecastPackageByChartProjectId(req.params.projectId);
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);
  assertEditablePackage(forecastPackage);

  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);

  if (!chart.claimedBy) {
    const populated = await populateForecastPackageById(forecastPackage._id);
    const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
    return res.json(serializeChartContext(populated, populatedChart, req.user));
  }

  const ownerOrAdmin = isPackageOwnerOrAdmin(req.user, forecastPackage);
  if (!isSameId(chart.claimedBy, req.user.id) && !ownerOrAdmin) {
    throwError(`${getForecastChartLabel(chart.chartType)} can only be released by its active editor`, 409);
  }

  chart.claimedBy = null;
  chart.claimedAt = null;
  forecastPackage.auditLogs.push({
    action: 'chart_released',
    performedBy: req.user.id,
    previousStatus: forecastPackage.status,
    newStatus: forecastPackage.status,
    comment: `${getForecastChartLabel(chart.chartType)} editing claim released`,
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const updateForecastChartCompletion = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const { chartType } = req.params;
  const isComplete = Boolean(req.body?.isComplete);
  const forecastPackage = await ForecastPackage.findById(req.params.id);

  if (!forecastPackage) throwError('Forecast Package not found', 404);
  assertOwnerOrAdmin(req, forecastPackage);

  updateForecastChartCompletionState(forecastPackage, chartType, isComplete, req.user);

  await forecastPackage.save();

  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const updateForecastChartCompletionByProject = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const isComplete = Boolean(req.body?.isComplete);
  const forecastPackage = await findForecastPackageByChartProjectId(req.params.projectId);
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);

  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);

  updateForecastChartCompletionState(forecastPackage, chart.chartType, isComplete, req.user);

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const submitForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  const isOwner = String(forecastPackage.owner) === String(req.user.id);
  if (!isOwner) throwError('Forecast Package not found', 404);

  if (!canSubmitPackage(forecastPackage.status)) {
    throwError('Only Draft or Revision Requested Forecast Packages can be submitted', 400);
  }

  const completion = getPackageCompletion(forecastPackage.chartCompletion || []);
  if (!completion.isComplete) {
    throwError('Forecast Package cannot be submitted until all required charts are complete', 400);
  }

  const previousStatus = forecastPackage.status;
  await lockLinkedChartProjects(forecastPackage, req.user.id, previousStatus);

  forecastPackage.status = FORECAST_PACKAGE_STATUS.SUBMITTED;
  forecastPackage.submittedAt = new Date();
  forecastPackage.auditLogs.push({
    action: 'submitted',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.SUBMITTED,
    comment: previousStatus === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED
      ? 'Forecast Package revision resubmitted for review'
      : 'Forecast Package submitted for review',
  });

  await forecastPackage.save();

  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const getAdminForecastPackages = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const { status = '' } = req.query;
  const query = {};
  if (status && status !== 'All') query.status = status;

  const packages = await populateForecastPackage(
    ForecastPackage.find(query).sort({ submittedAt: -1, updatedAt: -1, forecastDate: -1 })
  );

  res.json(packages.map(serializePackage));
});

export const startForecastPackageReview = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);
  if (String(forecastPackage.owner) === String(req.user.id)) {
    throwError('Admins cannot review their own Forecast Packages', 403);
  }

  if (forecastPackage.status === FORECAST_PACKAGE_STATUS.UNDER_REVIEW) {
    const populated = await populateForecastPackageById(forecastPackage._id);
    return res.json(serializePackage(populated));
  }

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.SUBMITTED) {
    throwError('Only submitted Forecast Packages can move to Under Review', 400);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.UNDER_REVIEW;
  forecastPackage.reviewStartedAt = new Date();
  forecastPackage.reviewStartedBy = req.user.id;
  forecastPackage.auditLogs.push({
    action: 'review_started',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.UNDER_REVIEW,
    comment: 'Forecast Package review started',
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const requestForecastPackageRevision = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const comment = getRequiredComment(req.body?.comment, 'Revision comment');
  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.UNDER_REVIEW) {
    throwError('Only Forecast Packages under review can receive revision requests', 400);
  }

  const previousStatus = forecastPackage.status;
  await requestLinkedChartProjectRevisions(forecastPackage, req.user.id, comment);

  forecastPackage.status = FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  forecastPackage.reviewedAt = new Date();
  forecastPackage.reviewComment = comment;
  forecastPackage.auditLogs.push({
    action: 'revision_requested',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
    comment,
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const approveForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (String(forecastPackage.owner) === String(req.user.id)) {
    throwError('Admins cannot approve their own Forecast Packages', 403);
  }

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.UNDER_REVIEW) {
    throwError('Only Forecast Packages under review can be approved', 400);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.APPROVED;
  forecastPackage.reviewedAt = new Date();
  forecastPackage.approvedBy = req.user.id;
  forecastPackage.auditLogs.push({
    action: 'approved',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.APPROVED,
    comment: 'Forecast Package approved',
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const publishForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.APPROVED) {
    throwError('Only approved Forecast Packages can be published', 400);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.PUBLISHED;
  forecastPackage.publishedAt = new Date();
  forecastPackage.auditLogs.push({
    action: 'published',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.PUBLISHED,
    comment: 'Forecast Package published',
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});