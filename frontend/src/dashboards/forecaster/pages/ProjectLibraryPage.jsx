import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, FolderKanban, Loader2, Plus, RefreshCw } from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  createForecastPackage,
  fetchCurrentForecastPackage,
} from '@/api/forecastPackageAPI';
import { useTheme } from '@/app/providers/ThemeProvider';

const REQUIRED_CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Wave Forecast',
  forecast_36h: '36h Wave Forecast',
  forecast_48h: '48h Wave Forecast',
};

function formatForecastDate(value) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
  }).format(date);
}

function getPackagePayload(response) {
  return response?.package || response;
}

function getChartProjectId(chart) {
  return chart?.project?._id || chart?.project?.id || chart?.project;
}

function getChartCompletion(packageData, chartType) {
  return packageData?.chartCompletion?.find((row) => row.chartType === chartType);
}

function getCompletion(packageData) {
  const completion = packageData?.completion;
  if (completion) return completion;

  const rows = packageData?.chartCompletion || [];
  const required = Object.keys(REQUIRED_CHART_LABELS).length;
  const completed = rows.filter((row) => row.isComplete).length;

  return {
    required,
    completed,
    percentage: required ? Math.round((completed / required) * 100) : 0,
    isComplete: completed === required,
  };
}

function StatusPill({ status, isDarkMode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'}`}>
      {status || 'Draft'}
    </span>
  );
}

function ChartCard({ chart, packageData, isDarkMode, onOpen }) {
  const chartType = chart?.chartType;
  const completion = getChartCompletion(packageData, chartType);
  const projectId = getChartProjectId(chart);
  const isComplete = Boolean(completion?.isComplete);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {REQUIRED_CHART_LABELS[chartType] || chartType}
          </p>
          <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isComplete ? 'Marked complete' : 'Needs forecast work'}
          </p>
        </div>
        {isComplete ? (
          <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
        ) : (
          <ClipboardList className={isDarkMode ? 'shrink-0 text-slate-500' : 'shrink-0 text-slate-400'} size={20} />
        )}
      </div>

      <Button
        className="mt-4 w-full"
        size="sm"
        variant={isComplete ? 'secondary' : 'primary'}
        disabled={!projectId}
        onClick={() => projectId && onOpen(projectId)}
      >
        Open in Studio
      </Button>
    </div>
  );
}

function EmptyPackageState({ isCreating, isDarkMode, onCreate, onOpenLibrary }) {
  return (
    <div className={`rounded-3xl border p-8 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}>
        <CalendarDays size={30} />
      </div>
      <h2 className={`mt-5 text-xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
        Create today&apos;s forecast package
      </h2>
      <p className={`mx-auto mt-2 max-w-2xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        A forecast package creates the four required charts for the daily marine forecast and keeps the forecaster workflow focused on the current forecast.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button icon={Plus} loading={isCreating} disabled={isCreating} onClick={onCreate}>
          Create Forecast Package
        </Button>
        <Button variant="secondary" icon={FolderKanban} onClick={onOpenLibrary}>
          View Previous Projects
        </Button>
      </div>
    </div>
  );
}

export default function ForecasterProjectLibraryPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const completion = useMemo(() => getCompletion(packageData), [packageData]);
  const charts = packageData?.charts || [];

  const loadCurrentPackage = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchCurrentForecastPackage({ signal });
      setPackageData(getPackagePayload(response));
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to load current forecast package:', err);
      setError(err?.message || 'Failed to load current forecast package.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCurrentPackage({ signal: controller.signal });
    return () => controller.abort();
  }, [loadCurrentPackage]);

  const handleCreatePackage = async () => {
    if (creating) return;
    setCreating(true);
    setError('');

    try {
      const response = await createForecastPackage();
      setPackageData(getPackagePayload(response));
    } catch (err) {
      console.error('Failed to create forecast package:', err);
      setError(err?.message || 'Failed to create forecast package.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChart = (projectId) => {
    navigate(`/studio/${projectId}`);
  };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>
              Forecaster Workspace
            </p>
            <h1 className={`mt-2 text-2xl font-black sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Current Forecast Package
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Complete the four required charts for the current daily forecast.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" icon={RefreshCw} onClick={() => loadCurrentPackage()} disabled={loading}>
              Refresh
            </Button>
            <Button variant="secondary" icon={FolderKanban} onClick={() => navigate('/studio/library')}>
              Previous Projects
            </Button>
          </div>
        </div>

        {error && (
          <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              {error}
            </span>
            <button
              type="button"
              className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-red-200 hover:text-white' : 'text-red-700 hover:text-red-900'}`}
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className={`flex min-h-[320px] items-center justify-center rounded-3xl border ${isDarkMode ? 'border-white/10 bg-slate-900/80 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <Loader2 className="animate-spin" size={18} />
              Loading current forecast package...
            </span>
          </div>
        ) : !packageData ? (
          <EmptyPackageState
            isCreating={creating}
            isDarkMode={isDarkMode}
            onCreate={handleCreatePackage}
            onOpenLibrary={() => navigate('/studio/library')}
          />
        ) : (
          <div className="space-y-5">
            <section className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={packageData.status} isDarkMode={isDarkMode} />
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatForecastDate(packageData.forecastDate)}
                    </span>
                  </div>
                  <h2 className={`mt-3 text-xl font-black sm:text-2xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {packageData.name || 'Marine Forecast Package'}
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Work through each chart, then submit the complete package for admin review.
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Completion
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {completion.percentage}%
                    </span>
                    <span className={`pb-1 text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {completion.completed}/{completion.required} charts
                    </span>
                  </div>
                  <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${completion.percentage}%` }} />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {charts.map((chart) => (
                <ChartCard
                  key={chart.chartType}
                  chart={chart}
                  packageData={packageData}
                  isDarkMode={isDarkMode}
                  onOpen={handleOpenChart}
                />
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
