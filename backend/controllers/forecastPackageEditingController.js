import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  getForecastChartLabel,
  getPackageCompletion,
  REQUIRED_FORECAST_CHART_TYPES,
} from '../utils/forecastPackage.js';
import { emitForecastChartUpdated } from '../socket/socketEmitter.js';

const EDITABLE_PACKAGE_STATUSES = [
  FORECAST_PACKAGE_STATUS.DRAFT,
  FORECAST_PACKAGE_STATUS.REVISION_REQUESTED,
];

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function isPackageOwnerOrAdmin(user, forecastPackage) {
  const isOwner = String(forecastPackage.owner?._id || forecastPackage.owner) === String(user?.id);
  return isOwner || user?.role === 'admin';
}

function getDisplayName(user) {
  if (!user || typeof user === 'string') return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || user.email || '';
}

function getPreviousIncompleteChartType(chartCompletion = [], chartType) {
  const chartIndex = REQUIRED_FORECAST_CHART_TYPES.indexOf(chartType);
  if (chartIndex <= 0) return null;

  return REQUIRED_FORECAST_CHART_TYPES.slice(0, chartIndex).find((previousChartType) => {
    const row = chartCompletion.find((item) => item.chartType === previousChartType);
    return !row?.isComplete;
  }) || null;
}

function getChartRowByProjectId(forecastPackage, projectId) {
  return forecastPackage.charts?.find((chart) => isSameId(chart.project, projectId));
}

function getActiveEditors(chart = {}) {
  const activeEditors = Array.isArray(chart.activeEditors) ? [...chart.activeEditors] : [];

  if (chart.claimedBy && !activeEditors.some((editor) => isSameId(editor.user, chart.claimedBy))) {
    activeEditors.push({ user: chart.claimedBy, startedAt: chart.claimedAt || null });
  }

  return activeEditors;
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
  const activeEditors = getActiveEditors(plainChart);
  const activeEditorLabels = activeEditors.map((editor) => getDisplayName(editor.user)).filter(Boolean);
  const blockingChartType = completionRow?.isComplete
    ? null
    : getPreviousIncompleteChartType(serializedPackage.chartCompletion || [], plainChart?.chartType);
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
      canCertify: editable && !isReady && !blockingChartType && (activeEditorCurrentUser || ownerOrAdmin) && activeEditors.length <= 1,
    },
  };
}

function getLegacyClaimPatch(activeEditors) {
  const firstEditor = activeEditors[0];
  return {
    'charts.$.claimedBy': firstEditor?.user || null,
    'charts.$.claimedAt': firstEditor?.startedAt || null,
  };
}

export const releaseForecastPackageChartEditingByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const forecastPackage = await ForecastPackage.findOne({ 'charts.project': req.params.projectId });
  if (!forecastPackage) throwError('Forecast Package chart context not found', 404);

  if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) {
    throwError('Chart workflow can only be changed while the package is Draft or Revision Requested', 403);
  }

  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);

  const remainingEditors = getActiveEditors(chart).filter((editor) => !isSameId(editor.user, req.user.id));
  await ForecastPackage.updateOne(
    { _id: forecastPackage._id, 'charts.project': req.params.projectId },
    {
      $set: {
        'charts.$.activeEditors': remainingEditors,
        ...getLegacyClaimPatch(remainingEditors),
      },
      $push: {
        auditLogs: {
          action: 'chart_released',
          performedBy: req.user.id,
          previousStatus: forecastPackage.status,
          newStatus: forecastPackage.status,
          comment: `${getForecastChartLabel(chart.chartType)} editing session released`,
        },
      },
    }
  );

  emitForecastChartUpdated(req.params.projectId, {
    action: 'chart_released',
    resourceType: 'forecast_chart',
  });

  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});
