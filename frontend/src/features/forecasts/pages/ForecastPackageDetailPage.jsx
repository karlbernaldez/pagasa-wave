import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarDays, UsersRound, Waves } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchForecastPackageById } from '@/api/forecastPackageAPI';
import Button from '@/components/ui/Button';
import { useTheme } from '@/app/providers/ThemeProvider';
import { isProjectPublished } from '@/features/projects/projectStatuses';
import {
  CHART_LABELS,
  adaptForecastPackageModel,
  formatPackageDate,
} from '@/features/forecasts/forecastPackageViewModel';

function StateCard({ title, body, action, isDarkMode }) {
  return (
    <div
      className={`rounded-2xl border p-8 text-center shadow-xl backdrop-blur-2xl ${
        isDarkMode
          ? 'border-white/10 bg-slate-950/48 text-slate-200 shadow-black/20'
          : 'border-white/75 bg-white/68 text-slate-800 shadow-slate-300/35'
      }`}
    >
      <h1 className="text-xl font-black">{title}</h1>
      <p className={`mx-auto mt-2 max-w-xl text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-white/80 bg-white/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={17} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
        <span className={`text-xs font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
      <p className={`mt-2 text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

export default function ForecastPackageDetailPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const query = useQuery({
    queryKey: ['forecast-package', packageId],
    queryFn: ({ signal }) => fetchForecastPackageById(packageId, { signal }),
    enabled: Boolean(packageId),
    staleTime: 30000,
  });

  const forecastPackage = useMemo(() => {
    const payload = query.data?.package || query.data;
    return payload ? adaptForecastPackageModel(payload) : null;
  }, [query.data]);

  const openChart = (chart) => {
    const projectId = chart?._id || chart?.id;
    if (!projectId) return;
    navigate(isProjectPublished(chart?.status) ? `/charts/${projectId}` : `/studio/${projectId}`);
  };

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <StateCard
          title="Loading Forecast Package"
          body="Loading the selected package and its forecast charts."
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  if (query.error || !forecastPackage) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <StateCard
          title="Forecast Package unavailable"
          body={query.error?.message || 'The requested Forecast Package could not be found.'}
          isDarkMode={isDarkMode}
          action={<Button onClick={() => navigate('/forecasts')}>Back to Forecasts</Button>}
        />
      </div>
    );
  }

  const dateLabel = forecastPackage.dateKey
    ? formatPackageDate(forecastPackage.dateKey)
    : 'Unscheduled package';

  return (
    <div className="min-h-full bg-transparent">
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/forecasts')}>
          Back to Forecasts
        </Button>

        <section
          className={`overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl ${
            isDarkMode
              ? 'border-cyan-200/15 bg-slate-950/48 shadow-black/20'
              : 'border-white/80 bg-white/68 shadow-slate-300/35'
          }`}
        >
          <header className={`border-b p-5 sm:p-7 ${isDarkMode ? 'border-white/10' : 'border-white/80'}`}>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              Forecast Package
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                  {dateLabel}
                </h1>
                <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {forecastPackage.title}
                </p>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${
                  isDarkMode
                    ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200'
                    : 'border-cyan-100 bg-cyan-50 text-cyan-700'
                }`}
              >
                {forecastPackage.status}
              </span>
            </div>
          </header>

          <div className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryItem
                icon={CalendarDays}
                label="Forecast date"
                value={dateLabel}
                isDarkMode={isDarkMode}
              />
              <SummaryItem
                icon={UsersRound}
                label="Contributors"
                value={forecastPackage.contributorLabel || 'No recorded contributors'}
                isDarkMode={isDarkMode}
              />
              <SummaryItem
                icon={Waves}
                label="Charts"
                value={`${forecastPackage.chartCount || 0} available`}
                isDarkMode={isDarkMode}
              />
            </div>

            <section>
              <div className="mb-3">
                <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>Forecast charts</h2>
                <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Open an operational chart in Studio, or view its published output when publication is complete.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(forecastPackage.charts || []).map((chartRow) => {
                  const chart = chartRow.project;
                  const projectId = chart?._id || chart?.id;
                  const chartLabel = CHART_LABELS[chartRow.chartType] || chartRow.chartType || 'Forecast Chart';
                  const published = isProjectPublished(chart?.status);

                  return (
                    <button
                      key={projectId || chartRow.chartType}
                      type="button"
                      disabled={!projectId}
                      onClick={() => openChart(chart)}
                      className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                        projectId
                          ? isDarkMode
                            ? 'border-white/10 bg-white/[0.035] hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]'
                            : 'border-white/80 bg-white/55 hover:border-cyan-200 hover:bg-white/85'
                          : 'cursor-not-allowed border-transparent opacity-45'
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
                          isDarkMode
                            ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200'
                            : 'border-cyan-100 bg-cyan-50 text-cyan-700'
                        }`}
                      >
                        <Waves size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                          {chartLabel}
                        </span>
                        <span className={`mt-1 block truncate text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {chart?.name || chart?.title || 'Chart unavailable'} · {chart?.status || 'Draft'}
                        </span>
                        {projectId ? (
                          <span className={`mt-2 block text-xs font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                            {published ? 'View published chart' : 'Open in Studio'}
                          </span>
                        ) : null}
                      </span>
                      {projectId ? (
                        <ArrowRight
                          size={18}
                          className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} transition-transform group-hover:translate-x-1`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
