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
    light: 'border-slate-200 bg-slate-100 text-slate-700',
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
  },
  'Under Review': {
    light: 'border-amber-200 bg-amber-50 text-amber-700',
    dark: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  },
  Approved: {
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  Published: {
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  Rejected: {
    light: 'border-rose-200 bg-rose-50 text-rose-700',
    dark: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  },
  'Revision Requested': {
    light: 'border-rose-200 bg-rose-50 text-rose-700',
    dark: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  },
  Archived: {
    light: 'border-slate-200 bg-slate-100 text-slate-600',
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
  },
  Draft: {
    light: 'border-blue-200 bg-blue-50 text-blue-700',
    dark: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  },
};

const PACKAGE_NEXT_STEP = {
  Submitted: 'Start admin review for the submitted charts.',
  'Under Review': 'Continue reviewing the remaining submitted charts.',
  Approved: 'All required charts are approved. This package is ready to publish.',
  Published: 'All package charts have been published as final outputs.',
  'Revision Requested': 'Waiting for forecaster revisions before review can continue.',
  Rejected: 'Package closed by review decision. No publication is expected.',
  Archived: 'Package is archived and no longer active in the review desk.',
  Draft: 'Package is still in production and should not be reviewed yet.',
};

const LOCKED_CHART_ACTION = {
  Approved: 'Approved',
  Published: 'Published output',
  'Revision Requested': 'Needs revision',
  Rejected: 'Closed',
  'No Publication': 'No publication',
  Archived: 'Archived',
  Draft: 'In production',
};

function getChartActionLabel(status) {
  if (REVIEWABLE_PROJECT_STATUSES.has(status)) return 'Review chart';
  return LOCKED_CHART_ACTION[status] || 'Not reviewable';
}

function PackageMetric({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white/70'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</span>
        <Icon size={15} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
      </div>
      <p className={`mt-2 text-2xl font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function ChartRow({ chartRow, isDarkMode, onOpenChart }) {
  const chart = chartRow.project;
  const statusClass = getProjectStatusStyle(chart?.status);
  const canReviewChart = REVIEWABLE_PROJECT_STATUSES.has(chart?.status);

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-slate-200 bg-slate-50/80'}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {CHART_LABELS[chartRow.chartType] || chartRow.chartType || 'Forecast Chart'}
          </p>
          <span className={`inline-flex max-w-full shrink-0 truncate rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>
            {getProjectStatusLabel(chart?.status)}
          </span>
        </div>
        <p className={`mt-1 truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`} title={chart?.name || chart?.title}>
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
  const nextStep = PACKAGE_NEXT_STEP[forecastPackage.status] || 'Review package chart statuses before taking action.';
  const readyChartCount = Math.min(REQUIRED_CHART_COUNT, (forecastPackage.approvedCount || 0) + (forecastPackage.returnedCount || 0));
  const primaryActionLabel = canPublishPackage
    ? 'Publish package'
    : canReviewPackage
      ? 'Review package'
      : forecastPackage.status === 'Published'
        ? 'Published output'
        : forecastPackage.status === 'Revision Requested'
          ? 'Waiting for revision'
          : forecastPackage.status === 'Rejected'
            ? 'Closed package'
            : 'Not reviewable';

  return (
    <article className={`overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
      isDarkMode
        ? isDaily ? 'border-cyan-300/30 bg-slate-900/90 ring-2 ring-cyan-300/15' : 'border-white/10 bg-slate-900/80'
        : isDaily ? 'border-cyan-200 bg-white ring-2 ring-cyan-100' : 'border-slate-200 bg-white'
    }`}>
      <div className={`border-b p-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isDaily && (
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'bg-cyan-300/10 text-cyan-100' : 'bg-cyan-100 text-cyan-700'}`}>
                  Today's package
                </span>
              )}
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${isDarkMode ? statusStyle.dark : statusStyle.light}`}>
                {forecastPackage.status}
              </span>
            </div>
            <h3 className={`mt-3 text-lg font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
              {forecastPackage.title}
            </h3>
            <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {packageDateLabel} · {forecastPackage.ownerLabel} · {forecastPackage.chartCount} chart{forecastPackage.chartCount === 1 ? '' : 's'}
            </p>
            <p className={`mt-2 text-sm font-bold leading-6 ${isDarkMode ? 'text-cyan-100/80' : 'text-slate-700'}`}>
              {nextStep}
            </p>
            <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {readyChartCount}/{REQUIRED_CHART_COUNT} required charts already reviewed or returned.
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
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <PackageMetric icon={Clock3} label="To review" value={forecastPackage.pendingCount} isDarkMode={isDarkMode} />
        <PackageMetric icon={CheckCircle2} label="Approved/Published" value={forecastPackage.approvedCount} isDarkMode={isDarkMode} />
        <PackageMetric icon={forecastPackage.returnedCount > 0 ? XCircle : RotateCcw} label="Returned" value={forecastPackage.returnedCount} isDarkMode={isDarkMode} />
      </div>

      <div className="space-y-2 px-4 pb-4">
        {forecastPackage.charts.map((chartRow) => (
          <ChartRow key={chartRow.project?._id || chartRow.project?.id || chartRow.chartType} chartRow={chartRow} isDarkMode={isDarkMode} onOpenChart={(chart) => onOpenChart?.(chart, forecastPackage)} />
        ))}
      </div>
    </article>
  );
}
