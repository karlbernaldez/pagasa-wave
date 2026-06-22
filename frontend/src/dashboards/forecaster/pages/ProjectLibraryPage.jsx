import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, Loader2, Plus, RefreshCw, Send } from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  createForecastPackage,
  fetchCurrentForecastPackage,
  submitForecastPackage,
  updateForecastChartCompletion,
} from '@/api/forecastPackageAPI';
import { useTheme } from '@/app/providers/ThemeProvider';

const FORECAST_TIME_ZONE = 'Asia/Manila';

const REQUIRED_CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Wave Forecast',
  forecast_36h: '36h Wave Forecast',
  forecast_48h: '48h Wave Forecast',
};

const EDITABLE_PACKAGE_STATUSES = new Set(['Draft', 'Revision Requested']);
const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2}$/;

function formatForecastDate(value) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeZone: FORECAST_TIME_ZONE,
  }).format(date);
}

function formatForecastDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: FORECAST_TIME_ZONE,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  return year && month && day ? `${year}-${month}-${day}` : '';
}

function getPackageTitle(packageData) {
  const dateKey = formatForecastDateKey(packageData?.forecastDate);
  const name = packageData?.name || '';

  if (dateKey && (!name || AUTO_PACKAGE_NAME_PATTERN.test(name))) {
    return `Marine Forecast ${dateKey}`;
  }

  return name || 'Marine Forecast Package';
}

function getPackagePayload(response) {
  if (!response) return null;
  if (Object.prototype.hasOwnProperty.call(response, 'package')) {
    return response.package || null;
  }
  return response;
}

function getPackageId(packageData) {
  return packageData?._id || packageData?.id;
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

function getNextAction(packageData, completion, isEditable) {
  if (!packageData) {
    return 'Create today\'s package to generate the four required forecast charts.';
  }

  if (!isEditable) {
    return `Package is ${packageData.status}. Charts are locked until Admin requests a revision.`;
  }

  if (!completion.isComplete) {
    return `${completion.required - completion.completed} chart${completion.required - completion.completed === 1 ? '' : 's'} still need forecast work.`;
  }

  return 'All charts are complete. Submit the package for admin review.';
}

function StatusPill({ status, isDarkMode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'}`}>
      {status || 'Draft'}
    </span>
  );
}

function MetricCard({ label, value, detail, icon: Icon, isDarkMode }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
          <p className={`mt-2 text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
        </div>
        {Icon && <Icon className={isDarkMode ? 'text-cyan-300' : 'text-blue-600'} size={20} />}
      </div>
      {detail && <p className={`mt-2 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{detail}</p>}
    </div>
  );
}

function WorkflowStep({ number, title, description, active, done, isDarkMode }) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${done ? 'bg-emerald-500 text-white' : active ? 'bg-cyan-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
        {done ? <CheckCircle2 size={16} /> : number}
      </div>
      <div>
        <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
        <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      </div>
    </div>
  );
}

function OperationsPanel({ packageData, completion, isEditable, isDarkMode }) {
  const nextAction = getNextAction(packageData, completion, isEditable);
  const isSubmittedOrLater = packageData && !isEditable;

  return (
    <aside className="space-y-4">
      <section className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>
          Operations Brief
        </p>
        <h3 className={`mt-3 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Next best action
        </h3>
        <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {nextAction}
        </p>
      </section>

      <section className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Workflow
        </p>
        <div className="mt-4 space-y-5">
          <WorkflowStep
            number="1"
            title="Prepare charts"
            description="Open each required chart in Studio and finish the forecast work."
            active={isEditable && !completion.isComplete}
            done={completion.isComplete || isSubmittedOrLater}
            isDarkMode={isDarkMode}
          />
          <WorkflowStep
            number="2"
            title="Mark completion"
            description="Use the chart cards to confirm each chart is ready for review."
            active={isEditable && completion.completed > 0 && !completion.isComplete}
            done={completion.isComplete || isSubmittedOrLater}
            isDarkMode={isDarkMode}
          />
          <WorkflowStep
            number="3"
            title="Submit package"
            description="Submit once all four charts are complete. Linked charts become read-only."
            active={isEditable && completion.isComplete}
            done={isSubmittedOrLater}
            isDarkMode={isDarkMode}
          />
        </div>
      </section>
    </aside>
  );
}

function ChartCard({ chart, packageData, isDarkMode, isEditable, isUpdating, onOpen, onToggleComplete }) {
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

      <div className="mt-4 grid gap-2">
        <Button
          className="w-full"
          size="sm"
          variant={isComplete ? 'secondary' : 'primary'}
          disabled={!projectId}
          onClick={() => projectId && onOpen(projectId)}
        >
          Open in Studio
        </Button>
        <Button
          className="w-full"
          size="sm"
          variant={isComplete ? 'secondary' : 'primary'}
          loading={isUpdating}
          disabled={!isEditable || isUpdating}
          onClick={() => onToggleComplete(chartType, !isComplete)}
        >
          {isComplete ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  );
}

function EmptyPackageState({ isCreating, isDarkMode, onCreate }) {
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
      <div className="mt-6 flex justify-center">
        <Button icon={Plus} loading={isCreating} disabled={isCreating} onClick={onCreate}>
          Create Forecast Package
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
  const [submitting, setSubmitting] = useState(false);
  const [updatingChartType, setUpdatingChartType] = useState(null);
  const [error, setError] = useState('');

  const completion = useMemo(() => getCompletion(packageData), [packageData]);
  const packageId = getPackageId(packageData);
  const charts = packageData?.charts || [];
  const isEditable = EDITABLE_PACKAGE_STATUSES.has(packageData?.status || 'Draft');
  const canSubmit = Boolean(packageId && isEditable && completion.isComplete && !submitting);
  const packageTitle = getPackageTitle(packageData);

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

  const handleToggleChartComplete = async (chartType, isComplete) => {
    if (!packageId || !chartType || updatingChartType) return;

    setUpdatingChartType(chartType);
    setError('');

    try {
      const updatedPackage = await updateForecastChartCompletion(packageId, chartType, isComplete);
      setPackageData(getPackagePayload(updatedPackage));
    } catch (err) {
      console.error('Failed to update chart completion:', err);
      setError(err?.message || 'Failed to update chart completion.');
    } finally {
      setUpdatingChartType(null);
    }
  };

  const handleSubmitPackage = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const updatedPackage = await submitForecastPackage(packageId);
      setPackageData(getPackagePayload(updatedPackage));
    } catch (err) {
      console.error('Failed to submit forecast package:', err);
      setError(err?.message || 'Failed to submit forecast package.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>
              Forecaster Workspace
            </p>
            <h1 className={`mt-2 text-2xl font-black sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Current Forecast Package
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Complete, verify, and submit the four required charts for the current daily marine forecast.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {packageData && (
              <Button
                icon={Send}
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmitPackage}
              >
                Submit Forecast Package
              </Button>
            )}
            <Button variant="secondary" icon={RefreshCw} onClick={() => loadCurrentPackage()} disabled={loading}>
              Refresh
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
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={packageData.status} isDarkMode={isDarkMode} />
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatForecastDate(packageData.forecastDate)}
                      </span>
                    </div>
                    <h2 className={`mt-3 text-xl font-black sm:text-2xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {packageTitle}
                    </h2>
                    <p className={`mt-1 max-w-3xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {completion.isComplete
                        ? 'All required charts are complete. Submit the package for admin review when ready.'
                        : 'Open each chart in Studio, complete the forecast work, then mark the chart complete before submission.'}
                    </p>
                    {!isEditable && (
                      <p className={`mt-2 text-xs font-bold ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                        This package is locked while it is {packageData.status}.
                      </p>
                    )}
                  </div>

                  <div className={`w-full rounded-2xl border p-4 lg:max-w-[240px] ${isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
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

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Forecast date"
                  value={formatForecastDateKey(packageData.forecastDate) || 'Today'}
                  detail="Philippines operational day"
                  icon={CalendarDays}
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  label="Charts ready"
                  value={`${completion.completed}/${completion.required}`}
                  detail={completion.isComplete ? 'Ready to submit' : 'Still in preparation'}
                  icon={CheckCircle2}
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  label="Package state"
                  value={packageData.status || 'Draft'}
                  detail={isEditable ? 'Editable by forecaster' : 'Read-only until revision'}
                  icon={ClipboardList}
                  isDarkMode={isDarkMode}
                />
                <MetricCard
                  label="Review gate"
                  value={completion.isComplete ? 'Open' : 'Blocked'}
                  detail={completion.isComplete ? 'Submission enabled' : 'Complete all charts first'}
                  icon={Send}
                  isDarkMode={isDarkMode}
                />
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      Required Charts
                    </p>
                    <h3 className={`mt-1 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      Forecast production board
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {charts.map((chart) => (
                    <ChartCard
                      key={chart.chartType}
                      chart={chart}
                      packageData={packageData}
                      isDarkMode={isDarkMode}
                      isEditable={isEditable}
                      isUpdating={updatingChartType === chart.chartType}
                      onOpen={handleOpenChart}
                      onToggleComplete={handleToggleChartComplete}
                    />
                  ))}
                </div>
              </section>
            </div>

            <OperationsPanel
              packageData={packageData}
              completion={completion}
              isEditable={isEditable}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}