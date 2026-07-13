import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, Eye, Info, Loader2, LockKeyhole, Plus, RefreshCw, Send, ShieldCheck, Waves } from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  createForecastPackage,
  fetchCurrentForecastPackage,
  submitForecastPackage,
} from '@/api/forecastPackageAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import ForecastReminderCard from '../components/ForecastReminderCard';
import useForecasterWorkspaceSettings from '../hooks/useForecasterWorkspaceSettings';

const FORECAST_TIME_ZONE = 'Asia/Manila';
const REQUIRED_CHART_SEQUENCE = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];
const EDITABLE_PACKAGE_STATUSES = new Set(['Draft', 'Revision Requested']);
const APPROVED_PACKAGE_STATUSES = new Set(['Approved', 'Published']);
const APPROVED_CHART_STATUSES = new Set(['Approved', 'Published']);
const WARNING_CHART_STATUSES = new Set(['Revision Requested', 'Under Review', 'Submitted']);
const REVISION_REQUESTED_STATUS = 'Revision Requested';
const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2}$/;

const REQUIRED_CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Wave Forecast',
  forecast_36h: '36h Wave Forecast',
  forecast_48h: '48h Wave Forecast',
};

const LOCKED_PACKAGE_COPY = {
  Submitted: {
    nextAction: 'Package has been submitted. Wait for Admin to start review or request revisions before editing again.',
    lockedNotice: 'Submitted package: charts are locked while Admin queues the review.',
    currentStep: 'Submitted',
    reviewGateDetail: 'Waiting for Admin review',
  },
  'Under Review': {
    nextAction: 'Admin review is in progress. Keep the package unchanged unless revisions are requested.',
    lockedNotice: 'Under review: charts are locked while Admin checks this forecast package.',
    currentStep: 'Under Review',
    reviewGateDetail: 'Admin review in progress',
  },
  Approved: {
    nextAction: 'Package is approved and ready for publication. Charts remain locked to preserve the reviewed output.',
    lockedNotice: 'Approved package: reviewed charts are locked and ready for publishing.',
    currentStep: 'Approved',
    reviewGateDetail: 'Ready for publication',
  },
  Published: {
    nextAction: 'Package has been published. Use the public chart output for sharing and archiving decisions.',
    lockedNotice: 'Published package: final charts are locked as operational outputs.',
    currentStep: 'Published',
    reviewGateDetail: 'Published output',
  },
  Rejected: {
    nextAction: 'Package was rejected by Admin. Create or wait for a new package instead of editing this one.',
    lockedNotice: 'Rejected package: this review cycle is closed and charts are locked.',
    currentStep: 'Rejected',
    reviewGateDetail: 'Review closed',
  },
  'No Publication': {
    nextAction: 'Package was marked no publication. Charts are locked because this output will not be published.',
    lockedNotice: 'No publication package: output is closed and charts are locked.',
    currentStep: 'No Publication',
    reviewGateDetail: 'No publication decision',
  },
  Archived: {
    nextAction: 'Package is archived and read-only. Create or open the current active package to continue forecasting.',
    lockedNotice: 'Archived package: charts are read-only.',
    currentStep: 'Archived',
    reviewGateDetail: 'Archived record',
  },
};

const CHART_METADATA = {
  analysis: {
    code: 'ANL',
    horizon: 'Analysis',
    mandate: 'Analysis of observed wave conditions, including significant wave height, direction, and period.',
    checkpoint: 'Analysis complete',
  },
  forecast_24h: {
    code: '+24H',
    horizon: '24-hour outlook',
    mandate: '24-hour wave height and direction forecast based on latest model guidance and analysis.',
    checkpoint: '24h forecast complete',
  },
  forecast_36h: {
    code: '+36H',
    horizon: '36-hour outlook',
    mandate: '36-hour wave height and direction forecast extending the 24-hour outlook with model guidance.',
    checkpoint: '36h forecast complete',
  },
  forecast_48h: {
    code: '+48H',
    horizon: '48-hour outlook',
    mandate: '48-hour wave height and direction forecast for extended marine operations planning.',
    checkpoint: '48h forecast complete',
  },
};

function normalizeOperationsSettings(settings = {}) {
  return { ...(settings || {}) };
}

function formatForecastDate(value) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'full', timeZone: FORECAST_TIME_ZONE }).format(date);
}

function formatForecastDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: FORECAST_TIME_ZONE,
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  return year && month && day ? `${year}-${month}-${day}` : '';
}

function getUserDisplayName(user) {
  if (!user || typeof user === 'string') return '';
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.email || '';
}

function formatNameList(names = []) {
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

function getActiveEditorNames(chart) {
  const names = (Array.isArray(chart?.activeEditors) ? chart.activeEditors : [])
    .map((editor) => getUserDisplayName(editor?.user))
    .filter(Boolean);
  const legacyName = getUserDisplayName(chart?.claimedBy);
  if (legacyName && !names.includes(legacyName)) names.push(legacyName);
  return names;
}

function getReadyEditorNames(chart, completion) {
  const names = (Array.isArray(chart?.readyEditors) ? chart.readyEditors : [])
    .map((vote) => getUserDisplayName(vote?.user))
    .filter(Boolean);
  const readyByName = getUserDisplayName(chart?.readyBy || completion?.completedBy);
  if (readyByName && !names.includes(readyByName)) names.push(readyByName);
  return names;
}

function getPackagePayload(response) {
  if (!response) return null;
  if (Object.prototype.hasOwnProperty.call(response, 'package')) return response.package || null;
  return response;
}

function getPackageId(packageData) {
  return packageData?._id || packageData?.id;
}

function getPackageTitle(packageData) {
  const dateKey = formatForecastDateKey(packageData?.forecastDate);
  const name = packageData?.name || '';
  if (dateKey && (!name || AUTO_PACKAGE_NAME_PATTERN.test(name))) return `Marine Forecast ${dateKey}`;
  return name || 'Marine Forecast Package';
}

function getChartProjectId(chart) {
  return chart?.project?._id || chart?.project?.id || chart?.project;
}

function getChartProjectStatus(chart) {
  if (chart?.project && typeof chart.project === 'object') return chart.project.status || '';
  return chart?.status || '';
}

function getChartCompletion(packageData, chartType) {
  return packageData?.chartCompletion?.find((row) => row.chartType === chartType);
}

function getTimeValue(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isRevisionActionPending(packageData, chart) {
  if (packageData?.status !== REVISION_REQUESTED_STATUS) return false;
  if (getChartProjectStatus(chart) !== REVISION_REQUESTED_STATUS) return false;

  const completion = getChartCompletion(packageData, chart?.chartType);
  if (!completion?.isComplete) return false;

  const revisionRequestedAt = getTimeValue(packageData.reviewedAt || packageData.updatedAt);
  const completedAt = getTimeValue(completion.completedAt || chart?.readyAt);
  return !completedAt || !revisionRequestedAt || completedAt <= revisionRequestedAt;
}

function getRevisionActionPendingChartTypes(packageData) {
  if (packageData?.status !== REVISION_REQUESTED_STATUS) return [];
  return (packageData?.charts || [])
    .filter((chart) => isRevisionActionPending(packageData, chart))
    .map((chart) => chart.chartType)
    .filter(Boolean);
}

function isChartComplete(packageData, chartType) {
  return Boolean(getChartCompletion(packageData, chartType)?.isComplete);
}

function getFirstIncompletePrerequisite(packageData, chartType) {
  const chartIndex = REQUIRED_CHART_SEQUENCE.indexOf(chartType);
  if (chartIndex <= 0) return null;
  return REQUIRED_CHART_SEQUENCE.slice(0, chartIndex).find((previousChartType) => !isChartComplete(packageData, previousChartType)) || null;
}

function getNextIncompleteChartType(packageData) {
  return REQUIRED_CHART_SEQUENCE.find((chartType) => !isChartComplete(packageData, chartType)) || null;
}

function getCompletion(packageData) {
  if (packageData?.completion) return packageData.completion;
  const rows = packageData?.chartCompletion || [];
  const required = REQUIRED_CHART_SEQUENCE.length;
  const completed = rows.filter((row) => row.isComplete).length;
  return { required, completed, percentage: required ? Math.round((completed / required) * 100) : 0, isComplete: completed === required };
}

function getLockedPackageCopy(status) {
  return LOCKED_PACKAGE_COPY[status] || {
    nextAction: `Package is ${status || 'locked'}. Charts are read-only until Admin requests a revision.`,
    lockedNotice: `This package is locked while it is ${status || 'not editable'}.`,
    currentStep: status || 'Locked',
    reviewGateDetail: 'Package locked',
  };
}

function sortChartsBySequence(charts = []) {
  return [...charts].sort((left, right) => {
    const leftIndex = REQUIRED_CHART_SEQUENCE.indexOf(left.chartType);
    const rightIndex = REQUIRED_CHART_SEQUENCE.indexOf(right.chartType);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

function getSubmitReadiness(packageData, completion, isEditable, pendingRevisionChartTypes = []) {
  if (!packageData) {
    return { title: 'No package yet', detail: 'Create today\'s package to begin the four-chart forecast workflow.', tone: 'neutral' };
  }
  if (!isEditable) {
    const copy = getLockedPackageCopy(packageData.status);
    return { title: 'Locked for forecasters', detail: copy.lockedNotice, tone: 'locked' };
  }
  if (pendingRevisionChartTypes.length) {
    const labels = pendingRevisionChartTypes.map((chartType) => REQUIRED_CHART_LABELS[chartType] || chartType).join(', ');
    return { title: 'Revision action required', detail: `Open and re-certify ${labels} before resubmitting this package.`, tone: 'warning' };
  }
  if (!completion.isComplete) {
    const nextChartType = getNextIncompleteChartType(packageData);
    const remaining = Math.max(0, completion.required - completion.completed);
    return {
      title: 'Not ready to submit',
      detail: nextChartType
        ? `Continue with ${REQUIRED_CHART_LABELS[nextChartType]}. ${remaining} chart${remaining === 1 ? '' : 's'} still need certification.`
        : `${remaining} chart${remaining === 1 ? '' : 's'} still need certification before submission.`,
      tone: 'blocked',
    };
  }
  return { title: 'Ready to submit', detail: 'All required charts are certified. Submit this package for Admin review.', tone: 'ready' };
}

function getNextAction(packageData, completion, isEditable, pendingRevisionChartTypes = []) {
  if (!packageData) return 'Create today\'s package to generate the four required forecast charts.';
  if (!isEditable) return getLockedPackageCopy(packageData.status).nextAction;
  if (pendingRevisionChartTypes.length) {
    const labels = pendingRevisionChartTypes.map((chartType) => REQUIRED_CHART_LABELS[chartType] || chartType).join(', ');
    return `Resolve and re-certify requested revisions for ${labels} before resubmitting the package.`;
  }
  if (!completion.isComplete) {
    const nextChartType = getNextIncompleteChartType(packageData);
    return nextChartType
      ? `Continue with ${REQUIRED_CHART_LABELS[nextChartType]}. Later charts remain queued until prerequisites are certified.`
      : `${completion.required - completion.completed} chart${completion.required - completion.completed === 1 ? '' : 's'} still need forecast work.`;
  }
  return 'All charts are complete. Submit the package for admin review.';
}

function StatusPill({ status, isDarkMode }) {
  const isSuccessful = ['Submitted', 'Approved', 'Published'].includes(status);
  return (
    <span className={`inline-flex items-center text-base font-black uppercase tracking-wide ${isSuccessful ? isDarkMode ? 'text-lime-300' : 'text-emerald-700' : isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>
      {status || 'Draft'}
    </span>
  );
}

function NextActionCard({ packageData, completion, isEditable, isDarkMode, pendingRevisionChartTypes }) {
  const nextAction = getNextAction(packageData, completion, isEditable, pendingRevisionChartTypes);

  return (
    <section className={`relative overflow-hidden rounded-2xl border px-5 py-4 ${isDarkMode ? 'border-cyan-300/35 bg-cyan-400/[0.08]' : 'border-blue-200 bg-blue-50/90 shadow-sm'}`}>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-20 sm:block" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(34,211,238,.8), transparent 38%), repeating-radial-gradient(ellipse at 100% 120%, transparent 0 14px, rgba(125,211,252,.5) 15px 16px)' }} />
      <div className="flex min-w-0 items-start gap-3">
        <span className={`relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border ${isDarkMode ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-300' : 'border-blue-200 bg-white text-blue-700 shadow-sm'}`}>
          <Info size={18} />
        </span>
        <div className="relative min-w-0">
          <p className={`text-base font-black ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`}>Next action</p>
          <p className={`mt-0.5 text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{nextAction}</p>
        </div>
      </div>
    </section>
  );
}

function ChartCard({ chart, packageData, isDarkMode, isEditable, onOpen, sequenceNumber }) {
  const chartType = chart?.chartType;
  const completion = getChartCompletion(packageData, chartType);
  const projectId = getChartProjectId(chart);
  const chartProjectStatus = getChartProjectStatus(chart);
  const chartReviewStatus = chartProjectStatus || (APPROVED_PACKAGE_STATUSES.has(packageData?.status) ? 'Approved' : packageData?.status);
  const isComplete = Boolean(completion?.isComplete);
  const revisionActionPending = isRevisionActionPending(packageData, chart);
  const isReCertifiedRevision = chartReviewStatus === REVISION_REQUESTED_STATUS && isComplete && !revisionActionPending;
  const displayChartStatus = isReCertifiedRevision ? 'Re-certified' : chartReviewStatus;
  const blockingChartType = getFirstIncompletePrerequisite(packageData, chartType);
  const isQueued = Boolean(blockingChartType) && !isComplete;
  const activeEditorNames = getActiveEditorNames(chart);
  const activeEditorText = formatNameList(activeEditorNames);
  const readyEditorText = formatNameList(getReadyEditorNames(chart, completion));
  const metadata = CHART_METADATA[chartType] || { code: 'CHT', horizon: 'Forecast chart', mandate: 'Prepare and verify this forecast chart.', checkpoint: 'Confirm readiness before package submission.' };
  const hasActiveEditors = activeEditorNames.length > 0;
  const canOpen = Boolean(projectId && !isQueued);
  const isApprovedChart = APPROVED_CHART_STATUSES.has(displayChartStatus);
  const isSubmittedChart = displayChartStatus === 'Submitted';
  const isWarningChart = ['Revision Requested', 'Under Review'].includes(displayChartStatus) && !isReCertifiedRevision;
  const isPositiveState = isApprovedChart || isSubmittedChart || isComplete || isReCertifiedRevision;
  const statusLabel = isQueued && !displayChartStatus ? 'Queued' : displayChartStatus || (isComplete ? 'Ready for review' : 'In production');
  const certificationText = revisionActionPending
    ? 'Revision needs re-certification'
    : isComplete
      ? readyEditorText ? `Certified by ${readyEditorText}` : 'Certified'
      : hasActiveEditors ? `Editing by ${activeEditorText}` : 'Not yet certified';
  const checkpointText = revisionActionPending
    ? 'Revision required before resubmission'
    : isQueued
      ? `Complete ${REQUIRED_CHART_LABELS[blockingChartType]} first`
      : hasActiveEditors && !isComplete
        ? `${activeEditorText} ${activeEditorNames.length === 1 ? 'is' : 'are'} currently editing`
        : metadata.checkpoint;
  const statusTextClass = isApprovedChart || isSubmittedChart || isReCertifiedRevision
    ? isDarkMode ? 'text-lime-300' : 'text-emerald-700'
    : isWarningChart
      ? 'text-amber-400'
      : isQueued
        ? 'text-slate-500'
        : isDarkMode ? 'text-cyan-300' : 'text-blue-700';

  return (
    <article className={`group min-h-[156px] overflow-hidden rounded-xl border shadow-lg transition duration-200 ${isQueued ? 'opacity-75' : 'hover:-translate-y-0.5 hover:shadow-xl'} ${isDarkMode ? 'border-cyan-300/30 bg-[#062b50]/78 shadow-black/20 hover:border-cyan-300/55' : 'border-blue-200 bg-white/92 shadow-blue-950/5 hover:border-blue-300'}`}>
      <div className="grid min-h-[156px] gap-3 p-4 sm:grid-cols-[28px_1fr] xl:grid-cols-[28px_68px_minmax(0,1fr)_172px] xl:items-center">
        <span className={`grid h-7 w-7 place-items-center self-start rounded-md border text-sm font-black xl:mt-0 ${isDarkMode ? 'border-cyan-300/40 bg-cyan-400/10 text-white' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>{sequenceNumber}</span>

        <div className={`grid h-16 w-16 place-items-center rounded-full border ${isPositiveState ? isDarkMode ? 'border-cyan-100/45 bg-white/[0.03] text-white' : 'border-blue-200 bg-blue-50 text-blue-800' : isQueued ? 'border-slate-500/30 text-slate-500' : isDarkMode ? 'border-cyan-300/35 bg-cyan-400/[0.05] text-cyan-100' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
          <div className="text-center">
            <Waves className="mx-auto" size={28} aria-hidden="true" />
            <span className="block text-[9px] font-black leading-none">{metadata.code}</span>
          </div>
        </div>

        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{REQUIRED_CHART_LABELS[chartType] || chartType}</h3>
          <p className={`mt-0.5 text-xs font-black uppercase tracking-[0.08em] ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`}>{metadata.code}</p>
          <p className={`mt-3 max-w-[290px] text-sm leading-[1.35] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{metadata.mandate}</p>
          <p className={`mt-3 inline-flex items-start gap-1.5 text-xs font-medium ${revisionActionPending ? 'text-amber-400' : isComplete ? isDarkMode ? 'text-cyan-300' : 'text-cyan-700' : isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <CheckCircle2 className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
            <span>Readiness checkpoint: {checkpointText}</span>
          </p>
        </div>

        <div className={`flex min-h-[126px] flex-col border-t pt-4 sm:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-1 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-black uppercase tracking-wide ${statusTextClass}`}><CheckCircle2 size={16} />{statusLabel}</span>
          <span className="group/certification relative mt-3 inline-flex w-fit" tabIndex={0} aria-label={isComplete ? certificationText : 'Not yet certified'}>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide ${isComplete ? isDarkMode ? 'border-cyan-300/25 bg-cyan-400/[0.07] text-cyan-300' : 'border-cyan-200 bg-cyan-50 text-cyan-700' : isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}><ShieldCheck size={14} />{isComplete ? 'Certified' : 'Not certified'}</span>
            <span role="tooltip" className={`pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-max max-w-[240px] translate-y-1 rounded-lg border px-3 py-2 text-[11px] font-semibold normal-case tracking-normal opacity-0 shadow-xl transition duration-150 group-hover/certification:translate-y-0 group-hover/certification:opacity-100 group-focus-within/certification:translate-y-0 group-focus-within/certification:opacity-100 ${isDarkMode ? 'border-cyan-300/20 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>{certificationText}</span>
          </span>
          <button type="button" disabled={!canOpen} onClick={() => canOpen && onOpen(projectId)} className={`mt-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'border-white/15 bg-white/[0.04] text-white hover:border-cyan-300/30 hover:bg-white/[0.08]' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-300 hover:bg-white'}`}>
            <Eye size={17} aria-hidden="true" />
            {isQueued ? 'Waiting' : isComplete ? 'Review chart' : 'Open chart'}
          </button>
        </div>
      </div>
    </article>
  );
}

function PackageSummary({ chartSequenceHelper, completion, hasPendingRevisionAction, isDarkMode, isEditable, lockedPackageCopy, packageData, packageTitle, submitReadiness }) {
  const ReadinessIcon = !isEditable ? LockKeyhole : completion.isComplete ? ShieldCheck : Waves;
  const statusIsComplete = ['Submitted', 'Approved', 'Published'].includes(packageData.status);
  const lockedDescription = 'The package is locked and cannot be edited until the Admin completes the review.';

  return (
    <section className={`min-h-[192px] overflow-hidden rounded-xl border shadow-xl ${isDarkMode ? 'border-cyan-300/30 bg-[#07335b]/78 shadow-black/20' : 'border-blue-200 bg-white/90 shadow-blue-950/5'}`}>
      <div className="grid min-h-[192px] xl:grid-cols-[18%_33%_27%_22%] xl:grid-rows-[1fr_auto]">
        <div className={`flex items-start gap-4 border-b p-6 xl:col-start-1 xl:row-start-1 xl:border-b-0 xl:border-r ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <span className={`mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border ${statusIsComplete ? isDarkMode ? 'border-lime-300/60 bg-lime-400/10 text-lime-300 shadow-[0_0_18px_rgba(163,230,53,0.10)]' : 'border-emerald-200 bg-emerald-50 text-emerald-600' : isDarkMode ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-300' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            <CheckCircle2 size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Status</p>
            <div className="mt-1"><StatusPill status={packageData.status} isDarkMode={isDarkMode} /></div>
          </div>
        </div>

        <div className={`border-b p-6 xl:col-start-2 xl:row-start-1 xl:border-b-0 xl:border-r ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <dl className="space-y-3">
            <div>
              <dt className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Date</dt>
              <dd className={`mt-1 text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatForecastDate(packageData.forecastDate)}</dd>
            </div>
            <div>
              <dt className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Package title</dt>
              <dd className={`mt-1 truncate text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={packageTitle}>{packageTitle}</dd>
            </div>
            <div>
              <dt className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Message</dt>
              <dd className={`mt-1 text-xs font-medium leading-5 ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{hasPendingRevisionAction ? 'Requested revisions must be opened in Studio and re-certified before this package can be resubmitted.' : completion.isComplete ? 'All required charts are complete.' : chartSequenceHelper}</dd>
            </div>
          </dl>
        </div>

        <div className={`border-b p-6 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:border-b-0 xl:border-r ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Completion</p>
          <p className={`mt-2 text-4xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{completion.percentage}%</p>
          <p className={`mt-3 text-base font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{completion.completed}/{completion.required} charts</p>
          <div className={`mt-5 h-2 w-full max-w-[310px] overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-200'}`} role="progressbar" aria-label="Forecast package completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion.percentage}><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300" style={{ width: `${completion.percentage}%` }} /></div>
        </div>

        <div className={`flex flex-col items-center justify-center border-b p-5 text-center xl:col-start-4 xl:row-span-2 xl:row-start-1 xl:border-b-0 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <span className={`grid h-16 w-16 place-items-center rounded-full border ${!isEditable ? isDarkMode ? 'border-amber-300/80 bg-slate-950/15 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.14)]' : 'border-amber-300 bg-amber-50 text-amber-600' : completion.isComplete ? 'border-emerald-300/50 bg-emerald-400/10 text-emerald-400' : isDarkMode ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-300' : 'border-blue-200 bg-blue-50 text-blue-700'}`}><ReadinessIcon size={29} /></span>
          <p className={`mt-3 text-base font-black ${!isEditable ? 'text-amber-400' : isDarkMode ? 'text-white' : 'text-slate-950'}`}>{submitReadiness.title}</p>
          <p className={`mt-2 max-w-[260px] text-xs font-medium leading-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{!isEditable ? lockedDescription : submitReadiness.detail}</p>
        </div>

        {!isEditable && <div className={`flex items-center gap-3 px-7 pb-5 pt-1 text-xs font-bold xl:col-span-2 xl:col-start-1 xl:row-start-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${isDarkMode ? 'border-amber-300/45 bg-amber-400/[0.06]' : 'border-amber-300 bg-amber-50'}`}><LockKeyhole size={15} /></span><p>{lockedPackageCopy.lockedNotice}</p></div>}
      </div>
    </section>
  );
}

function EmptyPackageState({ isCreating, isDarkMode, onCreate, message }) {
  return (
    <div className={`rounded-3xl border p-8 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}><CalendarDays size={30} /></div>
      <h2 className={`mt-5 text-xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Create today&apos;s forecast package</h2>
      <p className={`mx-auto mt-2 max-w-2xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{message || 'A forecast package creates the four required charts for the daily marine forecast and keeps the forecaster workflow focused on the current forecast.'}</p>
      <div className="mt-6 flex justify-center"><Button icon={Plus} loading={isCreating} disabled={isCreating} onClick={onCreate}>Create Forecast Package</Button></div>
    </div>
  );
}

export default function ForecasterProjectLibraryPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const workspaceSettings = useForecasterWorkspaceSettings();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const operationsSettings = useMemo(() => normalizeOperationsSettings(workspaceSettings.operations), [workspaceSettings.operations]);
  const completion = useMemo(() => getCompletion(packageData), [packageData]);
  const packageId = getPackageId(packageData);
  const orderedCharts = useMemo(() => sortChartsBySequence(packageData?.charts || []), [packageData?.charts]);
  const pendingRevisionChartTypes = useMemo(() => getRevisionActionPendingChartTypes(packageData), [packageData]);
  const hasPendingRevisionAction = pendingRevisionChartTypes.length > 0;
  const isEditable = EDITABLE_PACKAGE_STATUSES.has(packageData?.status || 'Draft');
  const lockedPackageCopy = useMemo(() => getLockedPackageCopy(packageData?.status), [packageData?.status]);
  const submitReadiness = useMemo(() => getSubmitReadiness(packageData, completion, isEditable, pendingRevisionChartTypes), [packageData, completion, isEditable, pendingRevisionChartTypes]);
  const canSubmit = Boolean(packageId && isEditable && completion.isComplete && !hasPendingRevisionAction && !submitting);
  const packageTitle = getPackageTitle(packageData);
  const chartSequenceHelper = workspaceSettings.chartSequenceHelperMessage || 'Follow the production order: Wave Analysis, 24h, 36h, then 48h. Forecasters can co-edit; readiness waits until active editors release.';
  const submitButtonLabel = !isEditable
    ? 'Package locked'
    : hasPendingRevisionAction
      ? 'Resolve revision first'
      : completion.isComplete
        ? 'Submit Forecast Package'
        : 'Complete required charts';

  const loadCurrentPackage = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchCurrentForecastPackage({ signal });
      setPackageData(getPackagePayload(response));
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Failed to load current forecast package:', err);
        setError(err?.message || 'Failed to load current forecast package.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCurrentPackage({ signal: controller.signal });
    return () => controller.abort();
  }, [loadCurrentPackage]);

  const handleCreatePackage = async () => {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      const response = await createForecastPackage();
      setPackageData(getPackagePayload(response));
    } catch (err) {
      console.error('Failed to create forecast package:', err);
      setError(err?.message || 'Failed to create forecast package.');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitPackage = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const updatedPackage = await submitForecastPackage(packageId);
      setPackageData(getPackagePayload(updatedPackage));
    } catch (err) {
      console.error('Failed to submit forecast package:', err);
      setError(err?.message || 'Failed to submit forecast package.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-transparent transition-colors">
      <div className="mx-auto max-w-[1540px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Current Forecast Package</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Complete the daily forecast sequence from analysis through the 48-hour outlook.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {packageData && isEditable && <Button icon={Send} loading={submitting} disabled={!canSubmit} onClick={handleSubmitPackage}>{submitButtonLabel}</Button>}
            <button
              type="button"
              onClick={() => loadCurrentPackage()}
              disabled={loading}
              className={`group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 text-sm font-bold backdrop-blur-2xl transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'border-white/20 bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_rgba(1,15,35,0.28)] hover:border-cyan-200/40 hover:bg-white/[0.11]' : 'border-white/80 bg-white/55 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_28px_rgba(15,65,90,0.12)] hover:border-cyan-200 hover:bg-white/75'}`}
            >
              <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <span className="pointer-events-none absolute -top-3 left-3 h-8 w-2/3 rounded-full bg-white/10 blur-xl transition-transform duration-300 group-hover:translate-x-2" />
              <RefreshCw className={`relative ${loading ? 'animate-spin' : 'transition-transform duration-300 group-hover:rotate-45'}`} size={17} aria-hidden="true" />
              <span className="relative">Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
            <span className="inline-flex items-start gap-2"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</span>
            <button type="button" className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-red-200 hover:text-white' : 'text-red-700 hover:text-red-900'}`} onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className={`flex min-h-[320px] items-center justify-center rounded-3xl border ${isDarkMode ? 'border-white/10 bg-slate-900/80 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}><span className="inline-flex items-center gap-2 text-sm font-bold"><Loader2 className="animate-spin" size={18} />Loading current forecast package...</span></div>
        ) : !packageData ? (
          <EmptyPackageState isCreating={creating} isDarkMode={isDarkMode} onCreate={handleCreatePackage} message={workspaceSettings.emptyPackageMessage} />
        ) : (
          <div className="space-y-5">
              <PackageSummary chartSequenceHelper={chartSequenceHelper} completion={completion} hasPendingRevisionAction={hasPendingRevisionAction} isDarkMode={isDarkMode} isEditable={isEditable} lockedPackageCopy={lockedPackageCopy} packageData={packageData} packageTitle={packageTitle} submitReadiness={submitReadiness} />

              {isEditable && <ForecastReminderCard packageData={packageData} settings={operationsSettings} isDarkMode={isDarkMode} />}
              <NextActionCard packageData={packageData} completion={completion} isEditable={isEditable} isDarkMode={isDarkMode} pendingRevisionChartTypes={pendingRevisionChartTypes} />

              <section>
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"><h2 className={`text-xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Forecast charts</h2><p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Four required charts · Complete in sequence</p></div>
                <div className="grid gap-3 md:grid-cols-2">
                  {orderedCharts.map((chart, index) => (
                    <ChartCard key={chart.chartType} chart={chart} packageData={packageData} isDarkMode={isDarkMode} isEditable={isEditable} onOpen={(projectId) => navigate(`/studio/${projectId}`)} sequenceNumber={index + 1} />
                  ))}
                </div>
              </section>
          </div>
        )}
      </div>
    </div>
  );
}


