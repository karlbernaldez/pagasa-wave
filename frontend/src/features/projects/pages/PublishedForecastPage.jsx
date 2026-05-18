import { useEffect, useMemo, useState } from 'react';
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
  Layers,
  MapPinned,
  PencilLine,
  Share2,
  UserRound,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { archiveProject } from '@/api/projectAPI';
import { fetchPublishedForecastOutput } from '@/api/publishedForecastAPI';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { getProjectStatusLabel, getProjectStatusStyle } from '@/features/projects/projectStatuses';
import { useTheme } from '@/app/providers/ThemeProvider';

const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';
const MRI3_TIMESTEP = '012';
const DEFAULT_FORECAST_MODEL = 'WW3';
const DEFAULT_FORECAST_DATE = '2026011200';
const FORECAST_OVERLAY_BOUNDS = [100, -5, 180, 50];

const OUTPUT_VIEW_MODES = {
  ANNOTATIONS: 'annotations',
  FORECAST_OVERLAY: 'forecast_overlay',
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

function getForecastOverlayModel(project) {
  return String(
    project?.forecastModel ||
    project?.waveModel ||
    project?.model ||
    project?.metadata?.forecastModel ||
    DEFAULT_FORECAST_MODEL
  ).trim().toUpperCase();
}

function getForecastOverlayTheme(isDarkMode) {
  return isDarkMode ? 'dark' : 'light';
}

function getForecastOverlayDate(project) {
  return String(
    project?.forecastRun ||
    project?.forecastRunDate ||
    project?.tilesetDate ||
    project?.metadata?.forecastRun ||
    DEFAULT_FORECAST_DATE
  );
}

function buildForecastTileUrl({ project, isDarkMode }) {
  const model = getForecastOverlayModel(project);
  const theme = getForecastOverlayTheme(isDarkMode);
  const date = getForecastOverlayDate(project);
  const base = `${WAVE_BUCKET_BASE}/${model}/${theme}/${date}`;

  return model === 'MRI3'
    ? `${base}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`
    : `${base}/{z}/{x}/{y}.png`;
}

function buildForecastOverlayConfig({ project, isDarkMode, enabled }) {
  if (!enabled || !project) return null;

  return {
    tileUrl: buildForecastTileUrl({ project, isDarkMode }),
    opacity: 0.82,
    tileSize: 256,
    scheme: 'xyz',
    bounds: FORECAST_OVERLAY_BOUNDS,
  };
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

function OutputModeToggle({ mode, onChange, isDarkMode }) {
  const buttonBase = 'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition sm:flex-none';

  const getButtonClass = (value) => {
    if (mode === value) return 'bg-blue-600 text-white shadow-sm';
    return isDarkMode
      ? 'text-slate-300 hover:bg-white/5'
      : 'text-slate-600 hover:bg-slate-100';
  };

  return (
    <div className={`grid grid-cols-2 rounded-2xl border p-1 ${isDarkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
      <button
        type="button"
        className={`${buttonBase} ${getButtonClass(OUTPUT_VIEW_MODES.ANNOTATIONS)}`}
        onClick={() => onChange(OUTPUT_VIEW_MODES.ANNOTATIONS)}
        aria-pressed={mode === OUTPUT_VIEW_MODES.ANNOTATIONS}
      >
        <PencilLine size={14} aria-hidden="true" />
        Annotations only
      </button>
      <button
        type="button"
        className={`${buttonBase} ${getButtonClass(OUTPUT_VIEW_MODES.FORECAST_OVERLAY)}`}
        onClick={() => onChange(OUTPUT_VIEW_MODES.FORECAST_OVERLAY)}
        aria-pressed={mode === OUTPUT_VIEW_MODES.FORECAST_OVERLAY}
      >
        <Layers size={14} aria-hidden="true" />
        Forecast overlay
      </button>
    </div>
  );
}

function OutputActionNotice({ isDarkMode }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm font-semibold leading-relaxed ${isDarkMode ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      PDF and image export will be added in the next publishing slice. The selected output mode should be used for export.
    </div>
  );
}

export default function PublishedForecastPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [copied, setCopied] = useState(false);
  const [archiveState, setArchiveState] = useState({ loading: false, error: '' });
  const [outputMode, setOutputMode] = useState(OUTPUT_VIEW_MODES.FORECAST_OVERLAY);

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
  const showForecastOverlay = outputMode === OUTPUT_VIEW_MODES.FORECAST_OVERLAY;
  const forecastOverlay = useMemo(
    () => buildForecastOverlayConfig({ project, isDarkMode, enabled: showForecastOverlay }),
    [isDarkMode, project, showForecastOverlay]
  );
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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
            <Button variant="secondary" icon={Download} disabled>
              Download PDF
            </Button>
            <Button variant="secondary" icon={Share2} disabled>
              Export Image
            </Button>
            {canArchive && (
              <Button variant="danger" icon={Archive} loading={archiveState.loading} onClick={handleArchive}>
                Archive
              </Button>
            )}
          </div>
        </div>

        {archiveState.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {archiveState.error}
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
            <div className={`flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div>
                <p className="text-sm font-black">Final forecast chart</p>
                <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  {showForecastOverlay
                    ? 'Read-only annotations over the covered forecast XYZ tileset.'
                    : 'Read-only annotations without the forecast raster overlay.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <OutputModeToggle mode={outputMode} onChange={setOutputMode} isDarkMode={isDarkMode} />
                <MapPinned size={20} className={isDarkMode ? 'text-cyan-300' : 'text-blue-700'} aria-hidden="true" />
              </div>
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
                forecastOverlay={forecastOverlay}
                emptyLabel={showForecastOverlay ? 'No annotations available for this forecast overlay' : 'No published annotations available'}
              />
            </div>
          </article>

          <aside className="space-y-4">
            <OutputActionNotice isDarkMode={isDarkMode} />

            <article className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
              <h2 className="text-sm font-black">Output mode</h2>
              <p className={`mt-2 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose whether this output shows only forecaster annotations or the annotations over the selected forecast XYZ tileset.
              </p>
              <div className={`mt-4 rounded-2xl border p-3 text-xs font-bold ${isDarkMode ? 'border-white/10 bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                Current mode: {showForecastOverlay ? 'Forecast overlay + annotations' : 'Annotations only'}
              </div>
            </article>

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
