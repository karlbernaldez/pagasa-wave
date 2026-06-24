import { Archive, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react';

const REVIEW_STATUSES = new Set(['Submitted', 'Under Review']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);
const REJECTED_STATUSES = new Set(['Rejected', 'Revision Requested']);

function toDateKey(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function isPastPackage(project, todayKey) {
  const dateKey = toDateKey(project?.forecastDate || project?.createdAt);
  return Boolean(dateKey && dateKey < todayKey);
}

function getDailyPackageStats(projects) {
  const todayKey = toDateKey(new Date());
  const dailyPackages = projects.filter((project) => toDateKey(project?.forecastDate || project?.createdAt) === todayKey);

  return {
    todayKey,
    dailyTotal: dailyPackages.length,
    dailyPending: dailyPackages.filter((project) => REVIEW_STATUSES.has(project.status)).length,
    dailyApproved: dailyPackages.filter((project) => APPROVED_STATUSES.has(project.status)).length,
    dailyReturned: dailyPackages.filter((project) => REJECTED_STATUSES.has(project.status)).length,
    pastVisible: projects.filter((project) => isPastPackage(project, todayKey)).length,
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
  projects = [],
  setStatusFilter,
  total = 0,
}) {
  const stats = getDailyPackageStats(projects);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${stats.todayKey}T00:00:00`));

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
            Today&apos;s forecast package is highlighted first. Approved, rejected, published, and past packages remain available through the filters and package history below.
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
        <StatCard icon={CalendarCheck2} label="Today visible" value={stats.dailyTotal} helper="Packages dated today" tone="cyan" isDarkMode={isDarkMode} />
        <StatCard icon={Clock3} label="Needs review" value={stats.dailyPending} helper="Submitted or under review" tone="amber" isDarkMode={isDarkMode} />
        <StatCard icon={CheckCircle2} label="Approved" value={stats.dailyApproved} helper="Approved or published today" tone="emerald" isDarkMode={isDarkMode} />
        <StatCard icon={XCircle} label="Returned" value={stats.dailyReturned} helper="Rejected or revision requested" tone="rose" isDarkMode={isDarkMode} />
        <StatCard icon={Archive} label="Package history" value={total} helper={`${stats.pastVisible} past visible on this page`} tone="slate" isDarkMode={isDarkMode} />
      </div>
    </section>
  );
}

export function isDailyForecastPackage(project) {
  const todayKey = toDateKey(new Date());
  return toDateKey(project?.forecastDate || project?.createdAt) === todayKey;
}
