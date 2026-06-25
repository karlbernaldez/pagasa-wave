import { Archive, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { groupForecastPackages, isDailyForecastPackage } from '@/features/projects/utils/forecastPackageGrouping';

function getDailyPackageStats({ packages = [], projects = [] }) {
  const rows = packages.length > 0 ? packages : groupForecastPackages(projects);
  const dailyPackages = rows.filter(isDailyForecastPackage);

  return {
    packageTotal: rows.length,
    dailyTotal: dailyPackages.length,
    dailyPending: dailyPackages.filter((forecastPackage) => forecastPackage.pendingCount > 0 || forecastPackage.status === 'Submitted' || forecastPackage.status === 'Under Review').length,
    dailyApproved: dailyPackages.filter((forecastPackage) => forecastPackage.status === 'Approved' || forecastPackage.status === 'Published').length,
    dailyReturned: dailyPackages.filter((forecastPackage) => forecastPackage.returnedCount > 0 || forecastPackage.status === 'Rejected' || forecastPackage.status === 'Revision Requested').length,
    pastVisible: rows.filter((forecastPackage) => forecastPackage.dateKey && !isDailyForecastPackage(forecastPackage)).length,
  };
}

function StatCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = {
    cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700',
    amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700',
    emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
    rose: isDarkMode ? 'bg-rose-400/10 text-rose-200' : 'bg-rose-50 text-rose-700',
    slate: isDarkMode ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-700',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-xs font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
          <p className={`mt-2 text-3xl font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className={`mt-3 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{helper}</p>
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
  const stats = getDailyPackageStats({ packages, projects });
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
            Review Forecast Packages Daily
          </h2>
          <p className={`mt-1 max-w-3xl text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Today&apos;s package comes directly from the ForecastPackage record with its linked wave analysis and forecast chart projects inside.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('All')}>All packages</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Submitted')}>Submitted</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Approved')}>Approved</QuickFilterButton>
          <QuickFilterButton isDarkMode={isDarkMode} onClick={() => setStatusFilter?.('Rejected')}>Rejected</QuickFilterButton>
        </div>
      </div>

      <div className={`grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5 ${isDarkMode ? 'border-white/10' : 'border-cyan-100'}`}>
        <StatCard icon={CalendarCheck2} label="Today packages" value={stats.dailyTotal} helper="ForecastPackage records dated today" tone="cyan" isDarkMode={isDarkMode} />
        <StatCard icon={Clock3} label="Needs review" value={stats.dailyPending} helper="Daily packages pending review" tone="amber" isDarkMode={isDarkMode} />
        <StatCard icon={CheckCircle2} label="Approved" value={stats.dailyApproved} helper="Approved or published packages" tone="emerald" isDarkMode={isDarkMode} />
        <StatCard icon={XCircle} label="Returned" value={stats.dailyReturned} helper="Rejected or revision requested packages" tone="rose" isDarkMode={isDarkMode} />
        <StatCard icon={Archive} label="Package history" value={total || stats.packageTotal} helper={`${stats.pastVisible} past packages visible`} tone="slate" isDarkMode={isDarkMode} />
      </div>
    </section>
  );
}
