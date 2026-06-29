import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import ForecastPackage from '../models/ForecastPackage.js';
import {
  FORECAST_PACKAGE_STATUS,
  getForecastChartLabel,
  getPackageCompletion,
  REQUIRED_FORECAST_CHART_TYPES,
} from '../utils/forecastPackage.js';
import { emitForecastChartUpdated, emitForecastPackageUpdated } from '../socket/socketEmitter.js';

const EDITABLE_PACKAGE_STATUSES = [FORECAST_PACKAGE_STATUS.DRAFT, FORECAST_PACKAGE_STATUS.REVISION_REQUESTED];

function isSameId(left, right) { return String(left?._id || left || '') === String(right?._id || right || ''); }
function getDisplayName(user) { if (!user || typeof user === 'string') return ''; const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim(); return name || user.username || user.email || ''; }
function getChartSequenceIndex(chartType) { return REQUIRED_FORECAST_CHART_TYPES.indexOf(chartType); }
function getPreviousIncompleteChartType(chartCompletion = [], chartType) { const chartIndex = getChartSequenceIndex(chartType); if (chartIndex <= 0) return null; return REQUIRED_FORECAST_CHART_TYPES.slice(0, chartIndex).find((previousChartType) => { const row = chartCompletion.find((item) => item.chartType === previousChartType); return !row?.isComplete; }) || null; }
function getChartRowByProjectId(forecastPackage, projectId) { return forecastPackage.charts?.find((chart) => isSameId(chart.project, projectId)); }
function getCompletionRow(forecastPackage, chartType) { return forecastPackage.chartCompletion?.find((item) => item.chartType === chartType); }
function getActiveEditors(chart = {}) { const activeEditors = Array.isArray(chart.activeEditors) ? [...chart.activeEditors] : []; if (chart.claimedBy && !activeEditors.some((editor) => isSameId(editor.user, chart.claimedBy))) activeEditors.push({ user: chart.claimedBy, startedAt: chart.claimedAt || null }); return activeEditors; }
function getParticipants(chart = {}) { const participants = Array.isArray(chart.participants) ? [...chart.participants] : []; getActiveEditors(chart).forEach((editor) => { if (!participants.some((participant) => isSameId(participant.user, editor.user))) participants.push({ user: editor.user, firstJoinedAt: editor.startedAt || new Date(), lastJoinedAt: editor.startedAt || new Date() }); }); return participants; }
function getReadyEditors(chart = {}) { return Array.isArray(chart.readyEditors) ? [...chart.readyEditors] : []; }
function getLegacyClaimPatch(activeEditors) { const firstEditor = activeEditors[0]; return { 'charts.$.claimedBy': firstEditor?.user || null, 'charts.$.claimedAt': firstEditor?.startedAt || null }; }
function applyLegacyClaimFromActiveEditors(chart, activeEditors) { const firstEditor = activeEditors[0]; chart.claimedBy = firstEditor?.user || null; chart.claimedAt = firstEditor?.startedAt || null; }
function ensureParticipant(chart, userId) { const now = new Date(); if (!Array.isArray(chart.participants)) chart.participants = []; const existing = chart.participants.find((participant) => isSameId(participant.user, userId)); if (existing) existing.lastJoinedAt = now; else chart.participants.push({ user: userId, firstJoinedAt: now, lastJoinedAt: now }); }
function isUserReady(chart, userId) { return getReadyEditors(chart).some((vote) => isSameId(vote.user, userId)); }
function removeReadyVote(chart, userId) { chart.readyEditors = getReadyEditors(chart).filter((vote) => !isSameId(vote.user, userId)); }
function addReadyVote(chart, userId) { removeReadyVote(chart, userId); chart.readyEditors.push({ user: userId, readyAt: new Date() }); }

async function populateForecastPackageById(id) {
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

function emitChartWorkflowUpdate(forecastPackage, projectId, payload = {}) {
  const eventPayload = { resourceType: 'forecast_chart', packageId: String(forecastPackage?._id || ''), projectId: String(projectId || ''), ...payload };
  emitForecastChartUpdated(projectId, eventPayload);
  emitForecastPackageUpdated(forecastPackage, eventPayload);
}

function serializePackage(forecastPackage) { const plain = typeof forecastPackage.toObject === 'function' ? forecastPackage.toObject() : forecastPackage; return { ...plain, completion: getPackageCompletion(plain.chartCompletion || []) }; }
function serializeChartContext(forecastPackage, chart, user) {
  const serializedPackage = serializePackage(forecastPackage);
  const plainChart = typeof chart?.toObject === 'function' ? chart.toObject() : chart;
  const completionRow = serializedPackage.chartCompletion?.find((item) => item.chartType === plainChart?.chartType);
  const activeEditors = getActiveEditors(plainChart);
  const participants = getParticipants(plainChart);
  const readyEditors = getReadyEditors(plainChart);
  const readyUserIds = new Set(readyEditors.map((vote) => String(vote.user?._id || vote.user)));
  const participantLabels = participants.map((participant) => getDisplayName(participant.user)).filter(Boolean);
  const readyEditorLabels = readyEditors.map((vote) => getDisplayName(vote.user)).filter(Boolean);
  const activeEditorLabels = activeEditors.map((editor) => getDisplayName(editor.user)).filter(Boolean);
  const blockingChartType = completionRow?.isComplete ? null : getPreviousIncompleteChartType(serializedPackage.chartCompletion || [], plainChart?.chartType);
  const editable = EDITABLE_PACKAGE_STATUSES.includes(serializedPackage.status);
  const activeEditorCurrentUser = activeEditors.some((editor) => isSameId(editor.user, user?.id));
  const hasOtherActiveEditors = activeEditors.some((editor) => !isSameId(editor.user, user?.id));
  const isReady = Boolean(completionRow?.isComplete);
  const participantCount = Math.max(participants.length, activeEditors.length, 1);
  const readyCount = participants.filter((participant) => readyUserIds.has(String(participant.user?._id || participant.user))).length;
  const currentUserReady = readyEditors.some((vote) => isSameId(vote.user, user?.id));
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
      canClaim: editable && !isReady && !blockingChartType && !activeEditorCurrentUser && !currentUserReady,
      canRelease: editable && activeEditorCurrentUser && !currentUserReady,
      canCertify: editable && !isReady && !blockingChartType && activeEditorCurrentUser && !currentUserReady,
      readyCount,
      participantCount,
      readyEditorLabels,
      participantLabels,
      currentUserReady,
    },
  };
}
function canAutoJoinChart(forecastPackage, chart, user) {
  if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) return false;
  const completionRow = getCompletionRow(forecastPackage, chart.chartType);
  if (completionRow?.isComplete) return false;
  if (user?.id && isUserReady(chart, user.id)) return false;
  return !getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType);
}
function assertEditablePackage(forecastPackage) { if (!EDITABLE_PACKAGE_STATUSES.includes(forecastPackage.status)) throwError('Chart workflow can only be changed while the package is Draft or Revision Requested', 403); }
function resetChartAndDependents(forecastPackage, chartType) { const chartIndex = getChartSequenceIndex(chartType); if (chartIndex < 0) return 0; const resetChartTypes = new Set(REQUIRED_FORECAST_CHART_TYPES.slice(chartIndex)); let resetCount = 0; forecastPackage.chartCompletion?.forEach((row) => { if (!resetChartTypes.has(row.chartType) || !row.isComplete) return; row.isComplete = false; row.completedAt = null; row.completedBy = null; resetCount += 1; }); forecastPackage.charts?.forEach((chart) => { if (!resetChartTypes.has(chart.chartType)) return; chart.readyAt = null; chart.readyBy = null; chart.readyEditors = []; }); return resetCount; }
function updateChartCompletionState(forecastPackage, chart, isComplete, user) {
  assertEditablePackage(forecastPackage);
  const completionRow = getCompletionRow(forecastPackage, chart.chartType);
  if (!completionRow) throwError(`Unknown or unsupported chart type: ${chart.chartType}`, 400);
  const activeEditors = getActiveEditors(chart);
  const participants = getParticipants(chart);
  const activeEditorCurrentUser = activeEditors.some((editor) => isSameId(editor.user, user?.id));
  const blockingChartType = isComplete ? getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType) : null;
  if (blockingChartType) throwError(`${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chart.chartType)}`, 400);
  let comment;
  if (isComplete) {
    if (!activeEditorCurrentUser) throwError(`${getForecastChartLabel(chart.chartType)} must be opened for editing by you before you can mark yourself ready`, 409);
    addReadyVote(chart, user.id);
    const remainingEditors = activeEditors.filter((editor) => !isSameId(editor.user, user.id));
    chart.activeEditors = remainingEditors;
    applyLegacyClaimFromActiveEditors(chart, remainingEditors);
    const readyUserIds = new Set(getReadyEditors(chart).map((vote) => String(vote.user?._id || vote.user)));
    const allParticipantsReady = participants.length > 0 && participants.every((participant) => readyUserIds.has(String(participant.user?._id || participant.user)));
    if (!allParticipantsReady) {
      const remainingCount = participants.filter((participant) => !readyUserIds.has(String(participant.user?._id || participant.user))).length;
      comment = `${getForecastChartLabel(chart.chartType)} ready vote recorded; ${remainingCount} forecaster${remainingCount === 1 ? '' : 's'} remaining`;
    } else {
      completionRow.isComplete = true;
      completionRow.completedAt = new Date();
      completionRow.completedBy = user.id;
      chart.readyAt = completionRow.completedAt;
      chart.readyBy = user.id;
      chart.activeEditors = [];
      chart.claimedBy = null;
      chart.claimedAt = null;
      comment = `${getForecastChartLabel(chart.chartType)} marked complete after all participating forecasters marked ready`;
    }
  } else {
    const resetCount = resetChartAndDependents(forecastPackage, chart.chartType);
    comment = resetCount > 1 ? `${getForecastChartLabel(chart.chartType)} and downstream charts marked incomplete` : `${getForecastChartLabel(chart.chartType)} marked incomplete`;
  }
  forecastPackage.auditLogs.push({ action: 'chart_completion_updated', performedBy: user.id, previousStatus: forecastPackage.status, newStatus: forecastPackage.status, comment });
}

async function getPackageByProject(projectId) { const forecastPackage = await ForecastPackage.findOne({ 'charts.project': projectId }); if (!forecastPackage) throwError('Forecast Package chart context not found', 404); return forecastPackage; }
async function joinChartIfAllowedByProject(projectId, user, { emit = true, audit = true, strict = false } = {}) {
  const forecastPackage = await getPackageByProject(projectId);
  const chart = getChartRowByProjectId(forecastPackage, projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  if (!canAutoJoinChart(forecastPackage, chart, user)) {
    if (strict && isUserReady(chart, user.id)) throwError(`${getForecastChartLabel(chart.chartType)} is already marked ready by you. Reopen the chart from the package board before editing again.`, 409);
    return { forecastPackage, joined: false };
  }
  const activeEditors = getActiveEditors(chart);
  const now = new Date();
  if (!activeEditors.some((editor) => isSameId(editor.user, user.id))) activeEditors.push({ user: user.id, startedAt: now });
  ensureParticipant(chart, user.id);
  const update = { $set: { 'charts.$.activeEditors': activeEditors, 'charts.$.participants': chart.participants, ...getLegacyClaimPatch(activeEditors) } };
  if (audit) update.$push = { auditLogs: { action: 'chart_claimed', performedBy: user.id, previousStatus: forecastPackage.status, newStatus: forecastPackage.status, comment: `${getForecastChartLabel(chart.chartType)} joined for editing` } };
  await ForecastPackage.updateOne({ _id: forecastPackage._id, 'charts.project': projectId }, update);
  if (emit) emitChartWorkflowUpdate(forecastPackage, projectId, { action: 'chart_joined', actorUserId: String(user.id) });
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
  assertEditablePackage(forecastPackage);
  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  const completionRow = getCompletionRow(forecastPackage, chart.chartType);
  if (completionRow?.isComplete) throwError(`${getForecastChartLabel(chart.chartType)} is already certified ready`, 400);
  const blockingChartType = getPreviousIncompleteChartType(forecastPackage.chartCompletion || [], chart.chartType);
  if (blockingChartType) throwError(`${getForecastChartLabel(blockingChartType)} must be certified before ${getForecastChartLabel(chart.chartType)} can be joined for editing`, 400);
  await joinChartIfAllowedByProject(req.params.projectId, req.user, { emit: true, audit: true, strict: true });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const releaseForecastPackageChartEditingByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  const forecastPackage = await getPackageByProject(req.params.projectId);
  assertEditablePackage(forecastPackage);
  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  const remainingEditors = getActiveEditors(chart).filter((editor) => !isSameId(editor.user, req.user.id));
  await ForecastPackage.updateOne({ _id: forecastPackage._id, 'charts.project': req.params.projectId }, { $set: { 'charts.$.activeEditors': remainingEditors, ...getLegacyClaimPatch(remainingEditors) }, $push: { auditLogs: { action: 'chart_released', performedBy: req.user.id, previousStatus: forecastPackage.status, newStatus: forecastPackage.status, comment: `${getForecastChartLabel(chart.chartType)} editing session released` } } });
  emitChartWorkflowUpdate(forecastPackage, req.params.projectId, { action: 'chart_released', actorUserId: String(req.user.id) });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});

export const updateForecastChartCompletionByProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);
  const forecastPackage = await getPackageByProject(req.params.projectId);
  const chart = getChartRowByProjectId(forecastPackage, req.params.projectId);
  if (!chart) throwError('Forecast Package chart context not found', 404);
  updateChartCompletionState(forecastPackage, chart, Boolean(req.body?.isComplete), req.user);
  await forecastPackage.save();
  emitChartWorkflowUpdate(forecastPackage, req.params.projectId, { action: 'chart_completion_updated', actorUserId: String(req.user.id) });
  const populated = await populateForecastPackageById(forecastPackage._id);
  const populatedChart = getChartRowByProjectId(populated, req.params.projectId);
  res.json(serializeChartContext(populated, populatedChart, req.user));
});
