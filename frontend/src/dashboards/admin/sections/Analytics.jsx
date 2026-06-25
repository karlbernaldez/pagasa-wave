import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { fetchAdminForecastPackages } from '@/api/forecastPackageAPI';
import { fetchAllUsers } from '@/api/userAPI';
import {
  adaptForecastPackageModel,
  getDateKey,
} from '@/features/projects/utils/forecastPackageGrouping';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const REVIEW_STATUSES = new Set(['Submitted', 'Under Review', 'Needs Review']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested', 'Returned']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);
const REVIEWABLE_STATUSES = new Set([
  ...REVIEW_STATUSES,
  ...RETURNED_STATUSES,
  ...APPROVED_STATUSES,
]);

const STATUS_COLORS = {
  Submitted: '#38bdf8',
  'Under Review': '#8b5cf6',
  'Needs Review': '#06b6d4',
  Returned: '#f59e0b',
  'Revision Requested': '#f59e0b',
  Approved: '#10b981',
  Published: '#14b8a6',
  Rejected: '#f43f5e',
};

function normalizeUser(user) {
  return {
    id: user?._id || user?.id || user?.email,
    status: String(user?.status || 'pending').toLowerCase(),
    role: String(user?.role || 'user').toLowerCase(),
  };
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

function formatHours(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function toDateKey(value) {
  return getDateKey(value || new Date());
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function packageTimestamp(forecastPackage) {
  return forecastPackage?.submittedAt || forecastPackage?.reviewedAt || forecastPackage?.updatedAt || forecastPackage?.createdAt;
}

function getChartCount(forecastPackage) {
  return forecastPackage.chartCount || forecastPackage.charts?.length || 0;
}

function isReviewablePackage(forecastPackage) {
  return REVIEWABLE_STATUSES.has(forecastPackage.status);
}

function buildDailySeries(packages) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = toDateKey(date);

    return {
      key,
      day: formatShortDate(key),
      submitted: 0,
      reviewed: 0,
      returned: 0,
    };
  });

  const byKey = new Map(days.map((day) => [day.key, day]));

  packages.forEach((forecastPackage) => {
    const key = forecastPackage.dateKey || toDateKey(forecastPackage.forecastDate || forecastPackage.createdAt);
    if (!byKey.has(key)) return;

    const day = byKey.get(key);
    day.submitted += 1;
    if (APPROVED_STATUSES.has(forecastPackage.status)) day.reviewed += 1;
    if (RETURNED_STATUSES.has(forecastPackage.status)) day.returned += 1;
  });

  return days;
}

function buildStatusRows(packages) {
  const counts = new Map();
  packages.forEach((forecastPackage) => {
    const status = forecastPackage.status || 'Submitted';
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return [...counts.entries()].map(([status, value]) => ({
    status,
    label: status,
    value,
    color: STATUS_COLORS[status] || '#94a3b8',
  })).sort((a, b) => b.value - a.value);
}

function buildReviewWorkloadSeries({ reviewQueue, underReview, returned, approved }) {
  return [
    { label: 'Awaiting review', description: 'Submitted packages not started', value: reviewQueue },
    { label: 'In review', description: 'Packages actively being reviewed', value: underReview },
    { label: 'Returned', description: 'Revision or rejection decisions', value: returned },
    { label: 'Approved / Published', description: 'Packages cleared by admin', value: approved },
  ];
}

function buildOwnerSeries(packages) {
  const counts = new Map();

  packages.forEach((forecastPackage) => {
    const owner = forecastPackage.ownerLabel || 'Forecast team';
    counts.set(owner, (counts.get(owner) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([owner, value]) => ({ owner, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function CustomTooltip({ active, payload, label, isDarkMode }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={cn(
      'rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-xl',
      isDarkMode ? 'border-white/10 bg-slate-950/90 text-slate-200' : 'border-white/80 bg-white/90 text-slate-700',
    )}>
      {label && <p className="mb-1 font-black">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="font-semibold" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsSection({ isDarkMode }) {
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

  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const panel = isDarkMode
    ? 'border-white/10 bg-slate-950/50 shadow-black/20'
    : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const gridColor = isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.16)';
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';

  const loadAnalytics = useCallback(async ({ silent = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: !silent && !current.loadedAt,
      refreshing: silent,
      error: '',
    }));

    try {
      const [packageResponse, userResponse] = await Promise.all([
        fetchAdminForecastPackages({ page: 1, limit: 100 }),
        fetchAllUsers({ page: 1, limit: 100 }),
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
        totalUsers: Array.isArray(userResponse) ? users.length : userResponse?.total ?? users.length,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Failed to load analytics.',
      }));
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const analytics = useMemo(() => {
    const reviewablePackages = state.packages.filter(isReviewablePackage);
    const awaitingReview = reviewablePackages.filter((forecastPackage) => forecastPackage.status === 'Submitted' || forecastPackage.status === 'Needs Review').length;
    const underReview = reviewablePackages.filter((forecastPackage) => forecastPackage.status === 'Under Review').length;
    const returned = reviewablePackages.filter((forecastPackage) => RETURNED_STATUSES.has(forecastPackage.status)).length;
    const approved = reviewablePackages.filter((forecastPackage) => APPROVED_STATUSES.has(forecastPackage.status)).length;
    const openReviewQueue = awaitingReview + underReview;
    const decisions = approved + returned;
    const totalCharts = reviewablePackages.reduce((sum, forecastPackage) => sum + getChartCount(forecastPackage), 0);

    const queuePackages = reviewablePackages.filter((forecastPackage) => REVIEW_STATUSES.has(forecastPackage.status));
    const queueHours = queuePackages.map((forecastPackage) => {
      const date = new Date(packageTimestamp(forecastPackage));
      if (Number.isNaN(date.getTime())) return 0;
      return Math.max(0, (Date.now() - date.getTime()) / 3600000);
    });
    const averageQueueHours = queueHours.length
      ? queueHours.reduce((sum, value) => sum + value, 0) / queueHours.length
      : 0;

    const activeUsers = state.users.filter((user) => user.status === 'active').length;
    const pendingUsers = state.users.filter((user) => user.status === 'pending').length;

    return {
      reviewablePackages,
      statusRows: buildStatusRows(reviewablePackages),
      dailySeries: buildDailySeries(reviewablePackages),
      reviewWorkloadSeries: buildReviewWorkloadSeries({
        reviewQueue: awaitingReview,
        underReview,
        returned,
        approved,
      }),
      ownerSeries: buildOwnerSeries(reviewablePackages),
      awaitingReview,
      underReview,
      openReviewQueue,
      returned,
      approved,
      decisions,
      totalCharts,
      approvalRate: percent(approved, decisions),
      returnRate: percent(returned, decisions),
      reviewCompletionRate: percent(decisions, reviewablePackages.length),
      averageQueueHours,
      activeUsers,
      pendingUsers,
    };
  }, [state.packages, state.users]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', panel)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading package analytics</p>
            <p className={cn('text-xs font-semibold', muted)}>Aggregating submitted package review workload and admin decisions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', text)}>Operational analytics</p>
          <p className={cn('mt-1 text-xs font-semibold', muted)}>
            Based on {analytics.reviewablePackages.length} submitted/reviewable packages, {analytics.totalCharts} linked chart records, and {state.totalUsers} user accounts. Draft/setup packages are excluded.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAnalytics({ silent: true })}
          className={cn(
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors',
            isDarkMode
              ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950',
          )}
        >
          <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </section>

      {state.error && (
        <section className={cn(
          'rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl',
          isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-800',
        )}>
          {state.error}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Waves} label="Open Review Queue" value={analytics.openReviewQueue} helper={`${analytics.awaitingReview} awaiting, ${analytics.underReview} in review`} tone="cyan" isDarkMode={isDarkMode} />
        <MetricCard icon={CheckCircle2} label="Approved / Published" value={analytics.approved} helper={`${analytics.approvalRate}% approval rate from decisions`} tone="emerald" isDarkMode={isDarkMode} />
        <MetricCard icon={Clock3} label="Avg Queue Age" value={formatHours(analytics.averageQueueHours)} helper="Age of packages still in review" tone="amber" isDarkMode={isDarkMode} />
        <MetricCard icon={ShieldCheck} label="Decision Completion" value={`${analytics.reviewCompletionRate}%`} helper={`${analytics.decisions} reviewed decisions recorded`} tone="blue" isDarkMode={isDarkMode} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.85fr)]">
        <Panel title="Seven-Day Review Workflow" description="Submitted packages compared with admin decisions and returned packages." isDarkMode={isDarkMode}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailySeries} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} /></linearGradient>
                  <linearGradient id="reviewedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#38bdf8" fill="url(#submittedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="reviewed" name="Approved / Published" stroke="#10b981" fill="url(#reviewedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="returned" name="Returned" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Package Review Funnel" description="Current reviewable package distribution by admin workflow state." isDarkMode={isDarkMode}>
          {analytics.statusRows.length === 0 ? (
            <EmptyState isDarkMode={isDarkMode} title="No submitted packages" description="Analytics will appear after forecast packages are submitted for admin review." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.statusRows} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={3}>
                    {analytics.statusRows.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Review Workload" description="Actionable package queues only; draft/setup packages are not shown." isDarkMode={isDarkMode}>
          <BarBlock data={analytics.reviewWorkloadSeries} dataKey="value" nameKey="label" color="#06b6d4" isDarkMode={isDarkMode} emptyTitle="No review workload" emptyDescription="Submitted and reviewed package counts will appear here." />
        </Panel>

        <Panel title="Forecast Team Throughput" description="Submitted/reviewable package volume by owner or team label." isDarkMode={isDarkMode}>
          <BarBlock data={analytics.ownerSeries} dataKey="value" nameKey="owner" color="#8b5cf6" isDarkMode={isDarkMode} emptyTitle="No owner data" emptyDescription="Package ownership appears after packages are submitted." />
        </Panel>

        <Panel title="Decision Health" description="Ratios that help admins see review quality and bottlenecks." isDarkMode={isDarkMode}>
          <div className="space-y-4">
            <RatioRow label="Review completion" value={analytics.reviewCompletionRate} isDarkMode={isDarkMode} tone="emerald" />
            <RatioRow label="Returned package rate" value={analytics.returnRate} isDarkMode={isDarkMode} tone={analytics.returnRate > 25 ? 'amber' : 'cyan'} />
            <RatioRow label="Active user share" value={percent(analytics.activeUsers, state.totalUsers)} isDarkMode={isDarkMode} tone="emerald" />
            <div className={cn('rounded-xl border p-3 text-xs font-semibold backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-white/80 bg-white/65 text-slate-500')}>
              Admin analytics intentionally exclude draft and unsubmitted setup packages. The page focuses on submitted package review workload and final decisions.
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = { blue: isDarkMode ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50/80 text-blue-700', cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50/80 text-cyan-700', emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50/80 text-emerald-700', amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50/80 text-amber-700' }[tone];
  return <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={cn('truncate text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p><p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p></div><span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}><Icon size={21} /></span></div><p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{helper}</p></div>;
}

function Panel({ title, description, isDarkMode, children }) {
  return <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}><div className="mb-4"><h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2><p className={cn('mt-1 text-sm font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>{children}</div>;
}

function BarBlock({ data, dataKey, nameKey, color, isDarkMode, emptyTitle, emptyDescription }) {
  if (!data.length || data.every((item) => !item[dataKey])) return <EmptyState isDarkMode={isDarkMode} title={emptyTitle} description={emptyDescription} />;
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 12, bottom: 4 }}><CartesianGrid stroke={isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.16)'} horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis type="category" dataKey={nameKey} width={128} tick={{ fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} /><Bar dataKey={dataKey} fill={color} radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div>;
}

function RatioRow({ label, value, isDarkMode, tone = 'cyan' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-cyan-500';
  return <div><div className="mb-1 flex justify-between text-xs font-black"><span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{label}</span><span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{value}%</span></div><div className={cn('h-2 overflow-hidden rounded-full', isDarkMode ? 'bg-white/10' : 'bg-slate-200')}><div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;
}

function EmptyState({ title, description, isDarkMode }) {
  return <div className={cn('rounded-xl border p-4 text-center', isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/60')}><AlertTriangle size={18} className={cn('mx-auto mb-2', isDarkMode ? 'text-slate-500' : 'text-slate-400')} /><p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p><p className={cn('mt-1 text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>;
}
