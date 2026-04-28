import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useChartType } from '@/app/providers/ChartTypeProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Animation presets — identical to Contact.jsx / WaveHeroSection
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: d },
  }),
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'backOut' } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Static config
// ─────────────────────────────────────────────────────────────────────────────

const CHART_TYPES = [
  { id: 'wave-wind',         label: 'Wave × Wind' },
  { id: 'wave-only',         label: 'Wave Only'   },
  { id: 'visually-impaired', label: 'Accessible'  },
];

const IMAGES_BY_TYPE = {
  'wave-wind':         Array(4).fill('/charts/wave-wind/WaveXWind.png'),
  'wave-only':         Array(4).fill('/charts/wave/Wave.png'),
  'visually-impaired': Array(4).fill('/charts/wind-barbs/barbs.png'),
};

const SEVERITY = {
  Calm:     { color: '#2563eb', bg: 'bg-blue-50',    text: 'text-blue-700',   dark: 'dark:bg-blue-500/10 dark:text-blue-300'   },
  Low:      { color: '#16a34a', bg: 'bg-green-50',   text: 'text-green-700',  dark: 'dark:bg-green-500/10 dark:text-green-300' },
  Moderate: { color: '#d97706', bg: 'bg-amber-50',   text: 'text-amber-700',  dark: 'dark:bg-amber-500/10 dark:text-amber-300' },
  High:     { color: '#dc2626', bg: 'bg-red-50',     text: 'text-red-700',    dark: 'dark:bg-red-500/10 dark:text-red-300'     },
  VeryHigh: { color: '#7c3aed', bg: 'bg-violet-50',  text: 'text-violet-700', dark: 'dark:bg-violet-500/10 dark:text-violet-300'},
};

const CHART_META = [
  {
    id: 1, tag: 'LIVE', hour: 'Now', severity: 'Moderate',
    title: 'Current Analysis',
    subtitle: 'Real-time sea state · updated 4 min ago',
    note: 'Swells from tropical depression remnant. Moderate surfing conditions along Pacific-facing coasts.',
    stats: [
      { label: 'Wave Ht.', value: '2.1', unit: 'm'  },
      { label: 'Period',   value: '8.5', unit: 's'  },
      { label: 'Dir.',     value: 'SW',  unit: ''   },
      { label: 'Energy',   value: 'High',unit: ''   },
      { label: 'Wind',     value: '24',  unit: 'kph'},
    ],
  },
  {
    id: 2, tag: 'FCST', hour: '+24h', severity: 'Moderate',
    title: '24-Hour Forecast',
    subtitle: 'Next-day model run',
    note: 'Slight intensification overnight. Small craft advisory may apply after midnight.',
    stats: [
      { label: 'Max Ht.', value: '2.8', unit: 'm'  },
      { label: 'Min Ht.', value: '1.5', unit: 'm'  },
      { label: 'Period',  value: '7.2', unit: 's'  },
      { label: 'Dir.',    value: 'WSW', unit: ''   },
      { label: 'Wind',    value: '30',  unit: 'kph'},
    ],
  },
  {
    id: 3, tag: 'EXT', hour: '+36h', severity: 'High',
    title: '36-Hour Extended',
    subtitle: 'Extended-range ensemble model',
    note: 'Model spread increases significantly. Higher uncertainty for long-range swell predictions.',
    stats: [
      { label: 'Max Ht.', value: '3.2', unit: 'm'  },
      { label: 'Min Ht.', value: '1.8', unit: 'm'  },
      { label: 'Period',  value: '9.1', unit: 's'  },
      { label: 'Dir.',    value: 'W',   unit: ''   },
      { label: 'Wind',    value: '38',  unit: 'kph'},
    ],
  },
  {
    id: 4, tag: 'LR', hour: '+48h', severity: 'VeryHigh',
    title: '48-Hour Long Range',
    subtitle: 'Long-term analysis · low confidence',
    note: 'Developing low pressure system. Marine warning likely. Verify against 24h forecast closer to time.',
    stats: [
      { label: 'Max Ht.', value: '3.5',  unit: 'm'  },
      { label: 'Min Ht.', value: '2.0',  unit: 'm'  },
      { label: 'Period',  value: '10.3', unit: 's'  },
      { label: 'Dir.',    value: 'WNW',  unit: ''   },
      { label: 'Wind',    value: '45',   unit: 'kph'},
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────────────────────

const PageHeader = memo(function PageHeader({ activeType, isDark }) {
  const match = CHART_TYPES.find(ct => ct.id === activeType);
  const headText = isDark ? 'text-white' : 'text-slate-900';
  const muteText = isDark ? 'text-slate-300' : 'text-slate-600';

  return (
    <motion.section
      className="text-center"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Badge — mirrors Contact.jsx hero badge */}
      <motion.div variants={scaleIn} className="mb-6">
        <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold
          backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]
          ${isDark
            ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
            : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
          }`}
        >
          <Layers size={16} className="animate-pulse" aria-hidden="true" />
          {match?.label ?? activeType} · Philippine Sea State
        </div>
      </motion.div>

      {/* Headline — font-black tracking-tight, gradient highlight */}
      <motion.h1
        variants={fadeUp}
        custom={0.08}
        className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 tracking-tight ${headText}`}
      >
        Wave{' '}
        <span className={`bg-gradient-to-r bg-clip-text text-transparent
          ${isDark
            ? 'from-blue-400 via-cyan-400 to-emerald-400'
            : 'from-blue-600 via-cyan-600 to-emerald-600'
          }`}>
          Forecast
        </span>{' '}
        Charts
      </motion.h1>

      <motion.p
        variants={fadeUp}
        custom={0.16}
        className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-3 ${muteText}`}
      >
        DOST-PAGASA · WaveWatch III
      </motion.p>

      {/* Scale strip */}
      <motion.div
        variants={fadeUp}
        custom={0.22}
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-4"
      >
        <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Scale
        </span>
        {Object.entries(SEVERITY).map(([key, { color, bg, text }]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} aria-hidden="true" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{key}</span>
          </span>
        ))}
      </motion.div>
    </motion.section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FilmCard — horizontal film-strip card
// ─────────────────────────────────────────────────────────────────────────────

const FilmCard = memo(function FilmCard({ chart, image, isDark, isTransitioning, onExpand, index }) {
  const { tag, hour, title, subtitle, severity, stats, note } = chart;
  const sev     = SEVERITY[severity];
  const isFirst = index === 0;
  const headText = isDark ? 'text-white' : 'text-slate-900';
  const muteText = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardCls  = isDark
    ? 'bg-slate-900/70 border-slate-700/60 backdrop-blur-sm hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
    : 'bg-white/90 border-slate-200 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-2xl';

  return (
    <motion.article
      variants={scaleIn}
      whileHover={{ scale: 1.01, y: -3 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`group relative flex flex-col sm:flex-row rounded-2xl border overflow-hidden
        transition-all duration-300 cursor-pointer ${cardCls}`}
      style={{ minHeight: isFirst ? 250 : 190 }}
      onClick={() => onExpand(chart)}
      role="button"
      tabIndex={0}
      aria-label={`Expand ${title}`}
      onKeyDown={(e) => e.key === 'Enter' && onExpand(chart)}
    >
      {/* Severity rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: sev.color }}
        aria-hidden="true"
      />

      {/* Gradient overlay on hover (mirrors contact cards) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

      {/* Shine sweep (mirrors contact cards) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Chart image */}
      <div className={`relative overflow-hidden ${isFirst ? 'sm:w-[55%]' : 'sm:w-[47%]'}
        ${isFirst ? 'h-52 sm:h-auto' : 'h-40 sm:h-auto'} ml-1`}
      >
        <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/30' : 'bg-slate-900/10'}`} />
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04]"
            style={{ filter: isTransitioning ? 'blur(4px) brightness(0.5)' : 'none' }}
          />
        )}

        {/* Tags */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg text-white uppercase"
            style={{ background: sev.color }}
          >
            {tag}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg
            ${isDark ? 'bg-slate-900/80 text-slate-200' : 'bg-white/85 text-slate-800'}`}>
            {hour}
          </span>
        </div>

        {/* Zoom hint */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100
          transition-opacity duration-200 flex items-center justify-center"
        >
          <span className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full text-sm font-semibold">
            <ArrowRight size={13} aria-hidden="true" />
            View full chart
          </span>
        </div>
      </div>

      {/* Data panel */}
      <div className={`flex flex-col justify-between flex-1 px-7 ${isFirst ? 'py-7' : 'py-5'} min-w-0`}>
        <div>
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className={`font-black tracking-tight leading-tight
              ${isFirst ? 'text-2xl' : 'text-xl'} ${headText}`}>
              {title}
            </h2>
            {/* Severity badge */}
            <span className={`text-[10px] font-bold tracking-wide px-3 py-1 rounded-full shrink-0 mt-0.5
              ${sev.bg} ${sev.text}`}>
              {severity}
            </span>
          </div>

          <p className={`text-xs font-semibold mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
          </p>

          {/* Stats */}
          <dl className={`grid gap-x-3 gap-y-3 ${isFirst ? 'grid-cols-5' : 'grid-cols-5'}`}>
            {stats.map(({ label, value, unit }) => (
              <div key={label}>
                <dt className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${muteText}`}>
                  {label}
                </dt>
                <dd className={`font-black leading-none
                  ${isFirst ? 'text-xl' : 'text-lg'} ${headText}`}>
                  {value}
                  {unit && (
                    <span className={`text-xs font-semibold ml-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {unit}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Note */}
        <p className={`mt-5 pt-4 border-t text-xs leading-relaxed
          ${isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          {note}
        </p>
      </div>
    </motion.article>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PreviewModal
// ─────────────────────────────────────────────────────────────────────────────

const PreviewModal = memo(function PreviewModal({ chart, image, isDark, onClose, onPrev, onNext }) {
  const titleId  = useId();
  const closeRef = useRef(null);
  const sev = SEVERITY[chart.severity];
  const headText = isDark ? 'text-white' : 'text-slate-900';
  const muteText = isDark ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') onNext?.();
      if (e.key === 'ArrowLeft')  onPrev?.();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, onPrev, onNext]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.92)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25, ease: 'backOut' }}
        className={`relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl
          ${isDark
            ? 'bg-slate-900 border border-slate-700/60'
            : 'bg-white border border-slate-200'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-7 py-5
          ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-100'}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 rounded-full" style={{ background: sev.color }} />
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${muteText}`}>
                {chart.tag} · {chart.hour}
              </p>
              <h2 id={titleId} className={`text-xl font-black tracking-tight ${headText}`}>
                {chart.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrev && (
              <button type="button" onClick={onPrev} aria-label="Previous chart"
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-105
                  ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            )}
            {onNext && (
              <button type="button" onClick={onNext} aria-label="Next chart"
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-105
                  ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
            <button
              ref={closeRef} type="button" onClick={onClose} aria-label="Close"
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ml-1
                ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className={isDark ? 'bg-slate-950' : 'bg-slate-50'}>
          <img src={image} alt={chart.title} className="w-full h-auto max-h-[68vh] object-contain" />
        </div>

        {/* Footer stats */}
        <div className={`flex items-center gap-8 px-7 py-5 overflow-x-auto
          ${isDark ? 'border-t border-slate-800' : 'border-t border-slate-100'}`}
        >
          {chart.stats.map(({ label, value, unit }) => (
            <div key={label} className="shrink-0">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${muteText}`}>{label}</p>
              <p className={`font-black text-lg leading-none ${headText}`}>
                {value}
                <span className={`text-sm font-semibold ml-0.5 ${muteText}`}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ForecastChartsPage v4
// ─────────────────────────────────────────────────────────────────────────────

const ForecastChartsPage = () => {
  const { activeChartType }   = useChartType();
  const { isDarkMode: isDark } = useTheme();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const t = setTimeout(() => setIsTransitioning(false), 220);
    return () => clearTimeout(t);
  }, [activeChartType]);

  useEffect(() => {
    const match = CHART_TYPES.find(ct => ct.id === activeChartType);
    document.title = `Charts — ${match?.label ?? activeChartType}`;
  }, [activeChartType]);

  const images = IMAGES_BY_TYPE[activeChartType] ?? IMAGES_BY_TYPE['wave-wind'];
  const handleExpand = useCallback((chart) =>
    setExpandedIndex(CHART_META.findIndex(c => c.id === chart.id)), []);
  const handleClose  = useCallback(() => setExpandedIndex(null), []);
  const handlePrev   = useCallback(() =>
    setExpandedIndex(i => (i - 1 + CHART_META.length) % CHART_META.length), []);
  const handleNext   = useCallback(() =>
    setExpandedIndex(i => (i + 1) % CHART_META.length), []);

  return (
    <>
      <div className={`relative min-h-screen pt-32 pb-20 px-4 md:px-6 overflow-hidden transition-all duration-700
        ${isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
        }`}
      >
        {/* Dot-grid background — matches hero exactly */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0">
          <div className={`absolute inset-0 bg-[length:30px_30px]
            ${isDark
              ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
            }`}
          />
        </div>

        {/* Ambient glow blobs — mirrors hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl
            ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'}`}
          />
          <div className={`absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full blur-3xl
            ${isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/12'}`}
          />
        </div>

        <div className="relative z-10 max-w-screen-lg mx-auto flex flex-col gap-14">

          {/* Header */}
          <PageHeader activeType={activeChartType} isDark={isDark} />

          {/* Film-strip cards */}
          <motion.div
            className="flex flex-col gap-5"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {CHART_META.map((chart, i) => (
              <FilmCard
                key={chart.id}
                chart={chart}
                image={images[i]}
                isDark={isDark}
                isTransitioning={isTransitioning}
                onExpand={handleExpand}
                index={i}
              />
            ))}
          </motion.div>

          {/* Footer */}
          <p className={`text-xs text-center font-semibold tabular-nums
            ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Data: DOST-PAGASA · WaveWatch III · Next update in 2h 14m
          </p>

        </div>
      </div>

      {expandedIndex !== null && (
        <PreviewModal
          chart={CHART_META[expandedIndex]}
          image={images[expandedIndex]}
          isDark={isDark}
          onClose={handleClose}
          onPrev={expandedIndex > 0 ? handlePrev : null}
          onNext={expandedIndex < CHART_META.length - 1 ? handleNext : null}
        />
      )}
    </>
  );
};

export default ForecastChartsPage;