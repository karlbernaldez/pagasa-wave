import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageCheck,
  UsersRound,
  Waves,
  X,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { CHART_LABELS, formatPackageDate } from '@/features/forecasts/forecastPackageViewModel';

const REVIEWABLE_PACKAGE_STATUSES = new Set(['Submitted', 'Under Review']);
const PUBLISHABLE_PACKAGE_STATUSES = new Set(['Approved']);
const REQUIRED_CHART_COUNT = 4;

const STATUS_STYLES = {
  Submitted: {
    dark: 'border-sky-300/25 bg-sky-400/10 text-sky-200',
    light: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  'Under Review': {
    dark: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
    light: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  Approved: {
    dark: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  Published: {
    dark: 'border-teal-300/25 bg-teal-400/10 text-teal-200',
    light: 'border-teal-200 bg-teal-50 text-teal-700',
  },
  'Revision Requested': {
    dark: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
    light: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  Rejected: {
    dark: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
    light: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  Draft: {
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
    light: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  Archived: {
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
    light: 'border-slate-200 bg-slate-100 text-slate-600',
  },
};

function SummaryStat({ icon: Icon, label, value, title, isDarkMode }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 backdrop-blur-xl ${isDarkMode ? 'border-cyan-200/15 bg-white/[0.035]' : 'border-white/80 bg-white/58'}`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-cyan-100 bg-cyan-50 text-cyan-700'}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p
          className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
        >
          {label}
        </p>
        <p
          className={`mt-1 truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          title={title || value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function getChartActionLabel(status, isReviewablePackage) {
  if (status === 'Approved') return 'View approved chart';
  if (status === 'Published') return 'View published chart';
  if (status === 'Revision Requested') return 'Review requested changes';
  if (status === 'Under Review') return 'Continue review';
  if (status === 'Submitted') return 'Start review';
  return isReviewablePackage ? 'Review chart' : 'View chart';
}

function PackageSummaryModal({ forecastPackage, isDarkMode, onClose, onOpenChart }) {
  const dateLabel = forecastPackage.dateKey
    ? formatPackageDate(forecastPackage.dateKey)
    : 'Unscheduled';
  const isReviewablePackage = REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status);
  const chartCount = forecastPackage.chartCount || forecastPackage.charts?.length || 0;
  const contributorLabel = forecastPackage.contributorLabel || 'No recorded contributors';
  const contributorTitle = (forecastPackage.contributorNames || []).join(', ') || contributorLabel;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modal = (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl ${isDarkMode ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.15),transparent_40%),rgba(1,10,24,.78)]' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.14),transparent_42%),rgba(226,240,248,.72)]'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`package-${forecastPackage.id}-title`}
    >
      <div
        className={`relative w-full max-w-5xl overflow-hidden rounded-2xl border shadow-2xl ring-1 backdrop-blur-3xl ${isDarkMode ? 'border-cyan-200/20 bg-[#06203a]/84 text-white shadow-black/50 ring-white/[0.06]' : 'border-white/85 bg-white/76 text-slate-950 shadow-slate-900/20 ring-slate-900/[0.04]'}`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-40 ${isDarkMode ? 'bg-[radial-gradient(circle_at_70%_0%,rgba(56,189,248,.16),transparent_45%)]' : 'bg-[radial-gradient(circle_at_70%_0%,rgba(14,165,233,.12),transparent_45%)]'}`}
        />

        <header
          className={`relative flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-7 sm:py-6 ${isDarkMode ? 'border-white/10' : 'border-white/70'}`}
        >
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-cyan-100 bg-cyan-50 text-cyan-700'}`}
            >
              <Waves size={24} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
              >
                Forecast package
              </p>
              <h2
                id={`package-${forecastPackage.id}-title`}
                className="mt-2 truncate text-3xl font-black tracking-tight"
              >
                {dateLabel}
              </h2>
              <p
                className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
              >
                {forecastPackage.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close package summary"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-cyan-200/30 hover:bg-white/[0.1] hover:text-white' : 'border-white/80 bg-white/65 text-slate-500 hover:bg-white'}`}
          >
            <X size={20} />
          </button>
        </header>

        <div className="relative p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryStat
              icon={CheckCircle2}
              label="Status"
              value={forecastPackage.status}
              isDarkMode={isDarkMode}
            />
            <SummaryStat
              icon={UsersRound}
              label="Contributors"
              value={contributorLabel}
              title={contributorTitle}
              isDarkMode={isDarkMode}
            />
            <SummaryStat
              icon={BarChart3}
              label="Charts"
              value={`${chartCount} available`}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className={`my-6 h-px ${isDarkMode ? 'bg-white/10' : 'bg-white/80'}`} />

          <div className="mb-4 flex items-center gap-3">
            <Waves size={22} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
            <div>
              <p
                className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
              >
                Package charts
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {isReviewablePackage
                  ? 'Choose the chart you want to review.'
                  : 'Choose the chart you want to view.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(forecastPackage.charts || []).map((chartRow) => {
              const chart = chartRow.project;
              const chartId = chart?._id || chart?.id;
              const chartStatus = chart?.status || 'Draft';
              const chartStatusStyle = STATUS_STYLES[chartStatus] || STATUS_STYLES.Draft;
              const actionLabel = getChartActionLabel(chartStatus, isReviewablePackage);
              const Icon = chartRow.chartType === 'analysis' ? Waves : Clock3;

              return (
                <button
                  key={chartId || chartRow.chartType}
                  type="button"
                  disabled={!chartId}
                  onClick={() => {
                    if (!chartId) return;
                    onClose();
                    onOpenChart?.(chart, forecastPackage);
                  }}
                  className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition ${chartId ? (isDarkMode ? 'border-cyan-200/15 bg-white/[0.035] hover:border-cyan-300/40 hover:bg-cyan-300/[0.08]' : 'border-white/80 bg-white/55 hover:border-cyan-200 hover:bg-white/85') : 'cursor-not-allowed border-transparent opacity-45'}`}
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-cyan-100 bg-cyan-50 text-cyan-700'}`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-base font-black">
                        {CHART_LABELS[chartRow.chartType] || chartRow.chartType || 'Forecast chart'}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${isDarkMode ? chartStatusStyle.dark : chartStatusStyle.light}`}
                      >
                        {chartStatus}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                      {chart?.name || chart?.title || 'Chart unavailable'}
                    </span>
                    {chartId && (
                      <span
                        className={`mt-3 block text-xs font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                      >
                        {actionLabel}
                      </span>
                    )}
                  </span>
                  {chartId && (
                    <ArrowRight
                      size={18}
                      className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} transition-transform group-hover:translate-x-1`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            className={`mt-6 flex items-center gap-3 border-t pt-4 text-xs font-semibold ${isDarkMode ? 'border-white/10 text-slate-500' : 'border-white/80 text-slate-500'}`}
          >
            <PackageCheck size={16} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
            <span>
              PAGASA · Philippine Atmospheric, Geophysical and Astronomical Services Administration
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body);
}

export default function ForecastPackageCard({
  forecastPackage,
  isDarkMode,
  onOpenChart,
  onPublishPackage,
  publishingPackageId,
}) {
  const [showPackageSummary, setShowPackageSummary] = useState(false);
  const canReview =
    REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status) &&
    Boolean(forecastPackage.primaryChart);
  const canPublish = PUBLISHABLE_PACKAGE_STATUSES.has(forecastPackage.status);
  const canViewPublished =
    forecastPackage.status === 'Published' &&
    (forecastPackage.charts || []).some((row) => row.project?._id || row.project?.id);
  const isPublishing = publishingPackageId === forecastPackage.id;
  const reviewedCount = Math.min(
    REQUIRED_CHART_COUNT,
    (forecastPackage.approvedCount || 0) + (forecastPackage.returnedCount || 0)
  );
  const dateLabel = forecastPackage.dateKey
    ? formatPackageDate(forecastPackage.dateKey)
    : 'Unscheduled';
  const actionLabel = canPublish
    ? 'Publish package'
    : canReview
      ? forecastPackage.status === 'Submitted'
        ? 'Start review'
        : 'Continue review'
      : canViewPublished
        ? 'View package'
        : forecastPackage.status;
  const statusStyle = STATUS_STYLES[forecastPackage.status] || STATUS_STYLES.Draft;
  const contributorLabel = forecastPackage.contributorLabel || 'No recorded contributors';
  const contributorTitle = (forecastPackage.contributorNames || []).join(', ') || contributorLabel;

  const handleAction = () => {
    if (canPublish) return onPublishPackage?.(forecastPackage);
    if (canReview || canViewPublished) setShowPackageSummary(true);
  };

  return (
    <>
      <article
        className={`grid gap-4 rounded-xl border px-4 py-4 backdrop-blur-xl transition sm:grid-cols-[minmax(0,1fr)_8.5rem_12rem_10rem] sm:items-center xl:col-span-2 ${isDarkMode ? 'border-white/10 bg-slate-950/42 hover:border-cyan-300/20 hover:bg-slate-950/55' : 'border-white/75 bg-white/64 hover:border-cyan-200 hover:bg-white/78'}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/[0.04] text-cyan-200' : 'border-slate-200 bg-white/80 text-cyan-700'}`}
            >
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h3
                className={`truncate text-sm font-black sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-950'}`}
                title={forecastPackage.title}
              >
                {dateLabel}
              </h3>
              <p
                className="truncate text-xs font-semibold text-slate-500"
                title={forecastPackage.title}
              >
                {forecastPackage.title}
              </p>
            </div>
          </div>
        </div>
        <div className="sm:justify-self-start">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${isDarkMode ? statusStyle.dark : statusStyle.light}`}
          >
            {forecastPackage.status}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">Contributors</p>
          <p
            className={`truncate text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
            title={contributorTitle}
          >
            {contributorLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {reviewedCount}/{REQUIRED_CHART_COUNT} reviewed
          </p>
        </div>
        <div className="sm:justify-self-end">
          <Button
            size="sm"
            className="w-full sm:w-40"
            variant={canReview || canPublish ? 'primary' : 'secondary'}
            icon={canPublish ? PackageCheck : ArrowRight}
            disabled={isPublishing || (!canReview && !canPublish && !canViewPublished)}
            onClick={handleAction}
          >
            {isPublishing ? 'Publishing...' : actionLabel}
          </Button>
        </div>
      </article>
      {showPackageSummary && (
        <PackageSummaryModal
          forecastPackage={forecastPackage}
          isDarkMode={isDarkMode}
          onClose={() => setShowPackageSummary(false)}
          onOpenChart={onOpenChart}
        />
      )}
    </>
  );
}
