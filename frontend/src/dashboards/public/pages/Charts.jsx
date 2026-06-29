import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Eye, Layers, Search, Waves, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { fetchPublicPublishedCharts } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import PublicPublishedChartPreviewMap from '@/dashboards/public/components/PublicPublishedChartPreviewMap';
import {
  PUBLIC_CHART_SLOTS,
  filterProjectsToPublicChartWindow,
  getPublicChartAvailableCount,
  getPublicChartCardDescription,
  getPublicChartCompleteness,
  getPublicChartTenDayWindow,
  groupPublicChartHistory,
  groupPublicChartsByTypeForDate,
} from '@/dashboards/public/utils/publicChartGroups';

const RECENT_FETCH_LIMIT = 80;
const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';

const CHART_STYLES = [
  { id: 'wave-wind', label: 'Wave & Wind', shortLabel: 'Wave + Wind', icon: Wind, description: 'Combined wave height and wind context.', color: '#2563eb' },
  { id: 'wave-only', label: 'Wave Only', shortLabel: 'Wave Only', icon: Waves, description: 'Clean wave-height focused chart style.', color: '#0891b2' },
  { id: 'visually-impaired', label: 'Accessible', shortLabel: 'Accessible', icon: Eye, description: 'High-contrast chart style for easier reading.', color: '#059669' },
];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.97 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35 } } };

function formatDate(value, options = {}) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(value));
  } catch {
    return '—';
  }
}

function getPersonName(person, fallback = 'DOST PAGASA') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

function CompletenessBadge({ completeness, isDark }) {
  if (completeness.isComplete) return <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>Complete</span>;
  if (completeness.isEmpty) return <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>No charts</span>;
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700'}`}>Incomplete</span>;
}

function ChartControls({ activeStyle, onChange, query, onQueryChange, isDark }) {
  return (
    <motion.section variants={fadeUp} className={`mx-auto grid w-full max-w-5xl gap-4 rounded-3xl border p-3 shadow-2xl shadow-black/5 backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_360px] ${isDark ? 'border-white/10 bg-slate-900/75' : 'border-slate-200 bg-white/85'}`}>
      <div className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
        <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search wave charts, date, or description" className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-950 placeholder:text-slate-400'}`} />
      </div>
      <div className={`grid grid-cols-3 rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`} aria-label="Chart display style">
        {CHART_STYLES.map((style) => {
          const Icon = style.icon;
          const active = style.id === activeStyle;
          return (
            <button key={style.id} type="button" onClick={() => onChange(style.id)} aria-pressed={active} title={style.description} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition-all ${active ? (isDark ? 'bg-cyan-400/15 text-cyan-100' : 'bg-white text-blue-700 shadow-sm') : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900')}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{style.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

function ChartSlotCard({ slot, chart, activeStyle, isDark, onOpen }) {
  const style = CHART_STYLES.find((item) => item.id === activeStyle) || CHART_STYLES[0];
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle;
  const description = getPublicChartCardDescription({ chart, slot, hasChart, formatDate, getPersonName });

  return (
    <motion.article variants={scaleIn} whileHover={{ y: -4 }} className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${isDark ? 'border-slate-700/70 bg-slate-900/80 hover:border-cyan-400/30' : 'border-slate-200 bg-white/95 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/80'}`}>
      <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-3xl" style={{ background: style.color }} aria-hidden="true" />
      <div className="relative ml-1 h-64 overflow-hidden text-left md:h-72">
        {hasChart ? (
          <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDark} height={null} className="h-full w-full rounded-none border-0" onClick={() => onOpen(chart)} />
        ) : (
          <div className={`h-full w-full ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`} />
        )}
        <div className="absolute left-4 top-4 z-20"><span className="rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20" style={{ background: style.color }}>{slot.badge}</span></div>
        {hasChart ? <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100"><span className="flex items-center gap-2 rounded-full bg-black/55 px-5 py-3 text-sm font-black text-white backdrop-blur-sm"><ArrowRight size={15} /> Open chart</span></div> : <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm">Awaiting publication</div>}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5 pl-7">
        <div>
          <h2 className={`text-2xl font-black leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{hasChart ? `Published ${formatDate(chart.publishedAt)} · ${getPersonName(chart.owner)}` : 'This slot is empty for the selected date'}</p>
          <p className={`mt-4 line-clamp-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>
        <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
          <span className={`flex items-center gap-2 text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{style.label}</span>
          <Button size="sm" icon={ArrowRight} disabled={!hasChart} onClick={() => onOpen(chart)}>View Chart</Button>
        </div>
      </div>
    </motion.article>
  );
}

function RecentHistory({ projects, selectedDate, onSelectDate, isDark }) {
  const grouped = useMemo(() => groupPublicChartHistory(projects), [projects]);
  if (!grouped.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Past 10 days</p><h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Recent chart dates</h2></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {grouped.map((item) => {
          const active = item.dateKey === selectedDate;
          return <button key={item.dateKey} type="button" onClick={() => onSelectDate(item.dateKey)} className={`rounded-2xl border p-4 text-left transition-all ${active ? (isDark ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-900') : (isDark ? 'border-white/10 bg-slate-900/70 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-700')}`}><p className="text-sm font-black">{formatDate(item.forecastDate)}</p><p className={`mt-2 text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.availableCount}/4 charts</p></button>;
        })}
      </div>
    </section>
  );
}

export default function Charts() {
  const navigate = useNavigate();
  const { isDarkMode: isDark } = useTheme();
  const { activeChartType, setActiveChartType } = useChartType();
  const [state, setState] = useState({ loading: true, error: '', projects: [] });
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, search: query, signal: controller.signal })
      .then((data) => setState({ loading: false, error: '', projects: filterProjectsToPublicChartWindow(data?.projects || [], getPublicChartTenDayWindow()) }))
      .catch((error) => { if (error?.name !== 'AbortError') setState({ loading: false, error: error?.message || 'Failed to load public charts.', projects: [] }); });
    return () => controller.abort();
  }, [query]);

  const recentProjects = state.projects;
  const historyGroups = useMemo(() => groupPublicChartHistory(recentProjects), [recentProjects]);
  const latestDate = historyGroups[0]?.dateKey || '';
  const activeDate = selectedDate || latestDate;
  const chartByType = useMemo(() => groupPublicChartsByTypeForDate(recentProjects, activeDate), [activeDate, recentProjects]);
  const availableCount = useMemo(() => getPublicChartAvailableCount(chartByType), [chartByType]);
  const completeness = useMemo(() => getPublicChartCompleteness(chartByType), [chartByType]);

  useEffect(() => { if (selectedDate && !historyGroups.some((item) => item.dateKey === selectedDate)) setSelectedDate(''); }, [historyGroups, selectedDate]);
  const openChart = useCallback((chart) => { if (chart?._id) navigate(`/forecasts/${chart._id}`); }, [navigate]);

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden"><div className={`absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full blur-3xl ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'}`} /><div className={`absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full blur-3xl ${isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/12'}`} /></div>
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8">
        <motion.section className="mx-auto max-w-4xl text-center" initial="hidden" animate="show">
          <motion.div variants={scaleIn} className="mb-4"><div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'border border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border border-blue-200 bg-blue-100/80 text-blue-700'}`}><Layers size={15} />{(CHART_STYLES.find((item) => item.id === activeChartType) || CHART_STYLES[0]).label} · {activeDate ? formatDate(activeDate) : 'Latest available'}</div></motion.div>
          <motion.h1 variants={fadeUp} className={`text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Wave Charts</motion.h1>
          <motion.p variants={fadeUp} className={`mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Browse the latest public WaveLab chart set and review recent published chart dates.</motion.p>
        </motion.section>
        <ChartControls activeStyle={activeChartType} onChange={setActiveChartType} query={query} onQueryChange={setQuery} isDark={isDark} />
        {state.loading && <div className="grid gap-5 lg:grid-cols-2">{PUBLIC_CHART_SLOTS.map((slot) => <div key={slot.chartType} className={`h-[430px] animate-pulse rounded-3xl border ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white/90'}`} />)}</div>}
        {!state.loading && state.error && <div className={`mx-auto max-w-2xl rounded-3xl border p-6 text-center text-sm font-bold ${isDark ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{state.error}</div>}
        {!state.loading && !state.error && !recentProjects.length && <div className={`mx-auto max-w-2xl rounded-3xl border p-10 text-center ${isDark ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}><p className="text-lg font-black">No published wave charts found</p><p className="mt-2 text-sm font-semibold">Published charts will appear here once Admin publishes approved outputs.</p></div>}
        {!state.loading && !state.error && recentProjects.length > 0 && <><section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><CalendarDays size={15} /> Current chart set</p><h2 className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{formatDate(activeDate)}</h2></div><div className="flex flex-wrap items-center gap-2"><CompletenessBadge completeness={completeness} isDark={isDark} /><div className={`rounded-2xl border px-4 py-3 text-sm font-black ${isDark ? 'border-white/10 bg-slate-900/70 text-slate-300' : 'border-slate-200 bg-white/90 text-slate-600'}`}>{availableCount}/4 published charts available</div></div></div><motion.div className="grid gap-5 lg:grid-cols-2" initial="hidden" animate="show">{PUBLIC_CHART_SLOTS.map((slot) => <ChartSlotCard key={`${activeDate}-${slot.chartType}`} slot={slot} chart={chartByType.get(slot.chartType)} activeStyle={activeChartType} isDark={isDark} onOpen={openChart} />)}</motion.div></section><RecentHistory projects={recentProjects} selectedDate={activeDate} onSelectDate={setSelectedDate} isDark={isDark} /></>}
        <p className={`text-center text-xs font-semibold tabular-nums ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Data: DOST-PAGASA · WaveLab · Published charts only</p>
      </div>
    </div>
  );
}
