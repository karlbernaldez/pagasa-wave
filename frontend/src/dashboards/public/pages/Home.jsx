import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Globe2,
  Layers,
  Map,
  MapPin,
  Menu,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  User,
  Waves,
  X,
} from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
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
const PUBLIC_HERO_IMAGE_URL = '/images/wavelab-coastal-hero.svg';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
  if (!date) return 'Unavailable';

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PUBLIC_CHART_TIME_ZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(date);
  } catch {
    return 'Unavailable';
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

function glassPanel(extra = '') {
  return cx(
    'rounded-[2rem] border border-white/70 bg-white/[0.78] shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl',
    extra,
  );
}

function LiquidBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-44 top-24 h-[560px] w-[560px] rounded-full bg-sky-200/55 blur-3xl" />
      <div className="absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-teal-100/70 blur-3xl" />
    </div>
  );
}

function SummaryGlassRow({ icon: Icon, label, value }) {
  return (
    <div className="group flex items-center gap-4 rounded-3xl border border-white/60 bg-white/[0.34] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition hover:bg-white/[0.48]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.52] text-blue-700 shadow-inner">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-950">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-slate-700">{value}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-slate-500/70 transition group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
    </div>
  );
}

function PublicLandingHeader({ lastUpdated, menuOpen, onToggleMenu, onCloseMenu }) {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const navLinks = [
    { label: 'Latest Forecast', href: '#latest' },
    { label: 'Charts', to: '/charts' },
    { label: 'Archive', to: '/charts' },
    { label: 'About', href: '#about' },
  ];

  const renderDesktopNavLink = (item) => {
    const className = 'rounded-xl px-1 py-2 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70';
    return item.to ? (
      <Link key={item.label} to={item.to} className={className}>{item.label}</Link>
    ) : (
      <a key={item.label} href={item.href} className={className}>{item.label}</a>
    );
  };

  const renderMobileNavLink = (item) => {
    const className = 'rounded-2xl px-4 py-3 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70';
    return item.to ? (
      <Link key={item.label} to={item.to} onClick={onCloseMenu} className={className}>{item.label}</Link>
    ) : (
      <a key={item.label} href={item.href} onClick={onCloseMenu} className={className}>{item.label}</a>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/[0.88] shadow-sm backdrop-blur-2xl">
      <nav className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8" aria-label="Wavelab Public navigation">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2" onClick={onCloseMenu}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-900/20">
            <Waves size={27} aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Wavelab</span>
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">Public</span>
            </span>
            <span className="hidden text-xs font-bold text-slate-500 sm:block">Published marine wave forecasts</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-black text-slate-700 lg:flex">
          {navLinks.map(renderDesktopNavLink)}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="hidden items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-right xl:flex">
            <Clock size={18} className="text-blue-700" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Last updated</p>
              <p className="text-sm font-black text-blue-700">{lastUpdated ? formatDateTime(lastUpdated) : 'When charts publish'}</p>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2"
          >
            <User size={18} aria-hidden="true" />
            Staff Dashboard
          </Link>

          <button
            type="button"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDarkMode}
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2"
          >
            {isDarkMode ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="wavelab-public-mobile-menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={onToggleMenu}
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>

      {menuOpen ? (
        <div id="wavelab-public-mobile-menu" className="border-t border-slate-200 bg-white/[0.95] px-4 py-4 shadow-lg backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 text-sm font-black text-slate-800">
            {navLinks.map(renderMobileNavLink)}
            <div className="mt-2 rounded-2xl bg-blue-50 px-4 py-3 text-blue-800">Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'When charts publish'}</div>
            <Link to="/login" onClick={onCloseMenu} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-white shadow-lg shadow-blue-900/20">
              <User size={18} aria-hidden="true" /> Staff Dashboard
            </Link>
            <button
              type="button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDarkMode}
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm"
            >
              {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PublicLandingFooter({ lastUpdated }) {
  return (
    <footer className="border-t border-blue-900/20 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-blue-700"><Waves size={25} aria-hidden="true" /></span>
            <div><span className="text-2xl font-black">Wavelab</span> <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-black uppercase">Public</span></div>
          </div>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-300">Public access to published wave forecast charts for communities, agencies, researchers, and marine users.</p>
          <p className="mt-3 text-xs font-bold text-slate-400">Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'Unavailable'}</p>
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-cyan-100">Navigate</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <a href="#latest" className="hover:text-white">Latest Forecasts</a>
            <Link to="/charts" className="hover:text-white">Charts</Link>
            <Link to="/charts" className="hover:text-white">Archive</Link>
            <a href="#about" className="hover:text-white">About</a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-cyan-100">Data notice</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">Forecast information is provided for guidance and situational awareness. Always refer to official marine advisories and local conditions.</p>
        </div>
      </div>
    </footer>
  );
}

function StateNotice({ title, children, tone = 'slate', action }) {
  const toneClass = tone === 'red'
    ? 'border-red-200 bg-red-50/90 text-red-700'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50/90 text-amber-800'
      : 'border-slate-200 bg-white/[0.86] text-slate-700';

  return (
    <div className={cx('rounded-3xl border p-6 text-center shadow-sm backdrop-blur-xl', toneClass)}>
      <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
      <div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function ForecastDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
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

function CTAButton({ to, children, variant = 'primary', icon: Icon, disabled = false, onClick }) {
  const baseClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2';
  const variantClass = variant === 'secondary'
    ? 'border border-blue-200 bg-white/80 text-blue-800 shadow-sm hover:border-blue-300 hover:bg-blue-50'
    : 'bg-blue-700 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800';
  const disabledClass = 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 shadow-none';
  const className = cx(baseClass, disabled ? disabledClass : variantClass);
  const content = <>{Icon ? <Icon size={18} aria-hidden="true" /> : null}{children}</>;

  if (disabled || !to) {
    return <button type="button" className={className} disabled={disabled} onClick={onClick}>{content}</button>;
  }

  return <Link to={to} className={className}>{content}</Link>;
}

function PdfAction({ state, onRetry }) {
  if (state === 'preparing') return <CTAButton disabled icon={Download}>Preparing PDF...</CTAButton>;
  if (state === 'unavailable') return <CTAButton disabled icon={Download}>PDF Unavailable</CTAButton>;
  if (state === 'error') return <CTAButton icon={RefreshCw} onClick={onRetry}>Try Again</CTAButton>;
  return <CTAButton to="/charts" variant="secondary" icon={Download}>Download PDF</CTAButton>;
}

function ChartFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(240,253,250,0.95))] text-blue-300" aria-label="Wave forecast chart preview unavailable">
      <div className="rounded-full border border-white/80 bg-white/65 p-6 shadow-inner">
        <Waves size={38} aria-hidden="true" />
      </div>
    </div>
  );
}

function ChartPreviewCard({ slot, chart }) {
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle || slot.title || 'Published wave chart';
  const coverage = slot?.badge || slot?.label || chart?.chartType || 'Published chart';

  return (
    <article className={glassPanel('group flex min-h-[360px] flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_rgba(15,23,42,0.14)]')}>
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {hasChart ? (
          <PublicPublishedChartPreviewMap
            projectId={chart._id}
            initialRaster={chart.raster}
            isDarkMode={false}
            height={null}
            className="h-full w-full rounded-none border-0"
            aria-label={`${title} preview map`}
          />
        ) : <ChartFallback />}
        <div className="absolute left-4 top-4 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/20">{coverage}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-black leading-snug text-slate-950">{title}</h3>
        <dl className="mt-4 grid gap-2 text-sm text-slate-600">
          <div><dt className="sr-only">Valid date and time</dt><dd>Valid: {hasChart ? formatDateTime(chart.forecastDate) : 'Unavailable'}</dd></div>
          <div><dt className="sr-only">Region or coverage area</dt><dd>Coverage: {coverage}</dd></div>
        </dl>
        <div className="mt-auto pt-5">
          {hasChart ? (
            <Link to={`/charts/${chart._id}`} className="inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70">
              View Chart <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : <span className="text-sm font-black text-slate-500">Chart unavailable</span>}
        </div>
      </div>
    </article>
  );
}

function GuideCard({ icon: Icon, title, children }) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white/[0.78] p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={28} aria-hidden="true" /></div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">{children}</p>
    </article>
  );
}

function RegionCard({ icon: Icon, title }) {
  return (
    <Link to="/charts" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/[0.78] p-4 text-sm font-black text-slate-900 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70">
      <Icon size={24} className="text-blue-700" aria-hidden="true" />
      {title}
    </Link>
  );
}

function LatestForecastCard({ latestDate, forecastPeriodLabel, availableCount, latestUpdatedAt, latestPrimaryChart, pdfState, onRetry }) {
  const forecastLink = latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts';

  return (
    <section id="latest" aria-labelledby="latest-forecast-heading" className={glassPanel('grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]')}>
      <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-blue-700 text-white shadow-lg shadow-blue-900/20"><CalendarDays size={38} aria-hidden="true" /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Latest Published Forecast</p>
          <h2 id="latest-forecast-heading" className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">Wave Forecast Package {latestDate ? formatDate(latestDate) : 'Latest'}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700"><CheckCircle2 size={14} aria-hidden="true" /> Published</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">Valid: {forecastPeriodLabel}</span>
          </div>
          <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-700">This public view only lists forecast outputs that have completed the publication workflow. Drafts, review notes, and internal workflow details are not shown.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ForecastDetail icon={CalendarDays} label="Forecast Date" value={latestDate ? formatDate(latestDate) : 'Latest'} />
            <ForecastDetail icon={Clock} label="Valid Period" value={forecastPeriodLabel} />
            <ForecastDetail icon={Layers} label="Available Charts" value={`${availableCount} published chart${availableCount === 1 ? '' : 's'}`} />
            <ForecastDetail icon={Clock} label="Last Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Unavailable'} />
          </div>
        </div>
      </div>

      <aside className="rounded-[1.6rem] border border-blue-100 bg-blue-50/80 p-5 shadow-inner">
        <p className="text-base font-black text-slate-950">Open the latest forecast</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">Go directly to the newest published chart package, or browse the full public chart archive.</p>
        <div className="mt-5 grid gap-3">
          <CTAButton to={forecastLink} icon={ArrowRight}>Open Forecast</CTAButton>
          <PdfAction state={pdfState} onRetry={onRetry} />
          <CTAButton to="/charts" variant="secondary" icon={FileText}>Browse Archive</CTAButton>
        </div>
      </aside>
    </section>
  );
}

export default function Home() {
  const [state, setState] = useState({ loading: true, error: '', projects: [] });
  const [reloadToken, setReloadToken] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { document.title = 'Wavelab Public | Public Wave Forecasts'; }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, mode: 'active', signal: controller.signal })
      .then((data) => {
        const allProjects = Array.isArray(data?.projects) ? data.projects : [];
        const windowedProjects = filterProjectsToPublicChartWindow(allProjects, getPublicChartTenDayWindow(allProjects));
        setState({ loading: false, error: '', projects: windowedProjects });
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
  const pdfState = state.loading ? 'preparing' : state.error ? 'error' : availableCount > 0 ? 'ready' : 'unavailable';

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <PublicLandingHeader
        lastUpdated={latestUpdatedAt}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <LiquidBackdrop />

      <div className="relative z-10">
        <section
          className="relative overflow-hidden border-b border-white/60 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(248,250,252,0.96) 0%, rgba(239,246,255,0.86) 34%, rgba(240,253,250,0.44) 58%, rgba(255,255,255,0.04) 100%), url(${PUBLIC_HERO_IMAGE_URL})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_68%_18%,rgba(6,182,212,0.08),transparent_26%)]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:pb-20 lg:pt-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm backdrop-blur-xl">
                <Waves size={16} aria-hidden="true" /> Wavelab Public
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">Public Wave Forecasts, Made Easier to Access</h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">View the latest published wave forecast charts and marine forecast outputs from Wavelab in one clear public portal.</p>
              <p className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-bold leading-relaxed text-slate-700 shadow-sm backdrop-blur-xl">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                Published forecast outputs are prepared and reviewed before public release.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <CTAButton to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} icon={Layers}>View Latest Forecast Charts</CTAButton>
                <CTAButton to="/charts" variant="secondary" icon={FileText}>Browse Forecast Archive</CTAButton>
              </div>
            </div>

            <aside className="relative self-center rounded-[2rem] border border-white/65 bg-white/[0.28] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] ring-1 ring-white/35 backdrop-blur-[26px] lg:translate-x-3" aria-label="Latest public forecast summary">
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_22%_15%,rgba(255,255,255,0.55),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))]" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Latest summary</p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">{latestDate ? formatDate(latestDate) : 'Published charts'}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-700">{state.loading ? 'Preparing latest public forecast access...' : state.error ? 'Forecast data is temporarily unavailable.' : recentProjects.length ? forecastPeriodLabel : 'No published forecast charts are available right now.'}</p>
                <div className="mt-5 grid gap-3">
                  <SummaryGlassRow icon={Layers} label="Charts" value={state.loading ? 'Preparing' : `${availableCount} available`} />
                  <SummaryGlassRow icon={Clock} label="Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Unavailable'} />
                  <SummaryGlassRow icon={Eye} label="Public status" value={state.loading ? 'Preparing' : recentProjects.length ? 'Published' : 'Unavailable'} />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          {state.loading ? (
            <div className="grid gap-5">
              <StateNotice title="Loading latest forecast">Fetching published WaveLab charts and preparing the public forecast summary.</StateNotice>
              <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className={glassPanel('h-48 animate-pulse')} />)}</div>
            </div>
          ) : null}

          {!state.loading && state.error ? (
            <StateNotice tone="red" title="Forecasts could not be loaded" action={<CTAButton icon={RefreshCw} onClick={() => setReloadToken((value) => value + 1)}>Try Again</CTAButton>}>
              <p>{state.error}</p><p className="mt-1">Refresh the public forecast list or try again later.</p>
            </StateNotice>
          ) : null}

          {!state.loading && !state.error && !recentProjects.length ? (
            <StateNotice tone="amber" title="No published forecast charts are available right now">Published forecast charts will appear here once they are available for public release. Please refer to official advisory channels for current marine updates.</StateNotice>
          ) : null}

          {!state.loading && !state.error && recentProjects.length > 0 ? (
            <LatestForecastCard latestDate={latestDate} forecastPeriodLabel={forecastPeriodLabel} availableCount={availableCount} latestUpdatedAt={latestUpdatedAt} latestPrimaryChart={latestPrimaryChart} pdfState={pdfState} onRetry={() => setReloadToken((value) => value + 1)} />
          ) : null}
        </section>

        <section aria-labelledby="latest-charts-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Latest chart previews</p><h2 id="latest-charts-heading" className="mt-2 text-3xl font-black text-slate-950">Published forecast charts</h2></div>
            <Link to="/charts" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70">View all charts <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {!state.loading && !state.error && recentProjects.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <ChartPreviewCard key={slot.chartType} slot={slot} chart={chartByType.get(slot.chartType)} />)}</div>
          ) : <StateNotice title="Chart previews unavailable">No published forecast charts are available for preview right now.</StateNotice>}
        </section>

        <section id="guide" aria-labelledby="forecast-guide-heading" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">How to read the forecast</p><h2 id="forecast-guide-heading" className="mt-2 text-3xl font-black text-slate-950">Simple guide for public users</h2></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <GuideCard icon={Waves} title="Wave Height">Wave height values show estimated sea wave conditions in meters.</GuideCard>
            <GuideCard icon={Globe2} title="Color Scale">Colors represent wave height ranges. Higher values may indicate rougher sea conditions.</GuideCard>
            <GuideCard icon={Clock} title="Forecast Time">Each forecast chart is valid for a specific date and time.</GuideCard>
            <GuideCard icon={ShieldCheck} title="Safety Reminder">Use forecasts together with official advisories and local conditions.</GuideCard>
          </div>
        </section>

        <section aria-labelledby="regions-heading" className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className={glassPanel('p-6 sm:p-8')}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Explore by area</p>
            <h2 id="regions-heading" className="mt-2 text-3xl font-black text-slate-950">Regional discovery</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-700">Use these public entry points to browse published charts by commonly requested marine areas. Filters can be connected as the archive gains region-specific routing.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <RegionCard icon={MapPin} title="Luzon Waters" /><RegionCard icon={MapPin} title="Visayas Waters" /><RegionCard icon={MapPin} title="Mindanao Waters" /><RegionCard icon={Waves} title="West Philippine Sea" /><RegionCard icon={Waves} title="Philippine Sea" /><RegionCard icon={Map} title="Coastal Areas" />
            </div>
          </div>
          <div className="grid gap-5">
            <section className={glassPanel('p-6')} aria-labelledby="archive-heading"><h2 id="archive-heading" className="text-2xl font-black text-slate-950">Need an earlier forecast?</h2><p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">Browse published forecast packages by date, region, or chart type.</p><div className="mt-5"><CTAButton to="/charts" icon={ArrowRight}>Open Forecast Archive</CTAButton></div></section>
            <section id="about" className={glassPanel('p-6')} aria-labelledby="about-wavelab-heading"><h2 id="about-wavelab-heading" className="text-2xl font-black text-slate-950">About Wavelab</h2><p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">Wavelab is a forecasting workflow system that helps prepare, review, and publish wave forecast outputs. Wavelab Public provides easier access to published charts and forecast packages for communities, agencies, and marine users.</p></section>
          </div>
        </section>

        <section aria-labelledby="forecast-notice-heading" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row"><AlertTriangle size={34} className="shrink-0 text-amber-600" aria-hidden="true" /><div><h2 id="forecast-notice-heading" className="text-xl font-black text-slate-950">Important Notice</h2><p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">Forecast information is provided for guidance and situational awareness. Always refer to official marine advisories, warnings, and local conditions before making travel or operational decisions.</p></div></div>
          </div>
        </section>
      </div>
      <PublicLandingFooter lastUpdated={latestUpdatedAt} />
    </main>
  );
}
