import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  fetchAnalyticsExport,
  fetchForecastAnalytics,
  fetchSystemAnalytics,
  fetchUserAnalytics,
} from '@/api/analyticsAPI';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

import {
  ANALYTICS_RANGE_PRESETS,
  buildPresetRange,
  initialAnalyticsRange,
  isAnalyticsDataStale,
} from './analytics/analyticsDateRange';
import {
  adaptiveBucketDays,
  bucketDateSeries,
  buildForecastDailySeries,
  buildForecastMetrics,
  buildSystemMetrics,
  buildUserMetrics,
  contributionMixRows,
  entriesByCount,
  getAllowedAnalyticsSections,
  publishedChartRows,
} from './analytics/analyticsWorkspaceModel';
import {
  AnalyticsCarousel,
  BarChartCard,
  DistributionCard,
  TrendCard,
} from './analytics/AnalyticsVisuals';

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

const bucketLabel = (days) => {
  const size = adaptiveBucketDays(days);
  if (size === 1) return 'Daily';
  if (size === 2) return '2-day buckets';
  return 'Weekly';
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
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
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

function ForecastPanel({ payload, isDarkMode }) {
  const metrics = buildForecastMetrics(payload);
  const days = Math.max(1, Number(payload.range?.days) || 14);
  const daily = buildForecastDailySeries(payload.packages || [], days);
  const trend = bucketDateSeries(daily, {
    start: payload.range?.start,
    end: payload.range?.end,
    valueFields: ['submitted', 'completed', 'returned'],
    dayCount: days,
  });

  const slides = [
    {
      id: 'movement',
      label: 'Package movement',
      content: (
        <TrendCard
          title="Package movement"
          description="Submitted, completed, and returned forecast packages in the selected period."
          rows={trend}
          series={[
            { dataKey: 'submitted', label: 'Submitted', stroke: '#0ea5e9' },
            { dataKey: 'completed', label: 'Completed', stroke: '#10b981' },
            { dataKey: 'returned', label: 'Returned', stroke: '#f59e0b' },
          ]}
          bucketLabel={bucketLabel(days)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'status',
      label: 'Package status distribution',
      content: (
        <DistributionCard
          title="Package status distribution"
          description="Forecast package states within the selected period."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BarChart3}
          label="Packages in period"
          value={metrics.total}
          helper={`${metrics.sampleSize} packages loaded for detailed trend analysis.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Clock3}
          label="In review"
          value={metrics.inReview}
          helper="Submitted or currently under review."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approved / published"
          value={metrics.approved}
          helper={`${metrics.completionRate}% reached an approved outcome.`}
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
      <AnalyticsCarousel
        slides={slides}
        isDarkMode={isDarkMode}
        ariaLabel="Forecast analytics charts"
      />
    </div>
  );
}

function UserPanel({ payload, isDarkMode }) {
  const metrics = buildUserMetrics(payload);
  const days = Math.max(1, Number(payload.range?.days) || 14);
  const contributionTrend = bucketDateSeries(payload.contributions?.trend || [], {
    start: payload.range?.start,
    end: payload.range?.end,
    valueFields: ['total'],
    dayCount: days,
  });

  const slides = [
    {
      id: 'contribution-trend',
      label: 'Contribution activity',
      content: (
        <TrendCard
          title="Contribution activity"
          description="Meaningful operational participation from package and review audit events."
          rows={contributionTrend}
          series={[{ dataKey: 'total', label: 'Operational events', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(days)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'contribution-mix',
      label: 'Contribution mix',
      content: (
        <BarChartCard
          title="Contribution mix"
          description="Aggregate operational events by action. This is not a productivity ranking."
          rows={contributionMixRows(payload.contributions)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'account-status',
      label: 'Account status',
      content: (
        <DistributionCard
          title="Account status"
          description="Operational account state without names, email addresses, or contact details."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'user-types',
      label: 'User Type distribution',
      content: (
        <DistributionCard
          title="User Type distribution"
          description="New accounts by configured User Type key."
          rows={entriesByCount(payload.roleCounts)}
          isDarkMode={isDarkMode}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Contribution events"
          value={metrics.contributionEvents}
          helper="Meaningful operational events during the selected period."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Users}
          label="Active contributors"
          value={metrics.activeContributors}
          helper="Distinct participants in aggregate; identities are not exposed."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Users}
          label="Accounts created"
          value={metrics.total}
          helper={`${metrics.activeRate}% of new accounts are active.`}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Pending / restricted"
          value={metrics.pending + metrics.suspended}
          helper={`${metrics.pending} pending and ${metrics.suspended} suspended or locked.`}
          isDarkMode={isDarkMode}
        />
      </section>
      <AnalyticsCarousel
        slides={slides}
        isDarkMode={isDarkMode}
        ariaLabel="User analytics charts"
      />
    </div>
  );
}

function SystemPanel({ payload, isDarkMode }) {
  const metrics = buildSystemMetrics(payload);
  const days = Math.max(1, Number(payload.range?.days) || 14);
  const viewTrend = bucketDateSeries(payload.publishedChartViews?.trend || [], {
    start: payload.range?.start,
    end: payload.range?.end,
    valueFields: ['views'],
    dayCount: days,
  });

  const slides = [
    {
      id: 'view-trend',
      label: 'Published chart views',
      content: (
        <TrendCard
          title="Published chart views"
          description="Privacy-safe public chart views recorded during the selected period."
          rows={viewTrend}
          series={[{ dataKey: 'views', label: 'Views', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(days)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'top-charts',
      label: 'Top viewed charts',
      content: (
        <BarChartCard
          title="Top viewed published charts"
          description="Current published charts with the most deduplicated views in the selected period."
          rows={publishedChartRows(payload.publishedChartViews)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'forecast-health',
      label: 'Forecast package health',
      content: (
        <DistributionCard
          title="Forecast package health"
          description="Package state distribution within the selected period."
          rows={entriesByCount(payload.forecastPackages?.statusCounts)}
          isDarkMode={isDarkMode}
        />
      ),
    },
    {
      id: 'account-health',
      label: 'New account health',
      content: (
        <DistributionCard
          title="New account health"
          description="Account state distribution for accounts created in the selected period."
          rows={entriesByCount(payload.users?.statusCounts)}
          isDarkMode={isDarkMode}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Eye}
          label="Published chart views"
          value={metrics.publishedViews}
          helper="Deduplicated public views in the selected period."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={Activity}
          label="Views today"
          value={metrics.viewsToday}
          helper="Current Asia/Manila operational day."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={BarChart3}
          label="Forecast packages"
          value={metrics.totalPackages}
          helper="Forecast packages represented in the selected operating period."
          isDarkMode={isDarkMode}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Open follow-up"
          value={metrics.packagesReturned + metrics.usersPending}
          helper={`${metrics.packagesReturned} returned packages and ${metrics.usersPending} pending accounts.`}
          isDarkMode={isDarkMode}
        />
      </section>
      <AnalyticsCarousel
        slides={slides}
        isDarkMode={isDarkMode}
        ariaLabel="System analytics charts"
      />
    </div>
  );
}

function RangeControls({
  range,
  customRange,
  onPreset,
  onCustomChange,
  onApplyCustom,
  isDarkMode,
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-3',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
      aria-label="Analytics date range"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
          {ANALYTICS_RANGE_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset)}
              aria-pressed={range.preset === preset.id}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-black transition-colors',
                range.preset === preset.id
                  ? 'bg-cyan-600 text-white'
                  : isDarkMode
                    ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>From</span>
            <input
              type="date"
              value={customRange.start}
              onChange={(event) => onCustomChange('start', event.target.value)}
              className={cn(
                'mt-1 block rounded-lg border px-2 py-2 text-xs',
                isDarkMode
                  ? 'border-white/10 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            />
          </label>
          <label className="text-xs font-bold">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>To</span>
            <input
              type="date"
              value={customRange.end}
              onChange={(event) => onCustomChange('end', event.target.value)}
              className={cn(
                'mt-1 block rounded-lg border px-2 py-2 text-xs',
                isDarkMode
                  ? 'border-white/10 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            />
          </label>
          <button
            type="button"
            onClick={onApplyCustom}
            disabled={!customRange.start || !customRange.end}
            className={cn(
              'min-h-9 rounded-lg border px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            Apply custom
          </button>
        </div>
      </div>
      <p
        className={cn(
          'mt-2 text-[11px] font-semibold',
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        )}
      >
        Active period: {range.start} to {range.end} · Asia/Manila · {bucketLabel(range.days)}
      </p>
    </section>
  );
}

const hasNoData = (sectionId, payload) => {
  if (!payload) return false;
  if (sectionId === 'forecast') return Number(payload.total || 0) === 0;
  if (sectionId === 'users') {
    return (
      Number(payload.total || 0) === 0 && Number(payload.contributions?.totalEvents || 0) === 0
    );
  }
  if (sectionId === 'system') {
    return (
      Number(payload.users?.total || 0) === 0 &&
      Number(payload.forecastPackages?.total || 0) === 0 &&
      Number(payload.publishedChartViews?.totalViews || 0) === 0
    );
  }
  return false;
};

export default function AnalyticsAccess({ isDarkMode }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const sections = useMemo(() => getAllowedAnalyticsSections(permissions), [permissions]);
  const [requestedSection, setRequestedSection] = useState(null);
  const activeConfig =
    sections.find((section) => section.id === requestedSection) || sections[0] || null;
  const activeSection = activeConfig?.id || null;
  const canExport = permissions.has('analytics.export');
  const [range, setRange] = useState(() => initialAnalyticsRange());
  const [customRange, setCustomRange] = useState(() => {
    const initial = initialAnalyticsRange();
    return { start: initial.start, end: initial.end };
  });
  const [state, setState] = useState({
    loading: false,
    refreshing: false,
    exporting: false,
    error: '',
    data: {},
    loadedAt: {},
  });

  const loadSection = useCallback(
    async (sectionId, { silent = false } = {}) => {
      const request = REQUEST_BY_SECTION[sectionId];
      if (!request) return;
      setState((current) => ({
        ...current,
        loading: !silent,
        refreshing: silent,
        error: '',
      }));
      try {
        const data = await request({ start: range.start, end: range.end });
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
    },
    [range.end, range.start]
  );

  useEffect(() => {
    if (!activeSection || state.data[activeSection]) return;
    void loadSection(activeSection);
  }, [activeSection, loadSection, state.data]);

  const applyRange = useCallback((nextRange) => {
    setRange(nextRange);
    setCustomRange({ start: nextRange.start, end: nextRange.end });
    setState((current) => ({ ...current, error: '', data: {}, loadedAt: {} }));
  }, []);

  const handlePreset = useCallback(
    (preset) =>
      applyRange({ preset: preset.id, days: preset.days, ...buildPresetRange(preset.days) }),
    [applyRange]
  );

  const handleCustom = useCallback(() => {
    const start = new Date(`${customRange.start}T00:00:00Z`);
    const end = new Date(`${customRange.end}T00:00:00Z`);
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
    applyRange({ preset: 'custom', days, ...customRange });
  }, [applyRange, customRange]);

  const handleSectionChange = useCallback((sectionId) => {
    setRequestedSection(sectionId);
    setState((current) => ({ ...current, error: '' }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!activeSection || !canExport) return;
    setState((current) => ({ ...current, exporting: true, error: '' }));
    try {
      const { blob, filename } = await fetchAnalyticsExport(activeSection, {
        start: range.start,
        end: range.end,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setState((current) => ({ ...current, exporting: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        exporting: false,
        error: error?.message || 'Unable to export analytics.',
      }));
    }
  }, [activeSection, canExport, range.end, range.start]);

  if (!sections.length) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'rounded-2xl border px-6 py-20 text-center',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 text-slate-400'
              : 'border-slate-200 bg-white text-slate-500'
          )}
        >
          <ShieldCheck className="mx-auto h-8 w-8" aria-hidden="true" />
          <p className="mt-3 text-sm font-black">
            No analytics subsection is assigned to your User Type.
          </p>
        </div>
      </div>
    );
  }

  const ActiveIcon = SECTION_ICON[activeConfig.id] || Activity;
  const payload = state.data[activeConfig.id] || null;
  const loadedAt = state.loadedAt[activeConfig.id];
  const stale = isAnalyticsDataStale(loadedAt);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section
        className={cn(
          'rounded-2xl border p-5 shadow-lg',
          isDarkMode ? 'border-cyan-300/15 bg-slate-950/60' : 'border-cyan-100 bg-cyan-50/60'
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
              <ActiveIcon size={20} aria-hidden="true" />
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
                  stale
                    ? isDarkMode
                      ? 'text-amber-200'
                      : 'text-amber-700'
                    : isDarkMode
                      ? 'text-slate-500'
                      : 'text-slate-400'
                )}
              >
                Last refreshed: {formatGeneratedAt(loadedAt)}
                {stale ? ' · data may be stale' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={state.exporting || !payload}
                className={cn(
                  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-slate-200'
                    : 'border-slate-200 bg-white text-slate-700'
                )}
              >
                {state.exporting ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download size={15} aria-hidden="true" />
                )}
                Export CSV
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void loadSection(activeConfig.id, { silent: true })}
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
        </div>
      </section>

      <nav
        className={cn(
          'flex gap-2 overflow-x-auto rounded-2xl border p-2',
          isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
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
              onClick={() => handleSectionChange(section.id)}
              aria-pressed={selected}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors',
                selected
                  ? 'bg-cyan-600 text-white'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {section.shortLabel}
            </button>
          );
        })}
      </nav>

      <RangeControls
        range={range}
        customRange={customRange}
        onPreset={handlePreset}
        onCustomChange={(field, value) =>
          setCustomRange((current) => ({ ...current, [field]: value }))
        }
        onApplyCustom={handleCustom}
        isDarkMode={isDarkMode}
      />

      {state.error ? (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          role="alert"
        >
          <AlertTriangle size={15} className="mr-2 inline" aria-hidden="true" />
          {state.error}
          {payload ? ' Showing the last successfully loaded data.' : ''}
        </div>
      ) : null}

      {payload && hasNoData(activeConfig.id, payload) ? (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-white/10 bg-white/[0.03] text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          )}
        >
          No analytics records were found for {range.start} to {range.end}. Try a wider period.
        </div>
      ) : null}

      {state.loading && !payload ? (
        <div
          className={cn(
            'flex min-h-[360px] items-center justify-center rounded-2xl border',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
          )}
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-black">Loading {activeConfig.label.toLowerCase()}…</span>
        </div>
      ) : activeConfig.id === 'forecast' ? (
        <ForecastPanel payload={payload || { range }} isDarkMode={isDarkMode} />
      ) : activeConfig.id === 'users' ? (
        <UserPanel payload={payload || { range }} isDarkMode={isDarkMode} />
      ) : (
        <SystemPanel payload={payload || { range }} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}
