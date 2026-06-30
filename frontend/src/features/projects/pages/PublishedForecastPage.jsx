import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  MapPinned,
  Palette,
  Share2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { archiveProject } from '@/api/projectAPI';
import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import PublicPublishedChartPreviewMap from '@/dashboards/public/components/PublicPublishedChartPreviewMap';
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import usePublicMapBounds from '@/features/projects/hooks/usePublicMapBounds';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';
import {
  CHART_STYLE_MODES,
  getChartStyleMode,
  normalizeChartStyleMode,
} from '@/features/projects/utils/chartStyleModes';

const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';
const DETAIL_MAP_HEIGHT = 'clamp(360px, calc(100vh - 365px), 540px)';

function formatDate(value, options = {}) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PUBLIC_CHART_TIME_ZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}

function getPersonName(person, fallback = '—') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || person.email || fallback;
}

function getChartTypeLabel(value) {
  const labels = {
    analysis: 'Analysis',
    forecast_24h: '24-Hour Forecast',
    forecast_36h: '36-Hour Forecast',
    forecast_48h: '48-Hour Forecast',
  };
  return labels[value] || value || 'Wave Chart';
}

function getLatestReviewSummary(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];
  return [...logs]
    .reverse()
    .find((log) => ['approved', 'published', 'revision_requested', 'comment_added', 'rejected'].includes(log?.action));
}

function getExportFilename(project, extension) {
  const safeName = String(project?.name || 'published-chart')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'published-chart';
  return `${safeName}.${extension}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPdfMetadata(project, latestReviewSummary, chartStyleLabel, showStaffInfo = true) {
  return {
    title: project?.name || 'Published Wave Chart',
    description: project?.description || 'Final read-only published wave chart generated from WaveLab.',
    status: getProjectStatusLabel(project?.status),
    chartType: getChartTypeLabel(project?.chartType),
    chartStyle: chartStyleLabel || 'Wave & Wind',
    validDate: formatDate(project?.forecastDate),
    publishedAt: formatDateTime(project?.publishedAt),
    forecaster: showStaffInfo ? getPersonName(project?.owner, 'Forecaster') : '',
    approvedBy: showStaffInfo ? getPersonName(project?.approvedBy, '—') : '',
    remarks: latestReviewSummary?.comment || project?.reviewComment || 'No review remarks recorded.',
  };
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function writeLoadingPdfWindow(printWindow) {
  printWindow.document.write(`<!doctype html><html><head><title>Preparing PDF Export</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a}.card{max-width:420px;padding:28px;border:1px solid #dbeafe;border-radius:20px;background:white;box-shadow:0 20px 45px rgba(15,23,42,.08)}h1{margin:0 0 8px;font-size:22px}p{margin:0;color:#475569;font-weight:600;line-height:1.5}</style></head><body><div class="card"><h1>Preparing PDF export…</h1><p>Please wait while WaveLab prepares the published wave chart.</p></div></body></html>`);
  printWindow.document.close();
}

function writePdfErrorWindow(printWindow, message) {
  if (!printWindow || printWindow.closed) return;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><title>PDF Export Failed</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Arial,sans-serif;background:#fef2f2;color:#991b1b}.card{max-width:460px;padding:28px;border:1px solid #fecaca;border-radius:20px;background:white;box-shadow:0 20px 45px rgba(127,29,29,.1)}h1{margin:0 0 8px;font-size:22px}p{margin:0;color:#7f1d1d;font-weight:600;line-height:1.5}</style></head><body><div class="card"><h1>PDF export failed</h1><p>${escapeHtml(message)}</p></div></body></html>`);
  printWindow.document.close();
}

function writePdfPrintWindow({ printWindow, project, latestReviewSummary, imageDataUrl, chartStyleLabel, showStaffInfo = true }) {
  const metadata = getPdfMetadata(project, latestReviewSummary, chartStyleLabel, showStaffInfo);
  const footerHtml = showStaffInfo
    ? `<footer class="footer"><span><strong>Final Wave Chart</strong> · Forecaster: ${escapeHtml(metadata.forecaster)}</span><span>Approved by: ${escapeHtml(metadata.approvedBy)}</span></footer>`
    : '<footer class="footer"><span><strong>Final Wave Chart</strong> · DOST-PAGASA WaveLab</span><span>Published operational output</span></footer>';

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(metadata.title)} - Published Wave Chart</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 297mm; height: 210mm; background: #e2e8f0; }
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { width: 297mm; height: 210mm; margin: 0 auto; padding: 10mm; display: grid; grid-template-rows: auto auto 1fr auto; gap: 4mm; background: #fff; overflow: hidden; }
          .topbar { display: flex; align-items: center; justify-content: space-between; gap: 8mm; }
          .brand { color: #0369a1; font-size: 8pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
          .status { border: 1px solid #bbf7d0; background: #f0fdf4; color: #047857; border-radius: 999px; padding: 2mm 3.5mm; font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
          h1 { margin: 0; font-size: 18pt; line-height: 1.05; letter-spacing: -0.02em; }
          .description { margin: 1.5mm 0 0; color: #475569; font-size: 8.5pt; font-weight: 600; line-height: 1.35; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
          .meta-card { border: 1px solid #dbeafe; background: #f8fafc; border-radius: 3mm; padding: 2.5mm; }
          .meta-card dt { margin: 0 0 1mm; color: #64748b; font-size: 6.5pt; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          .meta-card dd { margin: 0; color: #0f172a; font-size: 8.5pt; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .map-card { border: 1px solid #bfdbfe; border-radius: 5mm; overflow: hidden; background: #f8fafc; min-height: 0; }
          .map-card img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
          .footer { display: flex; align-items: center; justify-content: space-between; gap: 5mm; color: #64748b; font-size: 7pt; font-weight: 800; }
          .footer strong { color: #0369a1; }
          @media print { html, body { width: 297mm; height: 210mm; overflow: hidden; background: #fff; } }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="topbar"><div class="brand">DOST-PAGASA · WaveLab</div><div class="status">${escapeHtml(metadata.status)}</div></section>
          <header><h1>${escapeHtml(metadata.title)}</h1><p class="description">${escapeHtml(metadata.description)}</p></header>
          <dl class="meta-grid"><div class="meta-card"><dt>Valid Date</dt><dd>${escapeHtml(metadata.validDate)}</dd></div><div class="meta-card"><dt>Chart Type</dt><dd>${escapeHtml(metadata.chartType)}</dd></div><div class="meta-card"><dt>Style</dt><dd>${escapeHtml(metadata.chartStyle)}</dd></div><div class="meta-card"><dt>Published</dt><dd>${escapeHtml(metadata.publishedAt)}</dd></div></dl>
          <section class="map-card"><img src="${imageDataUrl}" alt="${escapeHtml(metadata.title)} published wave chart export" /></section>
          ${footerHtml}
        </main>
        <script>window.onload = () => { window.focus(); window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function glassPanelClass(isDarkMode, extra = '') {
  return `rounded-[1.75rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl ${isDarkMode ? 'border-white/10 bg-slate-900/72 shadow-cyan-950/20' : 'border-white/70 bg-white/78 shadow-blue-100/70'} ${extra}`;
}

function StatusPill({ children, isDarkMode, tone = 'blue' }) {
  const tones = {
    blue: isDarkMode ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-blue-200 bg-blue-50 text-blue-700',
    green: isDarkMode ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: isDarkMode ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/70 text-slate-700',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${tones[tone] || tones.blue}`}>{children}</span>;
}

function MetaItem({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-500/10 text-blue-700'}`}><Icon size={15} /></span>
      <span className="min-w-0">
        <span className={`block text-[10px] font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <span className={`block truncate text-xs font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>{value}</span>
      </span>
    </div>
  );
}

function ChartStyleSelector({ activeStyleMode, onChange, isDarkMode }) {
  return (
    <article className={glassPanelClass(isDarkMode, 'p-4')}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200 ring-cyan-300/15' : 'bg-blue-500/10 text-blue-700 ring-blue-300/40'}`}>
          <Palette size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-black">Viewing style</h2>
          <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Switch chart presentation without changing the published output.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
        {CHART_STYLE_MODES.map((mode) => {
          const active = mode.id === activeStyleMode;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(mode.id)}
              className={`rounded-2xl border px-3 py-2.5 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                active
                  ? isDarkMode ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-50 shadow-lg shadow-cyan-950/20' : 'border-blue-300 bg-blue-50/90 text-blue-950 shadow-sm'
                  : isDarkMode ? 'border-white/10 bg-slate-950/45 text-slate-300 hover:border-cyan-300/25 hover:bg-cyan-300/5' : 'border-slate-200/80 bg-white/55 text-slate-700 hover:border-blue-200 hover:bg-white'
              }`}
            >
              <span className="flex items-center justify-between gap-3 text-sm font-black">
                {mode.label}
                {active && <CheckCircle2 size={15} aria-hidden="true" />}
              </span>
              <span className={`mt-1 line-clamp-2 block text-[11px] font-semibold leading-relaxed ${active ? '' : isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{mode.description}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function LiquidBackdrop({ isDarkMode }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full blur-3xl ${isDarkMode ? 'bg-cyan-500/10' : 'bg-blue-300/25'}`} />
      <div className={`absolute right-[-120px] top-32 h-[460px] w-[460px] rounded-full blur-3xl ${isDarkMode ? 'bg-blue-700/10' : 'bg-cyan-200/30'}`} />
      <div className={`absolute bottom-[-180px] left-1/3 h-[520px] w-[520px] rounded-full blur-3xl ${isDarkMode ? 'bg-sky-400/5' : 'bg-indigo-200/20'}`} />
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08)_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08)_1px,_transparent_1px)]'} bg-[size:28px_28px] opacity-60`} />
    </div>
  );
}

export default function PublishedForecastPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { activeChartType, setActiveChartType } = useChartType();
  const { label: mapBoundsLabel, settings: publicSettings } = usePublicMapBounds();
  const exportMapRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [copied, setCopied] = useState(false);
  const [archiveState, setArchiveState] = useState({ loading: false, error: '' });
  const [exportState, setExportState] = useState({ loading: '', error: '' });

  const activeStyleMode = normalizeChartStyleMode(activeChartType);
  const activeStyle = getChartStyleMode(activeStyleMode);
  const showStaffInfo = publicSettings.showPublicStaffInfo !== false;

  useEffect(() => {
    const controller = new AbortController();

    async function loadChart() {
      setState({ loading: true, error: '', data: null });
      try {
        const data = await fetchPublicPublishedChartOutput(projectId, { signal: controller.signal, theme: isDarkMode ? 'dark' : 'light' });
        setState({ loading: false, error: '', data });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error?.message || 'Failed to load published chart.', data: null });
      }
    }

    loadChart();
    return () => controller.abort();
  }, [isDarkMode, projectId]);

  const project = state.data?.project;
  const featureCollection = state.data?.featureCollection;
  const raster = state.data?.raster;
  const canArchive = Boolean(state.data?.canArchive);
  const latestReviewSummary = useMemo(() => getLatestReviewSummary(project), [project]);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageClass = isDarkMode ? 'relative min-h-screen overflow-hidden bg-slate-950 text-slate-100' : 'relative min-h-screen overflow-hidden bg-slate-50 text-slate-950';

  const getExportMapDataUrl = () => {
    const mapDataUrl = exportMapRef.current?.getDataUrl();
    if (!mapDataUrl) throw new Error('Map is still preparing for export. Please try again in a moment.');
    return mapDataUrl;
  };

  const handleExportImage = async () => {
    setExportState({ loading: 'image', error: '' });
    try {
      downloadDataUrl(getExportMapDataUrl(), getExportFilename(project, 'png'));
      setExportState({ loading: '', error: '' });
    } catch (error) {
      setExportState({ loading: '', error: error?.message || 'Failed to export image.' });
    }
  };

  const handleDownloadPdf = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setExportState({ loading: '', error: 'Pop-up was blocked. Please allow pop-ups to export PDF.' });
      return;
    }

    writeLoadingPdfWindow(printWindow);
    setExportState({ loading: 'pdf', error: '' });

    try {
      writePdfPrintWindow({ printWindow, project, latestReviewSummary, imageDataUrl: getExportMapDataUrl(), chartStyleLabel: activeStyle.label, showStaffInfo });
      setExportState({ loading: '', error: '' });
    } catch (error) {
      const message = error?.message || 'Failed to export PDF.';
      writePdfErrorWindow(printWindow, message);
      setExportState({ loading: '', error: message });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleArchive = async () => {
    if (!project?._id) return;
    const confirmed = window.confirm('Archive this published chart? It will be removed from active published outputs.');
    if (!confirmed) return;

    setArchiveState({ loading: true, error: '' });
    try {
      await archiveProject(project._id);
      navigate('/dashboard?tab=charts', { replace: true });
    } catch (error) {
      setArchiveState({ loading: false, error: error?.message || 'Failed to archive chart.' });
    }
  };

  if (state.loading) {
    return (
      <main className={pageClass}>
        <LiquidBackdrop isDarkMode={isDarkMode} />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className={glassPanelClass(isDarkMode, 'max-w-md p-8 text-center')}>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-500">Loading chart output</p>
            <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Preparing the read-only published chart…</p>
          </div>
        </div>
      </main>
    );
  }

  if (state.error || !project) {
    return (
      <main className={pageClass}>
        <LiquidBackdrop isDarkMode={isDarkMode} />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className={glassPanelClass(isDarkMode, 'p-8 text-center')}>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-500">Chart unavailable</p>
            <h1 className="mt-3 text-2xl font-black">Published chart cannot be opened</h1>
            <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{state.error || 'This published chart may have been archived or is no longer available.'}</p>
            <div className="mt-6 flex justify-center"><Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/charts')}>View charts</Button></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <LiquidBackdrop isDarkMode={isDarkMode} />
      <PublishedForecastExportMap ref={exportMapRef} features={featureCollection} chartStyleMode={activeStyleMode} raster={raster} />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-76px)] max-w-[1600px] grid-rows-[auto_1fr] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <section className={glassPanelClass(isDarkMode, 'overflow-hidden px-4 py-3 sm:px-5')}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => navigate('/charts')} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] transition ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-300 hover:text-white' : 'border-slate-200 bg-white/70 text-slate-500 hover:text-slate-900'}`}>
                  <ArrowLeft size={13} aria-hidden="true" /> Charts
                </button>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${getProjectStatusStyle(project.status)}`}>{getProjectStatusLabel(project.status)}</span>
                <StatusPill isDarkMode={isDarkMode} tone="green"><ShieldCheck size={13} /> Final output</StatusPill>
                <StatusPill isDarkMode={isDarkMode}>{activeStyle.label}</StatusPill>
                <StatusPill isDarkMode={isDarkMode} tone="slate">{mapBoundsLabel}</StatusPill>
              </div>
              <h1 className="mt-3 max-w-5xl truncate text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">{project.name}</h1>
              <p className={`mt-1 max-w-4xl truncate text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{project.description || 'Final read-only published wave chart for viewing, sharing, downloading, and archiving.'}</p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              <Button variant="secondary" size="sm" icon={Clipboard} onClick={handleCopyLink}>{copied ? 'Copied' : 'Copy'}</Button>
              <Button variant="secondary" size="sm" icon={Download} loading={exportState.loading === 'pdf'} disabled={Boolean(exportState.loading)} onClick={handleDownloadPdf}>PDF</Button>
              <Button variant="secondary" size="sm" icon={Share2} loading={exportState.loading === 'image'} disabled={Boolean(exportState.loading)} onClick={handleExportImage}>Image</Button>
              {canArchive && <Button variant="danger" size="sm" icon={Archive} loading={archiveState.loading} onClick={handleArchive}>Archive</Button>}
            </div>
          </div>
        </section>

        {(archiveState.error || exportState.error) && <div className="rounded-2xl border border-red-200 bg-red-50/90 p-3 text-sm font-bold text-red-700 backdrop-blur-xl">{archiveState.error || exportState.error}</div>}

        <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className={glassPanelClass(isDarkMode, 'min-h-0 overflow-hidden p-3 sm:p-4')}>
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-500/10 text-blue-700'}`}><MapPinned size={19} /></span>
                <div>
                  <p className="text-base font-black">Final wave chart</p>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Read-only, configured-bounds public output.</p>
                </div>
              </div>
              <div className={`grid gap-2 sm:grid-cols-2 ${showStaffInfo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                <MetaItem icon={CalendarDays} label="Valid" value={formatDate(project.forecastDate)} isDarkMode={isDarkMode} />
                <MetaItem icon={FileText} label="Type" value={getChartTypeLabel(project.chartType)} isDarkMode={isDarkMode} />
                <MetaItem icon={CheckCircle2} label="Published" value={formatDateTime(project.publishedAt)} isDarkMode={isDarkMode} />
                {showStaffInfo && <MetaItem icon={UserRound} label="Forecaster" value={getPersonName(project.owner, 'Forecaster')} isDarkMode={isDarkMode} />}
              </div>
            </div>
            <div className={`overflow-hidden rounded-[1.5rem] ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-blue-100'}`}>
              <PublicPublishedChartPreviewMap projectId={project._id} initialRaster={raster} height={DETAIL_MAP_HEIGHT} isDarkMode={isDarkMode} className="rounded-none border-0" />
            </div>
          </article>

          <aside className="min-h-0 space-y-3 xl:self-start">
            <ChartStyleSelector activeStyleMode={activeStyleMode} onChange={setActiveChartType} isDarkMode={isDarkMode} />

            <article className={glassPanelClass(isDarkMode, 'p-4')}>
              <h2 className="text-sm font-black">Review summary</h2>
              <div className="mt-3 grid gap-3 text-sm">
                {showStaffInfo && <div><p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Approved by</p><p className="mt-1 font-bold">{getPersonName(project.approvedBy, '—')}</p></div>}
                <div><p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last action</p><p className="mt-1 font-bold capitalize">{latestReviewSummary?.action?.replaceAll('_', ' ') || '—'}</p></div>
                <div className={`rounded-2xl border p-3 text-xs font-semibold leading-relaxed ${isDarkMode ? 'border-white/10 bg-slate-950/70 text-slate-300' : 'border-slate-200 bg-white/65 text-slate-700'}`}>{latestReviewSummary?.comment || project.reviewComment || 'No review remarks recorded.'}</div>
              </div>
            </article>

            <article className={glassPanelClass(isDarkMode, 'p-4')}>
              <h2 className="text-sm font-black">Output link</h2>
              <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Share this public link with anyone who needs to view this chart.</p>
              <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-white/70'}`}>
                <span className="min-w-0 flex-1 truncate text-xs font-mono">{shareUrl}</span>
                <ExternalLink size={14} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} aria-hidden="true" />
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
