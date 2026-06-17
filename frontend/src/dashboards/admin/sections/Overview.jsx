import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
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

const STATUS_TONE = {
  [PROJECT_STATUS.SUBMITTED]: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  [PROJECT_STATUS.UNDER_REVIEW]: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  [PROJECT_STATUS.REVISION_REQUESTED]: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  [PROJECT_STATUS.APPROVED]: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  [PROJECT_STATUS.PUBLISHED]: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  [PROJECT_STATUS.REJECTED]: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  [PROJECT_STATUS.ARCHIVED]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  [PROJECT_STATUS.DRAFT]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const REVIEW_STATUSES = new Set([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
]);

const ATTENTION_STATUSES = new Set([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
  PROJECT_STATUS.REVISION_REQUESTED,
]);

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
  if (!value) return 'No activity recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No activity recorded';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function userDisplayName(user) {
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  return fullName || user?.username || user?.email || 'User account';
}

function normalizeUser(user) {
  return {
    id: user?._id || user?.id || user?.email,
    name: userDisplayName(user),
    email: user?.email || '',
    role: user?.role || 'user',
    status: String(user?.status || 'pending').toLowerCase(),
    position: user?.position || user?.agency || 'No position set',
    lastLogin: user?.lastLogin,
  };
}

function buildProjectEvent(project) {
  const status = project.status;
  const owner = project.ownerDisplay || 'Forecaster';
  const date = project.updatedAt || project.submittedAt || project.createdAt;

  if (status === PROJECT_STATUS.PUBLISHED) {
    return `${project.title} was published for public viewing`;
  }

  if (status === PROJECT_STATUS.APPROVED) {
    return `${project.title} is approved and ready to publish`;
  }

  if (status === PROJECT_STATUS.REVISION_REQUESTED) {
    return `${project.title} was returned to ${owner} for revision`;
  }

  if (status === PROJECT_STATUS.UNDER_REVIEW) {
    return `${project.title} is under admin review`;
  }

  if (status === PROJECT_STATUS.SUBMITTED) {
    return `${owner} submitted ${project.title}`;
  }

  return `${project.title} was updated`;
}

const DashboardOverview = ({ isDarkMode, onSelectTab }) => {
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
          limit: 8,
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
    const projects = state.projects;
    const statusCounts = state.statusCounts;
    const submitted = getCount(statusCounts, PROJECT_STATUS.SUBMITTED, projects);
    const underReview = getCount(statusCounts, PROJECT_STATUS.UNDER_REVIEW, projects);
    const revision = getCount(statusCounts, PROJECT_STATUS.REVISION_REQUESTED, projects);
    const approved = getCount(statusCounts, PROJECT_STATUS.APPROVED, projects);
    const published = getCount(statusCounts, PROJECT_STATUS.PUBLISHED, projects);
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

  const operationalQueue = useMemo(
    () => state.projects.filter((project) => ATTENTION_STATUSES.has(project.status)).slice(0, 5),
    [state.projects],
  );

  const recentActivity = useMemo(
    () => state.projects
      .slice(0, 6)
      .map((project) => ({
        id: project.id,
        text: buildProjectEvent(project),
        status: project.status,
        date: project.updatedAt || project.submittedAt || project.createdAt,
      })),
    [state.projects],
  );

  const text = isDarkMode ? 'text-slate-100' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const panel = isDarkMode
    ? 'border-white/10 bg-slate-900/70'
    : 'border-slate-200 bg-white';
  const healthy = !state.error;

  if (state.loading) {
    return (
      <div className={cn('flex min-h-[420px] items-center justify-center rounded-2xl border', panel)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-300' : 'text-blue-600')} />
          <p className={cn('text-sm font-bold', text)}>Loading operational dashboard</p>
          <p className={cn('text-xs font-semibold', muted)}>Fetching project queues and account status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={cn('rounded-2xl border p-5 shadow-sm', panel)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={cn('text-xs font-black uppercase tracking-[0.22em]', muted)}>
              Operational Command
            </p>
            <h1 className={cn('mt-2 text-2xl font-black tracking-tight md:text-3xl', text)}>
              Marine Forecast Administration
            </h1>
            <p className={cn('mt-2 max-w-3xl text-sm font-medium leading-6', muted)}>
              Monitor submitted wave forecast charts, keep user access healthy, and move approved guidance toward publication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              icon={healthy ? CheckCircle2 : AlertTriangle}
              label={healthy ? 'Operational' : 'Needs Attention'}
              isDarkMode={isDarkMode}
              tone={healthy ? 'emerald' : 'amber'}
            />
            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              className={cn(
                'flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-colors',
                isDarkMode
                  ? 'border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {state.error && (
          <div className={cn(
            'mt-4 rounded-xl border px-4 py-3 text-sm font-semibold',
            isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800',
          )}>
            {state.error}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Waves}
          label="Charts Awaiting Review"
          value={metrics.reviewQueue}
          helper={`${metrics.submitted} submitted, ${metrics.underReview} in review`}
          tone="blue"
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
          helper={`${metrics.pendingUsers} pending on current page`}
          tone="cyan"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Operational Attention"
          value={metrics.attentionQueue}
          helper={`${metrics.revision} returned for revision`}
          tone={metrics.attentionQueue > 0 ? 'amber' : 'emerald'}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.85fr)]">
        <Panel
          title="Review Queue"
          description="Submitted charts that need admin triage or approval."
          actionLabel="Open Review Charts"
          onAction={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
          isDarkMode={isDarkMode}
        >
          <div className="space-y-2">
            {reviewQueue.length === 0 ? (
              <EmptyState
                title="No charts waiting for review"
                description="Submitted forecast charts will appear here when forecasters send them for admin review."
                isDarkMode={isDarkMode}
              />
            ) : reviewQueue.map((project) => (
              <ProjectRow key={project.id} project={project} isDarkMode={isDarkMode} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Operational Checklist"
          description="Daily admin checks aligned with the forecast workflow."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            <ChecklistItem
              done={metrics.reviewQueue === 0}
              title="Review incoming forecast charts"
              detail={`${metrics.reviewQueue} chart${metrics.reviewQueue === 1 ? '' : 's'} in review queue`}
              isDarkMode={isDarkMode}
              onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
            />
            <ChecklistItem
              done={metrics.pendingUsers === 0}
              title="Verify pending staff accounts"
              detail={`${metrics.pendingUsers} pending account${metrics.pendingUsers === 1 ? '' : 's'} on current page`}
              isDarkMode={isDarkMode}
              onClick={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
            />
            <ChecklistItem
              done={!state.error}
              title="Confirm dashboard data availability"
              detail={state.error || `Last refreshed ${formatRelative(state.loadedAt)}`}
              isDarkMode={isDarkMode}
              onClick={() => loadDashboard({ silent: true })}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Publication Pipeline"
          description="Current distribution of forecast project states."
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
          description="Latest project updates from the review workflow."
          isDarkMode={isDarkMode}
        >
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState
                title="No project activity yet"
                description="Project updates will appear here after forecasters begin submitting charts."
                isDarkMode={isDarkMode}
              />
            ) : recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} isDarkMode={isDarkMode} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Access Health"
          description="Staff account visibility for operational readiness."
          actionLabel="Manage Users"
          onAction={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
          isDarkMode={isDarkMode}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MiniStat label="Active" value={metrics.activeUsers} icon={UserCheck} isDarkMode={isDarkMode} />
            <MiniStat label="Pending" value={metrics.pendingUsers} icon={Clock} isDarkMode={isDarkMode} />
          </div>

          <div className="space-y-2">
            {state.users.slice(0, 4).map((user) => (
              <UserRow key={user.id} user={user} isDarkMode={isDarkMode} />
            ))}
            {state.users.length === 0 && (
              <EmptyState
                title="No users loaded"
                description="User accounts will appear here once the admin user endpoint responds."
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickAction
          icon={Waves}
          title="Review forecast charts"
          description="Open submitted charts, inspect annotations, and approve or request revisions."
          onClick={() => onSelectTab?.(ADMIN_TABS.CHARTS)}
          isDarkMode={isDarkMode}
        />
        <QuickAction
          icon={ShieldCheck}
          title="Manage operational access"
          description="Approve, suspend, or update accounts for forecasters and admins."
          onClick={() => onSelectTab?.(ADMIN_TABS.USERS_LIST)}
          isDarkMode={isDarkMode}
        />
        <QuickAction
          icon={Settings}
          title="Maintain public content"
          description="Update public dashboard copy, contact details, and site information."
          onClick={() => onSelectTab?.(ADMIN_TABS.SETTINGS)}
          isDarkMode={isDarkMode}
        />
      </section>
    </div>
  );
};

function StatusPill({ icon: Icon, label, tone, isDarkMode }) {
  const toneClass = tone === 'emerald'
    ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black', toneClass)}>
      <Icon size={15} />
      {label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = {
    blue: isDarkMode ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50 text-blue-700',
    emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
    cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700',
    amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700',
  }[tone] || (isDarkMode ? 'bg-slate-400/10 text-slate-200' : 'bg-slate-100 text-slate-700');

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            {label}
          </p>
          <p className={cn('mt-2 text-3xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {value}
          </p>
        </div>
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneClass)}>
          <Icon size={21} />
        </span>
      </div>
      <p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
        {helper}
      </p>
    </div>
  );
}

function Panel({ title, description, actionLabel, onAction, isDarkMode, children }) {
  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {title}
          </h2>
          <p className={cn('mt-1 text-sm font-medium leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            {description}
          </p>
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-xs font-black transition-colors',
              isDarkMode ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
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
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50')}>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {project.title}
        </p>
        <p className={cn('mt-1 truncate text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {project.ownerDisplay} - {project.chartType} - {formatDate(project.updatedAt || project.submittedAt)}
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
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
        isDarkMode ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
      )}
    >
      <span className={cn(
        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        done
          ? isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
          : isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-100 text-amber-700',
      )}>
        {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {title}
        </span>
        <span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {detail}
        </span>
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
      <div className={cn('h-2.5 overflow-hidden rounded-full', isDarkMode ? 'bg-white/10' : 'bg-slate-200')}>
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
        <p className={cn('text-sm font-bold leading-5', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
          {item.text}
        </p>
        <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
          {formatRelative(item.date)}
        </p>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50')}>
      <div className="flex items-center gap-2">
        <Icon size={15} className={isDarkMode ? 'text-cyan-300' : 'text-blue-600'} />
        <span className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
      </div>
      <p className={cn('mt-2 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p>
    </div>
  );
}

function UserRow({ user, isDarkMode }) {
  const active = user.status === 'active';
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50')}>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{user.name}</p>
        <p className={cn('mt-1 truncate text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {user.role} - {user.position}
        </p>
      </div>
      <span className={cn(
        'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black capitalize',
        active
          ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700',
      )}>
        {user.status}
      </span>
    </div>
  );
}

function EmptyState({ title, description, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border px-4 py-6 text-center', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50')}>
      <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
      <p className={cn('mx-auto mt-1 max-w-sm text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
        {description}
      </p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-32 items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all',
        isDarkMode ? 'border-white/10 bg-slate-900/70 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700')}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span>
        <span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {description}
        </span>
      </span>
      <ArrowRight size={16} className={cn('mt-1 shrink-0 transition-transform group-hover:translate-x-0.5', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
    </button>
  );
}

export default DashboardOverview;
