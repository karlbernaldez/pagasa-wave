import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Eye, FileText, History, Layers, Search, Waves, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { fetchPublicPublishedForecasts } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import {
  PUBLIC_CHART_SLOTS,
  filterProjectsToPublicChartWindow,
  getPublicChartAvailableCount,
  getPublicChartCardDescription,
  getPublicChartTenDayWindow,
  groupPublicChartHistory,
  groupPublicChartsByTypeForDate,
  toPublicChartDateKey,
} from '@/dashboards/public/utils/publicChartGroups';

const CHART_STYLES = [
  {
    id: 'wave-wind',
    label: 'Wave & Wind',
    shortLabel: 'Wave + Wind',
    icon: Wind,
    description: 'Combined wave height and wind context.',
    image: '/charts/wave-wind/WaveXWind.png',
    color: '#2563eb',
  },
  {
    id: 'wave-only',
    label: 'Wave Only',
    shortLabel: 'Wave Only',
    icon: Waves,
    description: 'Clean wave-height focused chart style.',
    image: '/charts/wave/Wave.png',
    color: '#0891b2',
  },
  {
    id: 'visually-impaired',
    label: 'Accessible',
    shortLabel: 'Accessible',
    icon: Eye,
    description: 'High-contrast chart style for easier reading.',
    image: '/charts/wind-barbs/barbs.png',
    color: '#059669',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

function formatDate(value, options = {}) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(new Date(value));
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

const PageHeader = memo(function PageHeader({ activeStyle, currentDate, isDark }) {
  const style = CHART_STYLES.find((item) => item.id === activeStyle) || CHART_STYLES[0];

  return (
    <motion.section className="mx-auto max-w-4xl text-center" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={scaleIn} className="mb-4">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] backdrop-blur-sm ${
          isDark
            ? 'border border-blue-400/20 bg-blue-500/10 text-blue-300'
            : 'border border-blue-200 bg-blue-100/80 text-blue-700'
        }`}>
          <Layers size={15} aria-hidden="true" />
          {style.label} · {currentDate ? formatDate(currentDate) : 'Latest available'}
        </div>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={0.04} className={`text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Wave Charts
      </motion.h1>

      <motion.p variants={fadeUp} custom={0.08} className={`mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Latest published DOST-PAGASA WaveLab chart set, with style modes and recent charts from the past 10 days.
      </motion.p>
    </motion.section>
  );
});

function ChartControls({ activeStyle, onChange, query, onQueryChange, isDark }) {
  return (
    <motion.section
      variants={fadeUp}
      custom={0.12}
      className={`mx-auto grid w-full max-w-5xl gap-4 rounded-3xl border p-3 shadow-2xl shadow-black/5 backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_360px] ${
        isDark ? 'border-white/10 bg-slate-900/75' : 'border-slate-200 bg-white/85'
      }`}
    >
      <div className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
        <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search wave charts, date, or description"
          className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-950 placeholder:text-slate-400'}`}
        />
      </div>

      <div className={`grid grid-cols-3 rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`} aria-label="Chart display style">
        {CHART_STYLES.map((style) => {
          const Icon = style.icon;
          const active = style.id === activeStyle;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              aria-pressed={active}
              title={style.description}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition-all ${
                active
                  ? isDark ? 'bg-cyan-400/15 text-cyan-100 shadow-sm' : 'bg-white text-blue-700 shadow-sm'
                  : isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{style.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

const ChartSlotCard = memo(function ChartSlotCard({ slot, chart, activeStyle, isDark, onOpen }) {
  const style = CHART_STYLES.find((item) => item.id === activeStyle) || CHART_STYLES[0];
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle;
  const description = getPublicChartCardDescription({
    chart,
    slot,
    hasChart,
    formatDate,
    getPersonName,
  });

  return (
    <motion.article
      variants={scaleIn}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 230, damping: 24 }}
      className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark
          ? 'border-slate-700/70 bg-slate-900/80 backdrop-blur-sm hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-950/20'
          : 'border-slate-200 bg-white/95 backdrop-blur-sm hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/80'
      }`}
    >
      <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-3xl" style={{ background: style.color }} aria-hidden="true" />

      <button
        type="button"
        disabled={!hasChart}
        onClick={() => onOpen(chart)}
        className="relative ml-1 h-64 cursor-pointer overflow-hidden text-left disabled:cursor-default md:h-72"
      >
        <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/20' : 'bg-slate-900/5'}`} />
        <img
          src={style.image}
          alt={`${style.label} preview`}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${!hasChart ? 'opacity-45 grayscale' : ''}`}
        />

        <div className="absolute left-4 top-4">
          <span className="rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20" style={{ background: style.color }}>
            {slot.badge}
          </span>
        </div>

        {hasChart ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-black/55 px-5 py-3 text-sm font-black text-white backdrop-blur-sm">
              <ArrowRight size={15} aria-hidden="true" /> Open chart
            </span>
          </div>
        ) : (
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm">
            Awaiting publication
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col justify-between p-5 pl-7">
        <div>
          <h2 className={`text-2xl font-black leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {hasChart ? `Published ${formatDate(chart.publishedAt)} · ${getPersonName(chart.owner)}` : 'This slot is empty for the selected date'}
          </p>
          <p className={`mt-4 line-clamp-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>

        <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
          <span className={`flex items-center gap-2 text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <FileText size={14} /> {style.label}
          </span>
          <Button size="sm" icon={ArrowRight} disabled={!hasChart} onClick={() => onOpen(chart)}>
            View Chart
          </Button>
        </div>
      </div>
    </motion.article>
  );
});

function RecentHistory({ projects, selectedDate, onSelectDate, isDark }) {
  const grouped = useMemo(() => groupPublicChartHistory(projects), [projects]);

  if (grouped.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <History size={15} /> Past 10 days
          </p>
          <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Recent chart dates</h2>
        </div>
        <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select a date to preview its available chart set.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {grouped.map((item) => {
          const active = item.dateKey === selectedDate;
          return (
            <button
              key={item.dateKey}
              type="button"
              onClick={() => onSelectDate(item.dateKey)}
              className={`min-w-[150px] rounded-2xl border px-4 py-3 text-left transition-all ${
                active
                  ? isDark ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-900'
                  : isDark ? 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-black">{formatDate(item.dateKey)}</span>
              <span className={`mt-1 block text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.count} chart{item.count === 1 ? '' : 's'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ForecastChartsPage() {
  const navigate = useNavigate();
  const { activeChartType, setActiveChartType } = useChartType();
  const { isDarkMode: isDark } = useTheme();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    document.title = 'Wave Charts — WaveLab';
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCharts() {
      setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const data = await fetchPublicPublishedForecasts({ limit: 80, search: query, signal: controller.signal });
        setState({ loading: false, error: '', data });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error?.message || 'Failed to load published wave charts.', data: null });
      }
    }

    const timer = setTimeout(loadCharts, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const projects = state.data?.projects || [];
  const chartWindow = useMemo(() => getPublicChartTenDayWindow(projects), [projects]);
  const { latestDate } = chartWindow;

  const recentProjects = useMemo(
    () => filterProjectsToPublicChartWindow(projects, chartWindow),
    [chartWindow, projects]
  );

  useEffect(() => {
    if (!selectedDate && latestDate) setSelectedDate(latestDate);
  }, [latestDate, selectedDate]);

  const activeDate = selectedDate || latestDate;
  const chartByType = useMemo(
    () => groupPublicChartsByTypeForDate(recentProjects, activeDate),
    [activeDate, recentProjects]
  );
  const activeStyle = CHART_STYLES.some((style) => style.id === activeChartType) ? activeChartType : 'wave-wind';
  const availableCount = getPublicChartAvailableCount(chartByType);

  const openChart = useCallback((chart) => {
    if (!chart?._id) return;
    navigate(`/charts/${chart._id}`);
  }, [navigate]);

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 pb-20 pt-24 transition-all duration-700 md:px-6 ${
      isDark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] z-0">
        <div className={`absolute inset-0 bg-[length:30px_30px] ${
          isDark
            ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
            : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
        }`} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full blur-3xl ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'}`} />
        <div className={`absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full blur-3xl ${isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/12'}`} />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8">
        <PageHeader activeStyle={activeStyle} currentDate={activeDate} isDark={isDark} />

        <ChartControls
          activeStyle={activeStyle}
          onChange={setActiveChartType}
          query={query}
          onQueryChange={setQuery}
          isDark={isDark}
        />

        {state.loading && (
          <div className="grid gap-5 lg:grid-cols-2">
            {PUBLIC_CHART_SLOTS.map((slot) => (
              <div key={slot.chartType} className={`h-[430px] animate-pulse rounded-3xl border ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white/90'}`} />
            ))}
          </div>
        )}

        {!state.loading && state.error && (
          <div className={`mx-auto max-w-2xl rounded-3xl border p-6 text-center text-sm font-bold ${isDark ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {state.error}
          </div>
        )}

        {!state.loading && !state.error && recentProjects.length === 0 && (
          <div className={`mx-auto max-w-2xl rounded-3xl border p-10 text-center ${isDark ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
            <p className="text-lg font-black">No published wave charts found</p>
            <p className="mt-2 text-sm font-semibold">Published charts will appear here once Admin publishes approved outputs.</p>
          </div>
        )}

        {!state.loading && !state.error && recentProjects.length > 0 && (
          <>
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <CalendarDays size={15} /> Current chart set
                  </p>
                  <h2 className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{formatDate(activeDate)}</h2>
                </div>
                <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${isDark ? 'border-white/10 bg-slate-900/70 text-slate-300' : 'border-slate-200 bg-white/90 text-slate-600'}`}>
                  {availableCount}/4 published charts available
                </div>
              </div>

              <motion.div className="grid gap-5 lg:grid-cols-2" variants={stagger} initial="hidden" animate="show">
                {PUBLIC_CHART_SLOTS.map((slot) => (
                  <ChartSlotCard
                    key={`${activeDate}-${slot.chartType}`}
                    slot={slot}
                    chart={chartByType.get(slot.chartType)}
                    activeStyle={activeStyle}
                    isDark={isDark}
                    onOpen={openChart}
                  />
                ))}
              </motion.div>
            </section>

            <RecentHistory projects={recentProjects} selectedDate={activeDate} onSelectDate={setSelectedDate} isDark={isDark} />
          </>
        )}

        <p className={`text-center text-xs font-semibold tabular-nums ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Data: DOST-PAGASA · WaveLab · Published charts only
        </p>
      </div>
    </div>
  );
}
