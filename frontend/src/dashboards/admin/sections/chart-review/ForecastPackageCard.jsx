import { CheckCircle2, Clock3, ExternalLink, PackageCheck, RotateCcw, XCircle } from 'lucide-react';

import Button from '@/components/ui/Button';
import { CHART_LABELS, formatPackageDate, isDailyForecastPackage } from '@/features/projects/utils/forecastPackageGrouping';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';

const REVIEWABLE_PACKAGE_STATUSES = new Set(['Submitted', 'Under Review']);
const REVIEWABLE_PROJECT_STATUSES = new Set(['Submitted', 'Under Review']);
const PUBLISHABLE_PACKAGE_STATUSES = new Set(['Approved']);
const REQUIRED_CHART_COUNT = 4;

const PACKAGE_STATUS_STYLES = {
  Submitted: {
    light: 'border-sky-200 bg-sky-50/85 text-sky-700',
    dark: 'border-sky-300/20 bg-sky-400/10 text-sky-200',
  },
  'Under Review': {
    light: 'border-amber-200 bg-amber-50/85 text-amber-700',
    dark: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  },
  Approved: {
    light: 'border-emerald-200 bg-emerald-50/85 text-emerald-700',
    dark: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  },
  Published: {
    light: 'border-teal-200 bg-teal-50/85 text-teal-700',
    dark: 'border-teal-300/25 bg-teal-400/10 text-teal-200',
  },
  Rejected: {
    light: 'border-rose-200 bg-rose-50/85 text-rose-700',
    dark: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
  },
  'Revision Requested': {
    light: 'border-amber-200 bg-amber-50/85 text-amber-700',
    dark: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  },
  Archived: {
    light: 'border-slate-200 bg-slate-100/80 text-slate-600',
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
  },
  Draft: {
    light: 'border-slate-200 bg-slate-100/80 text-slate-600',
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
  },
};

const PACKAGE_NEXT_STEP = {
  Submitted: 'Ready for admin review',
  'Under Review': 'Review in progress',
  Approved: 'Ready to publish',
  Published: 'Published',
  'Revision Requested': 'Waiting for revision',
  Rejected: 'Closed',
  Archived: 'Archived',
  Draft: 'In production',
};

const LOCKED_CHART_ACTION = {
  Approved: 'Approved',
  Published: 'Published',
  'Revision Requested': 'Needs revision',
  Rejected: 'Closed',
  'No Publication': 'No publication',
  Archived: 'Archived',
  Draft: 'In production',
};

function getChartActionLabel(status) {
  if (REVIEWABLE_PROJECT_STATUSES.has(status)) return 'Review';
  return LOCKED_CHART_ACTION[status] || 'Unavailable';
}

function Metric({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-white/80 bg-white/60'}`}>
      <Icon size={15} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <span className={`ml-auto text-sm font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{value}</span>
    </div>
  );
}

function ChartRow({ chartRow, isDarkMode, onOpenChart }) {
  const chart = chartRow.project;
  const statusClass = getProjectStatusStyle(chart?.status);
  const canReviewChart = REVIEWABLE_PROJECT_STATUSES.has(chart?.status);

  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 ${isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-white/80 bg-white/55'}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`truncate text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {CHART_LABELS[chartRow.chartType] || chartRow.chartType || 'Forecast Chart'}
          </p>
          <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass}`}>
            {getProjectStatusLabel(chart?.status)}
          </span>
        </div>
        <p className={`mt-0.5 truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`} title={chart?.name || chart?.title}>
          {chart?.name || chart?.title || 'Untitled chart'}
        </p>
      </div>

      <Button size="sm" variant="secondary" icon={ExternalLink} disabled={!canReviewChart} onClick={() => canReviewChart && onOpenChart?.(chart)}>
        {getChartActionLabel(chart?.status)}
      </Button>
    </div>
  );
}

export default function ForecastPackageCard({ forecastPackage, isDarkMode, onOpenChart, onPublishPackage, publishingPackageId }) {
  const isDaily = isDailyForecastPackage(forecastPackage);
  const statusStyle = PACKAGE_STATUS_STYLES[forecastPackage.status] ?? PACKAGE_STATUS_STYLES.Draft;
  const packageDateLabel = forecastPackage.dateKey ? formatPackageDate(forecastPackage.dateKey) : 'Unscheduled';
  const canReviewPackage = REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status) && Boolean(forecastPackage.primaryChart);
  const canPublishPackage = PUBLISHABLE_PACKAGE_STATUSES.has(forecastPackage.status);
  const isPublishing = publishingPackageId === forecastPackage.id;
  const reviewedCount = Math.min(REQUIRED_CHART_COUNT, (forecastPackage.approvedCount || 0) + (forecastPackage.returnedCount || 0));
  const progressPercent = Math.round((reviewedCount / REQUIRED_CHART_COUNT) * 100);
  const primaryActionLabel = canPublishPackage
    ? 'Publish package'
    : canReviewPackage
      ? forecastPackage.status === 'Submitted' ? 'Start review' : 'Continue review'
      : PACKAGE_NEXT_STEP[forecastPackage.status] || 'Unavailable';

  return (
    <article className={`overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl transition-shadow hover:shadow-2xl ${
      isDarkMode
        ? isDaily ? 'border-cyan-300/20 bg-slate-950/52 shadow-black/20' : 'border-white/10 bg-slate-950/48 shadow-black/20'
        : isDaily ? 'border-cyan-200/80 bg-white/72 shadow-cyan-900/10' : 'border-white/75 bg-white/68 shadow-slate-300/35'
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isDaily && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'}`}>
                  Today
                </span>
              )}
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? statusStyle.dark : statusStyle.light}`}>
                {forecastPackage.status}
              </span>
            </div>

            <h2 className={`mt-3 truncate text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={forecastPackage.title}>
              {forecastPackage.title}
            </h2>
            <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {packageDateLabel} · {forecastPackage.ownerLabel || 'Forecast team'}
            </p>
          </div>

          <Button icon={PackageCheck} disabled={isPublishing || (!canReviewPackage && !canPublishPackage)} onClick={() => {
            if (canPublishPackage) {
              onPublishPackage?.(forecastPackage);
              return;
            }
            if (canReviewPackage) onOpenChart?.(forecastPackage.primaryChart, forecastPackage);
          }}>
            {isPublishing ? 'Publishing...' : primaryActionLabel}
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{PACKAGE_NEXT_STEP[forecastPackage.status] || 'Review package status'}</span>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{reviewedCount}/{REQUIRED_CHART_COUNT} reviewed</span>
          </div>
          <div className={`mt-2 h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200/80'}`}>
            <div className="h-full rounded-full bg-cyan-500 transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Metric icon={Clock3} label="To review" value={forecastPackage.pendingCount} isDarkMode={isDarkMode} />
          <Metric icon={CheckCircle2} label="Approved" value={forecastPackage.approvedCount} isDarkMode={isDarkMode} />
          <Metric icon={forecastPackage.returnedCount > 0 ? XCircle : RotateCcw} label="Returned" value={forecastPackage.returnedCount} isDarkMode={isDarkMode} />
        </div>
      </div>

      <div className={`border-t p-4 ${isDarkMode ? 'border-white/10 bg-white/[0.018]' : 'border-white/70 bg-white/30'}`}>
        <div className="space-y-2">
          {forecastPackage.charts.map((chartRow) => (
            <ChartRow key={chartRow.project?._id || chartRow.project?.id || chartRow.chartType} chartRow={chartRow} isDarkMode={isDarkMode} onOpenChart={(chart) => onOpenChart?.(chart, forecastPackage)} />
          ))}
        </div>
      </div>
    </article>
  );
}
