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
  Share2,
  UserRound,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { archiveProject } from '@/api/projectAPI';
import { fetchPublishedForecastOutput } from '@/api/publishedForecastAPI';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';
import { useTheme } from '@/app/providers/ThemeProvider';

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
  return formatDate(value, {
    hour: 'numeric',
    minute: '2-digit',
  });
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

  return labels[value] || value || 'Forecast';
}

function getLatestReviewSummary(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];
  return [...logs]
    .reverse()
    .find((log) => ['approved', 'published', 'revision_requested', 'comment_added', 'rejected'].includes(log?.action));
}

function getExportFilename(project, extension) {
  const safeName = String(project?.name || 'published-forecast')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'published-forecast';
  return `${safeName}.${extension}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to prepare map image for export.'));
    image.src = src;
  });
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? '…' : '';
    ctx.fillText(`${line}${suffix}`, x, y + index * lineHeight);
  });

  return y + Math.min(lines.length, maxLines) * lineHeight;
}

function getExportMetadata(project, latestReviewSummary) {
  return {
    title: project?.name || 'Published Forecast',
    subtitle: project?.description || 'A finalized, read-only published forecast chart.',
    status: getProjectStatusLabel(project?.status),
    forecastDate: formatDate(project?.forecastDate),
    chartType: getChartTypeLabel(project?.chartType),
    publishedAt: formatDateTime(project?.publishedAt),
    forecaster: getPersonName(project?.owner, 'Forecaster'),
    approvedBy: getPersonName(project?.approvedBy, '—'),
    reviewAction: latestReviewSummary?.action?.replaceAll('_', ' ') || '—',
    remarks: latestReviewSummary?.comment || project?.reviewComment || 'No review remarks recorded.',
  };
}

async function composeForecastExportImage({ project, latestReviewSummary, mapDataUrl }) {
  const metadata = getExportMetadata(project, latestReviewSummary);
  const mapImage = await loadImage(mapDataUrl);
  const canvas = document.createElement('canvas');
  const width = 1600;
  const height = 1280;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 52px Arial, sans-serif';
  ctx.fillText(metadata.title, 72, 104);

  ctx.fillStyle = '#475569';
  ctx.font = '600 22px Arial, sans-serif';
  drawWrappedText(ctx, metadata.subtitle, 72, 146, 980, 30, 2);

  ctx.fillStyle = '#0369a1';
  ctx.font = '800 20px Arial, sans-serif';
  ctx.fillText('FINAL FORECAST OUTPUT', 72, 224);

  const cardY = 258;
  const cardWidth = 344;
  const cardHeight = 94;
  const gap = 24;
  const cards = [
    ['FORECAST DATE', metadata.forecastDate],
    ['CHART TYPE', metadata.chartType],
    ['PUBLISHED', metadata.publishedAt],
    ['FORECASTER', metadata.forecaster],
  ];

  cards.forEach(([label, value], index) => {
    const x = 72 + index * (cardWidth + gap);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, cardY, cardWidth, cardHeight, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 16px Arial, sans-serif';
    ctx.fillText(label, x + 28, cardY + 34);
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px Arial, sans-serif';
    drawWrappedText(ctx, value, x + 28, cardY + 66, cardWidth - 56, 26, 1);
  });

  const mapX = 72;
  const mapY = 402;
  const mapW = 1456;
  const mapH = 650;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 28);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mapX + 24, mapY + 24, mapW - 48, mapH - 48, 20);
  ctx.clip();
  ctx.drawImage(mapImage, mapX + 24, mapY + 24, mapW - 48, mapH - 48);
  ctx.restore();

  const summaryY = 1094;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(72, summaryY, 1456, 124, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 24px Arial, sans-serif';
  ctx.fillText('Review summary', 104, summaryY + 42);

  ctx.fillStyle = '#475569';
  ctx.font = '700 18px Arial, sans-serif';
  ctx.fillText(`Approved by: ${metadata.approvedBy}`, 104, summaryY + 78);
  ctx.fillText(`Last action: ${metadata.reviewAction}`, 520, summaryY + 78);
  ctx.fillText(`Remarks: ${metadata.remarks}`, 104, summaryY + 108);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 15px Arial, sans-serif';
  ctx.fillText('Generated from WaveLab published forecast output', 72, 1252);

  return canvas.toDataURL('image/png');
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openPdfPrintWindow({ project, latestReviewSummary, imageDataUrl }) {
  const metadata = getExportMetadata(project, latestReviewSummary);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) throw new Error('Pop-up was blocked. Please allow pop-ups to export PDF.');

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${metadata.title} - Published Forecast</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
          .page { padding: 24px; }
          h1 { margin: 0; font-size: 28px; line-height: 1.1; }
          .subtitle { margin: 8px 0 18px; color: #475569; font-weight: 600; }
          .badge { display: inline-block; margin-bottom: 10px; padding: 6px 10px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
          .stat { border: 1px solid #dbeafe; border-radius: 14px; background: white; padding: 12px; }
          .label { color: #94a3b8; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
          .value { margin-top: 5px; font-weight: 800; font-size: 13px; }
          img { width: 100%; border-radius: 18px; border: 1px solid #cbd5e1; display: block; }
          .summary { margin-top: 14px; border: 1px solid #dbeafe; border-radius: 16px; background: white; padding: 14px; }
          .summary h2 { margin: 0 0 8px; font-size: 16px; }
          .summary p { margin: 4px 0; font-size: 12px; font-weight: 600; color: #334155; }
          .actions { margin-top: 12px; font-size: 11px; color: #64748b; }
          @media print { .no-print { display: none; } body { background: white; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="badge">${metadata.status} · Final Forecast Output</div>
          <h1>${metadata.title}</h1>
          <p class="subtitle">${metadata.subtitle}</p>
          <section class="stats">
            <div class="stat"><div class="label">Forecast Date</div><div class="value">${metadata.forecastDate}</div></div>
            <div class="stat"><div class="label">Chart Type</div><div class="value">${metadata.chartType}</div></div>
            <div class="stat"><div class="label">Published</div><div class="value">${metadata.publishedAt}</div></div>
            <div class="stat"><div class="label">Forecaster</div><div class="value">${metadata.forecaster}</div></div>
          </section>
          <img src="${imageDataUrl}" alt="Published forecast chart" />
          <section class="summary">
            <h2>Review summary</h2>
            <p><strong>Approved by:</strong> ${metadata.approvedBy}</p>
            <p><strong>Last review action:</strong> ${metadata.reviewAction}</p>
            <p><strong>Remarks:</strong> ${metadata.remarks}</p>
          </section>
          <p class="actions no-print">Use your browser print dialog to save this output as PDF.</p>
        </div>
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

function OutputActionNotice({ isDarkMode }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm font-semibold leading-relaxed ${isDarkMode ? 'border-blue-400/20 bg-blue-400/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
      Export uses the final read-only forecast snapshot shown on this page.
    </div>
  );
}

export default function PublishedForecastPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const exportMapRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [copied, setCopied] = useState(false);
  const [archiveState, setArchiveState] = useState({ loading: false, error: '' });
  const [exportState, setExportState] = useState({ loading: '', error: '' });

  useEffect(() => {
    const controller = new AbortController();

    async function loadForecast() {
      setState({ loading: true, error: '', data: null });

      try {
        const data = await fetchPublishedForecastOutput(projectId, { signal: controller.signal });
        setState({ loading: false, error: '', data });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error?.message || 'Failed to load published forecast.', data: null });
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

  const createExportImage = async () => {
    const mapDataUrl = exportMapRef.current?.getDataUrl();
    if (!mapDataUrl) throw new Error('Map is still preparing for export. Please try again in a moment.');

    return composeForecastExportImage({ project, latestReviewSummary, mapDataUrl });
  };

  const handleExportImage = async () => {
    setExportState({ loading: 'image', error: '' });

    try {
      const imageDataUrl = await createExportImage();
      downloadDataUrl(imageDataUrl, getExportFilename(project, 'png'));
      setExportState({ loading: '', error: '' });
    } catch (error) {
      setExportState({ loading: '', error: error?.message || 'Failed to export image.' });
    }
  };

  const handleDownloadPdf = async () => {
    setExportState({ loading: 'pdf', error: '' });

    try {
      const imageDataUrl = await createExportImage();
      openPdfPrintWindow({ project, latestReviewSummary, imageDataUrl });
      setExportState({ loading: '', error: '' });
    } catch (error) {
      setExportState({ loading: '', error: error?.message || 'Failed to export PDF.' });
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
    const confirmed = window.confirm('Archive this published forecast? It will be removed from active published outputs.');
    if (!confirmed) return;

    setArchiveState({ loading: true, error: '' });

    try {
      await archiveProject(project._id);
      navigate('/dashboard?tab=charts', { replace: true });
    } catch (error) {
      setArchiveState({ loading: false, error: error?.message || 'Failed to archive forecast.' });
    }
  };

  const pageClass = isDarkMode
    ? 'min-h-screen bg-slate-950 text-slate-100'
    : 'min-h-screen bg-slate-50 text-slate-950';

  if (state.loading) {
    return (
      <main className={pageClass}>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className={`rounded-3xl border p-8 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-500">Loading forecast output</p>
            <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Preparing the read-only published forecast…</p>
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
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-500">Forecast unavailable</p>
            <h1 className="mt-3 text-2xl font-black">Published output cannot be opened</h1>
            <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {state.error || 'This project may not be published yet, or you may not have access to view it.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Go back</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <PublishedForecastExportMap ref={exportMapRef} features={featureCollection} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`mb-4 inline-flex items-center gap-2 text-sm font-black transition ${isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${getProjectStatusStyle(project.status)}`}>
                {getProjectStatusLabel(project.status)}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${isDarkMode ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                Final Forecast Output
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{project.name}</h1>
            <p className={`mt-2 max-w-3xl text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {project.description || 'A finalized, read-only published forecast chart for viewing, sharing, downloading, and archiving.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Clipboard} onClick={handleCopyLink}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button variant="secondary" icon={Download} loading={exportState.loading === 'pdf'} disabled={Boolean(exportState.loading)} onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button variant="secondary" icon={Share2} loading={exportState.loading === 'image'} disabled={Boolean(exportState.loading)} onClick={handleExportImage}>
              Export Image
            </Button>
            {canArchive && (
              <Button variant="danger" icon={Archive} loading={archiveState.loading} onClick={handleArchive}>
                Archive
              </Button>
            )}
          </div>
        </div>

        {(archiveState.error || exportState.error) && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {archiveState.error || exportState.error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarDays} label="Forecast Date" value={formatDate(project.forecastDate)} isDarkMode={isDarkMode} />
          <StatCard icon={FileText} label="Chart Type" value={getChartTypeLabel(project.chartType)} isDarkMode={isDarkMode} />
          <StatCard icon={CheckCircle2} label="Published" value={formatDateTime(project.publishedAt)} isDarkMode={isDarkMode} />
          <StatCard icon={UserRound} label="Forecaster" value={getPersonName(project.owner, 'Forecaster')} isDarkMode={isDarkMode} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className={`overflow-hidden rounded-3xl border shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div>
                <p className="text-sm font-black">Final forecast chart</p>
                <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Read-only map output from the published project snapshot.</p>
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
                emptyLabel="No published annotations available"
              />
            </div>
          </article>

          <aside className="space-y-4">
            <OutputActionNotice isDarkMode={isDarkMode} />

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
                Share this link with authenticated WaveLab users who have access to this forecast.
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
