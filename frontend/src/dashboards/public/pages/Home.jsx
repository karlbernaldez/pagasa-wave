import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, Download, FileText, Globe2, Layers, LifeBuoy, Map, MapPin, RefreshCw, ShieldCheck, Waves } from 'lucide-react';

import { fetchPublicPublishedCharts } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import PublicPublishedChartPreviewMap from '@/dashboards/public/components/PublicPublishedChartPreviewMap';
import { PUBLIC_CHART_SLOTS, filterProjectsToPublicChartWindow, getPublicChartAvailableCount, getPublicChartCompleteness, getPublicChartTenDayWindow, groupPublicChartHistory, groupPublicChartsByTypeForDate } from '@/dashboards/public/utils/publicChartGroups';

const RECENT_FETCH_LIMIT = 80;
const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';
const HERO_IMAGE_URL = '/images/wavelab-public-hero.svg';

function parsePublicDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const dateKeyMatch = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateKeyMatch) {
    const [, year, month, day] = dateKeyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 16, 0, 0));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value, options = {}) {
  const date = parsePublicDate(value);
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', ...options }).format(date);
  } catch {
    return '-';
  }
}

function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}

function getLatestUpdatedAt(projects = []) {
  return projects.reduce((latest, project) => {
    const candidate = parsePublicDate(project?.publishedAt || project?.updatedAt || project?.createdAt);
    if (!candidate) return latest;
    return !latest || candidate > latest ? candidate : latest;
  }, null);
}

function getForecastPeriodLabel(activeDate) {
  const start = parsePublicDate(activeDate);
  if (!start) return 'Latest available forecast period';
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function panelClass(isDark, extra = '') {
  return `rounded-[2rem] border shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/78 shadow-black/20' : 'border-white/80 bg-white/92 shadow-blue-100/70'} ${extra}`;
}

function StateNotice({ isDark, tone = 'slate', title, children, action }) {
  const toneClass = tone === 'red'
    ? isDark ? 'border-red-400/20 bg-red-400/10 text-red-100' : 'border-red-200 bg-red-50 text-red-700'
    : tone === 'amber'
      ? isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'
      : isDark ? 'border-white/10 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700';
  return (
    <div className={`rounded-3xl border p-6 ${toneClass}`}>
      <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
      <div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function ForecastMetric({ icon: Icon, label, value, isDark }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-cyan-300/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function HeroPreviewCard({ latestDate, forecastPeriodLabel, availableCount, latestUpdatedAt, latestPrimaryChart }) {
  return (
    <aside className="hidden rounded-[2rem] border border-white/25 bg-slate-950/25 p-5 text-white shadow-2xl shadow-slate-950/25 backdrop-blur-xl lg:block">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Latest forecast</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-100">
          <CheckCircle2 size={13} aria-hidden="true" /> Published
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-black leading-tight">{latestDate ? formatDate(latestDate) : 'Public charts'}</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-50/85">Quick access to the newest published WaveLab chart set.</p>
      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">Forecast period</p>
          <p className="mt-1 text-sm font-black">{forecastPeriodLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">Charts</p>
            <p className="mt-1 text-sm font-black">{availableCount}/{PUBLIC_CHART_SLOTS.length}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/70">Updated</p>
            <p className="mt-1 text-sm font-black">{latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Soon'}</p>
          </div>
        </div>
      </div>
      <Link to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-cyan-200">
        Open Latest Charts <ArrowRight size={16} aria-hidden="true" />
      </Link>
      <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-blue-50/70">Scroll for full forecast details</p>
    </aside>
  );
}

function InfoCard({ icon: Icon, title, children, isDark }) {
  return (
    <article className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-white/70'}`}>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}><Icon size={22} aria-hidden="true" /></div>
      <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
      <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{children}</p>
    </article>
  );
}

function RegionCard({ icon: Icon, title, isDark }) {
  return (
    <Link to="/charts" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-400/70 ${isDark ? 'border-white/10 bg-slate-950/45 text-slate-100 hover:border-cyan-300/30 hover:bg-white/5' : 'border-slate-200 bg-white/75 text-slate-800 hover:border-blue-200 hover:bg-blue-50/80'}`}>
      <Icon size={20} className={isDark ? 'text-cyan-300' : 'text-blue-600'} aria-hidden="true" />
      {title}
    </Link>
  );
}

function ChartPreviewCard({ slot, chart, isDark }) {
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle || slot.title;
  const description = hasChart ? chart.description || `${slot.title} for ${formatDate(chart.forecastDate)}.` : `No published ${slot.title.toLowerCase()} is available for the latest forecast date yet.`;
  return (
    <article className={panelClass(isDark, 'group flex min-h-[350px] flex-col overflow-hidden transition hover:-translate-y-1')}>
      <div className="relative h-48 overflow-hidden">
        {hasChart ? <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDark} height={null} className="h-full w-full rounded-none border-0" /> : <div className={`flex h-full items-center justify-center ${isDark ? 'bg-slate-950/80' : 'bg-slate-100'}`}><Waves size={36} className={isDark ? 'text-slate-700' : 'text-slate-300'} aria-hidden="true" /></div>}
        <div className="absolute left-4 top-4 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20">{slot.badge}</div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className={`text-lg font-black leading-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
          <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{hasChart ? `Valid ${formatDateTime(chart.forecastDate)}` : 'Awaiting publication'}</p>
          <p className={`mt-3 line-clamp-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        </div>
        <Link to={hasChart ? `/charts/${chart._id}` : '/charts'} className={`mt-5 inline-flex items-center gap-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${isDark ? 'text-cyan-200' : 'text-blue-700'}`}>
          {hasChart ? 'View Chart' : 'Browse Charts'} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const { isDarkMode: isDark } = useTheme();
  const [state, setState] = useState({ loading: true, error: '', projects: [] });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => { document.title = 'Wavelab Public | Official Wave Forecasts'; }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, mode: 'active', signal: controller.signal })
      .then((data) => {
        const allProjects = data?.projects || [];
        setState({ loading: false, error: '', projects: filterProjectsToPublicChartWindow(allProjects, getPublicChartTenDayWindow(allProjects)) });
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setState({ loading: false, error: error?.message || 'Failed to load public forecasts.', projects: [] });
      });
    return () => controller.abort();
  }, [reloadToken]);

  const recentProjects = state.projects;
  const historyGroups = useMemo(() => groupPublicChartHistory(recentProjects), [recentProjects]);
  const latestDate = historyGroups[0]?.dateKey || '';
  const chartByType = useMemo(() => groupPublicChartsByTypeForDate(recentProjects, latestDate), [latestDate, recentProjects]);
  const availableCount = useMemo(() => getPublicChartAvailableCount(chartByType), [chartByType]);
  const completeness = useMemo(() => getPublicChartCompleteness(chartByType), [chartByType]);
  const latestUpdatedAt = useMemo(() => getLatestUpdatedAt(recentProjects), [recentProjects]);
  const latestPrimaryChart = useMemo(() => PUBLIC_CHART_SLOTS.map((slot) => chartByType.get(slot.chartType)).find(Boolean), [chartByType]);
  const forecastPeriodLabel = getForecastPeriodLabel(latestDate);
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageClass}`}>
      <section className="relative isolate flex min-h-[720px] h-[100svh] items-center overflow-hidden bg-sky-950 bg-cover bg-center px-4 py-28 sm:px-6 lg:min-h-[760px] lg:bg-[center_right] lg:px-8" style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/82 via-blue-950/42 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/25" aria-hidden="true" />
        <div className={`absolute bottom-0 left-0 right-0 -z-10 h-28 bg-gradient-to-t ${isDark ? 'from-slate-950 via-slate-950/65' : 'from-slate-50 via-slate-50/65'} to-transparent`} aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="max-w-3xl text-white lg:-translate-y-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-50 shadow-lg shadow-black/10 backdrop-blur"><Waves size={16} aria-hidden="true" />Wavelab Public</div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.04] tracking-tight drop-shadow-[0_3px_16px_rgba(0,0,0,0.25)] sm:text-5xl lg:text-[56px]">Public Wave Forecasts, Made Easier to Access</h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-blue-50 drop-shadow sm:text-lg">View the latest published wave forecast charts and marine forecast outputs from Wavelab in one clear public portal.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"><Layers size={18} aria-hidden="true" />View Latest Forecast Charts</Link>
              <Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/45 bg-white/5 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-200"><FileText size={18} aria-hidden="true" />Browse Forecast Archive</Link>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-50/80 drop-shadow">Published forecast outputs only · Updated when new charts are available</p>
          </div>
          <HeroPreviewCard latestDate={latestDate} forecastPeriodLabel={forecastPeriodLabel} availableCount={availableCount} latestUpdatedAt={latestUpdatedAt} latestPrimaryChart={latestPrimaryChart} />
        </div>
      </section>

      <section className="relative z-10 mx-auto flex max-w-[88rem] flex-col gap-8 px-4 py-20 sm:px-6 lg:px-8">
        {state.loading && <div className={panelClass(isDark, 'p-8')}><StateNotice isDark={isDark} title="Loading latest forecasts">Fetching the latest published WaveLab charts and preparing the public forecast summary.</StateNotice></div>}
        {!state.loading && state.error && <StateNotice isDark={isDark} tone="red" title="Forecasts could not be loaded" action={<button type="button" onClick={() => setReloadToken((value) => value + 1)} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"><RefreshCw size={16} aria-hidden="true" />Retry</button>}><p>{state.error}</p><p className="mt-1">Refresh the public forecast list or try again later.</p></StateNotice>}
        {!state.loading && !state.error && !recentProjects.length && <StateNotice isDark={isDark} tone="amber" title="No published forecasts are available right now">Please check again later or refer to official advisory channels for current marine updates.</StateNotice>}

        {!state.loading && !state.error && recentProjects.length > 0 && <>
          <section className={panelClass(isDark, 'grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8')} aria-labelledby="latest-forecast-heading">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>Latest Published Forecast</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-600"><CheckCircle2 size={14} aria-hidden="true" />Published</span>
              </div>
              <h2 id="latest-forecast-heading" className={`mt-3 text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Wave Forecast Package {latestDate ? formatDate(latestDate) : ''}</h2>
              <p className={`mt-4 max-w-3xl text-sm font-medium leading-relaxed ${mutedText}`}>Includes the latest public WaveLab chart set for marine weather awareness. Published outputs are shown only after they are available through the public chart workflow.</p>
              <div className="mt-6 grid max-w-5xl gap-3 sm:grid-cols-3">
                <ForecastMetric icon={CalendarDays} label="Forecast period" value={forecastPeriodLabel} isDark={isDark} />
                <ForecastMetric icon={Layers} label="Published charts" value={`${availableCount}/${PUBLIC_CHART_SLOTS.length} available`} isDark={isDark} />
                <ForecastMetric icon={Clock} label="Last updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Not available'} isDark={isDark} />
              </div>
            </div>
            <div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-blue-50/60'}`}>
              <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Open Forecast</p>
              <p className={`mt-2 text-sm font-medium leading-relaxed ${mutedText}`}>View published charts and forecast details.</p>
              <Link to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Open Forecast <ArrowRight size={16} aria-hidden="true" /></Link>
              <div className={`mt-5 border-t pt-5 ${isDark ? 'border-white/10' : 'border-blue-100'}`}>
                <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Download PDF</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-emerald-600"><CheckCircle2 size={14} aria-hidden="true" /> Available from chart page</p>
                <Link to="/charts" className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDark ? 'border-white/10 text-cyan-100 hover:bg-white/5' : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'}`}><Download size={16} aria-hidden="true" />Go to PDF Export</Link>
              </div>
            </div>
          </section>

          <section aria-labelledby="latest-charts-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Latest Forecast Charts</p><h2 id="latest-charts-heading" className={`mt-1 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Published chart preview</h2></div><Link to="/charts" className={`inline-flex items-center gap-2 text-sm font-black ${isDark ? 'text-cyan-200' : 'text-blue-700'}`}>View All Charts <ArrowRight size={15} aria-hidden="true" /></Link></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <ChartPreviewCard key={slot.chartType} slot={slot} chart={chartByType.get(slot.chartType)} isDark={isDark} />)}</div>
          </section>
        </>}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className={panelClass(isDark, 'p-6')}><p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>How to Read the Forecast</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><InfoCard icon={Waves} title="Wave Height" isDark={isDark}>Shows the estimated height of waves in meters.</InfoCard><InfoCard icon={Layers} title="Colors" isDark={isDark}>Colors represent different wave height ranges.</InfoCard><InfoCard icon={Clock} title="Forecast Time" isDark={isDark}>Each chart is valid for a specific date and time.</InfoCard><InfoCard icon={ShieldCheck} title="Use With Caution" isDark={isDark}>Use forecasts together with official advisories and local conditions.</InfoCard></div></div>
          <div className={panelClass(isDark, 'p-6')}><p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>Explore by Region</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><RegionCard icon={MapPin} title="Luzon Waters" isDark={isDark} /><RegionCard icon={MapPin} title="Visayas Waters" isDark={isDark} /><RegionCard icon={MapPin} title="Mindanao Waters" isDark={isDark} /><RegionCard icon={Globe2} title="West Philippine Sea" isDark={isDark} /><RegionCard icon={Globe2} title="Philippine Sea" isDark={isDark} /><RegionCard icon={LifeBuoy} title="Coastal Areas" isDark={isDark} /></div></div>
        </section>

        <section className={`grid gap-5 rounded-[2rem] border p-6 lg:grid-cols-[1fr_auto] lg:items-center ${isDark ? 'border-blue-400/10 bg-blue-400/10' : 'border-blue-100 bg-blue-50'}`}><div className="flex gap-4"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-cyan-300/10 text-cyan-200' : 'bg-white text-blue-700'}`}><CalendarDays size={26} aria-hidden="true" /></div><div><h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Looking for older forecasts?</h2><p className={`mt-2 text-sm font-medium leading-relaxed ${mutedText}`}>Search and browse previously published forecast packages and charts by date through the public chart archive.</p></div></div><Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">View Forecast Archive <ArrowRight size={16} aria-hidden="true" /></Link></section>

        <section className="grid gap-5 lg:grid-cols-2"><article className={panelClass(isDark, 'p-6')}><div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50 text-blue-700'}`}><Map size={26} aria-hidden="true" /></div><h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>About Wavelab</h2><p className={`mt-3 text-sm font-medium leading-relaxed ${mutedText}`}>Wavelab is a forecasting workflow system that helps prepare, review, and publish wave forecast outputs. The public portal provides easier access to published charts and forecast packages for communities, agencies, and marine users.</p></article><article className={`rounded-[2rem] border p-6 ${isDark ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50'}`}><div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-300/10 text-amber-100' : 'bg-white text-amber-700'}`}><AlertTriangle size={26} aria-hidden="true" /></div><h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Important Notice</h2><p className={`mt-3 text-sm font-medium leading-relaxed ${isDark ? 'text-amber-50/80' : 'text-amber-900/80'}`}>Forecast information is provided for guidance and situational awareness. Always refer to official advisories and local conditions before making marine travel or field decisions.</p></article></section>
        <p className={`text-center text-xs font-semibold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Data: DOST-PAGASA - WaveLab - Published charts only</p>
      </section>
    </main>
  );
}
