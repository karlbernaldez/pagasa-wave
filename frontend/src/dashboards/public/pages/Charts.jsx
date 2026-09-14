import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Download, Eye, RefreshCw, Search, Waves, Wind } from 'lucide-react';
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

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(value, options = {}) {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(value));
  } catch {
    return '-';
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

function getPersonName(person, fallback = 'DOST-PAGASA') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

function glassPanel(isDark, extra = '') {
  return `home-liquid rounded-[1.85rem] border backdrop-blur-2xl ${isDark ? 'is-dark border-white/10 bg-slate-900/60 shadow-[0_24px_64px_rgba(0,0,0,0.25)]' : 'border-white/70 bg-white/70 shadow-[0_22px_60px_rgba(15,23,42,0.09)]'} ${extra}`;
}

function LiquidBackdrop({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -left-40 top-20 h-[520px] w-[520px] rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-blue-300/25'}`} />
      <div className={`absolute -right-36 top-72 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? 'bg-blue-700/10' : 'bg-cyan-200/30'}`} />
    </div>
  );
}

function StateNotice({ isDark, tone = 'slate', title, children, action }) {
  const toneClass = tone === 'red'
    ? isDark ? 'border-red-400/20 bg-red-400/10 text-red-100' : 'border-red-200 bg-red-50 text-red-700'
    : tone === 'amber'
      ? isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'
      : isDark ? 'border-white/10 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700';

  return (
    <div className={`mx-auto max-w-2xl rounded-3xl border p-6 text-center backdrop-blur-xl ${toneClass}`}>
      <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
      <div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function CompletenessBadge({ completeness, isDark }) {
  if (completeness.isComplete) {
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><CheckCircle2 size={13} /> Complete</span>;
  }
  if (completeness.isEmpty) {
    return <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white/70 text-slate-500'}`}>No charts</span>;
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>Incomplete</span>;
}

function ChartControls({ activeStyle, onChange, query, onQueryChange, isDark }) {
  return (
    <section className={glassPanel(isDark, 'sticky top-[4.75rem] z-30 mt-4 grid w-full gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_420px]')}>
      <label className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-slate-200/80 bg-white/70'}`}>
        <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search wave charts, date, or description" className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-950 placeholder:text-slate-400'}`} />
      </label>
      <div className={`grid grid-cols-3 rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-slate-200/80 bg-white/70'}`} aria-label="Chart display style">
        {CHART_STYLES.map((style) => {
          const Icon = style.icon;
          const active = style.id === activeStyle;
          return (
            <button key={style.id} type="button" onClick={() => onChange(style.id)} aria-pressed={active} title={style.description} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${active ? (isDark ? 'bg-cyan-300/15 text-cyan-50 shadow-lg shadow-cyan-950/20' : 'solid-blue shadow-sm') : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100' : 'text-slate-500 hover:bg-white/80 hover:text-slate-900')}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{style.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
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
      ? `Published ${formatDate(chart.publishedAt)} - ${getPersonName(chart.owner)}`
      : `Published ${formatDate(chart.publishedAt)}`
    : 'This slot is empty for the selected date';

  return (
    <article className={`${glassPanel(isDark, 'group relative flex min-h-[350px] flex-col overflow-hidden rounded-[1.65rem] transition duration-300 hover:-translate-y-1')} ${isDark ? 'hover:border-cyan-300/30' : 'hover:border-blue-200'}`}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${style.color}88, transparent)` }} aria-hidden="true" />
      <div className="relative h-44 overflow-hidden text-left xl:h-48">
        {hasChart ? (
          <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDark} height={null} className="h-full w-full rounded-none border-0" onClick={() => onOpen(chart)} />
        ) : (
          <div className={`h-full w-full ${isDark ? 'bg-slate-950/80' : 'bg-slate-100/80'}`} />
        )}
        <div className="absolute left-4 top-4 z-20"><span className="rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20" style={{ background: style.color }}>{slot.badge}</span></div>
        {hasChart ? <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"><span className="flex items-center gap-2 rounded-full bg-slate-950/55 px-5 py-3 text-sm font-black text-white backdrop-blur-sm"><ArrowRight size={15} /> Open chart</span></div> : <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm">Awaiting publication</div>}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h2 className={`text-base font-black leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metaText}</p>
          <p className={`mt-3 line-clamp-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>
        <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>{style.label}</span>
          <Button size="sm" icon={ArrowRight} disabled={!hasChart} onClick={() => onOpen(chart)}>View</Button>
        </div>
      </div>
    </article>
  );
}

function RecentHistory({ projects, selectedDate, onSelectDate, isDark }) {
  const grouped = useMemo(() => groupPublicChartHistory(projects), [projects]);
  if (!grouped.length) return null;
  return (
    <section className={glassPanel(isDark, 'p-4')}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Recent chart dates</p><h2 className={`mt-1 text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Browse previous packages</h2></div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {grouped.map((item) => {
          const active = item.dateKey === selectedDate;
          return <button key={item.dateKey} type="button" onClick={() => onSelectDate(item.dateKey)} className={`min-w-[160px] rounded-2xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${active ? (isDark ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-900') : (isDark ? 'border-white/10 bg-slate-950/45 text-slate-300 hover:border-white/20' : 'border-slate-200/80 bg-white/60 text-slate-700 hover:border-blue-200 hover:bg-white')}`}><p className="text-sm font-black">{formatDate(item.dateKey)}</p><p className={`mt-2 text-xs font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.availableCount}/4 charts</p></button>;
        })}
      </div>
    </section>
  );
}

function writeChartSetPdfWindow({ printWindow, activeDate, activeStyleLabel, chartEntries, showStaffInfo, logoSrc, pdfNote }) {
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
          .generated { white-space: nowrap; text-align: right; color: #94a3b8; font-weight: 700; }
          @media print { html, body { width: 297mm; height: 210mm; overflow: hidden; background: #fff; } }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="topbar">
            <div class="brand-block">
              <div class="logo-box"><img src="${escapeHtml(safeLogoSrc)}" alt="PAGASA logo" /></div>
              <div><div class="brand">DOST-PAGASA - WaveLab</div><h1>Wave chart set</h1><p class="summary">Valid ${escapeHtml(dateLabel)} - ${escapeHtml(activeStyleLabel)} - Published operational output</p></div>
            </div>
            <div class="status">Four-chart PDF</div>
          </section>
          <section class="chart-grid">${cardsHtml}</section>
          <footer class="footer">
            <div><strong>Note:</strong> ${escapeHtml(note)}</div>
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
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [exportState, setExportState] = useState({ loading: false, error: '', entries: [] });
  const [pdfReadyCount, setPdfReadyCount] = useState(0);
  const showStaffInfo = publicSettings.showPublicStaffInfo !== false;

  useEffect(() => { document.title = 'Wavelab | Published Wave Charts'; }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, search: query, theme: isDark ? 'dark' : 'light', signal: controller.signal })
      .then((data) => setState({ loading: false, error: '', projects: filterProjectsToPublicChartWindow(data?.projects || [], getPublicChartTenDayWindow()) }))
      .catch((error) => { if (error?.name !== 'AbortError') setState({ loading: false, error: error?.message || 'Failed to load public charts.', projects: [] }); });
    return () => controller.abort();
  }, [isDark, query, reloadToken]);

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
  const pdfButtonLabel = exportState.loading ? 'Preparing PDF' : isPdfReady ? 'Download PDF' : 'Preparing PDF';
  const forecastPeriodLabel = activeDate ? `${formatDate(activeDate, { month: 'short', day: 'numeric' })} - ${formatDate(new Date(new Date(activeDate).getTime() + 24 * 60 * 60 * 1000), { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Latest available period';
  const pdfStatusText = availableCount
    ? isPdfReady
      ? `PDF export is ready. ${availableCount} of 4 published charts will be included; empty slots are marked unavailable.`
      : `Preparing ${Math.min(pdfReadyCount, pdfTotalCount || 4)} of ${pdfTotalCount || 4} chart slots for PDF export. Empty slots will be marked unavailable.`
    : 'PDF export becomes available after at least one chart is published for this date.';

  useEffect(() => { if (selectedDate && !historyGroups.some((item) => item.dateKey === selectedDate)) setSelectedDate(''); }, [historyGroups, selectedDate]);
  const openChart = useCallback((chart) => { if (chart?._id) navigate(`/charts/${chart._id}`); }, [navigate]);

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
        if (error?.name !== 'AbortError') setExportState({ loading: false, error: error?.message || 'Failed to preload chart set PDF.', entries: [] });
      });

    return () => controller.abort();
  }, [activeDate, chartByType, isDark, recentProjects.length]);

  useEffect(() => {
    exportImageCacheRef.current = {};
    setPdfReadyCount(0);
    if (!exportState.entries.length) return undefined;

    const totalCount = exportState.entries.length;
    const updateReadyCount = () => {
      const readyCount = exportState.entries.filter((entry) => {
        const key = `${activeStyleMode}:${entry.slot.chartType}`;
        if (!entry.project?._id || !hasExportableOutput(entry.output)) {
          exportImageCacheRef.current[key] = '';
          return true;
        }
        if (exportImageCacheRef.current[key]) return true;
        const mapRef = exportRefs.current[entry.slot.chartType];
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

      setPdfReadyCount((current) => readyCount >= totalCount ? totalCount : Math.max(current, readyCount));
      return readyCount >= totalCount;
    };

    if (updateReadyCount()) return undefined;
    const timer = window.setInterval(() => { if (updateReadyCount()) window.clearInterval(timer); }, 500);
    return () => window.clearInterval(timer);
  }, [activeStyleMode, exportState.entries]);

  const handleDownloadChartSetPdf = () => {
    if (!isPdfReady) {
      setExportState((prev) => ({ ...prev, error: 'PDF export is still preparing the chart images. Please wait until the Download PDF button is ready.' }));
      return;
    }

    const printableEntries = exportState.entries.map((entry) => {
      if (!entry.project?._id || !hasExportableOutput(entry.output)) return { ...entry, imageDataUrl: '' };
      return { ...entry, imageDataUrl: exportImageCacheRef.current[`${activeStyleMode}:${entry.slot.chartType}`] || '' };
    });

    const missingImage = printableEntries.some((entry) => entry.project?._id && hasExportableOutput(entry.output) && !entry.imageDataUrl);
    if (missingImage) {
      setPdfReadyCount(0);
      setExportState((prev) => ({ ...prev, error: 'PDF export is still preparing the chart images. Please wait until the Download PDF button is ready.' }));
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
    <main className={`wavelab-home relative min-h-screen overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'}`}>
      <LiquidBackdrop isDark={isDark} />

      {exportState.entries.map((entry) => entry.project?._id && hasExportableOutput(entry.output) ? (
        <PublishedForecastExportMap
          key={`export-${entry.project._id}-${activeStyleMode}`}
          ref={(instance) => { if (instance) exportRefs.current[entry.slot.chartType] = instance; }}
          features={entry.output.featureCollection}
          chartStyleMode={activeStyleMode}
          raster={entry.output.raster || entry.project.raster}
        />
      ) : null)}

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <section className={glassPanel(isDark, 'grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_330px_auto] lg:items-center')}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Published forecast archive</p>
            <h1 className={`mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>Published Wave Charts</h1>
            <p className={`mt-3 max-w-2xl text-base font-semibold leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Browse official published wave chart sets by date, chart style, and release package.</p>
          </div>
          <div className={cx('rounded-[1.45rem] border p-4', isDark ? 'border-white/10 bg-white/[0.055]' : 'border-white/60 bg-white/55')}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Current chart set</p>
            <h2 className={`mt-3 flex items-center gap-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}><CalendarDays size={27} className="text-blue-700" /> {activeDate ? formatDate(activeDate) : 'Latest available'}</h2>
            <div className="mt-4 flex flex-wrap gap-2"><CompletenessBadge completeness={completeness} isDark={isDark} /><span className={cx('rounded-full px-3 py-1 text-xs font-black', isDark ? 'bg-blue-400/10 text-cyan-100' : 'bg-blue-50 text-blue-800')}>{forecastPeriodLabel}</span></div>
          </div>
          <Button size="lg" icon={Download} loading={exportState.loading || (!isPdfReady && !!availableCount)} disabled={!availableCount || exportState.loading || !isPdfReady} onClick={handleDownloadChartSetPdf}>{pdfButtonLabel}</Button>
        </section>

        <ChartControls activeStyle={activeChartType} onChange={setActiveChartType} query={query} onQueryChange={setQuery} isDark={isDark} />

        {state.loading && (
          <section className="space-y-4">
            <StateNotice isDark={isDark} title="Loading latest chart set">Fetching published charts and preparing the public chart cards.</StateNotice>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <div key={slot.chartType} className={glassPanel(isDark, 'h-[350px] animate-pulse')} />)}</div>
          </section>
        )}

        {!state.loading && state.error && (
          <StateNotice isDark={isDark} tone="red" title="Charts could not be loaded" action={<Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setReloadToken((value) => value + 1)}>Retry</Button>}>
            <p>{state.error}</p>
            <p className="mt-1">Refresh the chart list or try again later.</p>
          </StateNotice>
        )}

        {exportState.error && <StateNotice isDark={isDark} tone="amber" title="PDF export not ready">{exportState.error}</StateNotice>}

        {!state.loading && !state.error && !recentProjects.length && (
          <StateNotice isDark={isDark} title={query.trim() ? 'No charts match this search' : 'No published wave charts found'}>
            {query.trim() ? 'Clear the search to view recent published outputs.' : 'Published charts will appear here once Admin publishes approved outputs.'}
          </StateNotice>
        )}

        {!state.loading && !state.error && recentProjects.length > 0 && <>
          <section className="space-y-4">
            <div className={glassPanel(isDark, 'grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center')}>
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700"><CalendarDays size={15} /> Current chart set summary</p>
                <h2 className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{formatDate(activeDate)}</h2>
                <p className={`mt-2 max-w-2xl text-xs font-semibold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pdfStatusText}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CompletenessBadge completeness={completeness} isDark={isDark} />
                <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-600'}`}>{availableCount}/4 published charts available</div>
                <Button size="sm" variant="secondary" icon={Download} loading={exportState.loading || (!isPdfReady && !!availableCount)} disabled={!availableCount || exportState.loading || !isPdfReady} onClick={handleDownloadChartSetPdf}>{pdfButtonLabel}</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <ChartSlotCard key={`${activeDate}-${slot.chartType}`} slot={slot} chart={chartByType.get(slot.chartType)} activeStyle={activeChartType} isDark={isDark} onOpen={openChart} showStaffInfo={showStaffInfo} />)}</div>
          </section>
          <RecentHistory projects={recentProjects} selectedDate={activeDate} onSelectDate={setSelectedDate} isDark={isDark} />
        </>}
        <div className={glassPanel(isDark, 'flex flex-col gap-3 p-4 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between')}>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}><span className="font-black text-blue-700">Important Notice:</span> Wave forecast charts are guidance products. Always check official marine advisories and local conditions.</p>
          <p className={`tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Data: DOST-PAGASA - WaveLab - Published charts only</p>
        </div>
      </div>
    </main>
  );
}
