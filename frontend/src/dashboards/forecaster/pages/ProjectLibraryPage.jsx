import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, Loader2, Plus, RefreshCw, Send } from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  createForecastPackage,
  fetchCurrentForecastPackage,
  submitForecastPackage,
  updateForecastChartCompletion,
} from '@/api/forecastPackageAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import ForecastReminderCard from '../components/ForecastReminderCard';
import useForecasterWorkspaceSettings from '../hooks/useForecasterWorkspaceSettings';

const FORECAST_TIME_ZONE = 'Asia/Manila';
const REQUIRED_CHART_SEQUENCE = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];
const EDITABLE_PACKAGE_STATUSES = new Set(['Draft', 'Revision Requested']);
const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2}$/;

const REQUIRED_CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Wave Forecast',
  forecast_36h: '36h Wave Forecast',
  forecast_48h: '48h Wave Forecast',
};

const CHART_DEADLINE_FIELDS = {
  analysis: 'waveAnalysisDeadlineMinutes',
  forecast_24h: 'forecast24DeadlineMinutes',
  forecast_36h: 'forecast36DeadlineMinutes',
  forecast_48h: 'forecast48DeadlineMinutes',
};

const DEFAULT_OPERATIONS_SETTINGS = {
  packageOpenTime: '06:00',
  deadlineWarningMinutes: 60,
  timezone: FORECAST_TIME_ZONE,
  waveAnalysisDeadlineMinutes: 90,
  forecast24DeadlineMinutes: 120,
  forecast36DeadlineMinutes: 150,
  forecast48DeadlineMinutes: 180,
};

const CHART_METADATA = {
  analysis: {
    code: 'ANL',
    horizon: 'Current state',
    mandate: 'Establish observed sea-state baseline and active wave systems.',
    checkpoint: 'Validate latest analysis before forecast progression.',
  },
  forecast_24h: {
    code: '+24H',
    horizon: 'Day 1 outlook',
    mandate: 'Prepare near-term operational guidance for the next 24 hours.',
    checkpoint: 'Confirm timing, extent, and intensity of expected wave conditions.',
  },
  forecast_36h: {
    code: '+36H',
    horizon: 'Extended outlook',
    mandate: 'Extend the forecast package through the intermediate marine window.',
    checkpoint: 'Check continuity against the 24h and 48h forecast frames.',
  },
  forecast_48h: {
    code: '+48H',
    horizon: 'Day 2 outlook',
    mandate: 'Finalize the two-day operational forecast horizon.',
    checkpoint: 'Confirm downstream hazards and publication readiness.',
  },
};

function parseTimeToMinutes(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function getZonedMinutes(date, timezone = FORECAST_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone || FORECAST_TIME_ZONE,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  const hours = Number(getPart('hour'));
  const minutes = Number(getPart('minute'));

  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function normalizeOperationsSettings(settings = {}) {
  return { ...DEFAULT_OPERATIONS_SETTINGS, ...(settings || {}) };
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

function formatClockFromMinutes(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return '';
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function getUserDisplayName(user) {
  if (!user || typeof user === 'string') return '';
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.email || '';
}

function getActiveEditorNames(chart) {
  const names = (Array.isArray(chart?.activeEditors) ? chart.activeEditors : [])
    .map((editor) => getUserDisplayName(editor?.user))
    .filter(Boolean);
  const legacyName = getUserDisplayName(chart?.claimedBy);
  if (legacyName && !names.includes(legacyName)) names.push(legacyName);
  return names;
}

function formatNameList(names) {
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
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

function getChartCompletion(packageData, chartType) {
  return packageData?.chartCompletion?.find((row) => row.chartType === chartType);
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

function sortChartsBySequence(charts = []) {
  return [...charts].sort((left, right) => {
    const leftIndex = REQUIRED_CHART_SEQUENCE.indexOf(left.chartType);
    const rightIndex = REQUIRED_CHART_SEQUENCE.indexOf(right.chartType);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

function getChartDeadlineState({ chartType, packageData, operations, now, isComplete, isQueued }) {
  const field = CHART_DEADLINE_FIELDS[chartType];
  const deadlineOffset = Number(operations?.[field]);
  const openMinutes = parseTimeToMinutes(operations?.packageOpenTime);
  const timezone = operations?.timezone || FORECAST_TIME_ZONE;
  const nowMinutes = getZonedMinutes(now, timezone);

  if (!field || openMinutes === null || !Number.isFinite(deadlineOffset) || nowMinutes === null) {
    return null;
  }

  const dueMinutes = openMinutes + deadlineOffset;
  const dueClock = formatClockFromMinutes(dueMinutes);
  const warningWindow = Math.max(0, Math.min(Number(operations?.deadlineWarningMinutes ?? 30), 30));
  const minutesUntilDue = dueMinutes - nowMinutes;

  if (isComplete) {
    return {
      tone: 'complete',
      label: 'Ready',
      detail: `Was due ${dueClock}`,
      dueClock,
      minutesUntilDue,
    };
  }

  if (isQueued) {
    return {
      tone: 'queued',
      label: `Due ${dueClock}`,
      detail: 'Waiting for previous chart',
      dueClock,
      minutesUntilDue,
    };
  }

  if (minutesUntilDue <= 0) {
    return {
      tone: 'overdue',
      label: `Overdue ${formatDuration(Math.abs(minutesUntilDue))}`,
      detail: `Due ${dueClock}`,
      dueClock,
      minutesUntilDue,
    };
  }

  if (warningWindow && minutesUntilDue <= warningWindow) {
    return {
      tone: 'dueSoon',
      label: `Due in ${formatDuration(minutesUntilDue)}`,
      detail: `Due ${dueClock}`,
      dueClock,
      minutesUntilDue,
    };
  }

  return {
    tone: 'scheduled',
    label: `Due ${dueClock}`,
    detail: `${formatDuration(minutesUntilDue)} left`,
    dueClock,
    minutesUntilDue,
  };
}

function getChartDeadlineStates(packageData, operations, now) {
  return REQUIRED_CHART_SEQUENCE.reduce((acc, chartType) => {
    const isComplete = isChartComplete(packageData, chartType);
    const isQueued = Boolean(getFirstIncompletePrerequisite(packageData, chartType)) && !isComplete;
    acc[chartType] = getChartDeadlineState({ chartType, packageData, operations, now, isComplete, isQueued });
    return acc;
  }, {});
}

function getDeadlineSummary(deadlineStates) {
  const states = Object.entries(deadlineStates || {})
    .map(([chartType, state]) => ({ chartType, ...state }))
    .filter((state) => state?.tone && !['complete', 'queued'].includes(state.tone));

  const overdue = states
    .filter((state) => state.tone === 'overdue')
    .sort((left, right) => left.minutesUntilDue - right.minutesUntilDue);

  if (overdue.length) {
    const first = overdue[0];
    return {
      tone: 'overdue',
      count: overdue.length,
      value: `${overdue.length} late`,
      detail: `${REQUIRED_CHART_LABELS[first.chartType]} is ${formatDuration(Math.abs(first.minutesUntilDue))} overdue`,
      chartType: first.chartType,
    };
  }

  const dueSoon = states
    .filter((state) => state.tone === 'dueSoon')
    .sort((left, right) => left.minutesUntilDue - right.minutesUntilDue);

  if (dueSoon.length) {
    const first = dueSoon[0];
    return {
      tone: 'dueSoon',
      count: dueSoon.length,
      value: 'Due soon',
      detail: `${REQUIRED_CHART_LABELS[first.chartType]} due in ${formatDuration(first.minutesUntilDue)}`,
      chartType: first.chartType,
    };
  }

  return {
    tone: 'onTrack',
    count: 0,
    value: 'On track',
    detail: 'No chart deadline warnings',
    chartType: null,
  };
}

function getNextAction(packageData, completion, isEditable, deadlineSummary) {
  if (!packageData) return 'Create today\'s package to generate the four required forecast charts.';
  if (!isEditable) return `Package is ${packageData.status}. Charts are locked until Admin requests a revision.`;

  if (deadlineSummary?.tone === 'overdue' && deadlineSummary.chartType) {
    return `${REQUIRED_CHART_LABELS[deadlineSummary.chartType]} is overdue. Complete or certify this chart before continuing the package sequence.`;
  }

  if (deadlineSummary?.tone === 'dueSoon' && deadlineSummary.chartType) {
    return `${REQUIRED_CHART_LABELS[deadlineSummary.chartType]} is due soon. Finish it first to keep the package on schedule.`;
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
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'}`}>
      {status || 'Draft'}
    </span>
  );
}

function MetricCard({ label, value, detail, icon: Icon, isDarkMode, tone = 'default' }) {
  const toneClass = tone === 'overdue'
    ? isDarkMode ? 'border-red-300/25 bg-red-950/25' : 'border-red-200 bg-red-50'
    : tone === 'dueSoon'
      ? isDarkMode ? 'border-amber-300/25 bg-amber-950/20' : 'border-amber-200 bg-amber-50'
      : isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-slate-50';
  const iconClass = tone === 'overdue'
    ? 'text-red-400'
    : tone === 'dueSoon'
      ? 'text-amber-400'
      : isDarkMode ? 'text-cyan-300' : 'text-blue-600';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
          <p className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
        </div>
        {Icon && <Icon className={iconClass} size={20} />}
      </div>
      {detail && <p className={`mt-2 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{detail}</p>}
    </div>
  );
}

function WorkflowStep({ number, title, description, active, done, isDarkMode }) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${done ? 'bg-emerald-500 text-white' : active ? 'bg-cyan-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
        {done ? <CheckCircle2 size={16} /> : number}
      </div>
      <div>
        <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
        <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      </div>
    </div>
  );
}

function OperationsPanel({ packageData, completion, isEditable, isDarkMode, workspaceSettings, deadlineSummary }) {
  const nextAction = getNextAction(packageData, completion, isEditable, deadlineSummary);
  const isSubmittedOrLater = packageData && !isEditable;
  const briefToneClass = deadlineSummary?.tone === 'overdue'
    ? isDarkMode ? 'border-red-300/25 bg-red-950/25' : 'border-red-200 bg-red-50'
    : deadlineSummary?.tone === 'dueSoon'
      ? isDarkMode ? 'border-amber-300/25 bg-amber-950/20' : 'border-amber-200 bg-amber-50'
      : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white';

  return (
    <aside className="space-y-4">
      <ForecastReminderCard packageData={packageData} settings={workspaceSettings} isDarkMode={isDarkMode} />

      <section className={`rounded-3xl border p-5 shadow-sm ${briefToneClass}`}>
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${deadlineSummary?.tone === 'overdue' ? 'text-red-300' : deadlineSummary?.tone === 'dueSoon' ? 'text-amber-300' : isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>Operations Brief</p>
        <h3 className={`mt-3 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Next best action</h3>
        <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{nextAction}</p>
      </section>

      <section className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Workflow</p>
        <div className="mt-4 space-y-5">
          <WorkflowStep number="1" title="Analyze current seas" description="Finish Wave Analysis before opening the forecast horizons." active={isEditable && getNextIncompleteChartType(packageData) === 'analysis'} done={isChartComplete(packageData, 'analysis') || isSubmittedOrLater} isDarkMode={isDarkMode} />
          <WorkflowStep number="2" title="Build forecast sequence" description="Certify 24h, then 36h, then 48h so each frame has a verified baseline." active={isEditable && !completion.isComplete && getNextIncompleteChartType(packageData) !== 'analysis'} done={completion.isComplete || isSubmittedOrLater} isDarkMode={isDarkMode} />
          <WorkflowStep number="3" title="Submit package" description="Submit once all four charts are complete and no forecaster is still editing." active={isEditable && completion.isComplete} done={isSubmittedOrLater} isDarkMode={isDarkMode} />
        </div>
      </section>
    </aside>
  );
}

function ChartDeadlineBadge({ state, isDarkMode }) {
  if (!state) return null;

  const classes = {
    complete: isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    overdue: isDarkMode ? 'border-red-300/25 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700',
    dueSoon: isDarkMode ? 'border-amber-300/25 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800',
    queued: isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500',
    scheduled: isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200' : 'border-blue-100 bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${classes[state.tone] || classes.scheduled}`} title={state.detail}>
      {state.label}
    </span>
  );
}

function ChartCard({ chart, packageData, isDarkMode, isEditable, isUpdating, onOpen, onToggleComplete, deadlineState }) {
  const chartType = chart?.chartType;
  const completion = getChartCompletion(packageData, chartType);
  const projectId = getChartProjectId(chart);
  const isComplete = Boolean(completion?.isComplete);
  const blockingChartType = getFirstIncompletePrerequisite(packageData, chartType);
  const isQueued = Boolean(blockingChartType) && !isComplete;
  const activeEditorNames = getActiveEditorNames(chart);
  const activeEditorText = formatNameList(activeEditorNames);
  const readyByName = getUserDisplayName(chart?.readyBy || completion?.completedBy);
  const metadata = CHART_METADATA[chartType] || { code: 'CHT', horizon: 'Forecast chart', mandate: 'Prepare and verify this forecast chart.', checkpoint: 'Confirm readiness before package submission.' };
  const hasActiveEditors = activeEditorNames.length > 0;
  const canToggle = isEditable && !isQueued && !isUpdating;
  const canOpen = Boolean(projectId && !isQueued);
  const isOverdue = deadlineState?.tone === 'overdue';
  const isDueSoon = deadlineState?.tone === 'dueSoon';
  const accentClass = isComplete ? 'bg-emerald-400' : isOverdue ? 'bg-red-400' : isDueSoon ? 'bg-amber-400' : isQueued ? 'bg-slate-600' : hasActiveEditors ? 'bg-amber-400' : 'bg-cyan-400';
  const statusLabel = isComplete ? 'Ready for review' : isQueued ? 'Queued' : isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : 'In production';
  const statusClass = isComplete
    ? 'bg-emerald-500/10 text-emerald-500'
    : isQueued
      ? isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
      : isOverdue
        ? isDarkMode ? 'bg-red-400/10 text-red-200' : 'bg-red-50 text-red-700'
        : isDueSoon
          ? isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-800'
          : hasActiveEditors
            ? isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700'
            : isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700';
  const collaborationLabel = isComplete
    ? readyByName ? `Certified by ${readyByName}` : 'Certified ready'
    : hasActiveEditors ? `Editing by ${activeEditorText}` : 'No active editors';
  const collaborationClass = isComplete
    ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : hasActiveEditors
      ? isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
      : isDarkMode ? 'border-white/10 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-white text-slate-600';

  return (
    <article className={`group relative overflow-hidden rounded-3xl border shadow-sm transition duration-200 ${isQueued ? 'opacity-75' : 'hover:-translate-y-0.5 hover:shadow-xl'} ${isOverdue ? isDarkMode ? 'border-red-300/25 bg-slate-900/85 hover:border-red-300/40' : 'border-red-200 bg-white hover:border-red-300' : isDarkMode ? 'border-white/10 bg-slate-900/85 hover:border-cyan-300/30' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
      <div className={`h-1 w-full ${accentClass}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black tracking-[0.14em] ${isDarkMode ? 'bg-slate-950 text-cyan-200 ring-1 ring-white/10' : 'bg-slate-100 text-blue-700'}`}>{metadata.code}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClass}`}>{statusLabel}</span>
              <ChartDeadlineBadge state={deadlineState} isDarkMode={isDarkMode} />
            </div>
            <h4 className={`mt-4 text-lg font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-950'}`}>{REQUIRED_CHART_LABELS[chartType] || chartType}</h4>
            <p className={`mt-1 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{metadata.horizon}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isComplete ? 'bg-emerald-500/10 text-emerald-500' : isOverdue ? 'bg-red-500/10 text-red-400' : isQueued ? isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500' : isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}>
            {isComplete ? <CheckCircle2 size={22} /> : <ClipboardList size={22} />}
          </div>
        </div>

        <div className={`mt-5 rounded-2xl border p-4 ${isOverdue ? isDarkMode ? 'border-red-300/20 bg-red-950/15' : 'border-red-100 bg-red-50/60' : isDarkMode ? 'border-white/10 bg-slate-950/55' : 'border-slate-100 bg-slate-50'}`}>
          <div className={`mb-4 inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-black ${collaborationClass}`}><span className="truncate">{collaborationLabel}</span></div>
          <p className={`text-sm leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{metadata.mandate}</p>
          <div className={`mt-4 border-t pt-3 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{isQueued ? 'Prerequisite required' : isOverdue ? 'Chart deadline missed' : isDueSoon ? 'Chart deadline approaching' : hasActiveEditors && !isComplete ? 'Active editors' : 'Readiness checkpoint'}</p>
            <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{isQueued ? `Complete ${REQUIRED_CHART_LABELS[blockingChartType]} before starting this chart.` : isOverdue ? `${deadlineState.detail}. Certify this chart before continuing.` : isDueSoon ? `${deadlineState.detail}. Finish this chart first.` : hasActiveEditors && !isComplete ? `${activeEditorText} ${activeEditorNames.length === 1 ? 'is' : 'are'} currently editing this chart.` : metadata.checkpoint}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button className="w-full sm:w-auto" size="sm" variant={isQueued ? 'secondary' : 'primary'} disabled={!canOpen} onClick={() => canOpen && onOpen(projectId)}>
            {isQueued ? `Waiting for ${REQUIRED_CHART_LABELS[blockingChartType]}` : isComplete ? 'Review chart' : 'Open chart'}
          </Button>
          <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition ${isComplete ? 'text-emerald-500 hover:bg-emerald-500/10' : isQueued ? isDarkMode ? 'text-slate-500' : 'text-slate-500' : isOverdue ? 'text-red-400 hover:bg-red-500/10' : isDarkMode ? 'text-cyan-200 hover:bg-cyan-400/10' : 'text-blue-700 hover:bg-blue-50'} disabled:cursor-not-allowed disabled:opacity-50`} disabled={!canToggle} onClick={() => onToggleComplete(chartType, !isComplete)} aria-pressed={isComplete}>
            {isUpdating ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            {isQueued ? 'Locked by sequence' : isComplete ? 'Ready' : hasActiveEditors ? 'Finish in Studio' : 'Certify ready'}
          </button>
        </div>
      </div>
    </article>
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
  const [updatingChartType, setUpdatingChartType] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const operationsSettings = useMemo(() => normalizeOperationsSettings(workspaceSettings.operations), [workspaceSettings.operations]);
  const completion = useMemo(() => getCompletion(packageData), [packageData]);
  const packageId = getPackageId(packageData);
  const orderedCharts = useMemo(() => sortChartsBySequence(packageData?.charts || []), [packageData?.charts]);
  const deadlineStates = useMemo(() => getChartDeadlineStates(packageData, operationsSettings, now), [packageData, operationsSettings, now]);
  const deadlineSummary = useMemo(() => getDeadlineSummary(deadlineStates), [deadlineStates]);
  const isEditable = EDITABLE_PACKAGE_STATUSES.has(packageData?.status || 'Draft');
  const canSubmit = Boolean(packageId && isEditable && completion.isComplete && !submitting);
  const packageTitle = getPackageTitle(packageData);
  const chartSequenceHelper = workspaceSettings.chartSequenceHelperMessage || 'Follow the production order: Wave Analysis, 24h, 36h, then 48h. Forecasters can co-edit; readiness waits until active editors release.';

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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

  const handleToggleChartComplete = async (chartType, isComplete) => {
    if (!packageId || !chartType || updatingChartType) return;
    const blockingChartType = isComplete ? getFirstIncompletePrerequisite(packageData, chartType) : null;
    if (blockingChartType) {
      setError(`${REQUIRED_CHART_LABELS[blockingChartType]} must be certified before ${REQUIRED_CHART_LABELS[chartType]}.`);
      return;
    }
    setUpdatingChartType(chartType);
    setError('');
    try {
      const updatedPackage = await updateForecastChartCompletion(packageId, chartType, isComplete);
      setPackageData(getPackagePayload(updatedPackage));
    } catch (err) {
      console.error('Failed to update chart completion:', err);
      setError(err?.message || 'Failed to update chart completion.');
    } finally {
      setUpdatingChartType(null);
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
    <div className={`min-h-full transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>Forecaster Workspace</p>
            <h1 className={`mt-2 text-2xl font-black sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Current Forecast Package</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Complete the daily forecast sequence from analysis through the 48-hour outlook.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {packageData && <Button icon={Send} loading={submitting} disabled={!canSubmit} onClick={handleSubmitPackage}>Submit Forecast Package</Button>}
            <Button variant="secondary" icon={RefreshCw} onClick={() => loadCurrentPackage()} disabled={loading}>Refresh</Button>
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><StatusPill status={packageData.status} isDarkMode={isDarkMode} /><span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatForecastDate(packageData.forecastDate)}</span></div>
                    <h2 className={`mt-3 text-xl font-black sm:text-2xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{packageTitle}</h2>
                    <p className={`mt-1 max-w-3xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{completion.isComplete ? 'All required charts are complete. Submit the package for admin review when no forecasters are still editing.' : chartSequenceHelper}</p>
                    {!isEditable && <p className={`mt-2 text-xs font-bold ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>This package is locked while it is {packageData.status}.</p>}
                  </div>
                  <div className={`w-full rounded-2xl border p-4 lg:max-w-[240px] ${isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Completion</p>
                    <div className="mt-2 flex items-end gap-2"><span className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{completion.percentage}%</span><span className={`pb-1 text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{completion.completed}/{completion.required} charts</span></div>
                    <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}><div className="h-full rounded-full bg-cyan-500" style={{ width: `${completion.percentage}%` }} /></div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Forecast date" value={formatForecastDateKey(packageData.forecastDate) || 'Today'} detail="Philippines operational day" icon={CalendarDays} isDarkMode={isDarkMode} />
                <MetricCard label="Current step" value={REQUIRED_CHART_LABELS[getNextIncompleteChartType(packageData)] || 'Submit'} detail={completion.isComplete ? 'Ready for admin review' : 'Next chart in sequence'} icon={CheckCircle2} isDarkMode={isDarkMode} />
                <MetricCard label="Chart deadlines" value={deadlineSummary.value} detail={deadlineSummary.detail} icon={ClipboardList} isDarkMode={isDarkMode} tone={deadlineSummary.tone} />
                <MetricCard label="Review gate" value={completion.isComplete ? 'Open' : 'Blocked'} detail={completion.isComplete ? 'Submission enabled after editors release' : 'Complete sequence first'} icon={Send} isDarkMode={isDarkMode} />
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3"><div><p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Required Charts</p><h3 className={`mt-1 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Sequential forecast production board</h3></div></div>
                <div className="grid gap-4 md:grid-cols-2">
                  {orderedCharts.map((chart) => (
                    <ChartCard key={chart.chartType} chart={chart} packageData={packageData} isDarkMode={isDarkMode} isEditable={isEditable} isUpdating={updatingChartType === chart.chartType} deadlineState={deadlineStates[chart.chartType]} onOpen={(projectId) => navigate(`/studio/${projectId}`)} onToggleComplete={handleToggleChartComplete} />
                  ))}
                </div>
              </section>
            </div>
            <OperationsPanel packageData={packageData} completion={completion} isEditable={isEditable} isDarkMode={isDarkMode} workspaceSettings={workspaceSettings} deadlineSummary={deadlineSummary} />
          </div>
        )}
      </div>
    </div>
  );
}
