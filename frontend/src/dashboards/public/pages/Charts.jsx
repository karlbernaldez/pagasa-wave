import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Download, Eye, Layers, Search, Waves, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { fetchPublicPublishedChartOutput, fetchPublicPublishedCharts } from '@/api/publishedForecastAPI';
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
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import usePublicMapBounds from '@/features/projects/hooks/usePublicMapBounds';
import { getChartStyleMode, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';

const RECENT_FETCH_LIMIT = 80;
const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';
const DEFAULT_PUBLIC_CHART_PDF_NOTE = 'This chart set is supplementary guidance for marine weather awareness and should be used together with official DOST-PAGASA bulletins, warnings, and advisories.';

const CHART_STYLES = [
  { id: 'wave-wind', label: 'Wave & Wind', shortLabel: 'Wave + Wind', icon: Wind, description: 'Wave raster plus published annotations.', color: '#2563eb' },
  { id: 'wave-only', label: 'Wave Only', shortLabel: 'Wave Only', icon: Waves, description: 'Annotation-focused chart without raster.', color: '#0891b2' },
  { id: 'visually-impaired', label: 'Accessible', shortLabel: 'Accessible', icon: Eye, description: 'Higher contrast labels and viewing mode.', color: '#059669' },
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

function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasExportableOutput(output) {
  return Boolean(
    output?.raster?.tileUrl
    || (Array.isArray(output?.featureCollection?.features) && output.featureCollection.features.length > 0)
  );
}

function getPersonName(person, fallback = 'DOST PAGASA') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

function glassPanel(isDark, extra = '') {
  return `rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl ${isDark ? 'border-white/10 bg-slate-900/72 shadow-cyan-950/20' : 'border-white/70 bg-white/78 shadow-blue-100/70'} ${extra}`;
}

function LiquidBackdrop({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -left-36 -top-36 h-[540px] w-[540px] rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-blue-300/25'}`} />
      <div className={`absolute -right-32 top-64 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? 'bg-blue-700/10' : 'bg-cyan-200/30'}`} />
      <div className={`absolute bottom-[-200px] left-1/3 h-[520px] w-[520px] rounded-full blur-3xl ${isDark ? 'bg-sky-400/5' : 'bg-indigo-200/20'}`} />
      <div className={`absolute inset-0 bg-[size:28px_28px] opacity-60 ${isDark ? 'bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08)_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08)_1px,_transparent_1px)]'}`} />
    </div>
  );
}

function CompletenessBadge({ completeness, isDark }) {
  if (completeness.isComplete) return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><CheckCircle2 size={13} /> Complete</span>;
  if (completeness.isEmpty) return <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white/70 text-slate-500'}`}>No charts</span>;
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>Incomplete</span>;
}

function ChartControls({ activeStyle, onChange, query, onQueryChange, isDark }) {
  return (
    <motion.section variants={fadeUp} className={glassPanel(isDark, 'mx-auto grid w-full max-w-5xl gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_390px]')}>
      <label className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-slate-200/80 bg-white/70'}`}>
        <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search wave charts, date, or description" className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-950 placeholder:text-slate-400'}`} />
      </label>
      <div className={`grid grid-cols-3 rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-slate-200/80 bg-white/70'}`} aria-label="Chart display style">
        {CHART_STYLES.map((style) => {
          const Icon = style.icon;
          const active = style.id === activeStyle;
          return (
            <button key={style.id} type="button" onClick={() => onChange(style.id)} aria-pressed={active} title={style.description} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${active ? (isDark ? 'bg-cyan-300/15 text-cyan-50 shadow-lg shadow-cyan-950/20' : 'bg-white text-blue-700 shadow-sm') : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100' : 'text-slate-500 hover:bg-white/80 hover:text-slate-900')}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{style.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

function ChartSlotCard({ slot, chart, activeStyle, isDark, onOpen, showStaffInfo }) {
  const style = CHART_STYLES.find((item) => item.id === activeStyle) || CHART_STYLES[0];
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle;
  const publicNameFormatter = showStaffInfo ? getPersonName : () => 'DOST-PAGASA';
  const description = getPublicChartCardDescription({ chart, slot, hasChart, formatDate, getPersonName: publicNameFormatter });
  const metaText = hasChart
    ? showStaffInfo
      ? `Published ${formatDate(chart.publishedAt)} · ${getPersonName(chart.owner)}`
      : `Published ${formatDate(chart.publishedAt)}`
    : 'This slot is empty for the selected date';

  return (
    <motion.article variants={scaleIn} whileHover={{ y: -4 }} className={`${glassPanel(isDark, 'group relative flex min-h-[415px] flex-col overflow-hidden transition duration-300')} ${isDark ? 'hover:border-cyan-300/30' : 'hover:border-blue-200'}`}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${style.color}88, transparent)` }} aria-hidden="true" />
      <div className="relative h-60 overflow-hidden text-left md:h-64">
        {hasChart ? (
          <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDark} height={null} className="h-full w-full rounded-none border-0" onClick={() => onOpen(chart)} />
        ) : (
          <div className={`h-full w-full ${isDark ? 'bg-slate-950/80' : 'bg-slate-100/80'}`} />
        )}
        <div className="absolute left-4 top-4 z-20"><span className="rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20" style={{ background: style.color }}>{slot.badge}</span></div>
        {hasChart ? <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100"><span className="flex items-center gap-2 rounded-full bg-black/55 px-5 py-3 text-sm font-black text-white backdrop-blur-sm"><ArrowRight size={15} /> Open chart</span></div> : <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm">Awaiting publication</div>}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h2 className={`text-xl font-black leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metaText}</p>
          <p className={`mt-3 line-clamp-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>
        <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>{style.label}</span>
          <Button size="sm" icon={ArrowRight} disabled={!hasChart} onClick={() => onOpen(chart)}>View</Button>
        </div>
      </div>
    </motion.article>
  );
}

function RecentHistory({ projects, selectedDate, onSelectDate, isDark }) {
  const grouped = useMemo(() => groupPublicChartHistory(projects), [projects]);
  if (!grouped.length) return null;
  return (
    <section className={glassPanel(isDark, 'p-5')}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Past 10 days</p><h2 className={`mt-1 text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Recent chart dates</h2></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {grouped.map((item) => {
          const active = item.dateKey === selectedDate;
          return <button key={item.dateKey} type="button" onClick={() => onSelectDate(item.dateKey)} className={`rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${active ? (isDark ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-900') : (isDark ? 'border-white/10 bg-slate-950/45 text-slate-300 hover:border-white/20' : 'border-slate-200/80 bg-white/60 text-slate-700 hover:border-blue-200 hover:bg-white')}`}><p className="text-sm font-black">{formatDate(item.dateKey)}</p><p className={`mt-2 text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.availableCount}/4 charts</p></button>;
        })}
      </div>
    </section>
  );
}

function writeChartSetPdfWindow({ printWindow, activeDate, activeStyleLabel, chartEntries, showStaffInfo, logoSrc, pdfNote }) {
  if (!printWindow || printWindow.closed) return;
  const dateLabel = formatDate(activeDate);
  const safeLogoSrc = logoSrc || '/pagasa-logo.png';
  const note = String(pdfNote || DEFAULT_PUBLIC_CHART_PDF_NOTE).trim();
  const cardsHtml = chartEntries.map((entry) => {
    const hasImage = Boolean(entry.imageDataUrl);
    const project = entry.project;
    const owner = showStaffInfo && project?.owner ? `<span>Forecaster: ${escapeHtml(getPersonName(project.owner, 'Forecaster'))}</span>` : '';
    const publishedAt = project?.publishedAt ? `<span>Published: ${escapeHtml(formatDateTime(project.publishedAt))}</span>` : '';
    return `
      <article class="chart-card">
        <header class="chart-card-header">
          <div><p class="slot">${escapeHtml(entry.slot.badge)}</p><h2>${escapeHtml(project?.name || entry.slot.fallbackTitle)}</h2></div>
          <p class="type">${escapeHtml(entry.slot.title)}</p>
        </header>
        <section class="chart-image-wrap">
          ${hasImage ? `<img src="${entry.imageDataUrl}" alt="${escapeHtml(entry.slot.title)} published chart" />` : '<div class="missing">No published chart available</div>'}
        </section>
        <footer>${publishedAt}${owner}</footer>
      </article>
    `;
  }).join('');

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>WaveLab Chart Set - ${escapeHtml(dateLabel)}</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 297mm; height: 210mm; background: #e2e8f0; }
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { width: 297mm; height: 210mm; margin: 0 auto; padding: 6mm; display: grid; grid-template-rows: auto 1fr auto; gap: 2.4mm; background: #fff; overflow: hidden; }
          .topbar { display: flex; align-items: center; justify-content: space-between; gap: 7mm; padding-bottom: 3mm; border-bottom: 1px solid #dbeafe; }
          .brand-block { display: flex; align-items: center; gap: 3mm; min-width: 0; }
          .logo-box { width: 15mm; height: 15mm; display: grid; place-items: center; border: 1px solid #dbeafe; border-radius: 50%; background: #f8fafc; overflow: hidden; flex: 0 0 auto; }
          .logo-box img { width: 12mm; height: 12mm; object-fit: contain; display: block; }
          .brand { color: #0369a1; font-size: 7pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
          h1 { margin: .5mm 0 0; font-size: 16pt; line-height: 1.05; letter-spacing: -0.025em; }
          .summary { margin: 1mm 0 0; color: #475569; font-size: 8pt; font-weight: 800; }
          .status { border: 1px solid #86efac; background: #f0fdf4; color: #047857; border-radius: 999px; padding: 2mm 3.5mm; font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; white-space: nowrap; }
          .chart-grid { min-height: 0; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 2.6mm; }
          .chart-card { min-height: 0; display: grid; grid-template-rows: auto 1fr auto; gap: 1.5mm; border: 1px solid #bfdbfe; border-radius: 4mm; padding: 2.2mm; background: #f8fafc; overflow: hidden; }
          .chart-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 4mm; }
          .slot { margin: 0 0 .4mm; color: #0369a1; font-size: 6.3pt; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
          h2 { margin: 0; font-size: 8.6pt; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 112mm; }
          .type { margin: 0; color: #64748b; font-size: 6.2pt; font-weight: 900; text-transform: uppercase; white-space: nowrap; }
          .chart-image-wrap { min-height: 0; border: 1px solid #dbeafe; border-radius: 3mm; overflow: hidden; background: #e2e8f0; display: grid; place-items: center; }
          .chart-image-wrap img { width: 100%; height: 100%; object-fit: contain; object-position: center; display: block; }
          .missing { color: #64748b; font-size: 9pt; font-weight: 900; }
          .chart-card footer { display: flex; align-items: center; justify-content: space-between; gap: 3mm; min-height: 3.5mm; color: #64748b; font-size: 6.2pt; font-weight: 800; }
          .footer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4mm; align-items: center; padding-top: 1mm; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 5.2pt; font-weight: 600; line-height: 1.15; }
          .footer strong { color: #64748b; font-weight: 800; }
          .note { max-width: 225mm; color: #94a3b8; }
          .generated { white-space: nowrap; text-align: right; color: #94a3b8; font-weight: 700; }
          @media print { html, body { width: 297mm; height: 210mm; overflow: hidden; background: #fff; } }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="topbar">
            <div class="brand-block">
              <div class="logo-box"><img src="${escapeHtml(safeLogoSrc)}" alt="PAGASA logo" /></div>
              <div><div class="brand">DOST-PAGASA · WaveLab</div><h1>Wave chart set</h1><p class="summary">Valid ${escapeHtml(dateLabel)} · ${escapeHtml(activeStyleLabel)} · Published operational output</p></div>
            </div>
            <div class="status">Four-chart PDF</div>
          </section>
          <section class="chart-grid">${cardsHtml}</section>
          <footer class="footer">
            <div><strong>Note:</strong> <span class="note">${escapeHtml(note)}</span></div>
            <div class="generated">Generated ${escapeHtml(new Date().toLocaleString('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE }))}</div>
          </footer>
        </main>
        <script>window.onload = () => { window.focus(); window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function Charts() {
  const navigate = useNavigate();
  const { isDarkMode: isDark } = useTheme();
  const { activeChartType, setActiveChartType } = useChartType();
  const { settings: publicSettings } = usePublicMapBounds();
  const exportRefs = useRef({});
  const exportImageCacheRef = useRef({});
  const [state, setState] = useState({ loading: true, error: '', projects: [] });
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [exportState, setExportState] = useState({ loading: false, error: '', entries: [] });
  const [pdfReadyCount, setPdfReadyCount] = useState(0);
  const showStaffInfo = publicSettings.showPublicStaffInfo !== false;

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, search: query, theme: isDark ? 'dark' : 'light', signal: controller.signal })
      .then((data) => setState({ loading: false, error: '', projects: filterProjectsToPublicChartWindow(data?.projects || [], getPublicChartTenDayWindow()) }))
      .catch((error) => { if (error?.name !== 'AbortError') setState({ loading: false, error: error?.message || 'Failed to load public charts.', projects: [] }); });
    return () => controller.abort();
  }, [isDark, query]);

  const recentProjects = state.projects;
  const historyGroups = useMemo(() => groupPublicChartHistory(recentProjects), [recentProjects]);
  const latestDate = historyGroups[0]?.dateKey || '';
  const activeDate = selectedDate || latestDate;
  const chartByType = useMemo(() => groupPublicChartsByTypeForDate(recentProjects, activeDate), [activeDate, recentProjects]);
  const availableCount = useMemo(() => getPublicChartAvailableCount(chartByType), [chartByType]);
  const completeness = useMemo(() => getPublicChartCompleteness(chartByType), [chartByType]);
  const activeStyle = CHART_STYLES.find((item) => item.id === activeChartType) || CHART_STYLES[0];
  const activeStyleMode = normalizeChartStyleMode(activeChartType);
  const activeStyleLabel = getChartStyleMode(activeStyleMode).label;
  const pdfTotalCount = exportState.entries.length;
  const isPdfReady = Boolean(!exportState.loading && pdfTotalCount && pdfReadyCount >= pdfTotalCount);
  const pdfButtonLabel = exportState.loading ? 'Preparing PDF' : isPdfReady ? 'PDF' : 'Warming PDF';

  useEffect(() => { if (selectedDate && !historyGroups.some((item) => item.dateKey === selectedDate)) setSelectedDate(''); }, [historyGroups, selectedDate]);
  const openChart = useCallback((chart) => { if (chart?._id) navigate(`/forecasts/${chart._id}`); }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    exportRefs.current = {};
    exportImageCacheRef.current = {};
    setPdfReadyCount(0);

    if (!activeDate || !recentProjects.length) {
      setExportState({ loading: false, error: '', entries: [] });
      return () => controller.abort();
    }

    const theme = isDark ? 'dark' : 'light';
    setExportState({ loading: true, error: '', entries: [] });

    Promise.all(PUBLIC_CHART_SLOTS.map(async (slot) => {
      const project = chartByType.get(slot.chartType) || null;
      if (!project?._id) return { slot, project: null, output: null };
      const output = await fetchPublicPublishedChartOutput(project._id, { theme, signal: controller.signal });
      return { slot, project, output };
    }))
      .then((entries) => setExportState({ loading: false, error: '', entries }))
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setExportState({ loading: false, error: error?.message || 'Failed to preload chart set PDF.', entries: [] });
        }
      });

    return () => controller.abort();
  }, [activeDate, chartByType, isDark, recentProjects.length]);

  useEffect(() => {
    if (!exportState.entries.length) {
      exportImageCacheRef.current = {};
      setPdfReadyCount(0);
      return undefined;
    }

    const totalCount = exportState.entries.length;
    const updateReadyCount = () => {
      const readyCount = exportState.entries.filter((entry) => {
        const key = entry.slot.chartType;
        if (!entry.project?._id || !hasExportableOutput(entry.output)) {
          exportImageCacheRef.current[key] = '';
          return true;
        }
        if (exportImageCacheRef.current[key]) return true;
        const mapRef = exportRefs.current[key];
        if (!mapRef?.isReady || !mapRef?.getDataUrl) return false;
        try {
          const imageDataUrl = mapRef.getDataUrl();
          if (!imageDataUrl) return false;
          exportImageCacheRef.current[key] = imageDataUrl;
          return true;
        } catch {
          return false;
        }
      }).length;

      setPdfReadyCount((current) => {
        if (readyCount >= totalCount) return totalCount;
        return Math.max(current, readyCount);
      });

      return readyCount >= totalCount;
    };

    if (updateReadyCount()) return undefined;
    const timer = window.setInterval(() => {
      if (updateReadyCount()) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, [activeStyleMode, exportState.entries]);

  const handleDownloadChartSetPdf = () => {
    if (!isPdfReady) {
      setExportState((prev) => ({ ...prev, error: 'PDF export is still warming up in the background. Please wait until the PDF button is ready.' }));
      return;
    }

    const printableEntries = exportState.entries.map((entry) => {
      if (!entry.project?._id || !hasExportableOutput(entry.output)) return { ...entry, imageDataUrl: '' };
      return { ...entry, imageDataUrl: exportImageCacheRef.current[entry.slot.chartType] || '' };
    });

    const missingImage = printableEntries.some((entry) => entry.project?._id && hasExportableOutput(entry.output) && !entry.imageDataUrl);
    if (missingImage) {
      setPdfReadyCount(0);
      setExportState((prev) => ({ ...prev, error: 'PDF export is still warming up in the background. Please wait until the PDF button is ready.' }));
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setExportState((prev) => ({ ...prev, error: 'Pop-up was blocked. Please allow pop-ups to export PDF.' }));
      return;
    }

    setExportState((prev) => ({ ...prev, error: '' }));
    writeChartSetPdfWindow({
      printWindow,
      activeDate,
      activeStyleLabel,
      chartEntries: printableEntries,
      showStaffInfo,
      logoSrc: publicSettings.logoPreview || '/pagasa-logo.png',
      pdfNote: publicSettings.publicChartPdfNote || DEFAULT_PUBLIC_CHART_PDF_NOTE,
    });
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <LiquidBackdrop isDark={isDark} />

      {exportState.entries.map((entry) => entry.project?._id && hasExportableOutput(entry.output) ? (
        <PublishedForecastExportMap
          key={`export-${entry.project._id}-${activeStyleMode}`}
          ref={(instance) => {
            if (instance) exportRefs.current[entry.slot.chartType] = instance;
          }}
          features={entry.output.featureCollection}
          chartStyleMode={activeStyleMode}
          raster={entry.output.raster || entry.project.raster}
        />
      ) : null)}

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7">
        <motion.section className={glassPanel(isDark, 'mx-auto w-full max-w-5xl p-7 text-center sm:p-9')} initial="hidden" animate="show">
          <motion.div variants={scaleIn} className="mb-4"><div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-100/80 text-blue-700'}`}><Layers size={15} />{activeStyle.label} · {activeDate ? formatDate(activeDate) : 'Latest available'}</div></motion.div>
          <motion.h1 variants={fadeUp} className={`text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Wave Charts</motion.h1>
          <motion.p variants={fadeUp} className={`mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Browse the latest public WaveLab chart set and review recently published operational wave outputs.</motion.p>
        </motion.section>

        <ChartControls activeStyle={activeChartType} onChange={setActiveChartType} query={query} onQueryChange={setQuery} isDark={isDark} />

        {state.loading && <div className="grid gap-5 lg:grid-cols-2">{PUBLIC_CHART_SLOTS.map((slot) => <div key={slot.chartType} className={glassPanel(isDark, 'h-[415px] animate-pulse')} />)}</div>}
        {!state.loading && state.error && <div className={`mx-auto max-w-2xl rounded-3xl border p-6 text-center text-sm font-bold backdrop-blur-xl ${isDark ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{state.error}</div>}
        {exportState.error && <div className={`mx-auto max-w-2xl rounded-3xl border p-4 text-center text-sm font-bold backdrop-blur-xl ${isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{exportState.error}</div>}
        {!state.loading && !state.error && !recentProjects.length && <div className={glassPanel(isDark, 'mx-auto max-w-2xl p-10 text-center')}><p className="text-lg font-black">No published wave charts found</p><p className={`mt-2 text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Published charts will appear here once Admin publishes approved outputs.</p></div>}

        {!state.loading && !state.error && recentProjects.length > 0 && <>
          <section className="space-y-5">
            <div className={glassPanel(isDark, 'flex flex-wrap items-center justify-between gap-3 p-5')}>
              <div><p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><CalendarDays size={15} /> Current chart set</p><h2 className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{formatDate(activeDate)}</h2></div>
              <div className="flex flex-wrap items-center gap-2"><CompletenessBadge completeness={completeness} isDark={isDark} /><div className={`rounded-2xl border px-4 py-3 text-sm font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-600'}`}>{availableCount}/4 published charts available</div><Button size="sm" variant="secondary" icon={Download} loading={exportState.loading || (!isPdfReady && !!availableCount)} disabled={!availableCount || exportState.loading || !isPdfReady} onClick={handleDownloadChartSetPdf}>{pdfButtonLabel}</Button></div>
            </div>
            <motion.div className="grid gap-5 lg:grid-cols-2" initial="hidden" animate="show">{PUBLIC_CHART_SLOTS.map((slot) => <ChartSlotCard key={`${activeDate}-${slot.chartType}`} slot={slot} chart={chartByType.get(slot.chartType)} activeStyle={activeChartType} isDark={isDark} onOpen={openChart} showStaffInfo={showStaffInfo} />)}</motion.div>
          </section>
          <RecentHistory projects={recentProjects} selectedDate={activeDate} onSelectDate={setSelectedDate} isDark={isDark} />
        </>}
        <p className={`text-center text-xs font-semibold tabular-nums ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Data: DOST-PAGASA · WaveLab · Published charts only</p>
      </div>
    </div>
  );
}
