import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  FileCheck2,
  Layers3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { fetchDashboardOverview } from '@/api/dashboardAPI';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

import DashboardAnalyticsCarousel from './analytics/DashboardAnalyticsCarousel';
import { buildPresetRange } from './analytics/analyticsDateRange';
import { adaptiveBucketDays, bucketDateSeries } from './analytics/analyticsWorkspaceModel';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ICON_BY_KEY = {
  review: FileCheck2,
  revision: RotateCcw,
  publish: CheckCircle2,
  models: Layers3,
  forecast: Waves,
  pipeline: Database,
  calendar: CalendarDays,
  analytics: BarChart3,
  users: Users,
};

const LINE_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee'];
const PIE_COLORS = ['#64748b', '#3b82f6', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];
const MAX_RECENT_PACKAGES = 5;
const DEFAULT_TREND_DAYS = 14;
const TREND_RANGE_OPTIONS = [7, 14, 30, 60, 90];

const STATUS_TONES = {
  Draft: 'slate',
  Submitted: 'cyan',
  'Under Review': 'cyan',
  'Revision Requested': 'amber',
  Approved: 'emerald',
  Published: 'emerald',
  Rejected: 'rose',
  Archived: 'slate',
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

function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(options.year ? { year: 'numeric' } : {}),
    ...(options.time ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

function formatOperationalDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function buildTrendPoints(points = [], series = [], range, selectedDays) {
  if (!range?.start || !range?.end) return points;

  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return points;

  const existingByDate = new Map(points.map((point) => [point.date, point]));
  const daily = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const base = { date };
    for (const item of series) base[item.key] = 0;
    daily.push({ ...base, ...(existingByDate.get(date) || {}) });
  }

  return bucketDateSeries(daily, {
    start: range.start,
    end: range.end,
    valueFields: series.map((item) => item.key),
    dayCount: selectedDays,
  });
}

function formatCycle(value) {
  const cycle = String(value || '');
  if (!/^\d{10}$/.test(cycle)) return cycle || '—';
  const year = Number(cycle.slice(0, 4));
  const month = Number(cycle.slice(4, 6));
  const day = Number(cycle.slice(6, 8));
  const hour = cycle.slice(8, 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return cycle;
  const label = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  return `${hour}Z · ${label}`;
}

function StatusBadge({ value, isDarkMode }) {
  const tone = STATUS_TONES[value] || 'slate';
  const classes = {
    slate: isDarkMode ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-700',
    cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700',
    amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700',
    emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
    rose: isDarkMode ? 'bg-rose-400/10 text-rose-200' : 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide',
        classes
      )}
    >
      {String(value || 'Unknown').replaceAll('_', ' ')}
    </span>
  );
}

function Panel({ title, description, action, children, isDarkMode, className }) {
  return (
    <section
      className={cn(
        'relative rounded-2xl border shadow-lg backdrop-blur-sm',
        isDarkMode ? 'border-white/10 bg-slate-950/55' : 'border-slate-200 bg-white/95',
        className
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

function SummaryCard({ card, isDarkMode }) {
  const Icon = ICON_BY_KEY[card.icon] || BarChart3;
  const tone = card.tone || 'neutral';
  const iconClass = {
    info: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700',
    success: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
    warning: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700',
    danger: isDarkMode ? 'bg-rose-400/10 text-rose-200' : 'bg-rose-50 text-rose-700',
    neutral: isDarkMode ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-700',
  }[tone];
  const displayValue = card.format === 'ratio' ? `${card.value}/${card.total ?? 0}` : card.value;

  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-lg backdrop-blur-sm',
        isDarkMode ? 'border-white/10 bg-slate-950/55' : 'border-slate-200 bg-white/95'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.12em]',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {card.label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-black tabular-nums',
              isDarkMode ? 'text-white' : 'text-slate-950'
            )}
          >
            {displayValue}
          </p>
        </div>
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl', iconClass)}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function WorkflowTrend({ trend, range, selectedDays, isRefreshing, onRangeChange, isDarkMode }) {
  const series = trend?.series || [];
  const points = buildTrendPoints(trend?.points || [], series, range, selectedDays);
  const isBucketed = adaptiveBucketDays(selectedDays) > 1;
  const tooltipStyle = {
    background: isDarkMode ? '#07182c' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <Panel
      title={trend?.title || 'Forecast Workflow Trend'}
      description={trend?.description || 'No workflow trend is available for this period.'}
      isDarkMode={isDarkMode}
      action={
        <label className="sr-only" htmlFor="dashboard-trend-range">
          Forecast workflow trend period
        </label>
      }
    >
      <div className="absolute right-4 top-4">
        <select
          id="dashboard-trend-range"
          aria-label="Forecast workflow trend period"
          value={selectedDays}
          disabled={isRefreshing}
          onChange={(event) => onRangeChange?.(Number(event.target.value))}
          className={cn(
            'rounded-lg border px-2 py-1 text-[10px] font-black outline-none disabled:cursor-wait disabled:opacity-60',
            isDarkMode
              ? 'border-white/10 bg-slate-900 text-slate-200'
              : 'border-slate-200 bg-white text-slate-700'
          )}
        >
          {TREND_RANGE_OPTIONS.map((days) => (
            <option key={days} value={days}>
              Last {days} days
            </option>
          ))}
        </select>
      </div>
      <div className="h-72 px-3 pb-3">
        {points.length && series.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? 'rgba(148,163,184,0.14)' : '#e2e8f0'}
              />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
                minTickGap={isBucketed ? 28 : 18}
                tickMargin={8}
                tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((item, index) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={isBucketed ? false : { r: 2.5 }}
                  activeDot={{ r: 4.5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className={cn(
              'grid h-full place-items-center text-xs font-semibold',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            No workflow events in the selected period.
          </div>
        )}
      </div>
    </Panel>
  );
}

function StatusDistribution({ rows = [], isDarkMode }) {
  const total = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
  const tooltipStyle = {
    background: isDarkMode ? '#07182c' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <Panel
      title="Package Status Distribution"
      description="Forecast package states in the selected period."
      isDarkMode={isDarkMode}
    >
      {rows.length ? (
        <div className="grid gap-2 px-3 pb-4 md:grid-cols-[190px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {rows.map((row, index) => (
                    <Cell key={row.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <strong
                  className={cn(
                    'block text-xl font-black',
                    isDarkMode ? 'text-white' : 'text-slate-950'
                  )}
                >
                  {total}
                </strong>
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wide',
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  Total
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2 py-2">
            {rows.map((row, index) => (
              <div key={row.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span
                    className={cn(
                      'truncate font-semibold',
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    {row.label}
                  </span>
                </span>
                <span
                  className={cn(
                    'font-black tabular-nums',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'px-4 pb-8 pt-4 text-center text-xs font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          No package status data is available.
        </p>
      )}
    </Panel>
  );
}

function WaveModelsTable({ models = [], isDarkMode, onSelectTab }) {
  return (
    <Panel
      title="Wave Models Readiness"
      description="Current source, frame, package, and pipeline readiness for configured operational models."
      isDarkMode={isDarkMode}
    >
      <div className="overflow-x-auto px-3 pb-3">
        <table className="min-w-full text-left text-xs">
          <thead className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            <tr>
              <th className="px-2 py-2 font-black">Model</th>
              <th className="px-2 py-2 font-black">Source Cycle</th>
              <th className="px-2 py-2 font-black">Frames</th>
              <th className="px-2 py-2 font-black">Package</th>
              <th className="px-2 py-2 font-black">Status</th>
              <th className="px-2 py-2 font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {models.length ? (
              models.map((model) => (
                <tr
                  key={model.id || model.key}
                  className={cn('border-t', isDarkMode ? 'border-white/10' : 'border-slate-200')}
                >
                  <td
                    className={cn(
                      'px-2 py-3 font-black',
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {model.name || model.code}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-3 font-mono text-[11px]',
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    )}
                  >
                    {formatCycle(model.sourceCycle)}
                  </td>
                  <td className="px-2 py-3 font-bold tabular-nums">
                    {model.frames?.ready ?? 0}/{model.frames?.expected ?? 0}
                  </td>
                  <td
                    className={cn(
                      'max-w-[210px] truncate px-2 py-3 font-mono text-[10px]',
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {model.package?.name || '—'}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge value={model.pipelineState} isDarkMode={isDarkMode} />
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectTab?.('wave_pipeline')}
                      className={cn(
                        'rounded-lg px-2 py-1 font-black',
                        isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
                      )}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className={cn(
                    'px-4 py-8 text-center font-semibold',
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  No operational wave models are available to this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RecentPackages({ packages = [], isDarkMode, onSelectTab }) {
  const visiblePackages = packages.slice(0, MAX_RECENT_PACKAGES);

  return (
    <Panel
      title="Recent Forecast Packages"
      description="Latest forecast packages and their current workflow state."
      isDarkMode={isDarkMode}
    >
      <div className="overflow-x-auto px-3 pb-3">
        <table className="min-w-full text-left text-xs">
          <thead className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
            <tr>
              <th className="px-2 py-2 font-black">Forecast Date</th>
              <th className="px-2 py-2 font-black">Package</th>
              <th className="px-2 py-2 font-black">Status</th>
              <th className="px-2 py-2 font-black">Updated</th>
              <th className="px-2 py-2 font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePackages.length ? (
              visiblePackages.map((item) => (
                <tr
                  key={item.id}
                  className={cn('border-t', isDarkMode ? 'border-white/10' : 'border-slate-200')}
                >
                  <td className="px-2 py-3 font-semibold">
                    {formatDate(item.forecastDate, { year: true })}
                  </td>
                  <td
                    className={cn(
                      'max-w-[220px] truncate px-2 py-3 font-bold',
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {item.name}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge value={item.status} isDarkMode={isDarkMode} />
                  </td>
                  <td className={cn('px-2 py-3', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                    {formatDate(item.updatedAt, { time: true })}
                  </td>
                  <td className="px-2 py-3">
                    {item.actions?.[0] ? (
                      <button
                        type="button"
                        onClick={() => onSelectTab?.(item.actions[0].target?.tab)}
                        className={cn(
                          'rounded-lg px-2 py-1 font-black',
                          isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
                        )}
                      >
                        {item.actions[0].label || 'Open'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className={cn(
                    'px-4 py-8 text-center font-semibold',
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  No recent forecast packages are available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function AttentionList({ items = [], isDarkMode, onSelectTab }) {
  return (
    <Panel
      title="Needs Attention"
      description="Operational items that currently require action."
      isDarkMode={isDarkMode}
    >
      <div className="space-y-1 px-3 pb-3">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab?.(item.action?.target?.tab)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors',
                isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                  item.severity === 'critical'
                    ? 'bg-rose-500/10 text-rose-400'
                    : item.severity === 'warning'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                )}
              >
                <AlertTriangle size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-xs font-black',
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-[11px] font-semibold leading-4',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  {item.description}
                </span>
              </span>
              <ArrowRight
                size={14}
                className={cn('mt-1 shrink-0', isDarkMode ? 'text-slate-600' : 'text-slate-400')}
              />
            </button>
          ))
        ) : (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-6 text-xs font-semibold',
              isDarkMode ? 'text-emerald-200' : 'text-emerald-700'
            )}
          >
            <CheckCircle2 size={17} /> No immediate operational issues detected.
          </div>
        )}
      </div>
    </Panel>
  );
}

function ActivityList({ items = [], isDarkMode, onSelectTab }) {
  return (
    <Panel
      title="Recent Activity"
      description="Latest forecast workflow events."
      isDarkMode={isDarkMode}
    >
      <div className="px-4 pb-4">
        {items.length ? (
          <div className="space-y-0">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab?.(item.target?.tab)}
                className="group flex w-full gap-3 text-left"
              >
                <span className="flex w-3 shrink-0 flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  {index < items.length - 1 ? (
                    <span
                      className={cn(
                        'min-h-10 w-px flex-1',
                        isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                      )}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 pb-3">
                  <span
                    className={cn(
                      'block text-xs font-black group-hover:text-cyan-500',
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-[11px] font-semibold',
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {item.description}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 pt-1 text-[10px] font-semibold',
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  )}
                >
                  {formatDate(item.occurredAt, { time: true })}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p
            className={cn(
              'py-8 text-center text-xs font-semibold',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            No recent workflow activity is available.
          </p>
        )}
      </div>
    </Panel>
  );
}

function QuickActions({ actions = [], isDarkMode, onSelectTab }) {
  return (
    <Panel
      title="Quick Actions"
      description="Common tasks available to your current permissions."
      isDarkMode={isDarkMode}
    >
      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.length ? (
          actions.map((action) => {
            const Icon = ICON_BY_KEY[action.icon] || Zap;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onSelectTab?.(action.target?.tab)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                    isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-xs font-black',
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {action.label}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-[10px] font-semibold leading-4',
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {action.description}
                  </span>
                </span>
                <ArrowRight
                  size={13}
                  className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}
                />
              </button>
            );
          })
        ) : (
          <p
            className={cn(
              'col-span-full py-8 text-center text-xs font-semibold',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            No additional dashboard actions are assigned.
          </p>
        )}
      </div>
    </Panel>
  );
}

export default function DashboardOverview({ isDarkMode, onSelectTab }) {
  const { rawUser } = useCurrentDashboardUser();
  const [trendDays, setTrendDays] = useState(DEFAULT_TREND_DAYS);
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    data: null,
  });

  const load = useCallback(async ({ silent = false, days = DEFAULT_TREND_DAYS } = {}) => {
    setState((current) => ({
      ...current,
      loading: !silent && !current.data,
      refreshing: silent,
      error: '',
    }));

    try {
      const range = buildPresetRange(days);
      const data = await fetchDashboardOverview(range);
      setState({ loading: false, refreshing: false, error: '', data });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Unable to load dashboard overview.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!rawUser) return undefined;
    const timer = window.setTimeout(() => void load({ days: DEFAULT_TREND_DAYS }), 0);
    return () => window.clearTimeout(timer);
  }, [load, rawUser]);

  const handleTrendRangeChange = (days) => {
    if (!TREND_RANGE_OPTIONS.includes(days) || days === trendDays) return;
    setTrendDays(days);
    void load({ silent: true, days });
  };

  if (state.loading && !state.data) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'flex min-h-[420px] items-center justify-center rounded-2xl border shadow-lg',
            isDarkMode ? 'border-white/10 bg-slate-950/55' : 'border-slate-200 bg-white'
          )}
        >
          <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="text-sm font-black">Loading operational dashboard…</span>
        </div>
      </div>
    );
  }

  const data = state.data || {};
  const meta = data.meta || {};
  const forecastSlide = data.forecastWorkflowTrend ? (
    <WorkflowTrend
      trend={data.forecastWorkflowTrend}
      range={meta.range}
      selectedDays={trendDays}
      isRefreshing={state.refreshing}
      onRangeChange={handleTrendRangeChange}
      isDarkMode={isDarkMode}
    />
  ) : null;
  const statusSlide = data.packageStatusDistribution?.length ? (
    <StatusDistribution rows={data.packageStatusDistribution} isDarkMode={isDarkMode} />
  ) : null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 p-4 sm:p-6">
      <section
        className={cn(
          'rounded-2xl border px-4 py-4 shadow-lg backdrop-blur-sm',
          isDarkMode ? 'border-white/10 bg-slate-950/55' : 'border-slate-200 bg-white/95'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={cn('text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Operational Dashboard
            </h2>
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              Live view of forecast production, model readiness, and workflow status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                'rounded-xl border px-3 py-2',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'block text-[9px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Operational Date
              </span>
              <strong className="mt-0.5 block text-xs">
                {formatOperationalDate(meta.operationalDate)}
              </strong>
            </div>
            <div
              className={cn(
                'rounded-xl border px-3 py-2',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'block text-[9px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Last Updated
              </span>
              <strong className="mt-0.5 block text-xs">
                {formatDate(meta.generatedAt, { time: true })}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => void load({ silent: true, days: trendDays })}
              disabled={state.refreshing}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black disabled:opacity-50',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <RefreshCw size={14} className={state.refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {state.error ? (
        <div
          role="alert"
          className={cn(
            'rounded-xl border px-4 py-3 text-xs font-semibold',
            isDarkMode
              ? 'border-rose-300/20 bg-rose-400/10 text-rose-100'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          )}
        >
          {state.error}
          {state.data ? ' Showing the last successfully loaded dashboard.' : ''}
        </div>
      ) : null}

      {meta.partial || data.errors?.length ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-xs font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          Some dashboard sources are temporarily unavailable. Available sections remain current.
        </div>
      ) : null}

      {data.summaryCards?.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.summaryCards.map((card) => (
            <SummaryCard key={card.key} card={card} isDarkMode={isDarkMode} />
          ))}
        </section>
      ) : null}

      <DashboardAnalyticsCarousel
        forecastSlide={forecastSlide}
        statusSlide={statusSlide}
        userAnalytics={data.userAnalytics}
        systemAnalytics={data.systemAnalytics}
        range={meta.range}
        selectedDays={trendDays}
        isDarkMode={isDarkMode}
      />

      {data.waveModels?.length || data.recentPackages?.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <WaveModelsTable
            models={data.waveModels}
            isDarkMode={isDarkMode}
            onSelectTab={onSelectTab}
          />
          <RecentPackages
            packages={data.recentPackages}
            isDarkMode={isDarkMode}
            onSelectTab={onSelectTab}
          />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <AttentionList
          items={data.attentionItems}
          isDarkMode={isDarkMode}
          onSelectTab={onSelectTab}
        />
        <ActivityList
          items={data.recentActivity}
          isDarkMode={isDarkMode}
          onSelectTab={onSelectTab}
        />
        <QuickActions
          actions={data.quickActions}
          isDarkMode={isDarkMode}
          onSelectTab={onSelectTab}
        />
      </section>
    </div>
  );
}
