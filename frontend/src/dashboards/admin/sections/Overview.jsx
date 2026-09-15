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
  RotateCcw,
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
  buildForecastDailySeries,
  buildForecastMetrics,
  buildSystemMetrics,
  buildUserMetrics,
  entriesByCount,
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

const ATTENTION_PIPELINE_STATES = new Set(['FAILED', 'WAITING_FOR_SOURCE', 'UNKNOWN']);

function formatTimestamp(value) {
  if (!value) return 'Not refreshed yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not refreshed yet';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatForecastDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
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

function Panel({ title, description, children, isDarkMode, action }) {
  return (
    <section
      className={cn(
        'rounded-2xl border shadow-lg',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div>
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {title}
          </h3>
          {description ? (
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ForecastActivityChart({ packages, isDarkMode }) {
  const daily = buildForecastDailySeries(packages || [], 14);
  const max = Math.max(
    1,
    ...daily.map((row) => Math.max(row.submitted, row.completed, row.returned))
  );

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-14 gap-1 sm:gap-2">
        {daily.map((row) => (
          <div key={row.key} className="min-w-0">
            <div
              className={cn(
                'flex h-40 items-end gap-[2px] rounded-lg p-1',
                isDarkMode ? 'bg-white/[0.03]' : 'bg-slate-50'
              )}
              title={`${row.label}: ${row.submitted} submitted, ${row.completed} completed, ${row.returned} returned`}
            >
              <div
                className="w-1/3 rounded-t bg-sky-500"
                style={{ height: `${Math.max(row.submitted ? 7 : 0, (row.submitted / max) * 100)}%` }}
              />
              <div
                className="w-1/3 rounded-t bg-emerald-500"
                style={{ height: `${Math.max(row.completed ? 7 : 0, (row.completed / max) * 100)}%` }}
              />
              <div
                className="w-1/3 rounded-t bg-amber-500"
                style={{ height: `${Math.max(row.returned ? 7 : 0, (row.returned / max) * 100)}%` }}
              />
            </div>
            <p
              className={cn(
                'mt-1 truncate text-center text-[9px] font-semibold',
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              {row.label}
            </p>
          </div>
        ))}
      </div>
      <div
        className={cn(
          'mt-3 flex flex-wrap gap-4 text-[10px] font-bold',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        <span><span className="text-sky-500">■</span> Submitted</span>
        <span><span className="text-emerald-500">■</span> Completed</span>
        <span><span className="text-amber-500">■</span> Returned</span>
      </div>
    </div>
  );
}

function StatusDistribution({ counts, isDarkMode }) {
  const rows = entriesByCount(counts);
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;

  return (
    <div className="space-y-3 px-4 pb-4">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{row.label}</span>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                {row.value} · {Math.round((row.value / total) * 100)}%
              </span>
            </div>
            <div className={cn('h-2 overflow-hidden rounded-full', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{ width: `${Math.max(4, (row.value / total) * 100)}%` }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className={cn('py-10 text-center text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
          No forecast status data available.
        </p>
      )}
    </div>
  );
}

function PipelineCard({ model, isDarkMode }) {
  const state = model?.state || 'UNKNOWN';
  const problem = ATTENTION_PIPELINE_STATES.has(state);
  const ready = state === 'READY';
  const frameCount = Number.isFinite(model?.frameCount) ? model.frameCount : 0;
  const expected = Number.isFinite(model?.expectedFrameCount) ? model.expectedFrameCount : 0;
  const sourceCycle = model?.sourceCycle || model?.cycle || model?.source?.cycle || null;

  return (
    <article
      className={cn(
        'rounded-xl border p-3',
        problem
          ? isDarkMode
            ? 'border-amber-400/20 bg-amber-400/[0.07] text-amber-100'
            : 'border-amber-200 bg-amber-50 text-amber-900'
          : ready
            ? isDarkMode
              ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : isDarkMode
              ? 'border-white/10 bg-white/[0.03] text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-700'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black">{model?.model || 'Wave model'}</h4>
        <span className="text-[10px] font-black uppercase tracking-wide">{state.replaceAll('_', ' ')}</span>
      </div>
      <p className="mt-2 text-xs font-semibold opacity-80">{model?.message || 'Operational pipeline status'}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-wide opacity-70">
        <span>{expected ? `${frameCount}/${expected} frames` : 'Frame readiness unavailable'}</span>
        {sourceCycle ? <span>Cycle {sourceCycle}</span> : null}
      </div>
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
        <span className={cn('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {title}
        </span>
        <span className={cn('mt-1 block text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          {description}
        </span>
        {meta ? <span className={cn('mt-2 block text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}>{meta}</span> : null}
      </span>
      <ArrowRight size={15} className={cn('mt-1 shrink-0', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
    </button>
  );
}

export default function DashboardOverview({ isDarkMode, onSelectTab }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const has = useCallback((permission) => permissions.has(permission), [permissions]);
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    errors: {},
    data: {},
    loadedAt: null,
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

      const settled = await Promise.allSettled(requests.map(async ([key, request]) => [key, await request]));
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
      }));
    },
    [has]
  );

  useEffect(() => {
    if (!rawUser) return undefined;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, rawUser]);

  const forecast = buildForecastMetrics(state.data.forecast);
  const users = buildUserMetrics(state.data.users);
  const system = buildSystemMetrics(state.data.system);
  const forecastPackages = state.data.forecast?.packages || [];
  const pipelineModels = state.data.pipeline?.models || [];
  const failedPipelines = pipelineModels.filter((model) => model.state === 'FAILED').length;
  const readyPipelines = pipelineModels.filter((model) => model.state === 'READY').length;
  const attentionPipelines = pipelineModels.filter((model) => ATTENTION_PIPELINE_STATES.has(model.state));
  const errorCount = Object.keys(state.errors).length;

  const attention = useMemo(() => {
    const items = [];
    if (has(PERMISSIONS.forecastReview) && has(PERMISSIONS.forecastAnalytics)) {
      if (forecast.inReview > 0) items.push(`${forecast.inReview} package${forecast.inReview === 1 ? '' : 's'} awaiting review`);
      if (forecast.returned > 0) items.push(`${forecast.returned} returned package${forecast.returned === 1 ? '' : 's'} need follow-up`);
    }
    attentionPipelines.forEach((model) => items.push(`${model.model || 'Wave model'}: ${String(model.state || 'unknown').replaceAll('_', ' ').toLowerCase()}`));
    if (has(PERMISSIONS.usersView) && has(PERMISSIONS.userAnalytics) && users.pending > 0) items.push(`${users.pending} pending account${users.pending === 1 ? '' : 's'} need review`);
    return items;
  }, [attentionPipelines, forecast.inReview, forecast.returned, has, users.pending]);

  const actions = useMemo(() => {
    const rows = [];
    if (has(PERMISSIONS.forecastReview)) rows.push({ icon: Waves, title: 'Review forecast packages', description: 'Resolve submitted and returned forecast work.', tab: ADMIN_TABS.FORECAST_REVIEW, meta: forecast.inReview ? `${forecast.inReview} in review` : 'Review workspace' });
    else if (has(PERMISSIONS.forecastView)) rows.push({ icon: Waves, title: 'Open forecast packages', description: 'Browse forecast packages available to your User Type.', tab: ADMIN_TABS.FORECAST_PACKAGES, meta: 'Forecast workspace' });
    if (has(PERMISSIONS.pipelineView)) rows.push({ icon: Database, title: 'Check wave pipeline', description: 'Inspect WW3 and ECWAM source/build readiness.', tab: ADMIN_TABS.WAVE_PIPELINE, meta: failedPipelines ? `${failedPipelines} issue${failedPipelines === 1 ? '' : 's'}` : `${readyPipelines}/${pipelineModels.length || 0} ready` });
    if (has(PERMISSIONS.usersView)) rows.push({ icon: Users, title: 'Manage users', description: 'Review account status and operational access.', tab: ADMIN_TABS.USERS_LIST, meta: users.pending ? `${users.pending} pending` : 'User management' });
    if (has(PERMISSIONS.waveModelsManage)) rows.push({ icon: Database, title: 'Manage wave models', description: 'Configure model availability and builder operations.', tab: ADMIN_TABS.WAVE_MODELS, meta: 'Model operations' });
    if (has(PERMISSIONS.calendarView)) rows.push({ icon: Clock3, title: 'Open operations calendar', description: 'Review forecast dates and operational milestones.', tab: ADMIN_TABS.CALENDAR, meta: 'Schedule view' });
    if (has(PERMISSIONS.forecastAnalytics) || has(PERMISSIONS.userAnalytics) || has(PERMISSIONS.systemAnalytics)) rows.push({ icon: BarChart3, title: 'Open analytics', description: 'Explore the full analytics workspace and date filters.', tab: ADMIN_TABS.ANALYTICS, meta: 'Detailed analytics' });
    return rows;
  }, [failedPipelines, forecast.inReview, has, pipelineModels.length, readyPipelines, users.pending]);

  const surface = isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white';

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[420px] items-center justify-center rounded-2xl border shadow-lg', surface)}>
          <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="text-sm font-black">Preparing your operational dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={cn('text-xs font-black uppercase tracking-[0.14em]', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}>
            Operational overview
          </p>
          <h2 className={cn('mt-1 text-2xl font-black tracking-tight', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Today at a glance
          </h2>
          <p className={cn('mt-1 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            Forecast workload, model readiness, publication progress, and operational activity.
          </p>
          <p className={cn('mt-2 text-[10px] font-semibold uppercase tracking-wide', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            Last refreshed {formatTimestamp(state.loadedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load({ silent: true })}
          disabled={state.refreshing}
          className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200 bg-white text-slate-700')}
        >
          <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
        </button>
      </section>

      {errorCount > 0 ? (
        <div className={cn('rounded-xl border px-4 py-3 text-xs font-semibold', isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800')}>
          Some permitted data could not be refreshed. Existing dashboard sections remain available where data was loaded.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {has(PERMISSIONS.forecastAnalytics) ? (
          <MetricCard icon={Clock3} label="In review" value={forecast.inReview} helper={`${forecast.returned} returned · ${forecast.published} published`} tone={forecast.returned ? 'amber' : 'cyan'} isDarkMode={isDarkMode} />
        ) : null}
        {has(PERMISSIONS.forecastAnalytics) ? (
          <MetricCard icon={CheckCircle2} label="Completion rate" value={`${forecast.completionRate}%`} helper={`${forecast.approved} approved or published in the current analytics period`} tone="emerald" isDarkMode={isDarkMode} />
        ) : null}
        {has(PERMISSIONS.systemAnalytics) ? (
          <MetricCard icon={Activity} label="Tracked packages" value={system.totalPackages} helper={`${system.packagesPublished} published · ${system.packagesReturned} returned`} tone="cyan" isDarkMode={isDarkMode} />
        ) : has(PERMISSIONS.userAnalytics) ? (
          <MetricCard icon={Users} label="Active accounts" value={users.active} helper={`${users.pending} pending · ${users.activeRate}% active`} tone={users.pending ? 'amber' : 'emerald'} isDarkMode={isDarkMode} />
        ) : null}
        {has(PERMISSIONS.pipelineView) ? (
          <MetricCard icon={Database} label="Models ready" value={`${readyPipelines}/${pipelineModels.length || 0}`} helper={failedPipelines ? `${failedPipelines} failed pipeline${failedPipelines === 1 ? '' : 's'} need attention` : `${attentionPipelines.length} source/readiness item${attentionPipelines.length === 1 ? '' : 's'} need attention`} tone={failedPipelines || attentionPipelines.length ? 'amber' : 'emerald'} isDarkMode={isDarkMode} />
        ) : null}
      </section>

      {has(PERMISSIONS.forecastAnalytics) ? (
        <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Panel title="Forecast activity · last 14 days" description="Submitted, completed, and returned forecast packages." isDarkMode={isDarkMode} action={<button type="button" onClick={() => onSelectTab?.(ADMIN_TABS.ANALYTICS)} className={cn('text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}>View analytics →</button>}>
            <ForecastActivityChart packages={forecastPackages} isDarkMode={isDarkMode} />
          </Panel>
          <Panel title="Package status" description="Current forecast package distribution in the analytics period." isDarkMode={isDarkMode}>
            <StatusDistribution counts={state.data.forecast?.statusCounts} isDarkMode={isDarkMode} />
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Operational attention" description="Conditions that may require action from your permitted workflows." isDarkMode={isDarkMode}>
          <div className="px-4 pb-4">
            {attention.length ? (
              <div className="space-y-2">
                {attention.map((item) => (
                  <div key={item} className={cn('flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold', isDarkMode ? 'border-amber-300/15 bg-amber-400/[0.05] text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900')}>
                    <AlertTriangle size={15} aria-hidden="true" /> {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn('flex items-center gap-3 rounded-xl border px-3 py-4 text-sm font-semibold', isDarkMode ? 'border-emerald-300/15 bg-emerald-400/[0.05] text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                <CheckCircle2 size={17} aria-hidden="true" /> No immediate attention items detected.
              </div>
            )}
          </div>
        </Panel>

        {has(PERMISSIONS.pipelineView) ? (
          <Panel title="Forecast readiness" description="Latest WW3 and ECWAM pipeline state." isDarkMode={isDarkMode}>
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-1">
              {pipelineModels.length ? pipelineModels.map((model) => <PipelineCard key={model.model} model={model} isDarkMode={isDarkMode} />) : <p className={cn('py-6 text-center text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>No wave-model readiness data available.</p>}
            </div>
          </Panel>
        ) : null}
      </section>

      {has(PERMISSIONS.forecastAnalytics) && forecastPackages.length ? (
        <Panel title="Recent forecast packages" description="Latest packages included in your permitted forecast analytics data." isDarkMode={isDarkMode}>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="min-w-full text-left text-xs">
              <thead className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                <tr><th className="py-2 pr-4 font-black">Forecast date</th><th className="py-2 pr-4 font-black">Package</th><th className="py-2 pr-4 font-black">Status</th><th className="py-2 font-black">Updated</th></tr>
              </thead>
              <tbody>
                {forecastPackages.slice(0, 6).map((item) => (
                  <tr key={item._id} className={cn('border-t', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
                    <td className="py-3 pr-4 font-semibold">{formatForecastDate(item.forecastDate)}</td>
                    <td className="py-3 pr-4 font-bold">{item.name || 'Forecast package'}</td>
                    <td className="py-3 pr-4"><span className={cn('rounded-full px-2 py-1 font-black', isDarkMode ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-700')}>{item.status || 'Unknown'}</span></td>
                    <td className={cn('py-3', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{formatTimestamp(item.updatedAt || item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <section>
        <div className="mb-3">
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Your next actions</h3>
          <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Permission-aware shortcuts to the operational areas available to you.</p>
        </div>
        {actions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => <ActionCard key={`${action.tab}-${action.title}`} {...action} onClick={() => onSelectTab?.(action.tab)} isDarkMode={isDarkMode} />)}
          </div>
        ) : (
          <div className={cn('rounded-2xl border px-5 py-12 text-center text-sm font-semibold', surface)}>No additional operational work areas are assigned to this User Type.</div>
        )}
      </section>
    </div>
  );
}
