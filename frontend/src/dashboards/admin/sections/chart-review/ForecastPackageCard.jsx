import { useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, PackageCheck, Waves, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  CHART_LABELS,
  formatPackageDate,
} from '@/features/projects/utils/forecastPackageGrouping';

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
  Archived: {
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
    light: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  Draft: {
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
    light: 'border-slate-200 bg-slate-100 text-slate-600',
  },
};

function PackageSummaryModal({ forecastPackage, isDarkMode, onClose, onOpenChart }) {
  const dateLabel = forecastPackage.dateKey
    ? formatPackageDate(forecastPackage.dateKey)
    : 'Unscheduled';
  const isReviewablePackage = REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`package-${forecastPackage.id}-title`}>
      <div className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${
        isDarkMode
          ? 'border-white/10 bg-slate-950/95 text-white shadow-black/40'
          : 'border-white/80 bg-white/95 text-slate-950 shadow-slate-900/20'
      }`}>
        <header className={`flex items-start justify-between gap-4 border-b p-5 sm:p-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-cyan-200/80' : 'text-cyan-700'}`}>Forecast package</p>
            <h2 id={`package-${forecastPackage.id}-title`} className="mt-2 truncate text-2xl font-black tracking-tight">{dateLabel}</h2>
            <p className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{forecastPackage.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close package summary" className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <X size={18} />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Status</p>
              <p className="mt-1 text-sm font-black">{forecastPackage.status}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Owner</p>
              <p className="mt-1 truncate text-sm font-black">{forecastPackage.ownerLabel || 'Forecast team'}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Charts</p>
              <p className="mt-1 text-sm font-black">{forecastPackage.chartCount || forecastPackage.charts?.length || 0} available</p>
            </div>
          </div>

          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Package charts</p>
              <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {isReviewablePackage ? 'Choose the chart you want to review.' : 'Choose the chart you want to view.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(forecastPackage.charts || []).map((chartRow) => {
              const chart = chartRow.project;
              const chartId = chart?._id || chart?.id;
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
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    chartId
                      ? isDarkMode
                        ? 'border-white/10 bg-white/[0.035] hover:border-cyan-300/30 hover:bg-cyan-300/10'
                        : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50'
                      : 'cursor-not-allowed border-transparent opacity-50'
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-cyan-300/15 bg-cyan-300/10 text-cyan-200' : 'border-cyan-100 bg-cyan-50 text-cyan-700'}`}>
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{CHART_LABELS[chartRow.chartType] || chartRow.chartType || 'Forecast chart'}</span>
                    <span className={`mt-1 block truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{chart?.name || chart?.title || 'Chart unavailable'}</span>
                    {chartId && (
                      <span className={`mt-2 block text-[11px] font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                        {isReviewablePackage ? 'Review chart' : 'View chart'}
                      </span>
                    )}
                  </span>
                  {chartId && <ArrowRight size={16} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForecastPackageCard({
  forecastPackage,
  isDarkMode,
  onOpenChart,
  onPublishPackage,
  publishingPackageId,
}) {
  const [showPackageSummary, setShowPackageSummary] = useState(false);
  const canReview = REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status) && Boolean(forecastPackage.primaryChart);
  const canPublish = PUBLISHABLE_PACKAGE_STATUSES.has(forecastPackage.status);
  const canViewPublished = forecastPackage.status === 'Published' && (forecastPackage.charts || []).some((chartRow) => chartRow.project?._id || chartRow.project?.id);
  const isPublishing = publishingPackageId === forecastPackage.id;
  const reviewedCount = Math.min(
    REQUIRED_CHART_COUNT,
    (forecastPackage.approvedCount || 0) + (forecastPackage.returnedCount || 0),
  );
  const dateLabel = forecastPackage.dateKey
    ? formatPackageDate(forecastPackage.dateKey)
    : 'Unscheduled';
  const actionLabel = canPublish
    ? 'Publish package'
    : canReview
      ? forecastPackage.status === 'Submitted' ? 'Start review' : 'Continue review'
      : canViewPublished ? 'View package' : forecastPackage.status;
  const statusStyle = STATUS_STYLES[forecastPackage.status] || STATUS_STYLES.Draft;

  const handleAction = () => {
    if (canPublish) {
      onPublishPackage?.(forecastPackage);
      return;
    }
    if (canReview || canViewPublished) setShowPackageSummary(true);
  };

  return (
    <>
      <article className={`grid gap-4 rounded-xl border px-4 py-4 backdrop-blur-xl transition sm:grid-cols-[minmax(0,1fr)_8.5rem_12rem_10rem] sm:items-center xl:col-span-2 ${
        isDarkMode
          ? 'border-white/10 bg-slate-950/42 hover:border-cyan-300/20 hover:bg-slate-950/55'
          : 'border-white/75 bg-white/64 hover:border-cyan-200 hover:bg-white/78'
      }`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              isDarkMode ? 'border-white/10 bg-white/[0.04] text-cyan-200' : 'border-slate-200 bg-white/80 text-cyan-700'
            }`}>
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h3 className={`truncate text-sm font-black sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={forecastPackage.title}>{dateLabel}</h3>
              <p className={`truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`} title={forecastPackage.title}>{forecastPackage.title}</p>
            </div>
          </div>
        </div>

        <div className="sm:justify-self-start">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${isDarkMode ? statusStyle.dark : statusStyle.light}`}>{forecastPackage.status}</span>
        </div>

        <div className="min-w-0">
          <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Owner</p>
          <p className={`truncate text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{forecastPackage.ownerLabel || 'Forecast team'}</p>
          <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{reviewedCount}/{REQUIRED_CHART_COUNT} reviewed</p>
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
