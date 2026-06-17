import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Users,
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

import { fetchAdminProjects } from '@/api/projectAPI';
import { fetchAllUsers } from '@/api/userAPI';
import { adaptProjects } from '@/features/projects/projectAdapter';
import { PROJECT_STATUS } from '@/features/projects/projectStatuses';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STATUS_LABELS = {
  [PROJECT_STATUS.SUBMITTED]: 'Submitted',
  [PROJECT_STATUS.UNDER_REVIEW]: 'Under Review',
  [PROJECT_STATUS.REVISION_REQUESTED]: 'Revision',
  [PROJECT_STATUS.APPROVED]: 'Approved',
  [PROJECT_STATUS.PUBLISHED]: 'Published',
  [PROJECT_STATUS.REJECTED]: 'Rejected',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
  [PROJECT_STATUS.DRAFT]: 'Draft',
};

const STATUS_COLORS = {
  [PROJECT_STATUS.SUBMITTED]: '#38bdf8',
  [PROJECT_STATUS.UNDER_REVIEW]: '#8b5cf6',
  [PROJECT_STATUS.REVISION_REQUESTED]: '#f59e0b',
  [PROJECT_STATUS.APPROVED]: '#10b981',
  [PROJECT_STATUS.PUBLISHED]: '#14b8a6',
  [PROJECT_STATUS.REJECTED]: '#f43f5e',
  [PROJECT_STATUS.ARCHIVED]: '#64748b',
  [PROJECT_STATUS.DRAFT]: '#94a3b8',
};

const CHART_TYPE_LABELS = {
  analysis: 'Analysis',
  forecast_24h: '24h Forecast',
  forecast_36h: '36h Forecast',
  forecast_48h: '48h Forecast',
  forecast: 'Forecast',
};

function normalizeUser(user) {
  return {
    id: user?._id || user?.id || user?.email,
    status: String(user?.status || 'pending').toLowerCase(),
    role: String(user?.role || 'user').toLowerCase(),
  };
}

function getStatusCount(statusCounts, status, projects) {
  if (statusCounts && Object.prototype.hasOwnProperty.call(statusCounts, status)) {
    return Number(statusCounts[status]) || 0;
  }

  return projects.filter((project) => project.status === status).length;
}

function getProjectDate(project) {
  return project.updatedAt || project.reviewedAt || project.submittedAt || project.createdAt;
}

function dateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
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

function formatHours(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function buildDailySeries(projects) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      day: formatShortDate(key),
      submitted: 0,
      reviewed: 0,
      published: 0,
    };
  });

  const byKey = new Map(days.map((day) => [day.key, day]));

  projects.forEach((project) => {
    const submittedKey = dateKey(project.submittedAt || project.createdAt);
    const reviewedKey = dateKey(project.reviewedAt || project.updatedAt);
    const publishedKey = dateKey(project.publishedAt || (project.status === PROJECT_STATUS.PUBLISHED ? project.updatedAt : null));

    if (byKey.has(submittedKey)) byKey.get(submittedKey).submitted += 1;
    if (byKey.has(reviewedKey)) byKey.get(reviewedKey).reviewed += 1;
    if (byKey.has(publishedKey)) byKey.get(publishedKey).published += 1;
  });

  return days;
}

function buildTypeSeries(projects) {
  const counts = new Map();

  projects.forEach((project) => {
    const key = project.chartType || 'forecast';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([type, value]) => ({
      type: CHART_TYPE_LABELS[type] || type.replace(/_/g, ' '),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function buildOwnerSeries(projects) {
  const counts = new Map();

  projects.forEach((project) => {
    const owner = project.ownerDisplay || 'Project Owner';
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
    projects: [],
    totalProjects: 0,
    statusCounts: null,
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
      const [projectResponse, userResponse] = await Promise.all([
        fetchAdminProjects({
          page: 1,
          limit: 100,
          sortBy: 'updatedAt',
          sortDir: 'desc',
        }),
        fetchAllUsers({
          page: 1,
          limit: 100,
        }),
      ]);

      const projects = adaptProjects(projectResponse?.projects ?? []);
      const users = Array.isArray(userResponse)
        ? userResponse.map(normalizeUser)
        : (userResponse?.data ?? []).map(normalizeUser);

      setState({
        loading: false,
        refreshing: false,
        error: '',
        projects,
        totalProjects: projectResponse?.total ?? projects.length,
        statusCounts: projectResponse?.statusCounts ?? null,
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
        error: error?.message || 'Failed to load analytics.',
      }));
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const analytics = useMemo(() => {
    const statusRows = Object.values(PROJECT_STATUS).map((status) => ({
      status,
      label: STATUS_LABELS[status] || status,
      value: getStatusCount(state.statusCounts, status, state.projects),
      color: STATUS_COLORS[status] || '#94a3b8',
    })).filter((item) => item.value > 0);

    const submitted = getStatusCount(state.statusCounts, PROJECT_STATUS.SUBMITTED, state.projects);
    const underReview = getStatusCount(state.statusCounts, PROJECT_STATUS.UNDER_REVIEW, state.projects);
    const revision = getStatusCount(state.statusCounts, PROJECT_STATUS.REVISION_REQUESTED, state.projects);
    const approved = getStatusCount(state.statusCounts, PROJECT_STATUS.APPROVED, state.projects);
    const published = getStatusCount(state.statusCounts, PROJECT_STATUS.PUBLISHED, state.projects);
    const rejected = getStatusCount(state.statusCounts, PROJECT_STATUS.REJECTED, state.projects);

    const decisions = approved + published + rejected + revision;
    const positiveDecisions = approved + published;
    const queue = submitted + underReview;

    const queueProjects = state.projects.filter((project) =>
      [PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW].includes(project.status),
    );
    const queueHours = queueProjects.map((project) => {
      const value = project.submittedAt || project.reviewStartedAt || project.createdAt;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 0;
      return Math.max(0, (Date.now() - date.getTime()) / 3600000);
    });
    const averageQueueHours = queueHours.length
      ? queueHours.reduce((sum, value) => sum + value, 0) / queueHours.length
      : 0;

    const activeUsers = state.users.filter((user) => user.status === 'active').length;
    const pendingUsers = state.users.filter((user) => user.status === 'pending').length;

    return {
      statusRows,
      dailySeries: buildDailySeries(state.projects),
      typeSeries: buildTypeSeries(state.projects),
      ownerSeries: buildOwnerSeries(state.projects),
      reviewQueue: queue,
      approvalRate: percent(positiveDecisions, decisions),
      revisionRate: percent(revision, decisions),
      publicationRate: percent(published, state.totalProjects),
      averageQueueHours,
      activeUsers,
      pendingUsers,
      reviewedSample: state.projects.filter((project) => getProjectDate(project)).length,
    };
  }, [state.projects, state.statusCounts, state.totalProjects, state.users]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', panel)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading operational analytics</p>
            <p className={cn('text-xs font-semibold', muted)}>Aggregating projects, review states, and user readiness.</p>
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
            Based on {state.totalProjects} projects and {state.totalUsers} user accounts. Last refreshed {formatRelative(state.loadedAt)}.
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
        <MetricCard
          icon={Waves}
          label="Review Queue"
          value={analytics.reviewQueue}
          helper="Submitted and under review"
          tone="cyan"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approval Rate"
          value={`${analytics.approvalRate}%`}
          helper="Approved or published decisions"
          tone="emerald"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Clock3}
          label="Avg Queue Age"
          value={formatHours(analytics.averageQueueHours)}
          helper="Open submitted/review items"
          tone="amber"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Users}
          label="Active Users"
          value={analytics.activeUsers}
          helper={`${analytics.pendingUsers} pending account${analytics.pendingUsers === 1 ? '' : 's'}`}
          tone="blue"
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.85fr)]">
        <Panel
          title="Seven-Day Workflow"
          description="Submitted, reviewed, and published project activity from the latest project sample."
          isDarkMode={isDarkMode}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailySeries} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="publishedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#38bdf8" fill="url(#submittedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="reviewed" name="Reviewed" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="published" name="Published" stroke="#10b981" fill="url(#publishedFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Review Funnel"
          description="Current project distribution by workflow state."
          isDarkMode={isDarkMode}
        >
          {analytics.statusRows.length === 0 ? (
            <EmptyState isDarkMode={isDarkMode} title="No workflow data" description="Project status counts will appear here once projects are available." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusRows}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={3}
                  >
                    {analytics.statusRows.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Chart Type Mix"
          description="Most common chart products in the latest sample."
          isDarkMode={isDarkMode}
        >
          <BarBlock
            data={analytics.typeSeries}
            dataKey="value"
            nameKey="type"
            color="#06b6d4"
            isDarkMode={isDarkMode}
            emptyTitle="No chart types"
            emptyDescription="Chart type mix will appear after projects are available."
          />
        </Panel>

        <Panel
          title="Forecaster Throughput"
          description="Project volume by owner in the latest sample."
          isDarkMode={isDarkMode}
        >
          <BarBlock
            data={analytics.ownerSeries}
            dataKey="value"
            nameKey="owner"
            color="#8b5cf6"
            isDarkMode={isDarkMode}
            emptyTitle="No owner data"
            emptyDescription="Forecaster throughput will appear after projects are available."
          />
        </Panel>

        <Panel
          title="Operational Readiness"
          description="Quick ratios from current project and user states."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-4">
            <RatioRow label="Publication rate" value={analytics.publicationRate} isDarkMode={isDarkMode} />
            <RatioRow label="Revision rate" value={analytics.revisionRate} isDarkMode={isDarkMode} tone={analytics.revisionRate > 30 ? 'amber' : 'cyan'} />
            <RatioRow label="Active user share" value={percent(analytics.activeUsers, state.totalUsers)} isDarkMode={isDarkMode} tone="emerald" />
            <div className={cn('rounded-xl border p-3 text-xs font-semibold backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-white/80 bg-white/65 text-slate-500')}>
              Analytics currently use the latest {state.projects.length} project records plus global status totals when provided by the API.
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
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
        <div className="min-w-0">
          <p className={cn('truncate text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
          <p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p>
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}>
          <Icon size={21} />
        </span>
      </div>
      <p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{helper}</p>
    </div>
  );
}

function Panel({ title, description, isDarkMode, children }) {
  return (
    <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="mb-4">
        <h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2>
        <p className={cn('mt-1 text-sm font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
      </div>
      {children}
    </div>
  );
}

function BarBlock({ data, dataKey, nameKey, color, isDarkMode, emptyTitle, emptyDescription }) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.16)'} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={96}
            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
          <Bar dataKey={dataKey} name="Projects" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatioRow({ label, value, isDarkMode, tone = 'cyan' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-cyan-500';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className={cn('font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
        <span className={cn('font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}%</span>
      </div>
      <div className={cn('h-2.5 overflow-hidden rounded-full', isDarkMode ? 'bg-white/10' : 'bg-white/80')}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ title, description, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border px-4 py-8 text-center backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <AlertTriangle className={cn('mx-auto h-6 w-6', isDarkMode ? 'text-slate-600' : 'text-slate-400')} />
      <p className={cn('mt-3 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
      <p className={cn('mx-auto mt-1 max-w-sm text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
    </div>
  );
}
