import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  Waves,
} from 'lucide-react';

import { fetchAdminForecastPackages } from '@/api/forecastPackageAPI';
import { fetchAllUsers } from '@/api/userAPI';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';
import {
  CHART_LABELS,
  adaptForecastPackageModel,
  formatPackageDate,
  getDateKey,
  isDailyForecastPackage,
} from '@/features/projects/utils/forecastPackageGrouping';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const REVIEW_STATUSES = new Set(['Submitted', 'Under Review', 'Needs Review']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested', 'Returned']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);
const DAILY_CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

const STATUS_TONE = {
  Submitted: 'border-sky-400/20 bg-sky-400/10 text-sky-600',
  'Under Review': 'border-violet-400/20 bg-violet-400/10 text-violet-600',
  'Needs Review': 'border-cyan-400/20 bg-cyan-400/10 text-cyan-600',
  'Revision Requested': 'border-amber-400/20 bg-amber-400/10 text-amber-600',
  Returned: 'border-amber-400/20 bg-amber-400/10 text-amber-600',
  Approved: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-600',
  Published: 'border-teal-400/20 bg-teal-400/10 text-teal-600',
  Rejected: 'border-rose-400/20 bg-rose-400/10 text-rose-600',
  Archived: 'border-slate-400/20 bg-slate-400/10 text-slate-500',
  Draft: 'border-slate-400/20 bg-slate-400/10 text-slate-500',
  Missing: 'border-slate-400/20 bg-slate-400/10 text-slate-500',
};

function normalizeUser(user) {
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return {
    id: user?._id || user?.id || user?.email,
    name: fullName || user?.username || user?.email || 'User account',
    email: user?.email || '',
    role: user?.role || 'user',
    status: String(user?.status || 'pending').toLowerCase(),
    position: user?.position || user?.agency || 'No position set',
  };
}

function formatDate(value) {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No timestamp';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value) {
  if (!value) return 'No refresh yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No refresh yet';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getPackageTimestamp(forecastPackage) {
  return forecastPackage?.updatedAt || forecastPackage?.reviewedAt || forecastPackage?.submittedAt || forecastPackage?.createdAt;
}

function getPackageEvent(forecastPackage) {
  if (forecastPackage.status === 'Published') return `${forecastPackage.title} was published`;
  if (forecastPackage.status === 'Approved') return `${forecastPackage.title} is ready to publish`;
  if (RETURNED_STATUSES.has(forecastPackage.status)) return `${forecastPackage.title} was returned for revision`;
  if (REVIEW_STATUSES.has(forecastPackage.status)) return `${forecastPackage.title} needs package review`;
  return `${forecastPackage.title} was updated`;
}

function chartStatusForType(forecastPackage, chartType) {
  const chart = forecastPackage?.charts?.find((item) => item.chartType === chartType);
  const project = chart?.project || chart;
  return project?.status || 'Missing';
}

function getChartReviewSummary(forecastPackage) {
  return DAILY_CHART_TYPES.map((chartType) => ({
    chartType,
    label: CHART_LABELS[chartType] || chartType,
    status: chartStatusForType(forecastPackage, chartType),
  }));
}

function getPackageCount(packages, predicate) {
  return packages.filter(predicate).length;
}

export default function DashboardOverview({ isDarkMode, onSelectTab }) {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    packages: [],
    totalPackages: 0,
    users: [],
    totalUsers: 0,
    loadedAt: null,
  });

  const surface = isDarkMode
    ? 'border-white/10 bg-slate-950/50 shadow-black/20'
    : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: !silent && !current.loadedAt,
      refreshing: silent,
      error: '',
    }));

    try {
      const [packageResponse, userResponse] = await Promise.all([
        fetchAdminForecastPackages({ page: 1, limit: 24 }),
        fetchAllUsers({ page: 1, limit: 8 }),
      ]);

      const packages = (packageResponse?.packages ?? []).map(adaptForecastPackageModel);
      const users = Array.isArray(userResponse)
        ? userResponse.map(normalizeUser)
        : (userResponse?.data ?? []).map(normalizeUser);

      setState({
        loading: false,
        refreshing: false,
        error: '',
        packages,
        totalPackages: packageResponse?.total ?? packages.length,
        users,
        totalUsers: Array.isArray(userResponse)
          ? users.length
          : userResponse?.total ?? users.length,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Failed to load dashboard overview.',
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const dailyPackage = state.packages.find(isDailyForecastPackage) || null;
    const reviewPackages = getPackageCount(state.packages, (forecastPackage) => REVIEW_STATUSES.has(forecastPackage.status));
    const returnedPackages = getPackageCount(state.packages, (forecastPackage) => RETURNED_STATUSES.has(forecastPackage.status));
    const approvedPackages = getPackageCount(state.packages, (forecastPackage) => APPROVED_STATUSES.has(forecastPackage.status));
    const pendingUsers = state.users.filter((user) => user.status === 'pending').length;
    const activeUsers = state.users.filter((user) => user.status === 'active').length;
    const todayChartSummary = getChartReviewSummary(dailyPackage);
    const todayReadyCharts = todayChartSummary.filter((chart) => chart.status !== 'Missing').length;

    return {
      dailyPackage,
      todayKey: getDateKey(new Date()),
      todayChartSummary,
      todayReadyCharts,
      reviewPackages,
      returnedPackages,
      approvedPackages,
      attentionQueue: reviewPackages + returnedPackages,
      pendingUsers,
      activeUsers,
    };
  }, [state.packages, state.users]);

  const reviewQueue = useMemo(
    () => state.packages.filter((forecastPackage) => REVIEW_STATUSES.has(forecastPackage.status)).slice(0, 5),
    [state.packages],
  );

  const recentActivity = useMemo(
    () => state.packages.slice(0, 5).map((forecastPackage) => ({
      id: forecastPackage.id,
      text: getPackageEvent(forecastPackage),
      status: forecastPackage.status,
      date: getPackageTimestamp(forecastPackage),
    })),
    [state.packages],
  );

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', surface)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading admin operations</p>
            <p className={cn('text-xs font-semibold', muted)}>Fetching forecast packages, daily chart readiness, and user access.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', text)}>Welcome back, Admin.</p>
          <p className={cn('mt-1 text-xs font-semibold', muted)}>
            Last refreshed {formatRelative(state.loadedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            icon={state.error ? AlertTriangle : CheckCircle2}
            label={state.error ? 'Needs attention' : 'Operational'}
            isDarkMode={isDarkMode}
            tone={state.error ? 'amber' : 'emerald'}
          />
          <button
            type="button"
            onClick={() => loadDashboard({ silent: true })}
            className={cn(
              'flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950',
            )}
          >
            <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      {state.error && (
        <section className={cn(
          'rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl',
          isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-800',
        )}>
          {state.error}
        </section>
      )}

      <section className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl sm:p-5', surface)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={cn('text-xs font-black uppercase tracking-[0.16em]', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}>
              Daily focus
            </p>
            <h2 className={cn('mt-2 text-2xl font-black tracking-tight', text)}>
              {metrics.dailyPackage?.title || `${formatPackageDate(metrics.todayKey)} Forecast Package`}
            </h2>
            <p className={cn('mt-1 text-sm font-semibold leading-6', muted)}>
              {metrics.dailyPackage
                ? `${metrics.todayReadyCharts} of 4 analysis and forecast charts are linked for today.`
                : 'No ForecastPackage is linked to today yet. Create or submit today\'s package to unlock the review flow.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-400"
          >
            Open Forecast Packages
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.todayChartSummary.map((chart) => (
            <ChartTile key={chart.chartType} chart={chart} isDarkMode={isDarkMode} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Waves}
          label="Packages In Review"
          value={metrics.reviewPackages}
          helper="Submitted or under review"
          tone="cyan"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={PackageCheck}
          label="Approved Packages"
          value={metrics.approvedPackages}
          helper="Approved or already published"
          tone="emerald"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Users}
          label="User Accounts"
          value={state.totalUsers}
          helper={`${metrics.pendingUsers} pending approval`}
          tone="blue"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={metrics.attentionQueue}
          helper={`${metrics.returnedPackages} returned package${metrics.returnedPackages === 1 ? '' : 's'}`}
          tone={metrics.attentionQueue > 0 ? 'amber' : 'emerald'}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.85fr)]">
        <Panel
          title="Package Review Queue"
          description="Forecast packages that need admin review or triage."
          actionLabel="Open Review Packages"
          onAction={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
          isDarkMode={isDarkMode}
        >
          <div className="space-y-2">
            {reviewQueue.length === 0 ? (
              <EmptyState
                title="No packages waiting for review"
                description="Submitted daily forecast packages will appear here when forecasters send them for admin review."
                isDarkMode={isDarkMode}
              />
            ) : reviewQueue.map((forecastPackage) => (
              <PackageRow key={forecastPackage.id} forecastPackage={forecastPackage} isDarkMode={isDarkMode} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Operational Checklist"
          description="Daily checks for a clean package review workflow."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            <ChecklistItem
              done={Boolean(metrics.dailyPackage)}
              title="Confirm today\'s package"
              detail={metrics.dailyPackage ? `${metrics.todayReadyCharts} of 4 charts linked` : 'No package linked to today'}
              isDarkMode={isDarkMode}
              onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
            />
            <ChecklistItem
              done={metrics.reviewPackages === 0}
              title="Clear package review queue"
              detail={`${metrics.reviewPackages} package${metrics.reviewPackages === 1 ? '' : 's'} waiting`}
              isDarkMode={isDarkMode}
              onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
            />
            <ChecklistItem
              done={metrics.pendingUsers === 0}
              title="Verify pending users"
              detail={`${metrics.pendingUsers} pending account${metrics.pendingUsers === 1 ? '' : 's'}`}
              isDarkMode={isDarkMode}
              onClick={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Package Pipeline" description="Current package state distribution." isDarkMode={isDarkMode}>
          <div className="space-y-3">
            <PipelineBar label="In Review" value={metrics.reviewPackages} total={state.totalPackages} color="bg-cyan-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Returned" value={metrics.returnedPackages} total={state.totalPackages} color="bg-amber-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Approved / Published" value={metrics.approvedPackages} total={state.totalPackages} color="bg-emerald-500" isDarkMode={isDarkMode} />
          </div>
        </Panel>

        <Panel title="Recent Package Activity" description="Latest forecast package updates." isDarkMode={isDarkMode}>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState title="No activity yet" description="Package updates will appear here after forecasters submit charts." isDarkMode={isDarkMode} />
            ) : recentActivity.map((item) => <ActivityRow key={item.id} item={item} isDarkMode={isDarkMode} />)}
          </div>
        </Panel>

        <Panel
          title="Access Health"
          description="Staff account readiness."
          actionLabel="Manage Users"
          onAction={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
          isDarkMode={isDarkMode}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MiniStat label="Active" value={metrics.activeUsers} icon={UserCheck} isDarkMode={isDarkMode} />
            <MiniStat label="Pending" value={metrics.pendingUsers} icon={Clock3} isDarkMode={isDarkMode} />
          </div>
          <div className="space-y-2">
            {state.users.length === 0 ? (
              <EmptyState title="No users loaded" description="User accounts will appear here once the admin user endpoint responds." isDarkMode={isDarkMode} />
            ) : state.users.slice(0, 4).map((user) => <UserRow key={user.id} user={user} isDarkMode={isDarkMode} />)}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickAction icon={Waves} title="Review forecast packages" description="Inspect today\'s package and approve, reject, or request revisions." onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)} isDarkMode={isDarkMode} />
        <QuickAction icon={ShieldCheck} title="Manage access" description="Approve, suspend, or update operational user accounts." onClick={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)} isDarkMode={isDarkMode} />
        <QuickAction icon={CalendarCheck2} title="Check operations calendar" description="Review package dates, publication milestones, and admin notes." onClick={() => onSelectTab?.(ADMIN_TABS.CALENDAR)} isDarkMode={isDarkMode} />
      </section>
    </div>
  );
}

function StatusPill({ icon: Icon, label, tone, isDarkMode }) {
  const toneClass = tone === 'emerald'
    ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
    : isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-700';

  return <span className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl', toneClass)}><Icon size={15} />{label}</span>;
}

function MetricCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = {
    blue: isDarkMode ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50/80 text-blue-700',
    cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50/80 text-cyan-700',
    emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50/80 text-emerald-700',
    amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50/80 text-amber-700',
  }[tone];

  return (
    <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className={cn('truncate text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p><p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p></div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}><Icon size={21} /></span>
      </div>
      <p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{helper}</p>
    </div>
  );
}

function Panel({ title, description, actionLabel, onAction, isDarkMode, children }) {
  return (
    <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0"><h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2><p className={cn('mt-1 text-sm font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>
        {actionLabel && <button type="button" onClick={onAction} className={cn('shrink-0 rounded-lg px-3 py-2 text-xs font-black transition-colors', isDarkMode ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]' : 'bg-white/75 text-slate-700 hover:bg-white')}>{actionLabel}</button>}
      </div>
      {children}
    </div>
  );
}

function ChartTile({ chart, isDarkMode }) {
  const tone = STATUS_TONE[chart.status] || STATUS_TONE.Draft;
  return (
    <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <p className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{chart.label}</p>
      <span className={cn('mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black', tone)}>{chart.status}</span>
    </div>
  );
}

function PackageRow({ forecastPackage, isDarkMode }) {
  const tone = STATUS_TONE[forecastPackage.status] || STATUS_TONE.Draft;
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <div className="min-w-0"><p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{forecastPackage.title}</p><p className={cn('mt-1 truncate text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{forecastPackage.ownerLabel || 'Forecast team'} - {forecastPackage.chartCount || 0} charts - {formatDate(getPackageTimestamp(forecastPackage))}</p></div>
      <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black', tone)}>{forecastPackage.status}</span>
    </div>
  );
}

function ChecklistItem({ done, title, detail, isDarkMode, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left backdrop-blur-xl transition-colors', isDarkMode ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]' : 'border-white/80 bg-white/65 hover:bg-white')}>
      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', done ? 'bg-emerald-400/10 text-emerald-500' : 'bg-amber-400/10 text-amber-500')}>{done ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}</span>
      <span className="min-w-0 flex-1"><span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span><span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{detail}</span></span>
      <ArrowRight size={15} className={cn('mt-1 shrink-0', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
    </button>
  );
}

function PipelineBar({ label, value, total, color, isDarkMode }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return <div><div className="mb-1 flex justify-between text-xs font-black"><span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{label}</span><span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{value}</span></div><div className={cn('h-2 overflow-hidden rounded-full', isDarkMode ? 'bg-white/10' : 'bg-slate-200')}><div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, percent)}%` }} /></div></div>;
}

function ActivityRow({ item, isDarkMode }) {
  const tone = STATUS_TONE[item.status] || STATUS_TONE.Draft;
  return <div className="flex gap-3"><span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full border', tone)} /><div className="min-w-0"><p className={cn('text-sm font-bold leading-5', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>{item.text}</p><p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{formatDate(item.date)}</p></div></div>;
}

function MiniStat({ label, value, icon: Icon, isDarkMode }) {
  return <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}><Icon size={18} className={isDarkMode ? 'text-cyan-200' : 'text-cyan-700'} /><p className={cn('mt-3 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p><p className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p></div>;
}

function UserRow({ user, isDarkMode }) {
  return <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}><p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{user.name}</p><p className={cn('mt-1 truncate text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{user.role} - {user.status}</p></div>;
}

function QuickAction({ icon: Icon, title, description, onClick, isDarkMode }) {
  return <button type="button" onClick={onClick} className={cn('flex items-start gap-3 rounded-2xl border p-4 text-left shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-0.5', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20 hover:bg-white/[0.04]' : 'border-white/70 bg-white/70 shadow-slate-300/40 hover:bg-white')}><span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700')}><Icon size={21} /></span><span><span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span><span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</span></span></button>;
}

function EmptyState({ title, description, isDarkMode }) {
  return <div className={cn('rounded-xl border p-4 text-center', isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/60')}><p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p><p className={cn('mt-1 text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>;
}
