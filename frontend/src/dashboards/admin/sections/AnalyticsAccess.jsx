import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Loader2, RefreshCw, Users } from 'lucide-react';

import {
  fetchForecastAnalytics,
  fetchSystemAnalytics,
  fetchUserAnalytics,
} from '@/api/analyticsAPI';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

import AnalyticsSection from './Analytics';

const ANALYTICS_PERMISSIONS = Object.freeze({
  forecast: 'analytics_forecast.view',
  users: 'analytics_users.view',
  system: 'analytics_system.view',
});

const cn = (...classes) => classes.filter(Boolean).join(' ');

function SummaryCard({ icon: Icon, title, value, helper, isDarkMode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              'text-xs font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {title}
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
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={20} />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 text-sm font-semibold leading-5',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {helper}
      </p>
    </div>
  );
}

function ScopedAnalytics({ isDarkMode, permissions }) {
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', data: {} });

  const allowed = useMemo(
    () => ({
      forecast: permissions.has(ANALYTICS_PERMISSIONS.forecast),
      users: permissions.has(ANALYTICS_PERMISSIONS.users),
      system: permissions.has(ANALYTICS_PERMISSIONS.system),
    }),
    [permissions]
  );

  const load = async ({ silent = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: !silent && !Object.keys(current.data).length,
      refreshing: silent,
      error: '',
    }));

    try {
      const requests = [];
      if (allowed.forecast) requests.push(['forecast', fetchForecastAnalytics()]);
      if (allowed.users) requests.push(['users', fetchUserAnalytics()]);
      if (allowed.system) requests.push(['system', fetchSystemAnalytics()]);

      const results = await Promise.all(
        requests.map(async ([key, request]) => [key, await request])
      );

      setState({
        loading: false,
        refreshing: false,
        error: '',
        data: Object.fromEntries(results),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Failed to load analytics.',
      }));
    }
  };

  useEffect(() => {
    void load();
    // Permission changes revoke sessions, so the allowed capability set is stable for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forecastPackages = state.data.forecast?.packages || [];
  const userRows = state.data.users?.data || [];
  const activeUsers = userRows.filter((user) => user.status === 'active').length;
  const approvedPackages = forecastPackages.filter((item) =>
    ['Approved', 'Published'].includes(item.status)
  ).length;

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'flex min-h-[360px] items-center justify-center rounded-2xl border',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/70'
          )}
        >
          <div className="flex items-center gap-3 text-sm font-black">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading permitted analytics…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Scoped operational analytics
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Only analytics subsections granted to your User Type are loaded or displayed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load({ silent: true })}
          className={cn(
            'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black',
            isDarkMode
              ? 'border-white/10 bg-white/[0.04] text-slate-300'
              : 'border-slate-200 bg-white text-slate-700'
          )}
        >
          <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </section>

      {state.error && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          <AlertTriangle size={15} className="mr-2 inline" /> {state.error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allowed.forecast && (
          <SummaryCard
            icon={BarChart3}
            title="Forecast Operations"
            value={state.data.forecast?.total ?? forecastPackages.length}
            helper={`${approvedPackages} approved or published packages in the scoped analytics read model.`}
            isDarkMode={isDarkMode}
          />
        )}
        {allowed.users && (
          <SummaryCard
            icon={Users}
            title="User Activity"
            value={activeUsers}
            helper={`${state.data.users?.total ?? userRows.length} total non-deleted accounts; no profile or contact fields are exposed.`}
            isDarkMode={isDarkMode}
          />
        )}
        {allowed.system && (
          <SummaryCard
            icon={Activity}
            title="System Operations"
            value={state.data.system?.forecastPackages?.total ?? 0}
            helper={`${state.data.system?.users?.active ?? 0} active users across ${state.data.system?.users?.total ?? 0} accounts.`}
            isDarkMode={isDarkMode}
          />
        )}
      </section>
    </div>
  );
}

export default function AnalyticsAccess({ isDarkMode }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const hasFullAnalytics = Object.values(ANALYTICS_PERMISSIONS).every((permission) =>
    permissions.has(permission)
  );

  if (hasFullAnalytics) {
    return <AnalyticsSection isDarkMode={isDarkMode} />;
  }

  return <ScopedAnalytics isDarkMode={isDarkMode} permissions={permissions} />;
}
