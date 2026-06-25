import { Archive, BarChart3, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react';

import {
  CHART_LABELS,
  groupForecastPackages,
  isDailyForecastPackage,
} from '@/features/projects/utils/forecastPackageGrouping';

const DAILY_CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

const STATUS_TONE = {
  Draft: 'slate',
  Submitted: 'amber',
  'Under Review': 'cyan',
  'Revision Requested': 'rose',
  Approved: 'emerald',
  Published: 'emerald',
  Rejected: 'rose',
  Archived: 'slate',
};

function getRows({ packages = [], projects = [] }) {
  return packages.length > 0 ? packages : groupForecastPackages(projects);
}

function getDailyFocus({ packages = [], projects = [] }) {
  const rows = getRows({ packages, projects });
  const dailyPackage = rows.find(isDailyForecastPackage) || rows[0] || null;
  const chartRows = dailyPackage?.charts || [];
  const chartByType = new Map(chartRows.map((chart) => [chart.chartType || chart.project?.chartType, chart]));

  return {
    dailyPackage,
    historyCount: rows.filter((forecastPackage) => forecastPackage.dateKey && !isDailyForecastPackage(forecastPackage)).length,
    chartTiles: DAILY_CHART_TYPES.map((chartType) => {
      const row = chartByType.get(chartType);
      const project = row?.project || row;
      return {
        chartType,
        label: CHART_LABELS[chartType] || chartType,
        status: project?.status || 'Missing',
        projectName: project?.name || project?.title || 'No chart project linked yet',
      };
    }),
  };
}

function getToneClasses(tone, isDarkMode) {
  const classes = {
    cyan: isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: isDarkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: isDarkMode ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: isDarkMode ? 'border-rose-300/20 bg-rose-300/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700',
    slate: isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700',
  };

  return classes[tone] || classes.slate;
}

function ChartFocusTile({ chart, isDarkMode }) {
  const tone = STATUS_TONE[chart.status] || 'slate';
  const icon = tone === 'emerald' ? CheckCircle2 : tone === 'rose' ? XCircle : tone === 'amber' || tone === 'cyan' ? Clock3 : BarChart3;
  const Icon = icon;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-xs font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {chart.label}
          </p>
          <p className={`mt-2 truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={chart.projectName}>
            {chart.projectName}
          </p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${getToneClasses(tone, isDarkMode)}`}>
          <Icon size={18} />
        </span>
      </div>
      <span className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getToneClasses(tone, isDarkMode)}`}>
        {chart.status}
      </span>
    </div>
  );
}

function QuickFilterButton({ children, isDarkMode, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors ${
        isDarkMode
          ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
          : 'border-white/80 bg-white/75 text-slate-600 hover:bg-white hover:text-slate-950'
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminDailyPackageFocus({
  isDarkMode,
  packages = [],
  projects = [],
  setStatusFilter,
  total = 0,
}) {
  const { chartTiles, dailyPackage, historyCount } = getDailyFocus({ packages, projects });
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date());

  return (
    <section className={`overflow-hidden rounded-3xl border shadow-xl backdrop-blur-xl ${isDarkMode ? 'border-cyan-300/15 bg-cyan-950/20 shadow-black/20' : 'border-cyan-100 bg-cyan-50/75 shadow-cyan-100/60'}`}>
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-cyan-200 bg-white/75 text-cyan-700'}`}>
              <CalendarCheck2 size={14} />
              Daily focus
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-100/70' : 'text-cyan-800/70'}`}>{formattedDate}</span>
          </div>
          <h2 className={`mt-3 text-xl font-black tracking-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            Today&apos;s four forecast charts
          </h2>
          <p className={`mt-1 max-w-3xl text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {dailyPackage?.title || 'Today\'s ForecastPackage'} is the primary review target. Package history stays available below through filters and pagination.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('All')}>All packages</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Submitted')}>Submitted</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Approved')}>Approved</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Rejected')}>Rejected</QuickFilterButton>
        </div>
      </div>

      <div className={`grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4 ${isDarkMode ? 'border-white/10' : 'border-cyan-100'}`}>
        {chartTiles.map((chart) => (
          <ChartFocusTile key={chart.chartType} chart={chart} isDarkMode={isDarkMode} />
        ))}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs font-bold sm:px-5 ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-cyan-100 text-slate-500'}`}>
        <span className="inline-flex items-center gap-2">
          <Archive size={14} />
          {historyCount} past package{historyCount === 1 ? '' : 's'} visible in history
        </span>
        <span>{total || packages.length} total package{(total || packages.length) === 1 ? '' : 's'} matching current filters</span>
      </div>
    </section>
  );
}
