import { Archive, BarChart3, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react';

import {
  CHART_LABELS,
  getDateKey,
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
  Missing: 'slate',
};

function getRows({ packages = [], projects = [] }) {
  return packages.length > 0 ? packages : groupForecastPackages(projects);
}

function getDailyFocus({ packages = [], projects = [] }) {
  const rows = getRows({ packages, projects });
  const todayKey = getDateKey(new Date());
  const dailyPackage = rows.find(isDailyForecastPackage) || null;
  const chartRows = dailyPackage?.charts || [];
  const chartByType = new Map(chartRows.map((chart) => [chart.chartType || chart.project?.chartType, chart]));

  return {
    todayKey,
    dailyPackage,
    historyCount: rows.filter((forecastPackage) => forecastPackage.dateKey && forecastPackage.dateKey !== todayKey).length,
    chartTiles: DAILY_CHART_TYPES.map((chartType) => {
      const row = chartByType.get(chartType);
      const project = row?.project || row;
      return {
        chartType,
        label: CHART_LABELS[chartType] || chartType,
        status: project?.status || 'Missing',
        projectName: project?.name || project?.title || 'No chart project linked for today yet',
        project,
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

function ChartFocusTile({ chart, dailyPackage, isDarkMode, onOpenChart }) {
  const tone = STATUS_TONE[chart.status] || 'slate';
  const icon = tone === 'emerald' ? CheckCircle2 : tone === 'rose' ? XCircle : tone === 'amber' || tone === 'cyan' ? Clock3 : BarChart3;
  const Icon = icon;
  const isClickable = Boolean(chart.project && chart.project._id);
  const baseClass = `rounded-2xl border p-4 text-left shadow-sm transition ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/70'}`;
  const interactiveClass = isClickable
    ? isDarkMode
      ? 'cursor-pointer hover:border-cyan-300/30 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/40'
      : 'cursor-pointer hover:border-cyan-200 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-200'
    : 'cursor-not-allowed opacity-70';
  const content = (
    <>
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
    </>
  );

  if (!isClickable) {
    return <div className={`${baseClass} ${interactiveClass}`}>{content}</div>;
  }

  return (
    <button type="button" className={`${baseClass} ${interactiveClass}`} onClick={() => onOpenChart?.(chart.project, dailyPackage)}>
      {content}
    </button>
  );
}

export default function AdminDailyPackageFocus({
  isDarkMode,
  packages = [],
  projects = [],
  onOpenChart,
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
      <div className="p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-cyan-200 bg-white/75 text-cyan-700'}`}>
              <CalendarCheck2 size={14} />
              Daily focus
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-100/70' : 'text-cyan-800/70'}`}>{formattedDate}</span>
          </div>
          <h2 className={`mt-3 text-xl font-black tracking-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            Today&apos;s Analysis and Forecast Charts
          </h2>
          <p className={`mt-1 max-w-3xl text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {dailyPackage?.title || 'No ForecastPackage is linked to today yet'} is the primary review target. Package history stays available below through the main filters and pagination.
          </p>
        </div>
      </div>

      <div className={`grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4 ${isDarkMode ? 'border-white/10' : 'border-cyan-100'}`}>
        {chartTiles.map((chart) => (
          <ChartFocusTile key={chart.chartType} chart={chart} dailyPackage={dailyPackage} isDarkMode={isDarkMode} onOpenChart={onOpenChart} />
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
