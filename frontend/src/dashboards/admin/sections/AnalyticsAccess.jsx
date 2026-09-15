import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  fetchForecastAnalytics,
  fetchSystemAnalytics,
  fetchUserAnalytics,
} from '@/api/analyticsAPI';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

import {
  buildForecastDailySeries,
  buildForecastMetrics,
  buildSystemMetrics,
  buildUserMetrics,
  entriesByCount,
  getAllowedAnalyticsSections,
} from './analytics/analyticsWorkspaceModel';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const SECTION_ICON = {
  forecast: BarChart3,
  users: Users,
  system: Activity,
};

const REQUEST_BY_SECTION = {
  forecast: fetchForecastAnalytics,
  users: fetchUserAnalytics,
  system: fetchSystemAnalytics,
};

function formatGeneratedAt(value) {
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

function MetricCard({ icon: Icon, label, value, helper, isDarkMode }) {
  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/75 shadow-slate-300/30'
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
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={18} />
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

function Distribution({ title, description, rows, isDarkMode }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section
      className={cn(
        'rounded-2xl border p-4',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/75'
      )}
    >
      <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
        {title}
      </h3>
      <p
        className={cn(
          'mt-1 text-xs font-semibold',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {description}
      </p>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                  {row.label}
                </span>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                  {row.value}
                </span>
              </div>
              <div
                className={cn(
                  'h-2 overflow-hidden rounded-full',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
              >
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{ width: `${Math.max(5, Math.round((row.value / max) * 100))}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p
            className={cn(
              'py-8 text-center text-xs font-semibold',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            No data available yet.
          </p>
        )}
      </div>
    </section>
  );
}

function ForecastPanel({ payload, isDarkMode }) {
  const metrics = buildForecastMetrics(payload);
  const daily = buildForecastDailySeries(payload.packages || [], 14);
  const maxDaily = Math.max(
    1,
    ...daily.map((row) => Math.max(row.submitted, row.completed, row.returned))
  );
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BarChart3}
          label="Tracked Packages"
          value={metrics.total}
          helper={`${metrics.sampleSize} latest packages loaded for detailed trend analysis.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Clock3}
          label="In Review"
          value={metrics.inReview}
          helper="Submitted or currently under review."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approved / Published"
          value={metrics.approved}
          helper={`${metrics.completionRate}% of tracked packages have reached an approved outcome.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={RotateCcw}
          label="Returned"
          value={metrics.returned}
          helper="Revision requested or rejected packages requiring follow-up."
          isDarkMode={isDarkMode}
        />
      </section>

      <section
        className={cn(
          'rounded-2xl border p-4',
          isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/75'
        )}
      >
        <div>
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            14-day package movement
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Recent submitted, completed, and returned package activity from the scoped analytics
            read model.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-14 gap-1 sm:gap-2">
          {daily.map((row) => (
            <div key={row.key} className="min-w-0">
              <div
                className={cn(
                  'flex h-36 items-end gap-[2px] rounded-lg p-1',
                  isDarkMode ? 'bg-white/[0.03]' : 'bg-slate-50'
                )}
                title={`${row.label}: ${row.submitted} submitted, ${row.completed} completed, ${row.returned} returned`}
              >
                <div
                  className="w-1/3 rounded-t bg-sky-500"
                  style={{
                    height: `${Math.max(row.submitted ? 8 : 0, Math.round((row.submitted / maxDaily) * 100))}%`,
                  }}
                />
                <div
                  className="w-1/3 rounded-t bg-emerald-500"
                  style={{
                    height: `${Math.max(row.completed ? 8 : 0, Math.round((row.completed / maxDaily) * 100))}%`,
                  }}
                />
                <div
                  className="w-1/3 rounded-t bg-amber-500"
                  style={{
                    height: `${Math.max(row.returned ? 8 : 0, Math.round((row.returned / maxDaily) * 100))}%`,
                  }}
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
          <span>■ Submitted</span>
          <span>■ Completed</span>
          <span>■ Returned</span>
        </div>
      </section>

      <Distribution
        title="Package status distribution"
        description="All tracked forecast package states."
        rows={entriesByCount(payload.statusCounts)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

function UserPanel({ payload, isDarkMode }) {
  const metrics = buildUserMetrics(payload);
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Accounts"
          value={metrics.total}
          helper="Non-deleted WaveLab accounts included in this sanitized analytics view."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Active"
          value={metrics.active}
          helper={`${metrics.activeRate}% of accounts are active.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Clock3}
          label="Pending"
          value={metrics.pending}
          helper="Accounts still awaiting activation or operational approval."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Restricted"
          value={metrics.suspended}
          helper="Suspended or locked accounts."
          isDarkMode={isDarkMode}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Distribution
          title="Account status"
          description="Operational account readiness without names, email addresses, or contact details."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
        <Distribution
          title="User Type distribution"
          description="Participation by configured User Type key."
          rows={entriesByCount(payload.roleCounts)}
          isDarkMode={isDarkMode}
        />
      </section>
    </div>
  );
}

function SystemPanel({ payload, isDarkMode }) {
  const metrics = buildSystemMetrics(payload);
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Operational Accounts"
          value={metrics.activeUsers}
          helper={`${metrics.activeUserRate}% of ${metrics.totalUsers} accounts are active.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={BarChart3}
          label="Tracked Packages"
          value={metrics.totalPackages}
          helper="Forecast packages represented in the analytics operating set."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Clock3}
          label="Review Load"
          value={metrics.packagesInReview}
          helper="Packages currently submitted or under review."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Open Follow-up"
          value={metrics.packagesReturned + metrics.usersPending}
          helper={`${metrics.packagesReturned} returned packages and ${metrics.usersPending} pending accounts.`}
          isDarkMode={isDarkMode}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Distribution
          title="Forecast package health"
          description="Current package state distribution across the operational set."
          rows={entriesByCount(payload.forecastPackages?.statusCounts)}
          isDarkMode={isDarkMode}
        />
        <Distribution
          title="Account health"
          description="Current account state distribution."
          rows={entriesByCount(payload.users?.statusCounts)}
          isDarkMode={isDarkMode}
        />
      </section>
    </div>
  );
}

export default function AnalyticsAccess({ isDarkMode }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const sections = useMemo(() => getAllowedAnalyticsSections(permissions), [permissions]);
  const [activeSection, setActiveSection] = useState(null);
  const [state, setState] = useState({
    loading: false,
    refreshing: false,
    error: '',
    data: {},
    loadedAt: {},
  });

  useEffect(() => {
    if (!sections.length) return;
    if (!sections.some((section) => section.id === activeSection)) setActiveSection(sections[0].id);
  }, [activeSection, sections]);

  const loadSection = useCallback(async (sectionId, { silent = false } = {}) => {
    const request = REQUEST_BY_SECTION[sectionId];
    if (!request) return;
    setState((current) => ({ ...current, loading: !silent, refreshing: silent, error: '' }));
    try {
      const data = await request();
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: '',
        data: { ...current.data, [sectionId]: data },
        loadedAt: {
          ...current.loadedAt,
          [sectionId]: data?.generatedAt || new Date().toISOString(),
        },
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Unable to load analytics.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!activeSection || state.data[activeSection]) return;
    void loadSection(activeSection);
  }, [activeSection, loadSection, state.data]);

  if (!sections.length) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'rounded-2xl border px-6 py-20 text-center',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 text-slate-400'
              : 'border-white/70 bg-white/75 text-slate-500'
          )}
        >
          <ShieldCheck className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm font-black">
            No analytics subsection is assigned to your User Type.
          </p>
        </div>
      </div>
    );
  }

  const activeConfig = sections.find((section) => section.id === activeSection) || sections[0];
  const ActiveIcon = SECTION_ICON[activeConfig.id] || Activity;
  const payload = state.data[activeConfig.id] || {};

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section
        className={cn(
          'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-cyan-300/15 bg-cyan-400/[0.05] shadow-black/20'
            : 'border-cyan-100 bg-cyan-50/70 shadow-slate-300/30'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-white text-cyan-700'
              )}
            >
              <ActiveIcon size={20} />
            </span>
            <div>
              <p
                className={cn(
                  'text-xs font-black uppercase tracking-[0.15em]',
                  isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
                )}
              >
                Operational analytics
              </p>
              <h2
                className={cn(
                  'mt-1 text-xl font-black',
                  isDarkMode ? 'text-white' : 'text-slate-950'
                )}
              >
                {activeConfig.label}
              </h2>
              <p
                className={cn(
                  'mt-1 max-w-3xl text-sm font-semibold leading-6',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {activeConfig.description}
              </p>
              <p
                className={cn(
                  'mt-2 text-[11px] font-semibold',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Last refreshed: {formatGeneratedAt(state.loadedAt[activeConfig.id])}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadSection(activeConfig.id, { silent: true })}
            disabled={state.refreshing}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-white bg-white text-slate-700'
            )}
          >
            <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      <nav
        className={cn(
          'flex gap-2 overflow-x-auto rounded-2xl border p-2',
          isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/75'
        )}
        aria-label="Analytics subsections"
      >
        {sections.map((section) => {
          const Icon = SECTION_ICON[section.id] || Activity;
          const selected = section.id === activeConfig.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors',
                selected
                  ? 'bg-cyan-600 text-white'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon size={15} />
              {section.shortLabel}
            </button>
          );
        })}
      </nav>

      {state.error && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          <AlertTriangle size={15} className="mr-2 inline" />
          {state.error}
        </div>
      )}

      {state.loading && !state.data[activeConfig.id] ? (
        <div
          className={cn(
            'flex min-h-[360px] items-center justify-center rounded-2xl border',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/75'
          )}
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm font-black">Loading {activeConfig.label.toLowerCase()}…</span>
        </div>
      ) : activeConfig.id === 'forecast' ? (
        <ForecastPanel payload={payload} isDarkMode={isDarkMode} />
      ) : activeConfig.id === 'users' ? (
        <UserPanel payload={payload} isDarkMode={isDarkMode} />
      ) : (
        <SystemPanel payload={payload} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}
