import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Layers,
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
const PUBLIC_HERO_IMAGE_URL = '/images/WavelabPublicHero.png';
const PUBLIC_DARK_HERO_IMAGE_URL = '/images/WavelabPublicHeroNight.png';

const HOME_LIQUID_CSS = `
.wavelab-home .hero-bg-layer { transition: opacity 900ms ease, filter 900ms ease; }
.wavelab-home > header.sticky {
  position: fixed !important;
  inset: 0 0 auto 0 !important;
  z-index: 50 !important;
  background: rgba(255,255,255,0.012) !important;
  -webkit-backdrop-filter: blur(5px) saturate(165%) contrast(104%) brightness(1.02) !important;
  backdrop-filter: blur(5px) saturate(165%) contrast(104%) brightness(1.02) !important;
  border-color: rgba(255,255,255,0.38) !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(255,255,255,0.16) !important;
}
.wavelab-home.bg-slate-950 > header.sticky {
  background: rgba(2,6,23,0.020) !important;
  border-color: rgba(255,255,255,0.10) !important;
}
.wavelab-home .hero-inner {
  min-height: clamp(760px, 86vh, 900px);
  align-items: center;
  padding-top: 11rem !important;
  padding-bottom: 7rem !important;
}
.wavelab-home .hero-bottom-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 9rem;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,0.92) 78%, rgba(248,250,252,1));
}
.wavelab-home.bg-slate-950 .hero-bottom-fade {
  background: linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.86) 78%, rgba(2,6,23,1));
}
.wavelab-home .home-liquid {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: rgba(255,255,255,0.30) !important;
  border-color: rgba(255,255,255,0.64) !important;
  -webkit-backdrop-filter: blur(16px) saturate(155%) contrast(104%) brightness(1.02) !important;
  backdrop-filter: blur(16px) saturate(155%) contrast(104%) brightness(1.02) !important;
  box-shadow: 0 28px 74px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(255,255,255,0.20), inset 0 0 0 1px rgba(255,255,255,0.08) !important;
}
.wavelab-home .home-liquid.is-dark {
  background: rgba(2,6,23,0.34) !important;
  border-color: rgba(255,255,255,0.14) !important;
  -webkit-backdrop-filter: blur(16px) saturate(165%) contrast(108%) brightness(1.04) !important;
  backdrop-filter: blur(16px) saturate(165%) contrast(108%) brightness(1.04) !important;
  box-shadow: 0 30px 84px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.035) !important;
}
.wavelab-home .home-liquid::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(120% 85% at 50% -18%, rgba(255,255,255,0.18), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.055), transparent 38%, rgba(255,255,255,0.012));
  opacity: 0.22;
  mix-blend-mode: screen;
}
.wavelab-home .home-liquid.is-dark::before { opacity: 0.12; }
.wavelab-home .home-liquid > * { position: relative; z-index: 1; }
.wavelab-home .home-liquid-row {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.26) !important;
  border-color: rgba(255,255,255,0.56) !important;
  -webkit-backdrop-filter: blur(12px) saturate(150%) contrast(104%) brightness(1.02) !important;
  backdrop-filter: blur(12px) saturate(150%) contrast(104%) brightness(1.02) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -12px 22px rgba(15,23,42,0.025), inset 0 0 0 1px rgba(255,255,255,0.10) !important;
}
.wavelab-home .home-liquid-row.is-dark {
  background: rgba(255,255,255,0.055) !important;
  border-color: rgba(255,255,255,0.13) !important;
}
.wavelab-home .hero-ph-map {
  pointer-events: none;
  min-height: clamp(440px, 56vh, 660px);
}
.wavelab-home .hero-ph-map::before {
  content: '';
  position: absolute;
  inset: 8% 0 4% 0;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0.42), rgba(14,165,233,0.12) 42%, transparent 70%);
  filter: blur(34px);
  opacity: 0.68;
}
.wavelab-home.bg-slate-950 .hero-ph-map::before {
  background: radial-gradient(circle at 50% 42%, rgba(103,232,249,0.18), rgba(14,165,233,0.10) 42%, transparent 70%);
  opacity: 0.74;
}
.wavelab-home .ph-map-shape {
  width: min(100%, 430px);
  height: clamp(420px, 54vh, 650px);
  margin-inline: auto;
  filter: drop-shadow(0 30px 38px rgba(15,23,42,0.18)) drop-shadow(0 0 18px rgba(255,255,255,0.42));
  opacity: 0.94;
}
.wavelab-home.bg-slate-950 .ph-map-shape {
  filter: drop-shadow(0 32px 42px rgba(0,0,0,0.38)) drop-shadow(0 0 22px rgba(103,232,249,0.18));
  opacity: 0.92;
}
.wavelab-home .solid-blue,
.wavelab-home .solid-blue:hover,
.wavelab-home .solid-blue:focus,
.wavelab-home .bg-blue-700 {
  background: #1d4ed8 !important;
  color: #fff !important;
  border-color: transparent !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
.wavelab-home .solid-blue:hover { background: #1e40af !important; }
.wavelab-home .secondary-action {
  background: rgba(255,255,255,0.40) !important;
  color: #1d4ed8 !important;
  border-color: rgba(147,197,253,0.72) !important;
}
.wavelab-home .secondary-action.is-dark {
  background: rgba(255,255,255,0.055) !important;
  color: #cffafe !important;
  border-color: rgba(255,255,255,0.16) !important;
}
.wavelab-home .section-heading { color: #0f172a; }
.wavelab-home.bg-slate-950 .section-heading { color: #fff; }
.wavelab-home .muted-copy { color: #334155; }
.wavelab-home.bg-slate-950 .muted-copy { color: rgba(226,232,240,0.86); }
@media (max-width: 1023px) {
  .wavelab-home .hero-inner {
    min-height: auto;
    padding-top: 8.5rem !important;
    padding-bottom: 4rem !important;
  }
  .wavelab-home .hero-ph-map { min-height: 360px; }
  .wavelab-home .ph-map-shape { height: 360px; }
}
`;

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function parsePublicDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const match = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 16, 0, 0));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value, options = {}) {
  const date = parsePublicDate(value);
  if (!date) return 'Unavailable';
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', ...options }).format(date);
  } catch {
    return 'Unavailable';
  }
}

function formatDateTime(value) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' });
}

function formatCurrentTime(value) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: PUBLIC_CHART_TIME_ZONE, hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(value);
  } catch {
    return '--:--';
  }
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

function LiquidPanel({ children, isDarkMode, className = '', as: Component = 'div', ...props }) {
  return <Component className={cx('home-liquid border', isDarkMode && 'is-dark', className)} {...props}>{children}</Component>;
}

function LiquidRow({ children, isDarkMode, className = '' }) {
  return <div className={cx('home-liquid-row border', isDarkMode && 'is-dark', className)}>{children}</div>;
}

function CTAButton({ to, children, variant = 'primary', icon: Icon, disabled = false, onClick, isDarkMode = false }) {
  const baseClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2';
  const variantClass = variant === 'secondary' ? cx('secondary-action border backdrop-blur-md', isDarkMode && 'is-dark') : 'solid-blue shadow-lg shadow-blue-900/20 hover:shadow-blue-900/25';
  const disabledClass = isDarkMode ? 'pointer-events-none cursor-not-allowed border-white/10 bg-white/[0.05] text-slate-400 shadow-none' : 'pointer-events-none cursor-not-allowed border-slate-200 bg-white/50 text-slate-500 shadow-none';
  const content = <>{Icon ? <Icon size={18} aria-hidden="true" /> : null}{children}</>;
  if (disabled || !to) return <button type="button" className={cx(baseClass, disabled ? disabledClass : variantClass)} disabled={disabled} onClick={onClick}>{content}</button>;
  return <Link to={to} className={cx(baseClass, variantClass)}>{content}</Link>;
}

function PublicLandingHeader({ currentTime, menuOpen, onToggleMenu, onCloseMenu, isDarkMode, setIsDarkMode }) {
  const navLinks = [{ label: 'Latest', href: '#latest' }, { label: 'Charts', to: '/charts' }, { label: 'Guide', href: '#guide' }, { label: 'About', href: '#about' }];
  const navClass = cx('rounded-xl px-1 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500/70', isDarkMode ? 'text-slate-100 hover:text-cyan-100' : 'text-slate-900 hover:text-blue-700');
  const mobileNavClass = cx('rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/70', isDarkMode ? 'text-slate-100 hover:bg-white/[0.07]' : 'text-slate-800 hover:bg-blue-50');
  const renderNav = (item) => item.to ? <Link key={item.label} to={item.to} className={navClass}>{item.label}</Link> : <a key={item.label} href={item.href} className={navClass}>{item.label}</a>;
  const renderMobileNav = (item) => item.to ? <Link key={item.label} to={item.to} onClick={onCloseMenu} className={mobileNavClass}>{item.label}</Link> : <a key={item.label} href={item.href} onClick={onCloseMenu} className={mobileNavClass}>{item.label}</a>;
  return (
    <header className={cx('sticky top-0 z-40 border-b shadow-sm backdrop-blur-2xl transition-colors duration-300', isDarkMode ? 'border-white/10 bg-slate-950/[0.84]' : 'border-white/60 bg-white/[0.88]')}>
      <nav className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8" aria-label="Wavelab navigation">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2" onClick={onCloseMenu}>
          <span className="solid-blue flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-900/20"><Waves size={27} aria-hidden="true" /></span>
          <span className="min-w-0 leading-tight"><span className="flex flex-wrap items-center gap-2"><span className={cx('text-xl font-black tracking-tight sm:text-2xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Wavelab</span><span className={cx('rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'bg-cyan-400/10 text-cyan-100' : 'bg-cyan-50 text-blue-700')}>Public</span></span><span className={cx('hidden text-xs font-bold sm:block', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Published marine forecasts</span></span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-black lg:flex">{navLinks.map(renderNav)}</div>
        <div className="hidden items-center gap-3 lg:flex">
          <div className={cx('hidden items-center gap-3 rounded-2xl border px-4 py-2.5 text-right xl:flex', isDarkMode ? 'border-white/10 bg-white/[0.06]' : 'border-blue-100 bg-blue-50/70')}>
            <Clock size={18} className={isDarkMode ? 'text-cyan-100' : 'text-blue-700'} aria-hidden="true" />
            <div><p className={cx('text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-300' : 'text-slate-500')}>Current time</p><p className={cx('text-sm font-black', isDarkMode ? 'text-cyan-100' : 'text-blue-700')}>{formatCurrentTime(currentTime)}</p></div>
          </div>
          <Link to="/login" className="solid-blue inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-lg shadow-blue-900/20 transition hover:shadow-blue-900/25 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2"><User size={18} aria-hidden="true" /> Staff Dashboard</Link>
          <button type="button" aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={isDarkMode} onClick={() => setIsDarkMode((prev) => !prev)} className={cx('inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2', isDarkMode ? 'border-white/10 bg-white/[0.07] text-cyan-100 hover:bg-white/[0.12]' : 'border-slate-200 bg-white/70 text-slate-900 hover:border-blue-200 hover:bg-blue-50')}>{isDarkMode ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}</button>
        </div>
        <button type="button" className={cx('inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 lg:hidden', isDarkMode ? 'border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]' : 'border-slate-200 bg-white/70 text-slate-900 hover:bg-blue-50')} aria-expanded={menuOpen} aria-controls="wavelab-public-mobile-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={onToggleMenu}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
      </nav>
      {menuOpen ? <div id="wavelab-public-mobile-menu" className={cx('border-t px-4 py-4 shadow-lg backdrop-blur-xl lg:hidden', isDarkMode ? 'border-white/10 bg-slate-950/[0.95]' : 'border-slate-200 bg-white/[0.95]')}><div className="mx-auto grid max-w-7xl gap-2 text-sm font-black">{navLinks.map(renderMobileNav)}<div className={cx('mt-2 rounded-2xl px-4 py-3', isDarkMode ? 'bg-white/[0.07] text-cyan-100' : 'bg-blue-50 text-blue-800')}>Current time: {formatCurrentTime(currentTime)}</div><Link to="/login" onClick={onCloseMenu} className="solid-blue inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 shadow-lg shadow-blue-900/20"><User size={18} aria-hidden="true" /> Staff Dashboard</Link></div></div> : null}
    </header>
  );
}

function HeroPhilippinesMap() {
  return (
    <aside className="hero-ph-map relative hidden items-center justify-center lg:flex" aria-label="Liquid glass map of the Philippines">
      <div className="ph-map-shape relative z-10" role="img" aria-label="Philippines map" />
    </aside>
  );
}

function ForecastDetail({ icon: Icon, label, value, isDarkMode }) {
  return <LiquidRow isDarkMode={isDarkMode} className={cx('flex gap-3 rounded-2xl p-4', isDarkMode ? 'border-white/10' : 'border-white/55')}><div className={cx('mt-0.5', isDarkMode ? 'text-cyan-100' : 'text-blue-700')}><Icon size={19} aria-hidden="true" /></div><div><p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{label}</p><p className={cx('mt-1 text-sm font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{value}</p></div></LiquidRow>;
}

function StateNotice({ title, children, tone = 'slate', action, isDarkMode }) {
  const toneClass = tone === 'red' ? (isDarkMode ? 'border-red-400/20 text-red-100' : 'border-red-200 text-red-700') : tone === 'amber' ? (isDarkMode ? 'border-amber-300/20 text-amber-100' : 'border-amber-200 text-amber-800') : (isDarkMode ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700');
  return <LiquidPanel isDarkMode={isDarkMode} className={cx('rounded-3xl p-6 text-center', toneClass)}><p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p><div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</LiquidPanel>;
}

function PdfAction({ state, onRetry, isDarkMode }) {
  if (state === 'preparing') return <CTAButton disabled icon={Download} isDarkMode={isDarkMode}>Preparing PDF...</CTAButton>;
  if (state === 'unavailable') return <CTAButton disabled icon={Download} isDarkMode={isDarkMode}>PDF Unavailable</CTAButton>;
  if (state === 'error') return <CTAButton icon={RefreshCw} onClick={onRetry} isDarkMode={isDarkMode}>Try Again</CTAButton>;
  return <CTAButton to="/charts" variant="secondary" icon={Download} isDarkMode={isDarkMode}>Download PDF</CTAButton>;
}

function ChartFallback() {
  return <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(224,242,254,0.55),rgba(240,253,250,0.55))] text-blue-300" aria-label="Wave forecast chart preview unavailable"><div className="rounded-full border border-white/80 bg-white/40 p-6 shadow-inner"><Waves size={38} aria-hidden="true" /></div></div>;
}

function ChartPreviewCard({ slot, chart, isDarkMode }) {
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle || slot.title || 'Published wave chart';
  const coverage = slot?.badge || slot?.label || chart?.chartType || 'Published chart';
  return <LiquidPanel isDarkMode={isDarkMode} as="article" className="group flex min-h-[360px] flex-col overflow-hidden rounded-[1.8rem] transition duration-300 hover:-translate-y-1 hover:border-blue-200"><div className="relative h-44 overflow-hidden bg-slate-100/45">{hasChart ? <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDarkMode} height={null} className="h-full w-full rounded-none border-0" aria-label={`${title} preview map`} /> : <ChartFallback />}<div className="solid-blue absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-950/20">{coverage}</div></div><div className="flex flex-1 flex-col p-5"><h3 className={cx('text-base font-black leading-snug', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h3><dl className={cx('mt-4 grid gap-2 text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}><div><dt className="sr-only">Valid date and time</dt><dd>Valid: {hasChart ? formatDateTime(chart.forecastDate) : 'Unavailable'}</dd></div><div><dt className="sr-only">Coverage</dt><dd>Coverage: {coverage}</dd></div></dl><div className="mt-auto pt-5">{hasChart ? <Link to={`/charts/${chart._id}`} className="inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70">View Chart <ArrowRight size={14} aria-hidden="true" /></Link> : <span className={cx('text-sm font-black', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Chart unavailable</span>}</div></div></LiquidPanel>;
}

function GuideCard({ icon: Icon, title, children, isDarkMode }) {
  return <LiquidPanel isDarkMode={isDarkMode} as="article" className="rounded-[1.65rem] p-6"><div className={cx('mb-5 flex h-14 w-14 items-center justify-center rounded-2xl', isDarkMode ? 'bg-white/[0.08] text-cyan-100' : 'bg-blue-50/80 text-blue-700')}><Icon size={28} aria-hidden="true" /></div><h3 className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h3><p className={cx('mt-2 text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{children}</p></LiquidPanel>;
}

function LatestForecastCard({ latestDate, forecastPeriodLabel, availableCount, latestUpdatedAt, latestPrimaryChart, pdfState, onRetry, isDarkMode }) {
  const forecastLink = latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts';
  return <LiquidPanel id="latest" isDarkMode={isDarkMode} as="section" className="grid gap-8 rounded-[2rem] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]" aria-labelledby="latest-forecast-heading"><div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]"><div className="solid-blue flex h-20 w-20 items-center justify-center rounded-[1.6rem] shadow-lg shadow-blue-900/20"><CalendarDays size={38} aria-hidden="true" /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Latest forecast</p><h2 id="latest-forecast-heading" className={cx('mt-3 text-3xl font-black leading-tight sm:text-4xl', isDarkMode ? 'text-white' : 'text-slate-950')}>{latestDate ? formatDate(latestDate) : 'Published package'}</h2><div className="mt-4 flex flex-wrap gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-black uppercase text-emerald-700"><CheckCircle2 size={14} aria-hidden="true" /> Published</span><span className={cx('rounded-full px-3 py-1 text-xs font-black', isDarkMode ? 'bg-blue-400/10 text-cyan-100' : 'bg-blue-50/90 text-blue-800')}>{forecastPeriodLabel}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ForecastDetail icon={CalendarDays} label="Forecast Date" value={latestDate ? formatDate(latestDate) : 'Latest'} isDarkMode={isDarkMode} /><ForecastDetail icon={Clock} label="Valid Period" value={forecastPeriodLabel} isDarkMode={isDarkMode} /><ForecastDetail icon={Layers} label="Charts" value={`${availableCount} available`} isDarkMode={isDarkMode} /><ForecastDetail icon={Clock} label="Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Unavailable'} isDarkMode={isDarkMode} /></div></div></div><LiquidPanel isDarkMode={isDarkMode} as="aside" className="rounded-[1.6rem] p-5"><p className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Open forecast</p><p className={cx('mt-2 text-sm leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>Open the newest published chart package or browse earlier outputs.</p><div className="mt-5 grid gap-3"><CTAButton to={forecastLink} icon={ArrowRight} isDarkMode={isDarkMode}>Open Forecast</CTAButton><PdfAction state={pdfState} onRetry={onRetry} isDarkMode={isDarkMode} /><CTAButton to="/charts" variant="secondary" icon={FileText} isDarkMode={isDarkMode}>Browse Archive</CTAButton></div></LiquidPanel></LiquidPanel>;
}

export default function Home() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [state, setState] = useState({ loading: true, error: '', projects: [] });
  const [reloadToken, setReloadToken] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => { document.title = 'Wavelab | Public Wave Forecasts'; }, []);
  useEffect(() => { const timer = window.setInterval(() => setCurrentTime(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const controller = new AbortController(); setState((prev) => ({ ...prev, loading: true, error: '' })); fetchPublicPublishedCharts({ page: 1, limit: RECENT_FETCH_LIMIT, mode: 'active', signal: controller.signal }).then((data) => { const allProjects = Array.isArray(data?.projects) ? data.projects : []; const windowedProjects = filterProjectsToPublicChartWindow(allProjects, getPublicChartTenDayWindow(allProjects)); setState({ loading: false, error: '', projects: windowedProjects }); }).catch((error) => { if (error?.name !== 'AbortError') setState({ loading: false, error: error?.message || 'Failed to load public forecasts.', projects: [] }); }); return () => controller.abort(); }, [reloadToken]);

  const recentProjects = state.projects;
  const historyGroups = useMemo(() => groupPublicChartHistory(recentProjects), [recentProjects]);
  const latestDate = historyGroups[0]?.dateKey || '';
  const chartByType = useMemo(() => groupPublicChartsByTypeForDate(recentProjects, latestDate), [latestDate, recentProjects]);
  const availableCount = useMemo(() => getPublicChartAvailableCount(chartByType), [chartByType]);
  const latestUpdatedAt = useMemo(() => getLatestUpdatedAt(recentProjects), [recentProjects]);
  const latestPrimaryChart = useMemo(() => PUBLIC_CHART_SLOTS.map((slot) => chartByType.get(slot.chartType)).find(Boolean), [chartByType]);
  const forecastPeriodLabel = getForecastPeriodLabel(latestDate);
  const pdfState = state.loading ? 'preparing' : state.error ? 'error' : availableCount > 0 ? 'ready' : 'unavailable';

  return <main className={cx('wavelab-home relative min-h-screen overflow-hidden transition-colors duration-500', isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950')}><style>{HOME_LIQUID_CSS}</style><PublicLandingHeader currentTime={currentTime} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} onCloseMenu={() => setMenuOpen(false)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /><div className="relative z-10"><section className="relative overflow-hidden border-b border-white/10"><div className="hero-bg-layer absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(248,250,252,0.96) 0%, rgba(239,246,255,0.84) 32%, rgba(240,253,250,0.36) 58%, rgba(255,255,255,0.02) 100%), url(${PUBLIC_HERO_IMAGE_URL})`, opacity: isDarkMode ? 0 : 1 }} aria-hidden="true" /><div className="hero-bg-layer absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,0.88) 0%, rgba(15,23,42,0.72) 34%, rgba(15,23,42,0.34) 58%, rgba(2,6,23,0.04) 100%), url(${PUBLIC_DARK_HERO_IMAGE_URL})`, opacity: isDarkMode ? 1 : 0 }} aria-hidden="true" /><div className={cx('absolute inset-0 transition-opacity duration-700', isDarkMode ? 'opacity-100 bg-[radial-gradient(circle_at_20%_18%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_68%_18%,rgba(45,212,191,0.10),transparent_26%)]' : 'opacity-100 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.14),transparent_30%),radial-gradient(circle_at_68%_18%,rgba(6,182,212,0.06),transparent_26%)]')} aria-hidden="true" /><div className="hero-bottom-fade" aria-hidden="true" /><div className="hero-inner relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8"><div><h1 className={cx('max-w-4xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-7xl', isDarkMode ? 'text-white drop-shadow-[0_8px_34px_rgba(0,0,0,0.35)]' : 'text-slate-950')}>Wave Forecasts, Made Easier to Access</h1><p className={cx('mt-6 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>View the latest published wave forecast charts and marine forecast outputs from Wavelab in one clear portal.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><CTAButton to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} icon={Layers} isDarkMode={isDarkMode}>View Latest Charts</CTAButton><CTAButton to="/charts" variant="secondary" icon={FileText} isDarkMode={isDarkMode}>Browse Archive</CTAButton></div></div><HeroPhilippinesMap /></div></section><section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">{state.loading ? <div className="grid gap-5"><StateNotice title="Loading forecast" isDarkMode={isDarkMode}>Fetching published charts.</StateNotice><div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <LiquidPanel key={item} isDarkMode={isDarkMode} className="h-48 animate-pulse rounded-[2rem]" />)}</div></div> : null}{!state.loading && state.error ? <StateNotice tone="red" title="Forecasts could not be loaded" action={<CTAButton icon={RefreshCw} onClick={() => setReloadToken((value) => value + 1)} isDarkMode={isDarkMode}>Try Again</CTAButton>} isDarkMode={isDarkMode}>{state.error}</StateNotice> : null}{!state.loading && !state.error && !recentProjects.length ? <StateNotice tone="amber" title="No published charts available" isDarkMode={isDarkMode}>Published forecast charts will appear here once available.</StateNotice> : null}{!state.loading && !state.error && recentProjects.length > 0 ? <LatestForecastCard latestDate={latestDate} forecastPeriodLabel={forecastPeriodLabel} availableCount={availableCount} latestUpdatedAt={latestUpdatedAt} latestPrimaryChart={latestPrimaryChart} pdfState={pdfState} onRetry={() => setReloadToken((value) => value + 1)} isDarkMode={isDarkMode} /> : null}</section><section aria-labelledby="latest-charts-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Latest charts</p><h2 id="latest-charts-heading" className="section-heading mt-2 text-3xl font-black">Published forecast charts</h2></div><Link to="/charts" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70">View all <ArrowRight size={15} aria-hidden="true" /></Link></div>{!state.loading && !state.error && recentProjects.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <ChartPreviewCard key={slot.chartType} slot={slot} chart={chartByType.get(slot.chartType)} isDarkMode={isDarkMode} />)}</div> : <StateNotice title="Chart previews unavailable" isDarkMode={isDarkMode}>No published forecast charts are available for preview right now.</StateNotice>}</section><section id="guide" aria-labelledby="forecast-guide-heading" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Guide</p><h2 id="forecast-guide-heading" className="section-heading mt-2 text-3xl font-black">Read the charts quickly</h2></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><GuideCard icon={Waves} title="Wave height" isDarkMode={isDarkMode}>Estimated sea wave conditions in meters.</GuideCard><GuideCard icon={Layers} title="Chart type" isDarkMode={isDarkMode}>Analysis and forecast windows are grouped by package.</GuideCard><GuideCard icon={Clock} title="Valid time" isDarkMode={isDarkMode}>Use the chart date and time before making decisions.</GuideCard><GuideCard icon={ShieldCheck} title="Safety" isDarkMode={isDarkMode}>Always check official advisories and local conditions.</GuideCard></div></section><section id="about" aria-labelledby="about-heading" className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8"><LiquidPanel isDarkMode={isDarkMode} className="rounded-[2rem] p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">About</p><h2 id="about-heading" className="section-heading mt-2 text-3xl font-black">Built for published wave forecasts</h2><p className="muted-copy mt-3 max-w-2xl text-sm font-medium leading-relaxed">Wavelab helps prepare, review, and publish wave forecast outputs. This public portal keeps the experience focused on released charts, forecast periods, and archive access.</p></LiquidPanel><LiquidPanel isDarkMode={isDarkMode} className="rounded-[2rem] p-6"><h2 className="section-heading text-2xl font-black">Need an earlier forecast?</h2><p className="muted-copy mt-3 text-sm font-medium leading-relaxed">Browse published packages by date or chart type.</p><div className="mt-5"><CTAButton to="/charts" icon={ArrowRight} isDarkMode={isDarkMode}>Open Archive</CTAButton></div></LiquidPanel></section><section aria-labelledby="forecast-notice-heading" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><LiquidPanel isDarkMode={isDarkMode} className="rounded-[2rem] p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row"><AlertTriangle size={34} className="shrink-0 text-amber-500" aria-hidden="true" /><div><h2 id="forecast-notice-heading" className="section-heading text-xl font-black">Important Notice</h2><p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/90' : 'text-slate-700')}>Forecast information is provided for guidance and situational awareness. Always refer to official marine advisories, warnings, and local conditions before making travel or operational decisions.</p></div></div></LiquidPanel></section></div></main>;
}
