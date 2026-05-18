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
  UserRound,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { archiveProject } from '@/api/projectAPI';
import { fetchPublicPublishedForecastOutput } from '@/api/publishedForecastAPI';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';
import {
  CHART_STYLE_MODES,
  getChartStyleMode,
  normalizeChartStyleMode,
} from '@/features/projects/utils/chartStyleModes';

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
    forecast_24h: '24-Hour Chart',
    forecast_36h: '36-Hour Chart',
    forecast_48h: '48-Hour Chart',
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

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function writeLoadingPdfWindow(printWindow) {
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Preparing PDF Export</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
          .card { max-width: 420px; padding: 28px; border: 1px solid #dbeafe; border-radius: 20px; background: white; box-shadow: 0 20px 45px rgba(15, 23, 42, .08); }
          h1 { margin: 0 0 8px; font-size: 22px; }
          p { margin: 0; color: #475569; font-weight: 600; line-height: 1.5; }
        </style>
      </head>
      <body><div class="card"><h1>Preparing PDF export…</h1><p>Please wait while WaveLab prepares the published wave chart.</p></div></body>
    </html>
  `);
  printWindow.document.close();
}

function writePdfErrorWindow(printWindow, message) {
  if (!printWindow || printWindow.closed) return;
  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>PDF Export Failed</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #fef2f2; color: #991b1b; }
          .card { max-width: 460px; padding: 28px; border: 1px solid #fecaca; border-radius: 20px; background: white; box-shadow: 0 20px 45px rgba(127, 29, 29, .10); }
          h1 { margin: 0 0 8px; font-size: 22px; }
          p { margin: 0; color: #7f1d1d; font-weight: 600; line-height: 1.5; }
        </style>
      </head>
      <body><div class="card"><h1>PDF export failed</h1><p>${escapeHtml(message)}</p></div></body>
    </html>
  `);
  printWindow.document.close();
}

function writePdfPrintWindow({ printWindow, project, imageDataUrl, chartStyleLabel }) {
  const title = project?.name || 'Published Wave Chart';

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)} - Published Wave Chart</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
          .page { width: 100%; min-height: 273mm; display: flex; flex-direction: column; gap: 10mm; }
          h1 { margin: 0; font-size: 22pt; line-height: 1.1; }
          .meta { margin-top: 3mm; display: flex; gap: 4mm; flex-wrap: wrap; color: #475569; font-size: 9pt; font-weight: 700; }
          .map { width: 100%; border: 1px solid #dbeafe; border-radius: 10px; overflow: hidden; }
          .map img { display: block; width: 100%; height: auto; }
          .footer { margin-top: auto; color: #64748b; font-size: 8pt; font-weight: 700; }
        </style>
      </head>
      <body>
        <main class="page">
          <header>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">
              <span>Final Wave Chart</span>
              <span>${escapeHtml(chartStyleLabel)}</span>
              <span>${escapeHtml(formatDate(project?.forecastDate))}</span>
            </div>
          </header>
          <section class="map"><img src="${imageDataUrl}" alt="${escapeHtml(title)} published wave chart export" /></section>
          <div class="footer">Generated from WaveLab published wave chart</div>
        </main>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function StatCard({ icon: Icon, label, value, isDarkMode }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-blue-50 text-blue-700'}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className={`block text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
          <span className={`mt-1 block truncate text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-950'}`}>{value}</span>
        </span>
      </div>
    </article>
  );
}

function ChartStyleSelector({ activeStyleMode, onChange, isDarkMode }) {
  return (
    <article className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-blue-50 text-blue-700'}`}>
          <Palette size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-black">Chart style</h2>
          <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Change the public viewing style without modifying the published chart.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {CHART_STYLE_MODES.map((mode) => {
          const active = mode.id === activeStyleMode;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(mode.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? isDarkMode ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-900'
                  : isDarkMode ? 'border-white/10 bg-slate-950 text-slate-300 hover:border-white/20' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-black">{mode.label}</span>
              <span className={`mt-1 block text-xs font-semibold leading-relaxed ${active ? '' : isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function OutputActionNotice({ isDarkMode, chartStyleLabel }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm font-semibold leading-relaxed ${isDarkMode ? 'border-blue-400/20 bg-blue-400/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
      Export uses the final read-only chart snapshot shown on this page using the current <strong>{chartStyleLabel}</strong> style.
    </div>
  );
}

export default function PublishedForecastPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { activeChartType, setActiveChartType } = useChartType();
  const exportMapRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [copied, setCopied] = useState(false);
  const [archiveState, setArchiveState] = useState({ loading: false, error: '' });
  const [exportState, setExportState] = useState({ loading: '', error: '' });

  const activeStyleMode = normalizeChartStyleMode(activeChartType);
  const activeStyle = getChartStyleMode(activeStyleMode);

  useEffect(() => {
    const controller = new AbortController();

    async function loadForecast() {
      setState({ loading: true, error: '', data: null });
      try {
        const data = await fetchPublicPublishedForecastOutput(projectId, { signal: controller.signal });
        setState({ loading: false, error: '', data });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error?.message || 'Failed to load published chart.', data: null });
      }
    }

    loadForecast();
    return () => controller.abort();
  }, [projectId]);

  const project = state.data?.project;
  const featureCollection = state.data?.featureCollection;
  const canArchive = Boolean(state.data?.canArchive);
  const latestReviewSummary = useMemo(() => getLatestReviewSummary(project), [project]);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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
      writePdfPrintWindow({
        printWindow,
        project,
        imageDataUrl: getExportMapDataUrl(),
        chartStyleLabel: activeStyle.label,
      });
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

  const pageClass = isDarkMode ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-950';

  if (state.loading) {
    return (
      <main className={pageClass}>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className={`rounded-3xl border p-8 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
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
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className={`rounded-3xl border p-8 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-500">Chart unavailable</p>
            <h1 className="mt-3 text-2xl font-black">Published chart cannot be opened</h1>
            <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {state.error || 'This published chart may have been archived or is no longer available.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/charts')}>View charts</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <PublishedForecastExportMap ref={exportMapRef} features={featureCollection} chartStyleMode={activeStyleMode} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/charts')}
              className={`mb-4 inline-flex items-center gap-2 text-sm font-black transition ${isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Wave Charts
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${getProjectStatusStyle(project.status)}`}>
                {getProjectStatusLabel(project.status)}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDarkMode ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                Final Wave Chart
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDarkMode ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {activeStyle.label}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{project.name}</h1>
            <p className={`mt-2 max-w-3xl text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {project.description || 'A finalized, read-only published wave chart for viewing, sharing, downloading, and archiving.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Clipboard} onClick={handleCopyLink}>{copied ? 'Copied' : 'Copy link'}</Button>
            <Button variant="secondary" icon={Download} loading={exportState.loading === 'pdf'} disabled={Boolean(exportState.loading)} onClick={handleDownloadPdf}>Download PDF</Button>
            <Button variant="secondary" icon={Share2} loading={exportState.loading === 'image'} disabled={Boolean(exportState.loading)} onClick={handleExportImage}>Export Image</Button>
            {canArchive && <Button variant="danger" icon={Archive} loading={archiveState.loading} onClick={handleArchive}>Archive</Button>}
          </div>
        </div>

        {(archiveState.error || exportState.error) && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {archiveState.error || exportState.error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarDays} label="Valid Date" value={formatDate(project.forecastDate)} isDarkMode={isDarkMode} />
          <StatCard icon={FileText} label="Chart Type" value={getChartTypeLabel(project.chartType)} isDarkMode={isDarkMode} />
          <StatCard icon={CheckCircle2} label="Published" value={formatDateTime(project.publishedAt)} isDarkMode={isDarkMode} />
          <StatCard icon={UserRound} label="Forecaster" value={getPersonName(project.owner, 'Forecaster')} isDarkMode={isDarkMode} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className={`overflow-hidden rounded-3xl border shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div>
                <p className="text-sm font-black">Final wave chart</p>
                <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Read-only map output using {activeStyle.label} style.</p>
              </div>
              <MapPinned size={20} className={isDarkMode ? 'text-cyan-300' : 'text-blue-700'} aria-hidden="true" />
            </div>

            <div className="p-4 sm:p-5">
              <ProjectPreviewMap
                projectId={project._id}
                features={featureCollection}
                featureScope="admin"
                height={560}
                isDarkMode={isDarkMode}
                lazy={false}
                showLabels
                chartStyleMode={activeStyleMode}
                emptyLabel="No published annotations available"
              />
            </div>
          </article>

          <aside className="space-y-4">
            <ChartStyleSelector activeStyleMode={activeStyleMode} onChange={setActiveChartType} isDarkMode={isDarkMode} />
            <OutputActionNotice isDarkMode={isDarkMode} chartStyleLabel={activeStyle.label} />

            <article className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
              <h2 className="text-sm font-black">Review summary</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Approved by</dt>
                  <dd className="mt-1 font-bold">{getPersonName(project.approvedBy, '—')}</dd>
                </div>
                <div>
                  <dt className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last review action</dt>
                  <dd className="mt-1 font-bold capitalize">{latestReviewSummary?.action?.replaceAll('_', ' ') || '—'}</dd>
                </div>
                <div>
                  <dt className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Remarks</dt>
                  <dd className={`mt-1 rounded-2xl p-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                    {latestReviewSummary?.comment || project.reviewComment || 'No review remarks recorded.'}
                  </dd>
                </div>
              </dl>
            </article>

            <article className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
              <h2 className="text-sm font-black">Output link</h2>
              <p className={`mt-2 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Share this public link with anyone who needs to view this published chart.
              </p>
              <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
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
