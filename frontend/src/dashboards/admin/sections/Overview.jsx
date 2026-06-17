import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Waves,
} from 'lucide-react';

import { fetchAdminProjects } from '@/api/projectAPI';
import { fetchAllUsers } from '@/api/userAPI';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';
import { adaptProjects } from '@/features/projects/projectAdapter';
import { PROJECT_STATUS } from '@/features/projects/projectStatuses';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const REVIEW_STATUSES = new Set([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
]);

const STATUS_TONE = {
  [PROJECT_STATUS.SUBMITTED]: 'border-sky-400/20 bg-sky-400/10 text-sky-600',
  [PROJECT_STATUS.UNDER_REVIEW]: 'border-violet-400/20 bg-violet-400/10 text-violet-600',
  [PROJECT_STATUS.REVISION_REQUESTED]: 'border-amber-400/20 bg-amber-400/10 text-amber-600',
  [PROJECT_STATUS.APPROVED]: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-600',
  [PROJECT_STATUS.PUBLISHED]: 'border-teal-400/20 bg-teal-400/10 text-teal-600',
  [PROJECT_STATUS.REJECTED]: 'border-rose-400/20 bg-rose-400/10 text-rose-600',
  [PROJECT_STATUS.ARCHIVED]: 'border-slate-400/20 bg-slate-400/10 text-slate-500',
  [PROJECT_STATUS.DRAFT]: 'border-slate-400/20 bg-slate-400/10 text-slate-500',
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

function getCount(statusCounts, status, projects) {
  if (statusCounts && Object.prototype.hasOwnProperty.call(statusCounts, status)) {
    return Number(statusCounts[status]) || 0;
  }

  return projects.filter((project) => project.status === status).length;
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

function buildProjectEvent(project) {
  const owner = project.ownerDisplay || 'Forecaster';

  if (project.status === PROJECT_STATUS.PUBLISHED) return `${project.title} was published`;
  if (project.status === PROJECT_STATUS.APPROVED) return `${project.title} is ready to publish`;
  if (project.status === PROJECT_STATUS.REVISION_REQUESTED) return `${project.title} was returned to ${owner}`;
  if (project.status === PROJECT_STATUS.UNDER_REVIEW) return `${project.title} is under review`;
  if (project.status === PROJECT_STATUS.SUBMITTED) return `${owner} submitted ${project.title}`;

  return `${project.title} was updated`;
}

export default function DashboardOverview({ isDarkMode, onSelectTab }) {
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
      const [projectResponse, userResponse] = await Promise.all([
        fetchAdminProjects({
          page: 1,
          limit: 10,
          sortBy: 'updatedAt',
          sortDir: 'desc',
        }),
        fetchAllUsers({
          page: 1,
          limit: 8,
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
        error: error?.message || 'Failed to load dashboard overview.',
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const submitted = getCount(state.statusCounts, PROJECT_STATUS.SUBMITTED, state.projects);
    const underReview = getCount(state.statusCounts, PROJECT_STATUS.UNDER_REVIEW, state.projects);
    const revision = getCount(state.statusCounts, PROJECT_STATUS.REVISION_REQUESTED, state.projects);
    const approved = getCount(state.statusCounts, PROJECT_STATUS.APPROVED, state.projects);
    const published = getCount(state.statusCounts, PROJECT_STATUS.PUBLISHED, state.projects);
    const pendingUsers = state.users.filter((user) => user.status === 'pending').length;
    const activeUsers = state.users.filter((user) => user.status === 'active').length;

    return {
      submitted,
      underReview,
      revision,
      approved,
      published,
      reviewQueue: submitted + underReview,
      attentionQueue: submitted + underReview + revision,
      pendingUsers,
      activeUsers,
    };
  }, [state.projects, state.statusCounts, state.users]);

  const reviewQueue = useMemo(
    () => state.projects.filter((project) => REVIEW_STATUSES.has(project.status)).slice(0, 5),
    [state.projects],
  );

  const recentActivity = useMemo(
    () => state.projects.slice(0, 5).map((project) => ({
      id: project.id,
      text: buildProjectEvent(project),
      status: project.status,
      date: project.updatedAt || project.submittedAt || project.createdAt,
    })),
    [state.projects],
  );

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', surface)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading admin operations</p>
            <p className={cn('text-xs font-semibold', muted)}>Fetching review queues, publication state, and user access.</p>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Waves}
          label="Review Queue"
          value={metrics.reviewQueue}
          helper={`${metrics.submitted} submitted, ${metrics.underReview} in review`}
          tone="cyan"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={FileCheck2}
          label="Ready To Publish"
          value={metrics.approved}
          helper={`${metrics.published} already published`}
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
          helper={`${metrics.revision} returned for revision`}
          tone={metrics.attentionQueue > 0 ? 'amber' : 'emerald'}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.85fr)]">
        <Panel
          title="Review Queue"
          description="Submitted forecast charts that need admin triage."
          actionLabel="Open Review Charts"
          onAction={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
          isDarkMode={isDarkMode}
        >
          <div className="space-y-2">
            {reviewQueue.length === 0 ? (
              <EmptyState
                title="No charts waiting for review"
                description="Submitted forecast charts will appear here when forecasters send them for review."
                isDarkMode={isDarkMode}
              />
            ) : reviewQueue.map((project) => (
              <ProjectRow key={project.id} project={project} isDarkMode={isDarkMode} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Operational Checklist"
          description="Daily checks for a clean review workflow."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            <ChecklistItem
              done={metrics.reviewQueue === 0}
              title="Clear review queue"
              detail={`${metrics.reviewQueue} chart${metrics.reviewQueue === 1 ? '' : 's'} waiting`}
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
            <ChecklistItem
              done={!state.error}
              title="Confirm data health"
              detail={state.error || `Dashboard refreshed ${formatRelative(state.loadedAt)}`}
              isDarkMode={isDarkMode}
              onClick={() => loadDashboard({ silent: true })}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Publication Pipeline"
          description="Current project state distribution."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            <PipelineBar label="Submitted" value={metrics.submitted} total={state.totalProjects} color="bg-sky-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Under Review" value={metrics.underReview} total={state.totalProjects} color="bg-violet-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Revision Requested" value={metrics.revision} total={state.totalProjects} color="bg-amber-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Approved" value={metrics.approved} total={state.totalProjects} color="bg-emerald-500" isDarkMode={isDarkMode} />
            <PipelineBar label="Published" value={metrics.published} total={state.totalProjects} color="bg-teal-500" isDarkMode={isDarkMode} />
          </div>
        </Panel>

        <Panel
          title="Recent Activity"
          description="Latest project updates."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Project updates will appear here after forecasters submit charts."
                isDarkMode={isDarkMode}
              />
            ) : recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} isDarkMode={isDarkMode} />
            ))}
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
              <EmptyState
                title="No users loaded"
                description="User accounts will appear here once the admin user endpoint responds."
                isDarkMode={isDarkMode}
              />
            ) : state.users.slice(0, 4).map((user) => (
              <UserRow key={user.id} user={user} isDarkMode={isDarkMode} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickAction
          icon={Waves}
          title="Review forecast charts"
          description="Inspect submitted map outputs and approve or request revisions."
          onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
          isDarkMode={isDarkMode}
        />
        <QuickAction
          icon={ShieldCheck}
          title="Manage access"
          description="Approve, suspend, or update operational user accounts."
          onClick={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
          isDarkMode={isDarkMode}
        />
        <QuickAction
          icon={Settings}
          title="Update configuration"
          description="Maintain public content and system settings."
          onClick={() => onSelectTab?.(ADMIN_TABS.SETTINGS)}
          isDarkMode={isDarkMode}
        />
      </section>
    </div>
  );
}

function StatusPill({ icon: Icon, label, tone, isDarkMode }) {
  const toneClass = tone === 'emerald'
    ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
    : isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-700';

  return (
    <span className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl', toneClass)}>
      <Icon size={15} />
      {label}
    </span>
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

function Panel({ title, description, actionLabel, onAction, isDarkMode, children }) {
  return (
    <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2>
          <p className={cn('mt-1 text-sm font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={cn('shrink-0 rounded-lg px-3 py-2 text-xs font-black transition-colors', isDarkMode ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]' : 'bg-white/75 text-slate-700 hover:bg-white')}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ProjectRow({ project, isDarkMode }) {
  const tone = STATUS_TONE[project.status] || STATUS_TONE[PROJECT_STATUS.DRAFT];

  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{project.title}</p>
        <p className={cn('mt-1 truncate text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {project.ownerDisplay || 'Forecaster'} - {project.chartType || 'Forecast'} - {formatDate(project.updatedAt || project.submittedAt)}
        </p>
      </div>
      <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black', tone)}>
        {project.status}
      </span>
    </div>
  );
}

function ChecklistItem({ done, title, detail, isDarkMode, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left backdrop-blur-xl transition-colors', isDarkMode ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]' : 'border-white/80 bg-white/65 hover:bg-white')}
    >
      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', done ? 'bg-emerald-400/10 text-emerald-500' : 'bg-amber-400/10 text-amber-500')}>
        {done ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span>
        <span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{detail}</span>
      </span>
      <ArrowRight size={15} className={cn('mt-1 shrink-0', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
    </button>
  );
}

function PipelineBar({ label, value, total, color, isDarkMode }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className={cn('font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
        <span className={cn('font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</span>
      </div>
      <div className={cn('h-2.5 overflow-hidden rounded-full', isDarkMode ? 'bg-white/10' : 'bg-white/80')}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActivityRow({ item, isDarkMode }) {
  return (
    <div className="flex gap-3">
      <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', item.status === PROJECT_STATUS.PUBLISHED ? 'bg-emerald-500' : 'bg-cyan-500')} />
      <div className="min-w-0">
        <p className={cn('text-sm font-bold leading-5', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{item.text}</p>
        <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{formatRelative(item.date)}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border p-3 backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <div className="flex items-center gap-2">
        <Icon size={15} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
        <span className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
      </div>
      <p className={cn('mt-2 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p>
    </div>
  );
}

function UserRow({ user, isDarkMode }) {
  const active = user.status === 'active';

  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{user.name}</p>
        <p className={cn('mt-1 truncate text-xs font-semibold capitalize', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {user.role} - {user.position}
        </p>
      </div>
      <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black capitalize', active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-600' : 'border-amber-400/20 bg-amber-400/10 text-amber-600')}>
        {user.status}
      </span>
    </div>
  );
}

function EmptyState({ title, description, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border px-4 py-6 text-center backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
      <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
      <p className={cn('mx-auto mt-1 max-w-sm text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('group flex min-h-32 items-start gap-3 rounded-2xl border p-4 text-left shadow-xl backdrop-blur-xl transition-all', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20 hover:bg-slate-900/70' : 'border-white/70 bg-white/70 shadow-slate-300/40 hover:bg-white')}
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700')}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span>
        <span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</span>
      </span>
      <ArrowRight size={16} className={cn('mt-1 shrink-0 transition-transform group-hover:translate-x-0.5', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
    </button>
  );
}
