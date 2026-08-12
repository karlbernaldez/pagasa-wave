import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHARTS,
  REQUIRED_FORECAST_CHART_TYPES,
  buildForecastChartProjectName,
  buildForecastPackageName,
  getForecastChartLabel,
  getPackageCompletion,
  normalizeForecastDate,
} from '../utils/forecastPackage.js';
import { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const EDITABLE_PACKAGE_STATUSES = [
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
];
const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2}$/;
const AUTO_CHART_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2} - /;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function assertAuthenticated(req) {
  if (!req.user) throwError('Unauthorized', 401);
}

function assertAdmin(req) {
  if (req.user?.role !== 'admin') throwError('Admin access required', 403);
}

function isPackageOwnerOrAdmin(user, forecastPackage) {
  const isOwner = String(forecastPackage.owner?._id || forecastPackage.owner) === String(user?.id);
  return isOwner || user?.role === 'admin';
}

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function getForecastDateQuery(value) {
  const start = normalizeForecastDate(value || new Date());
  if (!start) return null;
  return { $gte: start, $lt: new Date(start.getTime() + ONE_DAY_MS) };
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
    throwError(
      'Chart workflow can only be changed while the package is Draft or Revision Requested',
      403
    );
  }
}

function getChartSequenceIndex(chartType) {
  return REQUIRED_FORECAST_CHART_TYPES.indexOf(chartType);
}

function getPreviousIncompleteChartType(chartCompletion = [], chartType) {
  const chartIndex = getChartSequenceIndex(chartType);
  if (chartIndex <= 0) return null;

  const previousChartTypes = REQUIRED_FORECAST_CHART_TYPES.slice(0, chartIndex);
  return (
    previousChartTypes.find((previousChartType) => {
      const row = chartCompletion.find((item) => item.chartType === previousChartType);
      return !row?.isComplete;
    }) || null
  );
}

function getActiveEditors(chart = {}) {
  const activeEditors = Array.isArray(chart.activeEditors) ? chart.activeEditors : [];
  const normalized = [...activeEditors];

  if (chart.claimedBy && !normalized.some((editor) => isSameId(editor.user, chart.claimedBy))) {
    normalized.push({ user: chart.claimedBy, startedAt: chart.claimedAt || null });
  }

  return normalized;
}

function isUserActiveEditor(chart, userId) {
  return getActiveEditors(chart).some((editor) => isSameId(editor.user, userId));
}

function syncLegacyClaimFields(chart) {
  const activeEditors = getActiveEditors(chart);
  const firstEditor = activeEditors[0];
  chart.activeEditors = activeEditors;
  chart.claimedBy = firstEditor?.user || null;
  chart.claimedAt = firstEditor?.startedAt || null;
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

function resetForecastPackageForRevision(forecastPackage) {
  forecastPackage.chartCompletion?.forEach((row) => {
    row.isComplete = false;
    row.completedAt = null;
    row.completedBy = null;
  });

  forecastPackage.charts?.forEach((chart) => {
    chart.readyAt = null;
    chart.readyBy = null;
    chart.activeEditors = [];
    chart.claimedBy = null;
    chart.claimedAt = null;
  });
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

function getActiveEditorLabels(chart) {
  return getActiveEditors(chart)
    .map((editor) => getDisplayName(editor.user))
    .filter(Boolean);
}

function getActiveEditingChartLabel(forecastPackage) {
  const chart = forecastPackage.charts?.find((item) => getActiveEditors(item).length > 0);
  return chart ? getForecastChartLabel(chart.chartType) : null;
}

async function syncForecastPackageDisplayNames(forecastPackage) {
  if (!forecastPackage?.forecastDate) return forecastPackage;

  const canonicalPackageName = buildForecastPackageName(forecastPackage.forecastDate);
  const currentPackageName = String(forecastPackage.name || '');
  const shouldRenamePackage =
    !currentPackageName || AUTO_PACKAGE_NAME_PATTERN.test(currentPackageName);
  let changed = false;

  if (
    canonicalPackageName &&
    shouldRenamePackage &&
    forecastPackage.name !== canonicalPackageName
  ) {
    forecastPackage.name = canonicalPackageName;
    changed = true;
  }

  for (const chart of forecastPackage.charts || []) {
    const project = chart.project;
    if (!project || typeof project === 'string') continue;
    const currentProjectName = String(project.name || '');
    const shouldRenameChart =
      !currentProjectName || AUTO_CHART_NAME_PATTERN.test(currentProjectName);
    const nextProjectName =
      canonicalPackageName && shouldRenameChart
        ? buildForecastChartProjectName(
            forecastPackage.forecastDate,
            getForecastChartLabel(chart.chartType)
          )
        : null;

    if (nextProjectName && project.name !== nextProjectName) {
      project.name = nextProjectName;
      await Project.updateOne(
        { _id: project._id },
        { $set: { name: nextProjectName, forecastDate: forecastPackage.forecastDate } }
      );
      changed = true;
    }
  }

  if (changed && typeof forecastPackage.save === 'function') {
    await forecastPackage.save();
  }

  return forecastPackage;
}

function serializePackage(forecastPackage) {
  const plain =
    typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage;

  return {
    ...plain,
    completion: getPackageCompletion(plain.chartCompletion || []),
  };
}

function serializeChartContext(forecastPackage, chart, user) {
  const serializedPackage = serializePackage(forecastPackage);
  const plainChart = typeof chart?.toObject === 'function' ? chart.toObject() : chart;
  const completionRow = serializedPackage.chartCompletion?.find(
    (item) => item.chartType === plainChart?.chartType
  );
  const activeEditors = getActiveEditors(plainChart);
  const activeEditorLabels = getActiveEditorLabels(plainChart);
  const blockingChartType = completionRow?.isComplete
    ? null
    : getPreviousIncompleteChartType(
        serializedPackage.chartCompletion || [],
        plainChart?.chartType
      );
  const editable = EDITABLE_PACKAGE_STATUSES.includes(serializedPackage.status);
  const ownerOrAdmin = isPackageOwnerOrAdmin(user, serializedPackage);
  const activeEditorCurrentUser = activeEditors.some((editor) => isSameId(editor.user, user?.id));
  const hasOtherActiveEditors = activeEditors.some((editor) => !isSameId(editor.user, user?.id));
  const isReady = Boolean(completionRow?.isComplete);

  return {
    package: serializedPackage,
    chart: plainChart,
    chartType: plainChart?.chartType,
    completion: completionRow || null,
    blockingChartType,
    claim: {
      claimedByCurrentUser: activeEditorCurrentUser,
      claimedByOtherUser: hasOtherActiveEditors,
      claimedByLabel: activeEditorLabels.join(', '),
      activeEditorCount: activeEditors.length,
      activeEditorLabels,
      canClaim: editable && !isReady && !blockingChartType && !activeEditorCurrentUser,
      canRelease: editable && activeEditorCurrentUser,
      canCertify:
        editable &&
        !isReady &&
        !blockingChartType &&
        (activeEditorCurrentUser || ownerOrAdmin) &&
        activeEditors.length <= 1,
    },
  };
}

async function populateForecastPackage(query) {
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

function findForecastPackageByChartProjectId(projectId) {
  return ForecastPackage.findOne({ 'charts.project': projectId });
}

async function populateForecastPackageById(id) {
  const forecastPackage = await populateForecastPackage(ForecastPackage.findById(id));
  return syncForecastPackageDisplayNames(forecastPackage);
}

async function lockLinkedChartProjects(forecastPackage, userId, previousStatus) {
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

  syncLegacyClaimFields(chartRow);

  const ownerOrAdmin = isPackageOwnerOrAdmin(user, forecastPackage);
  const activeEditors = getActiveEditors(chartRow);
  const activeEditorCurrentUser = activeEditors.some((editor) => isSameId(editor.user, user?.id));

  const blockingChartType = isComplete
    ? getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chartType)
    : null;

  if (blockingChartType) {
    throwError(
      `${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chartType)}`,
      400
    );
  }

  if (isComplete && !activeEditorCurrentUser && !ownerOrAdmin) {
    throwError(
      `${getForecastChartLabel(chartType)} must be joined for editing before it can be certified ready`,
      409
    );
  }

  if (isComplete && activeEditors.length > 1) {
    throwError(
      `${getForecastChartLabel(chartType)} still has ${activeEditors.length} active editors. Ask other forecasters to release before certifying ready`,
      409
    );
  }

  let comment;
  if (isComplete) {
    completionRow.isComplete = true;
    completionRow.completedAt = new Date();
    completionRow.completedBy = user.id;
    chartRow.readyAt = completionRow.completedAt;
    chartRow.readyBy = user.id;
    chartRow.activeEditors = [];
    chartRow.claimedBy = null;
    chartRow.claimedAt = null;
    comment = `${getForecastChartLabel(chartType)} marked complete`;
  } else {
    const resetCount = resetChartAndDependents(forecastPackage, chartType);
    comment =
      resetCount > 1
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
        activeEditors: [],
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

  const { page = 1, limit = 10, status = '' } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;
  const query = {};

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

  for (const forecastPackage of packages) {
    await syncForecastPackageDisplayNames(forecastPackage);
  }

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

  const forecastPackage = await populateForecastPackage(
    ForecastPackage.findOne({ forecastDate: getForecastDateQuery(requestedDate) })
  );

  if (!forecastPackage) {
    return res.json({
      package: null,
      message: 'No Forecast Package found for the current Philippines operational day',
    });
  }

  await syncForecastPackageDisplayNames(forecastPackage);
  res.json({ package: serializePackage(forecastPackage) });
});

export const getForecastPackageById = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await populateForecastPackage(ForecastPackage.findById(req.params.id));
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  await syncForecastPackageDisplayNames(forecastPackage);
  res.json(serializePackage(forecastPackage));
});

export const getForecastPackageChartContextByProject = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await populateForecastPackage(
    findForecastPackageByChartProjectId(req.params.projectId)
  );
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);

  await syncForecastPackageDisplayNames(forecastPackage);
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
  if (completionRow?.isComplete)
    throwError(`${getForecastChartLabel(chart.chartType)} is already certified ready`, 400);

  const blockingChartType = getPreviousIncompleteChartType(
    forecastPackage.chartCompletion || [],
    chart.chartType
  );
  if (blockingChartType) {
    throwError(
      `${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chart.chartType)} can be joined for editing`,
      400
    );
  }

  syncLegacyClaimFields(chart);
  if (!isUserActiveEditor(chart, req.user.id)) {
    chart.activeEditors.push({ user: req.user.id, startedAt: new Date() });
  }
  syncLegacyClaimFields(chart);

  forecastPackage.auditLogs.push({
    action: 'chart_claimed',
    performedBy: req.user.id,
    previousStatus: forecastPackage.status,
    newStatus: forecastPackage.status,
    comment: `${getForecastChartLabel(chart.chartType)} joined for editing`,
  });

  await saveForecastPackageSnapshot(forecastPackage, {
    expectedStatus: forecastPackage.status,
    expectedUpdatedAt: forecastPackage.updatedAt,
    conflictMessage:
      'Forecast Package chart state changed while this operation was in progress. Reload and try again.',
  });
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

  syncLegacyClaimFields(chart);
  chart.activeEditors = getActiveEditors(chart).filter(
    (editor) => !isSameId(editor.user, req.user.id)
  );
  syncLegacyClaimFields(chart);

  forecastPackage.auditLogs.push({
    action: 'chart_released',
    performedBy: req.user.id,
    previousStatus: forecastPackage.status,
    newStatus: forecastPackage.status,
    comment: `${getForecastChartLabel(chart.chartType)} editing session released`,
  });

  await saveForecastPackageSnapshot(forecastPackage, {
    expectedStatus: forecastPackage.status,
    expectedUpdatedAt: forecastPackage.updatedAt,
    conflictMessage:
      'Forecast Package chart state changed while this operation was in progress. Reload and try again.',
  });
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

  updateForecastChartCompletionState(forecastPackage, chartType, isComplete, req.user);

  await saveForecastPackageSnapshot(forecastPackage, {
    expectedStatus: forecastPackage.status,
    expectedUpdatedAt: forecastPackage.updatedAt,
    conflictMessage:
      'Forecast Package chart state changed while this operation was in progress. Reload and try again.',
  });

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

  await saveForecastPackageSnapshot(forecastPackage, {
    expectedStatus: forecastPackage.status,
    expectedUpdatedAt: forecastPackage.updatedAt,
    conflictMessage:
      'Forecast Package chart state changed while this operation was in progress. Reload and try again.',
  });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const submitForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (!isPackageOwnerOrAdmin(req.user, forecastPackage)) {
    throwError('Only the package owner or an admin can submit this package', 403);
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
    throwError(
      `${activeEditingChart} still has active editors. Release the chart before submitting`,
      409
    );
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

export const startForecastPackageReview = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.SUBMITTED) {
    throwError('Only Submitted packages can be moved to Under Review', 403);
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
    comment: 'Forecast Package moved to review',
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

  if (
    ![FORECAST_PACKAGE_STATUS.UNDER_REVIEW, FORECAST_PACKAGE_STATUS.REJECTED].includes(
      forecastPackage.status
    )
  ) {
    throwError('Only packages under review or rejected packages can request revision', 403);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  forecastPackage.reviewedAt = new Date();
  forecastPackage.rejectedBy = req.user.id;
  forecastPackage.reviewComment = comment;
  resetForecastPackageForRevision(forecastPackage);
  forecastPackage.auditLogs.push({
    action: 'revision_requested',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
    comment,
  });

  await forecastPackage.save();
  await requestLinkedChartProjectRevisions(forecastPackage, req.user.id, comment);

  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const approveForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (
    ![FORECAST_PACKAGE_STATUS.UNDER_REVIEW, FORECAST_PACKAGE_STATUS.REVISION_REQUESTED].includes(
      forecastPackage.status
    )
  ) {
    throwError('Only packages under review or revision requested can be approved', 403);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.APPROVED;
  forecastPackage.approvedBy = req.user.id;
  forecastPackage.auditLogs.push({
    action: 'approved',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.APPROVED,
    comment: 'Forecast Package approved by admin',
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});

export const rejectForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const comment = getRequiredComment(req.body?.comment, 'Rejection comment');
  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  if (forecastPackage.status !== FORECAST_PACKAGE_STATUS.UNDER_REVIEW) {
    throwError('Only packages under review can be rejected', 403);
  }

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.REJECTED;
  forecastPackage.reviewedAt = new Date();
  forecastPackage.rejectedBy = req.user.id;
  forecastPackage.reviewComment = comment;
  forecastPackage.auditLogs.push({
    action: 'rejected',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.REJECTED,
    comment,
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
    throwError('Only approved packages can be published', 403);
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

export const archiveForecastPackage = asyncHandler(async (req, res) => {
  assertAuthenticated(req);
  assertAdmin(req);

  const forecastPackage = await ForecastPackage.findById(req.params.id);
  if (!forecastPackage) throwError('Forecast Package not found', 404);

  const previousStatus = forecastPackage.status;
  forecastPackage.status = FORECAST_PACKAGE_STATUS.ARCHIVED;
  forecastPackage.auditLogs.push({
    action: 'archived',
    performedBy: req.user.id,
    previousStatus,
    newStatus: FORECAST_PACKAGE_STATUS.ARCHIVED,
    comment: 'Forecast Package archived',
  });

  await forecastPackage.save();
  const populated = await populateForecastPackageById(forecastPackage._id);
  res.json(serializePackage(populated));
});