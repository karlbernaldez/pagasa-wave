import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Eye, FileText, History, Layers, Search, Waves, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { fetchPublicPublishedForecasts } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useChartType } from '@/app/providers/ChartTypeProvider';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: d },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'backOut' } },
};

const CHART_STYLES = [
  {
    id: 'wave-wind',
    label: 'Wave & Wind',
    icon: Wind,
    description: 'Combined wave height and wind context.',
    image: '/charts/wave-wind/WaveXWind.png',
  },
  {
    id: 'wave-only',
    label: 'Wave Only',
    icon: Waves,
    description: 'Clean wave-height focused chart style.',
    image: '/charts/wave/Wave.png',
  },
  {
    id: 'visually-impaired',
    label: 'Accessible',
    icon: Eye,
    description: 'High-contrast chart style for easier reading.',
    image: '/charts/wind-barbs/barbs.png',
  },
];

const CHART_SLOTS = [
  {
    chartType: 'analysis',
    tag: 'ANALYSIS',
    hour: 'Now',
    title: 'Analysis Chart',
    fallbackTitle: 'Current Analysis',
  },
  {
    chartType: 'forecast_24h',
    tag: '+24H',
    hour: '+24h',
    title: '24-Hour Chart',
    fallbackTitle: '24-Hour Wave Chart',
  },
  {
    chartType: 'forecast_36h',
    tag: '+36H',
    hour: '+36h',
    title: '36-Hour Chart',
    fallbackTitle: '36-Hour Wave Chart',
  },
  {
    chartType: 'forecast_48h',
    tag: '+48H',
    hour: '+48h',
    title: '48-Hour Chart',
    fallbackTitle: '48-Hour Wave Chart',
  },
];

const STYLE_SEVERITY = {
  'wave-wind': { color: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700', dark: 'dark:bg-blue-500/10 dark:text-blue-300' },
  'wave-only': { color: '#0891b2', bg: 'bg-cyan-50', text: 'text-cyan-700', dark: 'dark:bg-cyan-500/10 dark:text-cyan-300' },
  'visually-impaired': { color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', dark: 'dark:bg-emerald-500/10 dark:text-emerald-300' },
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

function toDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getPersonName(person, fallback = 'DOST PAGASA') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

function getChartTypeLabel(value) {
  const labels = {
    analysis: 'Analysis',
    forecast_24h: '24-Hour',
    forecast_36h: '36-Hour',
    forecast_48h: '48-Hour',
  };

  return labels[value] || value || 'Wave Chart';
}

function getTenDayWindow(projects) {
  const latestDate = projects.reduce((latest, project) => {
    const key = toDateKey(project.forecastDate);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, '');

  if (!latestDate) return { latestDate: '', startDate: '' };

  const start = new Date(`${latestDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 10);

  return {
    latestDate,
    startDate: start.toISOString().slice(0, 10),
  };
}

function getProjectsForDate(projects, dateKey) {
  const byType = new Map();

  projects
    .filter((project) => toDateKey(project.forecastDate) === dateKey)
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0))
    .forEach((project) => {
      if (!byType.has(project.chartType)) byType.set(project.chartType, project);
    });

  return byType;
}

const PageHeader = memo(function PageHeader({ activeStyle, currentDate, isDark }) {
  const match = CHART_STYLES.find((style) => style.id === activeStyle) || CHART_STYLES[0];
  const headText = isDark ? 'text-white' : 'text-slate-900';
  const muteText = isDark ? 'text-slate-300' : 'text-slate-600';

  return (
    <motion.section className="text-center" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={scaleIn} className="mb-6">
        <div className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
          isDark
            ? 'border border-blue-400/20 bg-blue-500/10 text-blue-300 hover:border-blue-400/40'
            : 'border border-blue-200 bg-blue-100/80 text-blue-700 hover:border-blue-300'
        }`}>
          <Layers size={16} className="animate-pulse" aria-hidden="true" />
          {match.label} · {currentDate ? formatDate(currentDate) : 'Latest available'}
        </div>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={0.08} className={`mb-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${headText}`}>
        Public{' '}
        <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
          isDark ? 'from-blue-400 via-cyan-400 to-emerald-400' : 'from-blue-600 via-cyan-600 to-emerald-600'
        }`}>
          Wave Charts
        </span>
      </motion.h1>

      <motion.p variants={fadeUp} custom={0.16} className={`mx-auto mb-3 max-w-2xl text-base leading-relaxed sm:text-lg ${muteText}`}>
        View the latest published DOST-PAGASA WaveLab charts in multiple public-friendly styles, with recent charts available for the past 10 days.
      </motion.p>
    </motion.section>
  );
});

function ChartStyleTabs({ activeStyle, onChange, isDark }) {
  return (
    <motion.div variants={fadeUp} custom={0.2} className="mx-auto grid max-w-4xl gap-3 md:grid-cols-3">
      {CHART_STYLES.map((style) => {
        const Icon = style.icon;
        const active = style.id === activeStyle;

        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
              active
                ? isDark ? 'border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-950/20' : 'border-blue-300 bg-blue-50 shadow-lg shadow-blue-100'
                : isDark ? 'border-white/10 bg-slate-900/70 hover:border-white/20' : 'border-slate-200 bg-white/90 hover:border-slate-300'
            }`}
          >
            <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${
              active ? isDark ? 'bg-cyan-400/15 text-cyan-200' : 'bg-blue-100 text-blue-700' : isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              <Icon size={18} />
            </span>
            <span className={`block text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{style.label}</span>
            <span className={`mt-1 block text-xs font-semibold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{style.description}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

const ChartSlotCard = memo(function ChartSlotCard({ slot, chart, activeStyle, isDark, onOpen }) {
  const style = CHART_STYLES.find((item) => item.id === activeStyle) || CHART_STYLES[0];
  const severity = STYLE_SEVERITY[activeStyle] || STYLE_SEVERITY['wave-wind'];
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle;
  const description = chart?.description || `No published ${slot.title.toLowerCase()} is available for this date yet.`;

  return (
    <motion.article
      variants={scaleIn}
      whileHover={{ scale: 1.01, y: -3 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`group relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'border-slate-700/60 bg-slate-900/70 backdrop-blur-sm hover:border-slate-600 hover:bg-slate-900/90 hover:shadow-2xl'
          : 'border-slate-200 bg-white/90 backdrop-blur-sm hover:border-slate-300 hover:bg-white hover:shadow-2xl'
      }`}
    >
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: severity.color }} aria-hidden="true" />

      <div className="relative h-44 overflow-hidden ml-1">
        <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/30' : 'bg-slate-900/10'}`} />
        <img src={style.image} alt={`${style.label} preview`} className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${!hasChart ? 'opacity-45 grayscale' : ''}`} />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white" style={{ background: severity.color }}>
            {slot.tag}
          </span>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${isDark ? 'bg-slate-900/80 text-slate-200' : 'bg-white/85 text-slate-800'}`}>
            {slot.hour}
          </span>
        </div>

        {hasChart && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white">
              <ArrowRight size={13} aria-hidden="true" /> View chart
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 pl-6">
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className={`text-xl font-black leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
            <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide ${severity.bg} ${severity.text}`}>
              {getChartTypeLabel(slot.chartType)}
            </span>
          </div>
          <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {hasChart ? `Published ${formatDate(chart.publishedAt)} · ${getPersonName(chart.owner)}` : 'Awaiting publication'}
          </p>
          <p className={`mt-4 line-clamp-2 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>

        <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
          <span className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
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
  const grouped = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      const key = toDateKey(project.forecastDate);
      if (!key) return;
      const entry = map.get(key) || { dateKey: key, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    });

    return [...map.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [projects]);

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

const ForecastChartsPage = () => {
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
  const { latestDate, startDate } = useMemo(() => getTenDayWindow(projects), [projects]);

  const recentProjects = useMemo(() => {
    if (!startDate || !latestDate) return projects;
    return projects.filter((project) => {
      const key = toDateKey(project.forecastDate);
      return key && key >= startDate && key <= latestDate;
    });
  }, [latestDate, projects, startDate]);

  useEffect(() => {
    if (!selectedDate && latestDate) setSelectedDate(latestDate);
  }, [latestDate, selectedDate]);

  const activeDate = selectedDate || latestDate;
  const chartByType = useMemo(() => getProjectsForDate(recentProjects, activeDate), [activeDate, recentProjects]);
  const activeStyle = CHART_STYLES.some((style) => style.id === activeChartType) ? activeChartType : 'wave-wind';

  const openChart = useCallback((chart) => {
    if (!chart?._id) return;
    navigate(`/charts/${chart._id}`);
  }, [navigate]);

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 pb-20 pt-32 transition-all duration-700 md:px-6 ${
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
        <div className={`absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full blur-3xl ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'}`} />
        <div className={`absolute -bottom-24 -right-24 h-[450px] w-[450px] rounded-full blur-3xl ${isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/12'}`} />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-12">
        <PageHeader activeStyle={activeStyle} currentDate={activeDate} isDark={isDark} />

        <ChartStyleTabs activeStyle={activeStyle} onChange={setActiveChartType} isDark={isDark} />

        <section className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/90'}`}>
            <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wave charts, date, or description"
              className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-950 placeholder:text-slate-400'}`}
            />
          </div>
        </section>

        {state.loading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {CHART_SLOTS.map((slot) => (
              <div key={slot.chartType} className={`h-[390px] animate-pulse rounded-2xl border ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white/90'}`} />
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
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <CalendarDays size={15} /> Current chart set
                  </p>
                  <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{formatDate(activeDate)}</h2>
                </div>
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Four chart slots: Analysis, 24h, 36h, and 48h.
                </p>
              </div>

              <motion.div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" variants={stagger} initial="hidden" animate="show">
                {CHART_SLOTS.map((slot) => (
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
};

export default ForecastChartsPage;
