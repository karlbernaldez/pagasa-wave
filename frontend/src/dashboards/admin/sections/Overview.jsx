import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  Waves,
} from 'lucide-react';

import {
  fetchForecastAnalytics,
  fetchSystemAnalytics,
  fetchUserAnalytics,
} from '@/api/analyticsAPI';
import { fetchWavePipelineStatus } from '@/api/wavePipelineStatus';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

import {
  buildForecastMetrics,
  buildSystemMetrics,
  buildUserMetrics,
} from './analytics/analyticsWorkspaceModel';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PERMISSIONS = Object.freeze({
  forecastAnalytics: 'analytics_forecast.view',
  userAnalytics: 'analytics_users.view',
  systemAnalytics: 'analytics_system.view',
  forecastView: 'forecast.view',
  forecastReview: 'forecast.review',
  pipelineView: 'wave_pipeline.view',
  waveModelsManage: 'wave_models.manage',
  usersView: 'users.view',
  calendarView: 'calendar.view',
});

const PIPELINE_TONE = {
  READY: 'emerald',
  READY_TO_BUILD: 'cyan',
  WAITING_FOR_SOURCE: 'amber',
  NORMALIZING: 'cyan',
  BUILDING: 'cyan',
  VALIDATING: 'cyan',
  PUBLISHING: 'cyan',
  FAILED: 'rose',
  UNKNOWN: 'slate',
};

const ATTENTION_PIPELINE_STATES = new Set(['FAILED', 'WAITING_FOR_SOURCE', 'UNKNOWN']);
const DASHBOARD_STALE_AFTER_MS = 5 * 60 * 1000;

function formatRelative(value) {
  if (!value) return 'not refreshed yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'not refreshed yet';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function MetricCard({ icon: Icon, label, value, helper, tone = 'cyan', isDarkMode }) {
  const iconTone =
    {
      cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700',
      emerald: isDarkMode
        ? 'bg-emerald-400/10 text-emerald-200'
        : 'bg-emerald-50 text-emerald-700',
      amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700',
      rose: isDarkMode ? 'bg-rose-400/10 text-rose-200' : 'bg-rose-50 text-rose-700',
    }[tone] || (isDarkMode ? 'bg-slate-400/10 text-slate-200' : 'bg-slate-100 text-slate-700');

  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-lg',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              'text-[11px] font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-black tabular-nums',
              isDarkMode ? 'text-white' : 'text-slate-950'
            )}
          >
            {value}
          </p>
        </div>
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl', iconTone)}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 text-xs font-semibold leading-5',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {helper}
      </p>
    </article>
  );
}

function ActionCard({ icon: Icon, title, description, meta, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 hover:bg-white/[0.05]'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
          isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}
        >
          {title}
        </span>
        <span
          className={cn(
            'mt-1 block text-xs font-semibold leading-5',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {description}
        </span>
        {meta ? (
          <span
            className={cn(
              'mt-2 block text-[10px] font-black uppercase tracking-wide',
              isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
            )}
          >
            {meta}
          </span>
        ) : null}
      </span>
      <ArrowRight
        size={15}
        aria-hidden="true"
        className={cn(
          'mt-1 shrink-0 transition-transform group-hover:translate-x-0.5',
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        )}
      />
    </button>
  );
}

function AttentionItem({ icon: Icon, title, detail, tone = 'amber', onClick, isDarkMode }) {
  const toneClasses = {
    amber: isDarkMode
      ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100'
      : 'border-amber-200 bg-amber-50 text-amber-900',
    rose: isDarkMode
      ? 'border-rose-300/20 bg-rose-400/[0.08] text-rose-100'
      : 'border-rose-200 bg-rose-50 text-rose-900',
    cyan: isDarkMode
      ? 'border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-100'
      : 'border-cyan-200 bg-cyan-50 text-cyan-900',
  }[tone];

  const content = (
    <>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-current/10">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-semibold opacity-80">{detail}</span>
      </span>
      {onClick ? (
        <ArrowRight size={15} aria-hidden="true" className="mt-1 shrink-0 opacity-60" />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left', toneClasses)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-3', toneClasses)}>{content}</div>
  );
}

function PipelineCard({ model, isDarkMode }) {
  const state = model?.state || 'UNKNOWN';
  const tone = PIPELINE_TONE[state] || 'slate';
  const toneClass = {
    emerald: isDarkMode
      ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800',
    cyan: isDarkMode
      ? 'border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200'
      : 'border-cyan-200 bg-cyan-50 text-cyan-800',
    amber: isDarkMode
      ? 'border-amber-400/20 bg-amber-400/[0.08] text-amber-200'
      : 'border-amber-200 bg-amber-50 text-amber-800',
    rose: isDarkMode
      ? 'border-rose-400/20 bg-rose-400/[0.08] text-rose-200'
      : 'border-rose-200 bg-rose-50 text-rose-800',
    slate: isDarkMode
      ? 'border-white/10 bg-white/[0.04] text-slate-300'
      : 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone];
  const frameCount = Number.isFinite(model?.frameCount) ? model.frameCount : 0;
  const expected = Number.isFinite(model?.expectedFrameCount) ? model.expectedFrameCount : 0;
  const sourceCycle = model?.sourceCycle || model?.cycle || model?.source?.cycle || null;

  return (
    <article className={cn('rounded-xl border p-3', toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black">{model?.model || 'Wave model'}</h4>
        <span className="text-[10px] font-black uppercase tracking-wide">
          {state.replaceAll('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold opacity-80">
        {model?.message || 'Operational pipeline status'}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-wide opacity-70">
        <span>{expected ? `${frameCount}/${expected} frames` : 'Frame readiness unavailable'}</span>
        {sourceCycle ? <span>Cycle {sourceCycle}</span> : null}
      </div>
    </article>
  );
}

export default function DashboardOverview({ isDarkMode, onSelectTab }) {
  const { user, rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const has = useCallback((permission) => permissions.has(permission), [permissions]);
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    errors: {},
    data: {},
    loadedAt: null,
    stale: false,
  });

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const requests = [];
      if (has(PERMISSIONS.forecastAnalytics)) requests.push(['forecast', fetchForecastAnalytics()]);
      if (has(PERMISSIONS.userAnalytics)) requests.push(['users', fetchUserAnalytics()]);
      if (has(PERMISSIONS.systemAnalytics)) requests.push(['system', fetchSystemAnalytics()]);
      if (has(PERMISSIONS.pipelineView)) requests.push(['pipeline', fetchWavePipelineStatus()]);

      setState((current) => ({
        ...current,
        loading: !silent && !current.loadedAt,
        refreshing: silent,
        errors: {},
      }));

      const settled = await Promise.allSettled(
        requests.map(async ([key, request]) => [key, await request])
      );
      const data = {};
      const errors = {};
      settled.forEach((result, index) => {
        const key = requests[index]?.[0];
        if (!key) return;
        if (result.status === 'fulfilled') data[key] = result.value[1];
        else errors[key] = result.reason?.message || `Unable to load ${key} summary.`;
      });

      setState((current) => ({
        loading: false,
        refreshing: false,
        errors,
        data: { ...current.data, ...data },
        loadedAt: new Date().toISOString(),
        stale: false,
      }));
    },
    [has]
  );

  useEffect(() => {
    if (!rawUser) return undefined;
    const initialLoadTimer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoadTimer);
  }, [load, rawUser]);

  useEffect(() => {
    if (!state.loadedAt) return undefined;
    const loadedAt = state.loadedAt;
    const staleTimer = window.setTimeout(() => {
      setState((current) =>
        current.loadedAt === loadedAt ? { ...current, stale: true } : current
      );
    }, DASHBOARD_STALE_AFTER_MS);
    return () => window.clearTimeout(staleTimer);
  }, [state.loadedAt]);

  const forecast = buildForecastMetrics(state.data.forecast);
  const users = buildUserMetrics(state.data.users);
  const system = buildSystemMetrics(state.data.system);
  const pipelineModels = state.data.pipeline?.models || [];
  const failedPipelines = pipelineModels.filter((model) => model.state === 'FAILED').length;
  const readyPipelines = pipelineModels.filter((model) => model.state === 'READY').length;
  const attentionPipelines = pipelineModels.filter((model) =>
    ATTENTION_PIPELINE_STATES.has(model.state)
  );
  const errorCount = Object.keys(state.errors).length;

  const attention = useMemo(() => {
    const items = [];

    if (has(PERMISSIONS.forecastReview) && has(PERMISSIONS.forecastAnalytics)) {
      if (forecast.inReview > 0) {
        items.push({
          key: 'review',
          icon: Clock3,
          title: `${forecast.inReview} package${forecast.inReview === 1 ? '' : 's'} awaiting review`,
          detail: 'Open the Review Queue and resolve submitted forecast work.',
          tone: 'cyan',
          tab: ADMIN_TABS.FORECAST_REVIEW,
        });
      }
      if (forecast.returned > 0) {
        items.push({
          key: 'returned',
          icon: AlertTriangle,
          title: `${forecast.returned} returned package${forecast.returned === 1 ? '' : 's'} need follow-up`,
          detail: 'Revision requested or rejected packages still require operational action.',
          tone: 'amber',
          tab: ADMIN_TABS.FORECAST_REVIEW,
        });
      }
    }

    if (has(PERMISSIONS.pipelineView)) {
      attentionPipelines.forEach((model) => {
        items.push({
          key: `pipeline-${model.model}`,
          icon: Database,
          title: `${model.model || 'Wave model'} is ${String(model.state || 'unknown').replaceAll('_', ' ').toLowerCase()}`,
          detail: model.message || 'Inspect the wave pipeline for the latest source/build state.',
          tone: model.state === 'FAILED' ? 'rose' : 'amber',
          tab: ADMIN_TABS.WAVE_PIPELINE,
        });
      });
    }

    if (has(PERMISSIONS.usersView) && has(PERMISSIONS.userAnalytics) && users.pending > 0) {
      items.push({
        key: 'pending-users',
        icon: Users,
        title: `${users.pending} pending account${users.pending === 1 ? '' : 's'} need review`,
        detail: 'Open User Management to review account status and operational access.',
        tone: 'amber',
        tab: ADMIN_TABS.USERS_LIST,
      });
    }

    return items;
  }, [attentionPipelines, forecast.inReview, forecast.returned, has, users.pending]);

  const actions = useMemo(() => {
    const rows = [];
    if (has(PERMISSIONS.forecastReview)) {
      rows.push({
        icon: Waves,
        title: 'Review forecast packages',
        description:
          'Open the package review queue and resolve submitted or returned forecast work.',
        tab: ADMIN_TABS.FORECAST_REVIEW,
        meta: forecast.inReview ? `${forecast.inReview} currently in review` : 'Review workspace',
      });
    } else if (has(PERMISSIONS.forecastView)) {
      rows.push({
        icon: Waves,
        title: 'Open forecast packages',
        description: 'Browse forecast packages available to your User Type.',
        tab: ADMIN_TABS.FORECAST_PACKAGES,
        meta: 'Forecast workspace',
      });
    }
    if (has(PERMISSIONS.pipelineView)) {
      rows.push({
        icon: Database,
        title: 'Check wave pipeline',
        description: 'Inspect WW3 and ECWAM source, build, validation, and publication readiness.',
        tab: ADMIN_TABS.WAVE_PIPELINE,
        meta: failedPipelines
          ? `${failedPipelines} pipeline issue${failedPipelines === 1 ? '' : 's'}`
          : `${readyPipelines} ready`,
      });
    }
    if (has(PERMISSIONS.usersView)) {
      rows.push({
        icon: Users,
        title: 'Manage users',
        description: 'Review account status and operational access.',
        tab: ADMIN_TABS.USERS_LIST,
        meta: users.pending ? `${users.pending} pending` : 'User management',
      });
    }
    if (has(PERMISSIONS.waveModelsManage)) {
      rows.push({
        icon: Database,
        title: 'Manage wave models',
        description: 'Configure model availability, package policy, and builder operations.',
        tab: ADMIN_TABS.WAVE_MODELS,
        meta: 'Model operations',
      });
    }
    if (has(PERMISSIONS.calendarView)) {
      rows.push({
        icon: Clock3,
        title: 'Open operations calendar',
        description: 'Review forecast dates and operational milestones.',
        tab: ADMIN_TABS.CALENDAR,
        meta: 'Schedule view',
      });
    }
    if (
      has(PERMISSIONS.forecastAnalytics) ||
      has(PERMISSIONS.userAnalytics) ||
      has(PERMISSIONS.systemAnalytics)
    ) {
      rows.push({
        icon: BarChart3,
        title: 'Open analytics',
        description: 'Inspect only the analytics subsections granted to your User Type.',
        tab: ADMIN_TABS.ANALYTICS,
        meta: 'Operational analytics',
      });
    }
    return rows;
  }, [failedPipelines, forecast.inReview, has, readyPipelines, users.pending]);

  const surface = isDarkMode
    ? 'border-white/10 bg-slate-950/50'
    : 'border-slate-200 bg-white';

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'flex min-h-[420px] items-center justify-center rounded-2xl border shadow-lg',
            surface
          )}
        >
          <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="text-sm font-black">Preparing your operational dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section
        className={cn(
          'rounded-2xl border p-5 shadow-lg',
          isDarkMode ? 'border-cyan-300/15 bg-slate-950/60' : 'border-cyan-100 bg-cyan-50/60'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p
              className={cn(
                'text-xs font-black uppercase tracking-[0.15em]',
                isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
              )}
            >
              WaveLab operational workspace
            </p>
            <h2
              className={cn(
                'mt-2 text-2xl font-black tracking-tight',
                isDarkMode ? 'text-white' : 'text-slate-950'
              )}
            >
              Welcome, {user?.name || 'WaveLab user'}.
            </h2>
            <p
              className={cn(
                'mt-1 max-w-3xl text-sm font-semibold leading-6',
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Prioritize forecast work, wave-model readiness, and operational follow-up using only
              the capabilities assigned to your User Type.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-slate-300'
                    : 'border-white bg-white text-slate-600'
                )}
              >
                <ShieldCheck size={12} aria-hidden="true" /> {user?.role || 'Authorized user'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black',
                  errorCount
                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-500'
                    : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-500'
                )}
              >
                {errorCount ? (
                  <AlertTriangle size={12} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={12} aria-hidden="true" />
                )}
                {errorCount
                  ? `${errorCount} source${errorCount === 1 ? '' : 's'} unavailable`
                  : 'Permitted data sources available'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load({ silent: true })}
            disabled={state.refreshing}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            <RefreshCw
              size={15}
              className={state.refreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
        <p
          className={cn(
            'mt-3 text-[10px] font-semibold uppercase tracking-wide',
            state.stale
              ? isDarkMode
                ? 'text-amber-200'
                : 'text-amber-700'
              : isDarkMode
                ? 'text-slate-500'
                : 'text-slate-400'
          )}
        >
          Last refreshed {formatRelative(state.loadedAt)}
          {state.stale ? ' · data may be stale' : ''}
        </p>
      </section>

      {errorCount > 0 ? (
        <section
          className={cn(
            'rounded-2xl border px-4 py-3 text-xs font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          aria-label="Unavailable dashboard sources"
        >
          <p className="mb-1 font-black">Some permitted data could not be refreshed.</p>
          {Object.entries(state.errors).map(([key, message]) => (
            <p key={key}>
              <span className="font-black capitalize">{key}:</span> {message}
            </p>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-3">
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            What needs attention
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Actionable conditions are shown only when you can access the related workflow.
          </p>
        </div>
        {attention.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {attention.map((item) => (
              <AttentionItem
                key={item.key}
                {...item}
                onClick={() => onSelectTab?.(item.tab)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold',
              isDarkMode
                ? 'border-emerald-300/15 bg-emerald-400/[0.05] text-emerald-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            )}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            No immediate attention items were detected from your permitted data sources.
          </div>
        )}
      </section>

      {has(PERMISSIONS.pipelineView) ? (
        <section className={cn('rounded-2xl border p-4 shadow-sm', surface)}>
          <div className="mb-4">
            <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Forecast readiness
            </h3>
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              WW3 and ECWAM source/build readiness from the latest pipeline status available to you.
            </p>
          </div>
          {pipelineModels.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {pipelineModels.map((model) => (
                <PipelineCard key={model.model} model={model} isDarkMode={isDarkMode} />
              ))}
            </div>
          ) : (
            <p
              className={cn(
                'py-6 text-center text-xs font-semibold',
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              No wave-model readiness data is available from the latest pipeline response.
            </p>
          )}
        </section>
      ) : null}

      <section>
        <div className="mb-3">
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Operational summary
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Only summaries backed by a granted analytics or pipeline capability appear here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {has(PERMISSIONS.forecastAnalytics) ? (
            <MetricCard
              icon={Waves}
              label="Packages in review"
              value={forecast.inReview}
              helper={`${forecast.returned} returned · ${forecast.approved} approved/published`}
              tone={forecast.returned ? 'amber' : 'cyan'}
              isDarkMode={isDarkMode}
            />
          ) : null}
          {has(PERMISSIONS.userAnalytics) ? (
            <MetricCard
              icon={Users}
              label="Active new accounts"
              value={users.active}
              helper={`${users.pending} pending · ${users.activeRate}% active in the analytics period`}
              tone={users.pending ? 'amber' : 'emerald'}
              isDarkMode={isDarkMode}
            />
          ) : null}
          {has(PERMISSIONS.systemAnalytics) ? (
            <MetricCard
              icon={Activity}
              label="Tracked packages"
              value={system.totalPackages}
              helper={`${system.packagesPublished} published · ${system.packagesReturned} returned`}
              tone="cyan"
              isDarkMode={isDarkMode}
            />
          ) : null}
          {has(PERMISSIONS.pipelineView) ? (
            <MetricCard
              icon={Database}
              label="Pipeline ready"
              value={`${readyPipelines}/${pipelineModels.length || 0}`}
              helper={
                failedPipelines
                  ? `${failedPipelines} failed pipeline${failedPipelines === 1 ? '' : 's'} need attention`
                  : 'No failed pipeline reported in the latest status.'
              }
              tone={failedPipelines ? 'rose' : 'emerald'}
              isDarkMode={isDarkMode}
            />
          ) : null}
          {!has(PERMISSIONS.forecastAnalytics) &&
          !has(PERMISSIONS.userAnalytics) &&
          !has(PERMISSIONS.systemAnalytics) &&
          !has(PERMISSIONS.pipelineView) ? (
            <div
              className={cn(
                'col-span-full rounded-2xl border px-5 py-10 text-center text-sm font-semibold',
                surface
              )}
            >
              No summary data capabilities are assigned to this User Type. Your permitted work areas
              are still available below.
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Your next actions
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Shortcuts are generated from effective permissions, never from the User Type name.
          </p>
        </div>
        {actions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <ActionCard
                key={`${action.tab}-${action.title}`}
                {...action}
                onClick={() => onSelectTab?.(action.tab)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl border px-5 py-12 text-center text-sm font-semibold',
              surface
            )}
          >
            Your User Type currently has Dashboard access but no additional operational work areas.
          </div>
        )}
      </section>
    </div>
  );
}
