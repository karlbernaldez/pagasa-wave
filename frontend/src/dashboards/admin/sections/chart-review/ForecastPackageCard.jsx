import { CheckCircle2, Clock3, ExternalLink, PackageCheck, RotateCcw, XCircle } from 'lucide-react';

import Button from '@/components/ui/Button';
import { CHART_LABELS, isDailyForecastPackage } from '@/features/projects/utils/forecastPackageGrouping';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';

const PACKAGE_STATUS_STYLES = {
  'Needs Review': {
    light: 'border-amber-200 bg-amber-50 text-amber-700',
    dark: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  },
  Approved: {
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  Returned: {
    light: 'border-rose-200 bg-rose-50 text-rose-700',
    dark: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  },
  Closed: {
    light: 'border-slate-200 bg-slate-100 text-slate-600',
    dark: 'border-white/10 bg-white/[0.05] text-slate-300',
  },
  'In Progress': {
    light: 'border-blue-200 bg-blue-50 text-blue-700',
    dark: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  },
};

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

function ChartRow({ chart, isDarkMode, onOpenChart }) {
  const statusClass = getProjectStatusStyle(chart.status);

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-slate-200 bg-slate-50/80'}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {CHART_LABELS[chart.chartType] || chart.chartType || 'Forecast Chart'}
          </p>
          <span className={`inline-flex max-w-full shrink-0 truncate rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>
            {getProjectStatusLabel(chart.status)}
          </span>
        </div>
        <p className={`mt-1 truncate text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`} title={chart.name || chart.title}>
          {chart.name || chart.title || 'Untitled chart'}
        </p>
      </div>

      <Button size="sm" variant="secondary" icon={ExternalLink} onClick={() => onOpenChart?.(chart)}>
        Review chart
      </Button>
    </div>
  );
}

export default function ForecastPackageCard({ forecastPackage, isDarkMode, onOpenChart }) {
  const isDaily = isDailyForecastPackage(forecastPackage);
  const statusStyle = PACKAGE_STATUS_STYLES[forecastPackage.status] ?? PACKAGE_STATUS_STYLES['In Progress'];

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
                  Today&apos;s package
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
              {forecastPackage.ownerLabel} · {forecastPackage.chartCount} chart{forecastPackage.chartCount === 1 ? '' : 's'} in this package
            </p>
          </div>

          <Button icon={PackageCheck} onClick={() => onOpenChart?.(forecastPackage.primaryChart)}>
            Review package
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <PackageMetric icon={Clock3} label="Needs review" value={forecastPackage.pendingCount} isDarkMode={isDarkMode} />
        <PackageMetric icon={CheckCircle2} label="Approved" value={forecastPackage.approvedCount} isDarkMode={isDarkMode} />
        <PackageMetric icon={forecastPackage.returnedCount > 0 ? XCircle : RotateCcw} label="Returned" value={forecastPackage.returnedCount} isDarkMode={isDarkMode} />
      </div>

      <div className="space-y-2 px-4 pb-4">
        {forecastPackage.charts.map((chart) => (
          <ChartRow key={chart._id || chart.id} chart={chart} isDarkMode={isDarkMode} onOpenChart={onOpenChart} />
        ))}
      </div>
    </article>
  );
}
