import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  Gauge,
  Loader2,
  RefreshCw,
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

import { initialAnalyticsRange, isAnalyticsDataStale } from './analytics/analyticsDateRange';
import { formatGeneratedAt } from './analytics/analyticsPresentation';
import { getAllowedAnalyticsSections } from './analytics/analyticsWorkspaceModel';
import AnalyticsRangeControls from './analytics/components/AnalyticsRangeControls';
import CollaborationActivityPanel from './analytics/panels/CollaborationActivityPanel';
import ExecutiveAnalysisPanel from './analytics/panels/ExecutiveAnalysisPanel';
import ForecastPerformancePanel from './analytics/panels/ForecastPerformancePanel';
import PublicReachPanel from './analytics/panels/PublicReachPanel';
import SystemPipelinePanel from './analytics/panels/SystemPipelinePanel';

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

const hasNoData = (sectionId, payload) => {
  if (!payload) return false;
  if (sectionId === 'overview') return Object.keys(payload.sections || {}).length === 0;
  if (sectionId === 'forecast') return Number(payload.total || 0) === 0;
  if (sectionId === 'public') return Number(payload.totalViews || 0) === 0;
  if (sectionId === 'users') {
    return (
      Number(payload.total || 0) === 0 && Number(payload.contributions?.totalEvents || 0) === 0
    );
  }
  if (sectionId === 'system') {
    return payload.available && Number(payload.summary?.models || 0) === 0;
  }
  return false;
};

function renderPanel(sectionId, payload, isDarkMode) {
  if (sectionId === 'overview') {
    return <ExecutiveAnalysisPanel payload={payload} isDarkMode={isDarkMode} />;
  }
  if (sectionId === 'forecast') {
    return <ForecastPerformancePanel payload={payload} isDarkMode={isDarkMode} />;
  }
  if (sectionId === 'public') {
    return <PublicReachPanel payload={payload} isDarkMode={isDarkMode} />;
  }
  if (sectionId === 'users') {
    return <CollaborationActivityPanel payload={payload} isDarkMode={isDarkMode} />;
  }
  return <SystemPipelinePanel payload={payload} isDarkMode={isDarkMode} />;
}

export default function AnalyticsAccess({ isDarkMode }) {
  const { rawUser } = useCurrentDashboardUser();
  const permissions = useMemo(() => new Set(rawUser?.permissions || []), [rawUser?.permissions]);
  const sections = useMemo(() => getAllowedAnalyticsSections(permissions), [permissions]);
  const [requestedSection, setRequestedSection] = useState('overview');
  const activeConfig =
    sections.find((section) => section.id === requestedSection) || sections[0] || null;
  const activeSection = activeConfig?.id || null;
  const canExport = permissions.has('analytics.export') && EXPORTABLE_SECTIONS.has(activeSection);

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

  useEffect(() => {
    if (!activeConfig && sections.length) {
      setRequestedSection(sections[0].id);
    }
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
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
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

  const payload = state.data[activeSection] || null;
  const loadedAt = state.loadedAt[activeSection];
  const stale = isAnalyticsDataStale(loadedAt);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className={cn(
              'text-xs font-black uppercase tracking-[0.15em]',
              isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
            )}
          >
            Analytics & Reports
          </p>
          <h2
            className={cn('mt-1 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}
          >
            Operations intelligence
          </h2>
          <p
            className={cn(
              'mt-1 max-w-4xl text-sm font-semibold leading-6',
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            Historical workflow performance, public reach, collaboration patterns, and pipeline
            evidence for operational analysis. The live Dashboard remains the place for immediate
            status and actions.
          </p>
          <p
            className={cn(
              'mt-2 text-[11px] font-semibold',
              stale ? 'text-amber-600' : isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Last refreshed: {formatGeneratedAt(loadedAt)}
            {stale ? ' · data may be stale' : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canExport ? (
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={state.exporting || !payload}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] text-slate-200'
                  : 'border-slate-200 bg-white text-slate-700'
              )}
            >
              {state.exporting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Export CSV
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void loadSection(activeSection, { silent: true })}
            disabled={state.refreshing}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />
            {state.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      <nav
        className={cn(
          'flex gap-2 overflow-x-auto rounded-2xl border p-2',
          isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
        )}
        aria-label="Analytics subsections"
        role="tablist"
      >
        {sections.map((section) => {
          const Icon = SECTION_ICON[section.id] || Activity;
          const selected = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setRequestedSection(section.id);
                setState((current) => ({ ...current, error: '' }));
              }}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
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

      <AnalyticsRangeControls
        range={range}
        customRange={customRange}
        onApplyRange={applyRange}
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
          <AlertTriangle size={15} className="mr-2 inline" />
          {state.error}
          {payload ? ' Showing the last successfully loaded data.' : ''}
        </div>
      ) : null}

      {!payload && !state.error ? (
        <div
          className={cn(
            'flex min-h-[360px] items-center justify-center rounded-2xl border',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
          )}
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm font-black">Loading {activeConfig.label.toLowerCase()}…</span>
        </div>
      ) : !payload && state.error ? (
        <div
          className={cn(
            'flex min-h-[280px] flex-col items-center justify-center rounded-2xl border px-6 text-center',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/5 text-slate-300'
              : 'border-amber-200 bg-amber-50/60 text-slate-700'
          )}
        >
          <AlertTriangle className="h-7 w-7" />
          <p className="mt-3 text-sm font-black">Analytics data is currently unavailable.</p>
          <button
            type="button"
            onClick={() => void loadSection(activeSection)}
            className="mt-4 rounded-xl border px-3 py-2 text-sm font-black"
          >
            Retry
          </button>
        </div>
      ) : payload && hasNoData(activeSection, payload) ? (
        <div
          className={cn(
            'flex min-h-[280px] flex-col items-center justify-center rounded-2xl border px-6 text-center',
            isDarkMode
              ? 'border-white/10 bg-white/[0.03] text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          )}
        >
          <BarChart3 className="h-7 w-7" />
          <p className="mt-3 text-sm font-black">No analytics records in this period.</p>
          <p className="mt-1 text-xs font-semibold">
            {range.start} to {range.end} · Try a wider date range.
          </p>
        </div>
      ) : payload ? (
        renderPanel(activeSection, payload, isDarkMode)
      ) : null}
    </div>
  );
}
