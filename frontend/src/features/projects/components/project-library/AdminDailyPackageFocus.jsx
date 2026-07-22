import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  PackageOpen,
  Waves,
} from 'lucide-react';

import { publishForecastPackage } from '@/api/forecastPackageAPI';
import { publishProject } from '@/api/projectAPI';
import Button from '@/components/ui/Button';
import {
  CHART_LABELS,
  formatPackageDate,
  getDateKey,
  groupForecastPackages,
  isDailyForecastPackage,
} from '@/features/projects/utils/forecastPackageGrouping';

const DAILY_CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];
const COMPLETE_STATUSES = new Set(['Approved', 'Published']);
const REVIEWABLE_STATUSES = new Set(['Submitted', 'Under Review']);

function getRows({ packages = [], projects = [] }) {
  return packages.length > 0 ? packages : groupForecastPackages(projects);
}

function getDailyFocus({ packages = [], projects = [] }) {
  const rows = getRows({ packages, projects });
  const todayKey = getDateKey(new Date());
  const dailyPackage = rows.find(isDailyForecastPackage) || null;
  const chartRows = dailyPackage?.charts || [];
  const chartByType = new Map(chartRows.map((chart) => [chart.chartType || chart.project?.chartType, chart]));

  const charts = DAILY_CHART_TYPES.map((chartType) => {
    const row = chartByType.get(chartType);
    const project = row?.project || row;
    return {
      chartType,
      label: CHART_LABELS[chartType] || chartType,
      status: project?.status || 'Missing',
      projectName: project?.name || project?.title || 'Not submitted yet',
      project,
    };
  });

  return {
    dailyPackage,
    charts,
    completeCount: charts.filter((chart) => COMPLETE_STATUSES.has(chart.status)).length,
    historyCount: rows.filter((forecastPackage) => forecastPackage.dateKey && forecastPackage.dateKey !== todayKey).length,
  };
}

function ChartTile({ chart, dailyPackage, isDarkMode, onOpenChart }) {
  const complete = COMPLETE_STATUSES.has(chart.status);
  const reviewable = REVIEWABLE_STATUSES.has(chart.status);
  const available = Boolean(chart.project && (chart.project._id || chart.project.id));
  const Icon = chart.chartType === 'analysis' ? Waves : Clock3;

  return (
    <article className={`rounded-xl border p-4 backdrop-blur-xl ${
      isDarkMode ? 'border-white/10 bg-white/[0.045]' : 'border-white/75 bg-white/62'
    }`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
          isDarkMode ? 'border-cyan-300/15 bg-cyan-300/10 text-cyan-200' : 'border-cyan-100 bg-cyan-50 text-cyan-700'
        }`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{chart.label}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            {complete ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Clock3 size={13} className={reviewable ? 'text-amber-400' : 'text-slate-500'} />}
            <span className={`text-xs font-bold ${
              complete ? 'text-emerald-400' : reviewable ? 'text-amber-400' : isDarkMode ? 'text-slate-500' : 'text-slate-500'
            }`}>
              {chart.status}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!available}
        onClick={() => available && onOpenChart?.(chart.project, dailyPackage)}
        className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-black transition ${
          available
            ? isDarkMode
              ? 'border-white/10 bg-white/[0.045] text-slate-200 hover:border-cyan-300/25 hover:bg-cyan-300/10'
              : 'border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50'
            : 'cursor-not-allowed border-transparent bg-transparent text-slate-500'
        }`}
      >
        <span>{available ? (reviewable ? 'Review chart' : 'View chart') : chart.projectName}</span>
        {available && <ArrowRight size={14} />}
      </button>
    </article>
  );
}

export default function AdminDailyPackageFocus({
  isDarkMode,
  packages = [],
  projects = [],
  onOpenChart,
  onPublishPackage,
  publishingPackageId,
}) {
  const { charts, completeCount, dailyPackage } = getDailyFocus({ packages, projects });
  const [localPublishing, setLocalPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const dateLabel = dailyPackage?.dateKey
    ? formatPackageDate(dailyPackage.dateKey)
    : new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date());
  const isReadyToPublish = dailyPackage?.status === 'Approved';
  const isPublishing = publishingPackageId === dailyPackage?.id || localPublishing;
  const primaryChart = dailyPackage?.primaryChart;
  const canOpen = Boolean(primaryChart);

  const publishDirectly = async () => {
    const packageId = dailyPackage?._id || dailyPackage?.id;
    if (!packageId || !isReadyToPublish) return;

    setPublishError('');
    setLocalPublishing(true);
    try {
      const approvedProjects = (dailyPackage.charts || [])
        .map((chart) => chart.project)
        .filter((project) => (project?._id || project?.id) && project?.status === 'Approved');

      await Promise.all(approvedProjects.map((project) => publishProject(project._id || project.id)));
      await publishForecastPackage(packageId);
      window.location.reload();
    } catch (error) {
      console.error('Failed to publish today\'s forecast package:', error);
      setPublishError(error?.message || 'Failed to publish today\'s forecast package.');
    } finally {
      setLocalPublishing(false);
    }
  };

  const runPrimaryAction = async () => {
    if (isReadyToPublish) {
      if (onPublishPackage) {
        await onPublishPackage(dailyPackage);
      } else {
        await publishDirectly();
      }
      return;
    }
    if (canOpen) onOpenChart?.(primaryChart, dailyPackage);
  };

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${
      isDarkMode ? 'border-cyan-300/15 bg-slate-950/48 shadow-black/25' : 'border-white/80 bg-white/68 shadow-slate-300/35'
    }`}>
      <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden p-5 sm:p-7">
          <div className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl ${isDarkMode ? 'bg-cyan-400/10' : 'bg-cyan-200/35'}`} />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-200/80' : 'text-cyan-700'}`}>Today&apos;s forecast package</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className={`text-3xl font-black tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{dateLabel}</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
                  isReadyToPublish
                    ? isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                }`}>
                  {isReadyToPublish && <Check size={13} />}
                  {dailyPackage?.status || 'Not submitted'}
                </span>
              </div>
              <p className={`mt-3 max-w-xl text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {dailyPackage
                  ? 'Review today’s required charts and complete the package before publication.'
                  : 'Today’s package has not been submitted yet. Required chart slots will update as forecasts arrive.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-5 text-xs font-bold">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Owner <strong className={isDarkMode ? 'text-slate-100' : 'text-slate-800'}>{dailyPackage?.ownerLabel || 'Forecast team'}</strong></span>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Package <strong className={isDarkMode ? 'text-slate-100' : 'text-slate-800'}>{dailyPackage?.title || 'Awaiting submission'}</strong></span>
              </div>
            </div>

            <div className={`grid h-40 w-40 place-items-center rounded-full border-[3px] text-center shadow-[0_0_38px_rgba(34,211,238,0.18)] ${
              isDarkMode ? 'border-cyan-300/70 bg-cyan-400/[0.06]' : 'border-cyan-400 bg-cyan-50/70'
            }`}>
              <div>
                <CheckCircle2 className={`mx-auto ${completeCount === 4 ? 'text-emerald-400' : 'text-cyan-400'}`} size={28} />
                <p className={`mt-2 text-3xl font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{completeCount} / 4</p>
                <p className={`text-xs font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Charts complete</p>
              </div>
            </div>
          </div>
        </div>

        <aside className={`border-t p-5 sm:p-7 lg:border-l lg:border-t-0 ${isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-white/70 bg-white/35'}`}>
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Today&apos;s package action</p>
          <h3 className={`mt-3 text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            {isReadyToPublish ? 'Publish today’s package' : dailyPackage ? 'Review today’s package' : 'Await today’s package'}
          </h3>
          <p className={`mt-2 text-sm font-semibold leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isReadyToPublish
              ? 'All required charts are approved. Publish the package to make the outputs available.'
              : 'Open the current review workspace and resolve the remaining chart decisions.'}
          </p>
          {publishError && <p role="alert" className="mt-3 text-sm font-semibold text-red-400">{publishError}</p>}
          <div className="mt-5">
            <Button icon={isReadyToPublish ? PackageOpen : Eye} disabled={!dailyPackage || (!isReadyToPublish && !canOpen) || isPublishing} onClick={runPrimaryAction}>
              {isPublishing ? 'Publishing...' : isReadyToPublish ? 'Publish today’s package' : 'Review today’s package'}
            </Button>
          </div>
        </aside>
      </div>

      <div className={`border-t px-5 pt-4 sm:px-7 ${isDarkMode ? 'border-white/10' : 'border-white/70'}`}>
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Required daily charts</p>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
        {charts.map((chart) => (
          <ChartTile key={chart.chartType} chart={chart} dailyPackage={dailyPackage} isDarkMode={isDarkMode} onOpenChart={onOpenChart} />
        ))}
      </div>
    </section>
  );
}
