import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Gauge,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  fetchAnalyticsExport,
  fetchAnalyticsOverview,
  fetchForecastAnalytics,
  fetchPublicReachAnalytics,
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
  contributionMixRows,
  entriesByCount,
  getAllowedAnalyticsSections,
  publishedChartRows,
} from './analytics/analyticsWorkspaceModel';
import {
  BarChartCard,
  DistributionCard,
  TrendCard,
} from './analytics/AnalyticsVisuals';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const SECTION_ICON = {
  overview: Gauge,
  forecast: BarChart3,
  public: Eye,
  users: Users,
  system: Activity,
};

const REQUEST_BY_SECTION = {
  overview: fetchAnalyticsOverview,
  forecast: fetchForecastAnalytics,
  public: fetchPublicReachAnalytics,
  users: fetchUserAnalytics,
  system: fetchSystemAnalytics,
};

const EXPORTABLE_SECTIONS = new Set(['overview', 'forecast', 'public', 'users', 'system']);

const bucketLabel = (days) => (adaptiveBucketDays(days) === 1 ? 'Daily' : 'Weekly');

function formatGeneratedAt(value) {
  if (!value) return 'Not refreshed yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not refreshed yet';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function formatHours(metric) {
  if (metric?.medianHours == null) return '—';
  const value = Number(metric.medianHours);
  return Number.isFinite(value) ? `${value}h` : '—';
}

function MetricCard({ icon: Icon, label, value, helper, isDarkMode }) {
  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-sm',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
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

function metricGrid(children) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</section>;
}

function buildTrend(rows, range, valueFields) {
  return bucketDateSeries(rows || [], {
    start: range?.start,
    end: range?.end,
    valueFields,
    dayCount: range?.days,
  });
}

function OverviewPanel({ payload, isDarkMode }) {
  const forecast = payload.sections?.forecast;
  const users = payload.sections?.users;
  const publicReach = payload.sections?.public;
  const range = payload.range;
  const trend = forecast
    ? buildTrend(forecast.throughput, range, ['submitted', 'completed', 'returned'])
    : [];

  return (
    <div className="space-y-5">
      {payload.partial ? (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
          role="status"
        >
          Some analytics sources are temporarily unavailable. Available sections remain current.
        </div>
      ) : null}

      {metricGrid(
        <>
          {forecast ? (
            <>
              <MetricCard
                icon={BarChart3}
                label="Forecast Packages"
                value={forecast.summary?.packages ?? 0}
                helper="Forecast packages in the selected operating period."
                isDarkMode={isDarkMode}
              />
              <MetricCard
                icon={CheckCircle2}
                label="Published Packages"
                value={forecast.summary?.published ?? 0}
                helper="Packages currently published within the selected forecast period."
                isDarkMode={isDarkMode}
              />
              <MetricCard
                icon={RotateCcw}
                label="Return / Revision Rate"
                value={
                  forecast.summary?.returnRate == null
                    ? '—'
                    : `${forecast.summary.returnRate}%`
                }
                helper="Returned outcomes divided by decided review outcomes."
                isDarkMode={isDarkMode}
              />
            </>
          ) : null}
          {publicReach ? (
            <MetricCard
              icon={Eye}
              label="Published Chart Views"
              value={publicReach.summary?.periodViews ?? 0}
              helper="Privacy-safe deduplicated chart views in the selected period."
              isDarkMode={isDarkMode}
            />
          ) : users ? (
            <MetricCard
              icon={Users}
              label="Active Contributors"
              value={users.summary?.activeContributors ?? 0}
              helper="Distinct users with tracked operational activity in the selected period."
              isDarkMode={isDarkMode}
            />
          ) : null}
        </>
      )}

      {forecast ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
          <TrendCard
            title="Forecast Package Throughput"
            description="Submitted, completed, and returned workflow events using their operational timestamps."
            rows={trend}
            series={[
              { dataKey: 'submitted', label: 'Submitted', stroke: '#0ea5e9' },
              { dataKey: 'completed', label: 'Completed', stroke: '#10b981' },
              { dataKey: 'returned', label: 'Returned', stroke: '#f59e0b' },
            ]}
            bucketLabel={bucketLabel(range?.days)}
            isDarkMode={isDarkMode}
          />
          <DistributionCard
            title="Workflow Distribution"
            description="Current forecast package states for the selected forecast period."
            rows={entriesByCount(forecast.statusCounts)}
            isDarkMode={isDarkMode}
          />
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {forecast ? (
          <MetricCard
            icon={CheckCircle2}
            label="Review Completion"
            value={
              forecast.summary?.completionRate == null
                ? '—'
                : `${forecast.summary.completionRate}%`
            }
            helper="Completed review outcomes among packages with a decided outcome."
            isDarkMode={isDarkMode}
          />
        ) : null}
        {users ? (
          <MetricCard
            icon={Users}
            label="Active Contributors"
            value={users.summary?.activeContributors ?? 0}
            helper={`${users.summary?.contributionEvents ?? 0} aggregate operational events.`}
            isDarkMode={isDarkMode}
          />
        ) : null}
        {publicReach ? (
          <MetricCard
            icon={Eye}
            label="Published Chart Reach"
            value={publicReach.summary?.publishedChartsViewed ?? 0}
            helper="Distinct published charts viewed during the selected period."
            isDarkMode={isDarkMode}
          />
        ) : null}
      </section>
    </div>
  );
}

function ForecastPanel({ payload, isDarkMode }) {
  const trend = buildTrend(payload.throughput, payload.range, [
    'submitted',
    'completed',
    'returned',
  ]);
  const summary = payload.summary || {};
  const timing = payload.timing || {};

  return (
    <div className="space-y-5">
      {metricGrid(
        <>
          <MetricCard
            icon={BarChart3}
            label="Packages Submitted"
            value={summary.submitted ?? 0}
            helper="Submission audit events in the selected period."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Packages Published"
            value={summary.publishedEvents ?? 0}
            helper="Publication audit events in the selected period."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={RotateCcw}
            label="Revision Requests"
            value={summary.revisionRequests ?? 0}
            helper="Revision-request events recorded during the selected period."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Completion Rate"
            value={summary.completionRate == null ? '—' : `${summary.completionRate}%`}
            helper="Approved/published outcomes divided by decided review outcomes."
            isDarkMode={isDarkMode}
          />
        </>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <TrendCard
          title="Forecast Throughput"
          description="Operational event timing is used instead of forecast date for workflow movement."
          rows={trend}
          series={[
            { dataKey: 'submitted', label: 'Submitted', stroke: '#0ea5e9' },
            { dataKey: 'completed', label: 'Completed', stroke: '#10b981' },
            { dataKey: 'returned', label: 'Returned', stroke: '#f59e0b' },
          ]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <DistributionCard
          title="Review Outcomes"
          description="Package status distribution for the selected forecast period."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Preparation Time', timing.preparation, 'First tracked chart activity to submission.'],
          ['Review Wait', timing.reviewWait, 'Submission to review start.'],
          ['Review Duration', timing.reviewDuration, 'Review start to a review decision.'],
          ['Publication Delay', timing.publicationDelay, 'Approval to publication.'],
        ].map(([label, metric, helper]) => (
          <MetricCard
            key={label}
            icon={Clock3}
            label={label}
            value={formatHours(metric)}
            helper={
              metric?.sampleSize
                ? `Median · ${metric.sampleSize} complete package${metric.sampleSize === 1 ? '' : 's'}. ${helper}`
                : `No complete timing sample. ${helper}`
            }
            isDarkMode={isDarkMode}
          />
        ))}
      </section>

      <AnalyticsTable
        title="Package Activity"
        description="Recent packages in the selected forecast period. Timing columns show only verified values."
        isDarkMode={isDarkMode}
        headers={['Forecast Date', 'Package', 'Submitted', 'Outcome', 'Review Time', 'Published']}
        rows={(payload.packages || []).slice(0, 50).map((item) => [
          formatDate(item.forecastDate),
          item.name || 'Forecast package',
          formatDateTime(item.submittedAt),
          item.status || '—',
          item.reviewDurationHours == null ? '—' : `${item.reviewDurationHours}h`,
          formatDateTime(item.publishedAt),
        ])}
      />
    </div>
  );
}

function PublicReachPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.trend, payload.range, ['views']);

  return (
    <div className="space-y-5">
      {metricGrid(
        <>
          <MetricCard
            icon={Activity}
            label="Views Today"
            value={summary.viewsToday ?? 0}
            helper="Current Asia/Manila operational day."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={Eye}
            label="Views in Period"
            value={summary.periodViews ?? 0}
            helper="Deduplicated views during the selected period."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={BarChart3}
            label="All-Time Views"
            value={summary.allTimeViews ?? 0}
            helper="All persisted published-chart view records."
            isDarkMode={isDarkMode}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Published Charts Viewed"
            value={summary.publishedChartsViewed ?? 0}
            helper="Distinct published charts reached in the selected period."
            isDarkMode={isDarkMode}
          />
        </>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <TrendCard
          title="Published Chart Views"
          description="Privacy-safe public reach recorded by WaveLab."
          rows={trend}
          series={[{ dataKey: 'views', label: 'Views', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Most Viewed Published Charts"
          description="Published charts ranked by deduplicated views in the selected period."
          rows={publishedChartRows(payload)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Published Chart Reach"
        description="Public-safe chart metadata only; no visitor identity or raw tracking identifiers are exposed."
        isDarkMode={isDarkMode}
        headers={['Chart', 'Type', 'Forecast Date', 'Published', 'Views']}
        rows={(payload.topCharts || []).map((item) => [
          item.name || 'Published chart',
          item.chartType || '—',
          formatDate(item.forecastDate),
          formatDateTime(item.publishedAt),
          item.views ?? 0,
        ])}
      />
    </div>
  );
}

function UserPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.contributions?.trend, payload.range, ['total']);

  return (
    <div className="space-y-5">
      {metricGrid(
        <>
          <MetricCard icon={Users} label="Total Accounts" value={summary.totalAccounts ?? 0} helper="Current non-deleted account population." isDarkMode={isDarkMode} />
          <MetricCard icon={CheckCircle2} label="Active Accounts" value={summary.activeAccounts ?? 0} helper="Accounts currently in active state." isDarkMode={isDarkMode} />
          <MetricCard icon={Clock3} label="Pending Accounts" value={summary.pendingAccounts ?? 0} helper="Accounts currently pending activation." isDarkMode={isDarkMode} />
          <MetricCard icon={Activity} label="Active Contributors" value={summary.activeContributors ?? 0} helper={`${summary.contributionEvents ?? 0} aggregate operational events in range.`} isDarkMode={isDarkMode} />
        </>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        <DistributionCard title="Account Status Distribution" description="Current account state without names, emails, or contact data." rows={entriesByCount(payload.statusCounts)} isDarkMode={isDarkMode} />
        <DistributionCard title="User Type Distribution" description="Current accounts grouped by configured User Type key." rows={entriesByCount(payload.roleCounts)} isDarkMode={isDarkMode} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <TrendCard title="Operational Participation" description="Aggregate forecast and review audit activity; this is not an employee ranking." rows={trend} series={[{ dataKey: 'total', label: 'Operational events', stroke: '#06b6d4' }]} bucketLabel={bucketLabel(payload.range?.days)} isDarkMode={isDarkMode} />
        <BarChartCard title="Contribution Event Mix" description="Tracked operational events by action." rows={contributionMixRows(payload.contributions)} isDarkMode={isDarkMode} />
      </section>
    </div>
  );
}

function SystemPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};

  return (
    <div className="space-y-5">
      {!payload.available ? (
        <div className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold', isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800')} role="status">
          Live wave-pipeline status is unavailable. No historical pipeline results were fabricated.
        </div>
      ) : null}

      {metricGrid(
        <>
          <MetricCard icon={CheckCircle2} label="Models Ready" value={`${summary.readyModels ?? 0} / ${summary.models ?? 0}`} helper="Enabled operational models reporting READY." isDarkMode={isDarkMode} />
          <MetricCard icon={Clock3} label="Current Forecast Cycle" value={summary.currentForecastCycle || '—'} helper="Required source cycle across operational models." isDarkMode={isDarkMode} />
          <MetricCard icon={BarChart3} label="Available Packages" value={summary.packagesAvailable ?? 0} helper="Models with a published current package." isDarkMode={isDarkMode} />
          <MetricCard icon={Activity} label="Pipeline Health" value={String(summary.pipelineHealth || 'unavailable').replace(/^./, (value) => value.toUpperCase())} helper="Derived from current dynamic wave-model pipeline states." isDarkMode={isDarkMode} />
        </>
      )}

      <AnalyticsTable
        title="Model Readiness"
        description="Dynamic operational models only; no model names are hard-coded into Analytics."
        isDarkMode={isDarkMode}
        headers={['Model', 'Source Cycle', 'Package', 'State', 'Frames', 'Last Updated']}
        rows={(payload.models || []).map((model) => [
          model.label || model.code,
          model.sourceCycle || model.requiredSourceCycle || '—',
          model.packageTag || (model.published ? 'Published' : '—'),
          model.state || '—',
          `${model.frameCount ?? 0} / ${model.expectedFrameCount ?? 0}`,
          formatDateTime(model.completedAt || model.lastCheckAt),
        ])}
      />
    </div>
  );
}

function AnalyticsTable({ title, description, headers, rows, isDarkMode }) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border', isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white')}>
      <div className="p-5">
        <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h3>
        <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className={isDarkMode ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-50 text-slate-500'}>
            <tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-black uppercase tracking-wide">{header}</th>)}</tr>
          </thead>
          <tbody className={isDarkMode ? 'divide-y divide-white/5 text-slate-300' : 'divide-y divide-slate-100 text-slate-700'}>
            {rows.length ? rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-4 py-3 font-semibold">{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={headers.length} className="px-4 py-12 text-center font-semibold">No records in the selected period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(date);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }).format(date);
}

function RangeControls({ range, customRange, onPreset, onCustomChange, onApplyCustom, isDarkMode }) {
  return (
    <section className={cn('rounded-2xl border p-3', isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white')} aria-label="Analytics date range">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
          {ANALYTICS_RANGE_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => (
            <button key={preset.id} type="button" onClick={() => onPreset(preset)} aria-pressed={range.preset === preset.id} className={cn('rounded-lg px-3 py-2 text-xs font-black transition-colors', range.preset === preset.id ? 'bg-cyan-600 text-white' : isDarkMode ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {['start', 'end'].map((field) => (
            <label key={field} className="text-xs font-bold">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{field === 'start' ? 'From' : 'To'}</span>
              <input type="date" value={customRange[field]} onChange={(event) => onCustomChange(field, event.target.value)} className={cn('mt-1 block rounded-lg border px-2 py-2 text-xs', isDarkMode ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900')} />
            </label>
          ))}
          <button type="button" onClick={onApplyCustom} disabled={!customRange.start || !customRange.end} className={cn('min-h-9 rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-50', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200 bg-white text-slate-700')}>
            Custom
          </button>
        </div>
      </div>
      <p className={cn('mt-2 text-[11px] font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
        {range.start} to {range.end} · Asia/Manila · {bucketLabel(range.days)}
      </p>
    </section>
  );
}

const hasNoData = (sectionId, payload) => {
  if (!payload) return false;
  if (sectionId === 'overview') return Object.keys(payload.sections || {}).length === 0;
  if (sectionId === 'forecast') return Number(payload.total || 0) === 0;
  if (sectionId === 'public') return Number(payload.totalViews || 0) === 0;
  if (sectionId === 'users') return Number(payload.total || 0) === 0 && Number(payload.contributions?.totalEvents || 0) === 0;
  if (sectionId === 'system') return payload.available && Number(payload.summary?.models || 0) === 0;
  return false;
};

export default function AnalyticsAccess({ isDarkMode }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const sections = useMemo(() => getAllowedAnalyticsSections(permissions), [permissions]);
  const [requestedSection, setRequestedSection] = useState('overview');
  const activeConfig = sections.find((section) => section.id === requestedSection) || sections[0] || null;
  const activeSection = activeConfig?.id || null;
  const canExport = permissions.has('analytics.export') && EXPORTABLE_SECTIONS.has(activeSection);
  const [range, setRange] = useState(() => initialAnalyticsRange());
  const [customRange, setCustomRange] = useState(() => {
    const initial = initialAnalyticsRange();
    return { start: initial.start, end: initial.end };
  });
  const [state, setState] = useState({ loading: false, refreshing: false, exporting: false, error: '', data: {}, loadedAt: {} });

  const loadSection = useCallback(async (sectionId, { silent = false } = {}) => {
    const request = REQUEST_BY_SECTION[sectionId];
    if (!request) return;
    setState((current) => ({ ...current, loading: !silent, refreshing: silent, error: '' }));
    try {
      const data = await request({ start: range.start, end: range.end });
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: '',
        data: { ...current.data, [sectionId]: data },
        loadedAt: { ...current.loadedAt, [sectionId]: data?.generatedAt || new Date().toISOString() },
      }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, refreshing: false, error: error?.message || 'Unable to load analytics.' }));
    }
  }, [range.end, range.start]);

  useEffect(() => {
    if (!activeSection || state.data[activeSection]) return;
    void loadSection(activeSection);
  }, [activeSection, loadSection, state.data]);

  useEffect(() => {
    if (!activeConfig && sections.length) setRequestedSection(sections[0].id);
  }, [activeConfig, sections]);

  const applyRange = useCallback((nextRange) => {
    setRange(nextRange);
    setCustomRange({ start: nextRange.start, end: nextRange.end });
    setState((current) => ({ ...current, error: '', data: {}, loadedAt: {} }));
  }, []);

  const handleCustom = useCallback(() => {
    const start = new Date(`${customRange.start}T00:00:00Z`);
    const end = new Date(`${customRange.end}T00:00:00Z`);
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
    applyRange({ preset: 'custom', days, ...customRange });
  }, [applyRange, customRange]);

  const handleExport = useCallback(async () => {
    if (!activeSection || !canExport) return;
    setState((current) => ({ ...current, exporting: true, error: '' }));
    try {
      const { blob, filename } = await fetchAnalyticsExport(activeSection, { start: range.start, end: range.end });
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
      setState((current) => ({ ...current, exporting: false, error: error?.message || 'Unable to export analytics.' }));
    }
  }, [activeSection, canExport, range.end, range.start]);

  if (!sections.length) {
    return <div className="mx-auto max-w-[1500px] p-4 sm:p-6"><div className={cn('rounded-2xl border px-6 py-20 text-center', isDarkMode ? 'border-white/10 bg-slate-950/50 text-slate-400' : 'border-slate-200 bg-white text-slate-500')}><ShieldCheck className="mx-auto h-8 w-8" aria-hidden="true" /><p className="mt-3 text-sm font-black">No analytics subsection is assigned to your User Type.</p></div></div>;
  }

  const payload = state.data[activeSection] || null;
  const loadedAt = state.loadedAt[activeSection];
  const stale = isAnalyticsDataStale(loadedAt);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={cn('text-xs font-black uppercase tracking-[0.15em]', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}>Analytics & Reports</p>
          <h2 className={cn('mt-1 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Operational intelligence</h2>
          <p className={cn('mt-1 max-w-3xl text-sm font-semibold leading-6', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Operational performance, forecast workflow trends, platform usage, and system health.</p>
          <p className={cn('mt-2 text-[11px] font-semibold', stale ? 'text-amber-600' : isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Last refreshed: {formatGeneratedAt(loadedAt)}{stale ? ' · data may be stale' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canExport ? <button type="button" onClick={() => void handleExport()} disabled={state.exporting || !payload} className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200 bg-white text-slate-700')}>{state.exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Export CSV</button> : null}
          <button type="button" onClick={() => void loadSection(activeSection, { silent: true })} disabled={state.refreshing} className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200 bg-white text-slate-700')}><RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />{state.refreshing ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </section>

      <nav className={cn('flex gap-2 overflow-x-auto rounded-2xl border p-2', isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white')} aria-label="Analytics subsections" role="tablist">
        {sections.map((section) => {
          const Icon = SECTION_ICON[section.id] || Activity;
          const selected = section.id === activeSection;
          return <button key={section.id} type="button" role="tab" aria-selected={selected} onClick={() => { setRequestedSection(section.id); setState((current) => ({ ...current, error: '' })); }} className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500', selected ? 'bg-cyan-600 text-white' : isDarkMode ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white' : 'text-slate-600 hover:bg-slate-50')}><Icon size={15} />{section.shortLabel}</button>;
        })}
      </nav>

      <RangeControls range={range} customRange={customRange} onPreset={(preset) => applyRange({ preset: preset.id, days: preset.days, ...buildPresetRange(preset.days) })} onCustomChange={(field, value) => setCustomRange((current) => ({ ...current, [field]: value }))} onApplyCustom={handleCustom} isDarkMode={isDarkMode} />

      {state.error ? <div className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold', isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800')} role="alert"><AlertTriangle size={15} className="mr-2 inline" />{state.error}{payload ? ' Showing the last successfully loaded data.' : ''}</div> : null}

      {!payload && !state.error ? <div className={cn('flex min-h-[360px] items-center justify-center rounded-2xl border', isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white')} aria-live="polite" aria-busy="true"><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span className="text-sm font-black">Loading {activeConfig.label.toLowerCase()}…</span></div>
        : !payload && state.error ? <div className={cn('flex min-h-[280px] flex-col items-center justify-center rounded-2xl border px-6 text-center', isDarkMode ? 'border-amber-300/20 bg-amber-400/5 text-slate-300' : 'border-amber-200 bg-amber-50/60 text-slate-700')}><AlertTriangle className="h-7 w-7" /><p className="mt-3 text-sm font-black">Analytics data is currently unavailable.</p><button type="button" onClick={() => void loadSection(activeSection)} className="mt-4 rounded-xl border px-3 py-2 text-sm font-black">Retry</button></div>
        : payload && hasNoData(activeSection, payload) ? <div className={cn('flex min-h-[280px] flex-col items-center justify-center rounded-2xl border px-6 text-center', isDarkMode ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600')}><BarChart3 className="h-7 w-7" /><p className="mt-3 text-sm font-black">No analytics records in this period.</p><p className="mt-1 text-xs font-semibold">{range.start} to {range.end} · Try a wider date range.</p></div>
        : activeSection === 'overview' ? <OverviewPanel payload={payload} isDarkMode={isDarkMode} />
        : activeSection === 'forecast' ? <ForecastPanel payload={payload} isDarkMode={isDarkMode} />
        : activeSection === 'public' ? <PublicReachPanel payload={payload} isDarkMode={isDarkMode} />
        : activeSection === 'users' ? <UserPanel payload={payload} isDarkMode={isDarkMode} />
        : <SystemPanel payload={payload} isDarkMode={isDarkMode} />}
    </div>
  );
}
