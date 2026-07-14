import { ArrowRight, CalendarDays, PackageCheck } from 'lucide-react';

import Button from '@/components/ui/Button';
import { formatPackageDate } from '@/features/projects/utils/forecastPackageGrouping';

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

export default function ForecastPackageCard({
  forecastPackage,
  isDarkMode,
  onOpenChart,
  onPublishPackage,
  publishingPackageId,
}) {
  const canReview = REVIEWABLE_PACKAGE_STATUSES.has(forecastPackage.status) && Boolean(forecastPackage.primaryChart);
  const canPublish = PUBLISHABLE_PACKAGE_STATUSES.has(forecastPackage.status);
  const canViewPublished = forecastPackage.status === 'Published' && Boolean(forecastPackage.primaryChart);
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
    if (canReview || canViewPublished) {
      onOpenChart?.(forecastPackage.primaryChart, forecastPackage);
    }
  };

  return (
    <article className={`grid gap-4 rounded-xl border px-4 py-4 backdrop-blur-xl transition sm:grid-cols-[minmax(0,1.4fr)_auto_auto_auto] sm:items-center xl:col-span-2 ${
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
            <h3 className={`truncate text-sm font-black sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={forecastPackage.title}>
              {dateLabel}
            </h3>
            <p className={`truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`} title={forecastPackage.title}>
              {forecastPackage.title}
            </p>
          </div>
        </div>
      </div>

      <div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${isDarkMode ? statusStyle.dark : statusStyle.light}`}>
          {forecastPackage.status}
        </span>
      </div>

      <div className="min-w-0">
        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Owner</p>
        <p className={`truncate text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {forecastPackage.ownerLabel || 'Forecast team'}
        </p>
        <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          {reviewedCount}/{REQUIRED_CHART_COUNT} reviewed
        </p>
      </div>

      <Button
        size="sm"
        variant={canReview || canPublish ? 'primary' : 'secondary'}
        icon={canPublish ? PackageCheck : ArrowRight}
        disabled={isPublishing || (!canReview && !canPublish && !canViewPublished)}
        onClick={handleAction}
      >
        {isPublishing ? 'Publishing...' : actionLabel}
      </Button>
    </article>
  );
}
