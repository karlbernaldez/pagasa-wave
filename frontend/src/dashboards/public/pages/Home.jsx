import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Facebook,
  FileText,
  Globe2,
  Layers,
  Mail,
  Map,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Twitter,
  Waves,
} from 'lucide-react';

import { fetchPublicPublishedCharts } from '@/api/publishedForecastAPI';
import PublicPublishedChartPreviewMap from '@/dashboards/public/components/PublicPublishedChartPreviewMap';
import {
  PUBLIC_CHART_SLOTS,
  filterProjectsToPublicChartWindow,
  getPublicChartAvailableCount,
  getPublicChartTenDayWindow,
  groupPublicChartHistory,
  groupPublicChartsByTypeForDate,
} from '@/dashboards/public/utils/publicChartGroups';

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
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PUBLIC_CHART_TIME_ZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(date);
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
  end.setUTCDate(end.getUTCDate() + 1);
  return `${formatDate(start, { month: 'short', day: 'numeric' })} - ${formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function PublicHeader({ lastUpdated }) {
  return (
    <header className="relative z-20 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[86px] max-w-[88rem] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/70">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Waves size={29} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight">WAVELAB</span>
              <span className="rounded bg-blue-700 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-white">Public</span>
            </div>
            <p className="text-xs font-semibold text-slate-600">Official Wave Forecasts for Everyone</p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 text-sm font-black text-slate-900 md:flex">
          <a href="#latest" className="hover:text-blue-700">Latest Forecasts</a>
          <Link to="/charts" className="hover:text-blue-700">Charts</Link>
          <Link to="/charts" className="hover:text-blue-700">Archive</Link>
          <a href="#about" className="hover:text-blue-700">About</a>
          <a href="#contact" className="hover:text-blue-700">Contact</a>
        </div>

        <div className="hidden items-center gap-3 text-right md:flex">
          <Clock size={20} className="text-blue-700" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-slate-600">Last updated</p>
            <p className="text-sm font-black text-blue-700">{lastUpdated ? formatDateTime(lastUpdated) : 'When charts publish'}</p>
          </div>
        </div>
      </nav>
    </header>
  );
}

function StateNotice({ title, children, tone = 'slate', action }) {
  const className = tone === 'red'
    ? 'border-red-200 bg-red-50 text-red-700'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${className}`}>
      <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
      <div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function ForecastDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-blue-700">
        <Icon size={19} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ChartPreviewCard({ slot, chart }) {
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle || slot.title;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="h-32 overflow-hidden bg-slate-100">
        {hasChart ? (
          <PublicPublishedChartPreviewMap
            projectId={chart._id}
            initialRaster={chart.raster}
            isDarkMode={false}
            height={null}
            className="h-full w-full rounded-none border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Waves size={34} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="min-h-[48px] text-sm font-black leading-relaxed text-slate-950">{title}</h3>
        <p className="mt-2 text-sm font-medium text-slate-600">Valid: {hasChart ? formatDateTime(chart.forecastDate) : 'Awaiting publication'}</p>
        <Link to={hasChart ? `/charts/${chart._id}` : '/charts'} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-800">
          View Chart <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function GuideCard({ icon: Icon, title, children, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div>
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">{children}</p>
    </div>
  );
}

function RegionCard({ icon: Icon, title }) {
  return (
    <Link to="/charts" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-black text-slate-900 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70">
      <Icon size={28} className="text-blue-700" aria-hidden="true" />
      {title}
    </Link>
  );
}

function PublicFooter() {
  return (
    <footer id="contact" className="mt-10 bg-[#002c5f] text-white">
      <div className="mx-auto grid max-w-[88rem] gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_1.6fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Waves size={24} /></div>
            <div><span className="text-2xl font-black">WAVELAB</span> <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-black uppercase">Public</span></div>
          </div>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-blue-100">Official Wave Forecasts for Everyone</p>
          <div className="mt-5 flex gap-4 text-blue-100"><Facebook size={20} /><Twitter size={20} /><Globe2 size={20} /></div>
        </div>
        <div><h3 className="font-black uppercase tracking-wide">Quick Links</h3><div className="mt-4 grid gap-2 text-sm text-blue-100"><a href="#latest">Latest Forecasts</a><Link to="/charts">Charts</Link><Link to="/charts">Archive</Link><a href="#about">About</a></div></div>
        <div><h3 className="font-black uppercase tracking-wide">Resources</h3><div className="mt-4 grid gap-2 text-sm text-blue-100"><a href="#guide">How to Read Forecasts</a><span>Marine Safety Tips</span><span>Data Disclaimer</span><span>FAQ</span></div></div>
        <div><h3 className="font-black uppercase tracking-wide">Contact</h3><div className="mt-4 grid gap-2 text-sm text-blue-100"><span>PAGASA – Marine Forecasting Section</span><span className="inline-flex items-center gap-2"><Mail size={15} /> marine.forecast@pagasa.dost.gov.ph</span><span className="inline-flex items-center gap-2"><Phone size={15} /> (02) 8284-0800 loc. 4800</span></div></div>
        <div><h3 className="font-black uppercase tracking-wide">Disclaimer</h3><p className="mt-4 text-sm leading-relaxed text-blue-100">Forecasts are for guidance only and may change without prior notice. Wavelab and PAGASA are not liable for any decisions made based on these forecasts.</p></div>
      </div>
      <div className="mx-auto max-w-[88rem] border-t border-white/10 px-5 py-5 text-center text-sm text-blue-100 lg:px-8">© 2026 Wavelab Public. All Rights Reserved.</div>
    </footer>
  );
}

export default function Home() {
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
  const latestUpdatedAt = useMemo(() => getLatestUpdatedAt(recentProjects), [recentProjects]);
  const latestPrimaryChart = useMemo(() => PUBLIC_CHART_SLOTS.map((slot) => chartByType.get(slot.chartType)).find(Boolean), [chartByType]);
  const forecastPeriodLabel = getForecastPeriodLabel(latestDate);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicHeader lastUpdated={latestUpdatedAt} />

      <section className="relative h-[400px] overflow-hidden bg-cover bg-center md:h-[430px]" style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#002c5f]/95 via-[#002c5f]/65 to-[#002c5f]/10" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/15" aria-hidden="true" />
        <div className="relative mx-auto flex h-full max-w-[88rem] items-center px-5 lg:px-8">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl font-black leading-tight tracking-tight drop-shadow sm:text-5xl lg:text-[52px]">Public Wave Forecasts,<br />Made Easier to Access</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-blue-50">View the latest published wave forecast charts and marine forecast outputs from Wavelab in one clear public portal.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"><Layers size={20} />View Latest Forecast Charts</Link>
              <Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-md border border-white bg-white/5 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-200"><FileText size={20} />Browse Forecast Archive</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-7 max-w-[88rem] px-5 lg:px-8">
        {state.loading && <StateNotice title="Loading latest forecasts">Fetching the latest published WaveLab charts and preparing the public forecast summary.</StateNotice>}
        {!state.loading && state.error && <StateNotice tone="red" title="Forecasts could not be loaded" action={<button type="button" onClick={() => setReloadToken((value) => value + 1)} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"><RefreshCw size={16} />Retry</button>}><p>{state.error}</p><p className="mt-1">Refresh the public forecast list or try again later.</p></StateNotice>}
        {!state.loading && !state.error && !recentProjects.length && <StateNotice tone="amber" title="No published forecasts are available right now">Please check again later or refer to official advisory channels for current marine updates.</StateNotice>}

        {!state.loading && !state.error && recentProjects.length > 0 && (
          <section id="latest" className="relative z-10 grid gap-8 rounded-lg border border-slate-200 bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.16)] lg:grid-cols-[minmax(0,1fr)_330px] lg:p-8">
            <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)_minmax(250px,0.95fr)]">
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-blue-50 text-blue-700"><CalendarDays size={42} /></div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">Latest Published Forecast</p>
                <h2 className="mt-7 text-2xl font-black leading-tight text-slate-950 md:text-3xl">Wave Forecast Package<br />{latestDate ? formatDate(latestDate) : 'Latest'}</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded bg-blue-700 px-3 py-1 text-xs font-black uppercase text-white">Published</span>
                  <span className="rounded bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">Valid: {forecastPeriodLabel}</span>
                </div>
                <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-slate-700">Includes significant wave height charts and regional outlook for the latest published forecast period.</p>
              </div>
              <div className="grid gap-5 border-slate-200 md:border-l md:pl-7">
                <ForecastDetail icon={CalendarDays} label="Forecast Date" value={latestDate ? formatDate(latestDate) : 'Latest'} />
                <ForecastDetail icon={Clock} label="Valid Period" value={forecastPeriodLabel} />
                <ForecastDetail icon={Layers} label="Published Charts" value={`${availableCount} charts`} />
                <ForecastDetail icon={Clock} label="Last Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Not available'} />
              </div>
            </div>
            <aside className="rounded-lg bg-slate-50 p-6">
              <p className="font-black text-slate-950">Open Forecast</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">View all published charts and forecast details.</p>
              <Link to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800">Open Forecast <ArrowRight size={16} /></Link>
              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="font-black text-slate-950">Download PDF</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-emerald-600"><CheckCircle2 size={15} /> PDF Ready</p>
                <Link to="/charts" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-700 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"><Download size={16} /> Download PDF</Link>
              </div>
            </aside>
          </section>
        )}
      </section>

      <section className="mx-auto max-w-[88rem] px-5 py-9 lg:px-8">
        {!state.loading && !state.error && recentProjects.length > 0 && (
          <section aria-labelledby="latest-charts-heading">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="latest-charts-heading" className="text-base font-black uppercase tracking-wide text-blue-700">Latest Forecast Charts</h2>
              <Link to="/charts" className="inline-flex items-center gap-2 text-sm font-black text-blue-700">View All Charts <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {PUBLIC_CHART_SLOTS.map((slot) => <ChartPreviewCard key={slot.chartType} slot={slot} chart={chartByType.get(slot.chartType)} />)}
            </div>
          </section>
        )}

        <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]" id="guide">
          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wide text-blue-700">How to Read the Forecast</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-4">
              <GuideCard icon={Waves} title="Wave Height">Shows the estimated height of waves in meters.</GuideCard>
              <GuideCard icon={Globe2} tone="amber" title="Colors">Colors represent different wave height ranges.</GuideCard>
              <GuideCard icon={Clock} title="Forecast Time">Each chart is valid for a specific date and time.</GuideCard>
              <GuideCard icon={ShieldCheck} tone="green" title="Use With Caution">Use forecasts together with official advisories and local conditions.</GuideCard>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wide text-blue-700">Explore by Region</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <RegionCard icon={MapPin} title="Luzon Waters" />
              <RegionCard icon={MapPin} title="Visayas Waters" />
              <RegionCard icon={MapPin} title="Mindanao Waters" />
              <RegionCard icon={Waves} title="West Philippine Sea" />
              <RegionCard icon={Waves} title="Philippine Sea" />
              <RegionCard icon={Map} title="Coastal Areas" />
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 rounded-lg bg-blue-50 p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-blue-700"><CalendarDays size={35} /></div>
          <div><h2 className="text-lg font-black uppercase tracking-wide text-blue-700">Looking for older forecasts?</h2><p className="mt-2 text-sm font-medium text-slate-700">Search and browse previously published forecast packages and charts by date and region.</p></div>
          <Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800">View Forecast Archive <ArrowRight size={16} /></Link>
        </section>

        <section id="about" className="mt-7 grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg bg-blue-50 p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-white"><Waves size={36} /></div>
            <h2 className="font-black uppercase text-slate-950">About Wavelab</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">Wavelab is a forecasting workflow system that helps prepare, review, and publish wave forecast outputs. The public portal provides easier access to published charts and forecast packages for communities, agencies, and marine users.</p>
          </article>
          <article className="rounded-lg bg-amber-50 p-8">
            <div className="mb-5 text-amber-500"><AlertTriangle size={58} /></div>
            <h2 className="font-black uppercase text-slate-950">Important Notice</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">Forecast information is provided for guidance and situational awareness. Always refer to official advisories, warnings, and local conditions before making marine travel or operational decisions.</p>
          </article>
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
