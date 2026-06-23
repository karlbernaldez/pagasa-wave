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

const EDITABLE_PACKAGE_STATUSES = [FORECAST_PACKAGE_STATUS.DRAFT, FORECAST_PACKAGE_STATUS.REVISION_REQUESTED];

function isSameId(left, right) { return String(left?._id || left || '') === String(right?._id || right || ''); }
function isPackageOwnerOrAdmin(user, forecastPackage) { const isOwner = String(forecastPackage.owner?._id || forecastPackage.owner) === String(user?.id); return isOwner || user?.role === 'admin'; }
function getDisplayName(user) { if (!user || typeof user === 'string') return ''; const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim(); return name || user.username || user.email || ''; }
function getPreviousIncompleteChartType(chartCompletion = [], chartType) { const chartIndex = REQUIRED_FORECAST_CHART_TYPES.indexOf(chartType); if (chartIndex <= 0) return null; return REQUIRED_FORECAST_CHART_TYPES.slice(0, chartIndex).find((previousChartType) => { const row = chartCompletion.find((item) => item.chartType === previousChartType); return !row?.isComplete; }) || null; }
function getChartRowByProjectId(forecastPackage, projectId) { return forecastPackage.charts?.find((chart) => isSameId(chart.project, projectId)); }
function getCompletionRow(forecastPackage, chartType) { return forecastPackage.chartCompletion?.find((item) => item.chartType === chartType); }
function getActiveEditors(chart = {}) { const activeEditors = Array.isArray(chart.activeEditors) ? [...chart.activeEditors] : []; if (chart.claimedBy && !activeEditors.some((editor) => isSameId(editor.user, chart.claimedBy))) activeEditors.push({ user: chart.claimedBy, startedAt: chart.claimedAt || null }); return activeEditors; }

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

function serializePackage(forecastPackage) { const plain = typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage; return { ...plain, completion: getPackageCompletion(plain.chartCompletion || []) }; }
function serializeChartContext(forecastPackage, chart, user) {
  const serializedPackage = serializePackage(forecastPackage);
  const plainChart = typeof chart?.toObject === 'function' ? chart.toObject() : chart;
  const completionRow = serializedPackage.chartCompletion?.find((item) => item.chartType === plainChart?.chartType);
  const activeEditors = getActiveEditors(plainChart);
  const activeEditorLabels = activeEditors.map((editor) => getDisplayName(editor.user)).filter(Boolean);
  const blockingChartType = completionRow?.isComplete ? null : getPreviousIncompleteChartType(serializedPackage.chartCompletion || [], plainChart?.chartType);
  const editable = EDITABLE_PACKAGE_STATUSES.includes(serializedPackage.status);
  const activeEditorCurrentUser = activeEditors.some((editor) => isSameId(editor.user, user?.id));
  const hasOtherActiveEditors = activeEditors.some((editor) => !isSameId(editor.user, user?.id));
  const isReady = Boolean(completionRow?.isComplete);
  return { package: serializedPackage, chart: plainChart, chartType: plainChart?.chartType, completion: completionRow || null, blockingChartType, claim: { claimedByCurrentUser: activeEditorCurrentUser, claimedByOtherUser: hasOtherActiveEditors, claimedByLabel: activeEditorLabels.join(', '), activeEditorCount: activeEditors.length, activeEditorLabels, canClaim: editable && !isReady && !blockingChartType && !activeEditorCurrentUser, canRelease: editable && activeEditorCurrentUser, canCertify: editable && !isReady && !blockingChartType && activeEditorCurrentUser && activeEditors.length === 1 } };
}
function getLegacyClaimPatch(activeEditors) { const firstEditor = activeEditors[0]; return { 'charts.$.claimedBy': firstEditor?.user || null, 'charts.$.claimedAt': firstEditor?.startedAt || null }; }
function canAutoJoinChart(forecastPackage, chart) { if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) return false; const completionRow = getCompletionRow(forecastPackage, chart.chartType); if (completionRow?.isComplete) return false; return !getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType); }

async function getPackageByProject(projectId) { const forecastPackage = await ForecastPackage.findOne({ 'charts.project': projectId }); if (!forecastPackage) throwError('Forecast Package chart context not found', 404); return forecastPackage; }
async function joinChartIfAllowedByProject(projectId, user, { emit = true, audit = true } = {}) {
  const forecastPackage = await getPackageByProject(projectId);
  const chart = getChartRowByProjectId(forecastPackage, projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  if (!canAutoJoinChart(forecastPackage, chart)) return { forecastPackage, joined: false };
  const activeEditors = getActiveEditors(chart);
  if (activeEditors.some((editor) => isSameId(editor.user, user.id))) return { forecastPackage, joined: false };
  activeEditors.push({ user: user.id, startedAt: new Date() });
  const update = { $set: { 'charts.$.activeEditors': activeEditors, ...getLegacyClaimPatch(activeEditors) } };
  if (audit) update.$push = { auditLogs: { action: 'chart_claimed', performedBy: user.id, previousStatus: forecastPackage.status, newStatus: forecastPackage.status, comment: `${getForecastChartLabel(chart.chartType)} joined for editing` } };
  await ForecastPackage.updateOne({ _id: forecastPackage._id, 'charts.project': projectId }, update);
  if (emit) emitForecastChartUpdated(projectId, { action: 'chart_joined', resourceType: 'forecast_chart', actorUserId: String(user.id) });
  return { forecastPackage, joined: true };
}

export const getForecastPackageChartContextByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  const shouldAutoJoin = req.query?.autoJoin !== 'false';
  const result = shouldAutoJoin
    ? await joinChartIfAllowedByProject(req.params.projectId, req.user, { emit: true, audit: true })
    : { forecastPackage: await getPackageByProject(req.params.projectId), joined: false };
  const populated = await populateForecastPackageById(result.forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const joinForecastPackageChartEditingByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  const forecastPackage = await getPackageByProject(req.params.projectId);
  if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) throwError('Chart workflow can only be changed while the package is Draft or Revision Requested', 403);
  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  const completionRow = getCompletionRow(forecastPackage, chart.chartType);
  if (completionRow?.isComplete) throwError(`${getForecastChartLabel(chart.chartType)} is already certified ready`, 400);
  const blockingChartType = getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType);
  if (blockingChartType) throwError(`${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chart.chartType)} can be joined for editing`, 400);
  await joinChartIfAllowedByProject(req.params.projectId, req.user, { emit: true, audit: true });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const releaseForecastPackageChartEditingByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  const forecastPackage = await getPackageByProject(req.params.projectId);
  if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) throwError('Chart workflow can only be changed while the package is Draft or Revision Requested', 403);
  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  const remainingEditors = getActiveEditors(chart).filter((editor) => !isSameId(editor.user, req.user.id));
  await ForecastPackage.updateOne({ _id: forecastPackage._id, 'charts.project': req.params.projectId }, { $set: { 'charts.$.activeEditors': remainingEditors, ...getLegacyClaimPatch(remainingEditors) }, $push: { auditLogs: { action: 'chart_released', performedBy: req.user.id, previousStatus: forecastPackage.status, newStatus: forecastPackage.status, comment: `${getForecastChartLabel(chart.chartType)} editing session released` } } });
  emitForecastChartUpdated(req.params.projectId, { action: 'chart_released', resourceType: 'forecast_chart', actorUserId: String(req.user.id) });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});
