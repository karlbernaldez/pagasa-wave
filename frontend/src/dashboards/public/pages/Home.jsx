import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Globe2,
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
const PUBLIC_HERO_IMAGE_URL = '/images/wavelab-coastal-hero.svg';
const PUBLIC_DARK_HERO_IMAGE_URL = '/images/wavelab-coastal-hero-night.svg';

const LIQUID_CSS = `
.hero-bg-layer { transition: opacity 900ms ease, filter 900ms ease; }
.crystal-panel {
  background: rgba(255,255,255,0.30);
  -webkit-backdrop-filter: blur(18px) saturate(170%) contrast(108%) brightness(1.03);
  backdrop-filter: blur(18px) saturate(170%) contrast(108%) brightness(1.03);
  box-shadow: 0 28px 72px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.72), inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -18px 42px rgba(255,255,255,0.06);
}
.crystal-panel.is-dark {
  background: rgba(2,6,23,0.34);
  -webkit-backdrop-filter: blur(20px) saturate(170%) contrast(112%) brightness(1.05);
  backdrop-filter: blur(20px) saturate(170%) contrast(112%) brightness(1.05);
  box-shadow: 0 32px 84px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.045), inset 0 -18px 42px rgba(0,0,0,0.08);
}
.crystal-surface {
  background: rgba(255,255,255,0.22);
  -webkit-backdrop-filter: blur(16px) saturate(165%) contrast(106%);
  backdrop-filter: blur(16px) saturate(165%) contrast(106%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -12px 26px rgba(255,255,255,0.06), 0 12px 30px rgba(15,23,42,0.06);
}
.crystal-surface.is-dark {
  background: rgba(255,255,255,0.055);
  -webkit-backdrop-filter: blur(16px) saturate(170%) contrast(112%);
  backdrop-filter: blur(16px) saturate(170%) contrast(112%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -12px 26px rgba(0,0,0,0.10), 0 12px 30px rgba(0,0,0,0.20);
}
.liquid-summary {
  isolation: isolate;
  transform-style: preserve-3d;
  background: rgba(255,255,255,0.035);
  border-color: rgba(255,255,255,0.78);
  -webkit-backdrop-filter: blur(18px) saturate(185%) contrast(110%) brightness(1.04);
  backdrop-filter: blur(18px) saturate(185%) contrast(110%) brightness(1.04);
  box-shadow: 0 38px 96px rgba(15,23,42,0.16), 0 12px 34px rgba(14,165,233,0.045), inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(15,23,42,0.07), inset 0 -24px 48px rgba(255,255,255,0.025);
}
.liquid-summary.is-dark {
  background: rgba(2,6,23,0.070);
  border-color: rgba(255,255,255,0.25);
  -webkit-backdrop-filter: blur(20px) saturate(190%) contrast(116%) brightness(1.08);
  backdrop-filter: blur(20px) saturate(190%) contrast(116%) brightness(1.08);
  box-shadow: 0 44px 116px rgba(0,0,0,0.40), 0 12px 34px rgba(8,145,178,0.045), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -1px 0 rgba(255,255,255,0.075), inset 1px 0 0 rgba(255,255,255,0.06), inset -1px 0 0 rgba(0,0,0,0.20), inset 0 -26px 52px rgba(0,0,0,0.06);
}
.liquid-summary::before,
.liquid-summary::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}
.liquid-summary::before {
  background: radial-gradient(120% 85% at 50% -18%, rgba(255,255,255,0.20), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.060), transparent 36%, rgba(255,255,255,0.012));
  opacity: 0.38;
  mix-blend-mode: screen;
}
.liquid-summary.is-dark::before {
  background: radial-gradient(120% 85% at 50% -18%, rgba(255,255,255,0.10), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.034), transparent 36%, rgba(255,255,255,0.010));
  opacity: 0.34;
}
.liquid-summary::after {
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.30), inset 0 16px 22px rgba(255,255,255,0.05), inset 0 -20px 32px rgba(15,23,42,0.035);
}
.liquid-summary.is-dark::after {
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.085), inset 0 16px 22px rgba(255,255,255,0.028), inset 0 -20px 32px rgba(0,0,0,0.09);
}
.liquid-row {
  position: relative;
  overflow: hidden;
  transform: translateZ(12px);
  background: rgba(255,255,255,0.055);
  -webkit-backdrop-filter: blur(14px) saturate(170%) contrast(110%) brightness(1.03);
  backdrop-filter: blur(14px) saturate(170%) contrast(110%) brightness(1.03);
}
.liquid-row.is-dark {
  background: rgba(255,255,255,0.045);
  -webkit-backdrop-filter: blur(15px) saturate(175%) contrast(116%) brightness(1.06);
  backdrop-filter: blur(15px) saturate(175%) contrast(116%) brightness(1.06);
}
.liquid-row::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(100% 70% at 50% -25%, rgba(255,255,255,0.14), transparent 46%), linear-gradient(180deg, rgba(255,255,255,0.045), transparent 42%);
  opacity: 0.30;
}
.liquid-row.is-dark::before { opacity: 0.18; }
.liquid-row::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.50), inset 0 -14px 26px rgba(15,23,42,0.028), inset 0 0 0 1px rgba(255,255,255,0.12);
}
.liquid-row.is-dark::after {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -14px 26px rgba(0,0,0,0.09), inset 0 0 0 1px rgba(255,255,255,0.05);
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

function panel(isDarkMode, extra = '') {
  return cx('crystal-panel rounded-[2rem] border transition-colors duration-300', isDarkMode ? 'is-dark border-white/10' : 'border-white/60', extra);
}

function crystalSurface(isDarkMode, extra = '') {
  return cx('crystal-surface border transition-colors duration-300', isDarkMode ? 'is-dark border-white/10' : 'border-white/55', extra);
}

function SummaryGlassRow({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={cx('liquid-row group flex items-center gap-4 rounded-[1.45rem] border px-4 py-3.5 transition duration-300 hover:-translate-y-0.5', isDarkMode ? 'is-dark border-white/[0.16] shadow-[0_18px_36px_rgba(0,0,0,0.12)]' : 'border-white/[0.62] shadow-[0_18px_36px_rgba(15,23,42,0.055)]')}>
      <span className={cx('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner', isDarkMode ? 'bg-white/[0.050] text-cyan-200' : 'bg-white/[0.13] text-blue-700')}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="relative z-10 min-w-0 flex-1">
        <span className={cx('block text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{label}</span>
        <span className={cx('mt-0.5 block truncate text-sm font-semibold', isDarkMode ? 'text-slate-200/90' : 'text-slate-700')}>{value}</span>
      </span>
    </div>
  );
}

function PublicLandingHeader({ lastUpdated, menuOpen, onToggleMenu, onCloseMenu, isDarkMode, setIsDarkMode }) {
  const navLinks = [
    { label: 'Latest Forecast', href: '#latest' },
    { label: 'Charts', to: '/charts' },
    { label: 'Archive', to: '/charts' },
    { label: 'About', href: '#about' },
  ];
  const navClass = cx('rounded-xl px-1 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500/70', isDarkMode ? 'text-slate-200 hover:text-cyan-200' : 'text-slate-700 hover:text-blue-700');
  const mobileNavClass = cx('rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/70', isDarkMode ? 'text-slate-100 hover:bg-white/[0.07]' : 'text-slate-800 hover:bg-blue-50');
  const renderNav = (item) => (item.to ? <Link key={item.label} to={item.to} className={navClass}>{item.label}</Link> : <a key={item.label} href={item.href} className={navClass}>{item.label}</a>);
  const renderMobileNav = (item) => (item.to ? <Link key={item.label} to={item.to} onClick={onCloseMenu} className={mobileNavClass}>{item.label}</Link> : <a key={item.label} href={item.href} onClick={onCloseMenu} className={mobileNavClass}>{item.label}</a>);

  return (
    <header className={cx('sticky top-0 z-40 border-b shadow-sm backdrop-blur-2xl transition-colors duration-300', isDarkMode ? 'border-white/10 bg-slate-950/[0.84]' : 'border-white/60 bg-white/[0.88]')}>
      <nav className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8" aria-label="Wavelab Public navigation">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2" onClick={onCloseMenu}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-900/20"><Waves size={27} aria-hidden="true" /></span>
          <span className="min-w-0 leading-tight">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cx('text-xl font-black tracking-tight sm:text-2xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Wavelab</span>
              <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-blue-700')}>Public</span>
            </span>
            <span className={cx('hidden text-xs font-bold sm:block', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Published marine wave forecasts</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-black lg:flex">{navLinks.map(renderNav)}</div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className={cx('hidden items-center gap-3 rounded-2xl border px-4 py-2.5 text-right xl:flex', isDarkMode ? 'border-white/10 bg-white/[0.06]' : 'border-blue-100 bg-blue-50/70')}>
            <Clock size={18} className={isDarkMode ? 'text-cyan-200' : 'text-blue-700'} aria-hidden="true" />
            <div>
              <p className={cx('text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Last updated</p>
              <p className={cx('text-sm font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{lastUpdated ? formatDateTime(lastUpdated) : 'When charts publish'}</p>
            </div>
          </div>
          <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2"><User size={18} aria-hidden="true" /> Staff Dashboard</Link>
          <button type="button" aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={isDarkMode} onClick={() => setIsDarkMode((prev) => !prev)} className={cx('inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2', isDarkMode ? 'border-white/10 bg-white/[0.07] text-cyan-100 hover:bg-white/[0.12]' : 'border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50')}>{isDarkMode ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}</button>
        </div>

        <button type="button" className={cx('inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 lg:hidden', isDarkMode ? 'border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]' : 'border-slate-200 bg-white text-slate-800 hover:bg-blue-50')} aria-expanded={menuOpen} aria-controls="wavelab-public-mobile-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={onToggleMenu}>
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>

      {menuOpen ? (
        <div id="wavelab-public-mobile-menu" className={cx('border-t px-4 py-4 shadow-lg backdrop-blur-xl lg:hidden', isDarkMode ? 'border-white/10 bg-slate-950/[0.95]' : 'border-slate-200 bg-white/[0.95]')}>
          <div className="mx-auto grid max-w-7xl gap-2 text-sm font-black">
            {navLinks.map(renderMobileNav)}
            <div className={cx('mt-2 rounded-2xl px-4 py-3', isDarkMode ? 'bg-white/[0.07] text-cyan-100' : 'bg-blue-50 text-blue-800')}>Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'When charts publish'}</div>
            <Link to="/login" onClick={onCloseMenu} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-white shadow-lg shadow-blue-900/20"><User size={18} aria-hidden="true" /> Staff Dashboard</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function StateNotice({ title, children, tone = 'slate', action, isDarkMode }) {
  const toneClass = tone === 'red'
    ? (isDarkMode ? 'border-red-400/20 bg-red-950/40 text-red-100' : 'border-red-200 bg-red-50/70 text-red-700')
    : tone === 'amber'
      ? (isDarkMode ? 'border-amber-300/20 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50/70 text-amber-800')
      : (isDarkMode ? 'border-white/10 bg-slate-950/40 text-slate-200' : 'border-slate-200 bg-white/[0.42] text-slate-700');

  return (
    <div className={cx('rounded-3xl border p-6 text-center shadow-sm backdrop-blur-xl', toneClass)}>
      <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
      <div className="mt-2 text-sm font-semibold leading-relaxed">{children}</div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function ForecastDetail({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div className={crystalSurface(isDarkMode, 'flex gap-3 rounded-2xl p-4')}>
      <div className={cx('mt-0.5', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}><Icon size={19} aria-hidden="true" /></div>
      <div>
        <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{label}</p>
        <p className={cx('mt-1 text-sm font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{value}</p>
      </div>
    </div>
  );
}

function CTAButton({ to, children, variant = 'primary', icon: Icon, disabled = false, onClick, isDarkMode = false }) {
  const baseClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2';
  const variantClass = variant === 'secondary'
    ? (isDarkMode ? 'border border-white/10 bg-white/[0.08] text-cyan-100 shadow-sm hover:bg-white/[0.13]' : 'border border-blue-200 bg-white/80 text-blue-800 shadow-sm hover:border-blue-300 hover:bg-blue-50')
    : 'bg-blue-700 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800';
  const disabledClass = isDarkMode ? 'pointer-events-none cursor-not-allowed border-white/10 bg-white/[0.08] text-slate-400 shadow-none' : 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 shadow-none';
  const content = <>{Icon ? <Icon size={18} aria-hidden="true" /> : null}{children}</>;

  if (disabled || !to) return <button type="button" className={cx(baseClass, disabled ? disabledClass : variantClass)} disabled={disabled} onClick={onClick}>{content}</button>;
  return <Link to={to} className={cx(baseClass, variantClass)}>{content}</Link>;
}

function PdfAction({ state, onRetry, isDarkMode }) {
  if (state === 'preparing') return <CTAButton disabled icon={Download} isDarkMode={isDarkMode}>Preparing PDF...</CTAButton>;
  if (state === 'unavailable') return <CTAButton disabled icon={Download} isDarkMode={isDarkMode}>PDF Unavailable</CTAButton>;
  if (state === 'error') return <CTAButton icon={RefreshCw} onClick={onRetry} isDarkMode={isDarkMode}>Try Again</CTAButton>;
  return <CTAButton to="/charts" variant="secondary" icon={Download} isDarkMode={isDarkMode}>Download PDF</CTAButton>;
}

function ChartFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(224,242,254,0.78),rgba(240,253,250,0.78))] text-blue-300" aria-label="Wave forecast chart preview unavailable">
      <div className="rounded-full border border-white/80 bg-white/50 p-6 shadow-inner"><Waves size={38} aria-hidden="true" /></div>
    </div>
  );
}

function ChartPreviewCard({ slot, chart, isDarkMode }) {
  const hasChart = Boolean(chart?._id);
  const title = chart?.name || slot.fallbackTitle || slot.title || 'Published wave chart';
  const coverage = slot?.badge || slot?.label || chart?.chartType || 'Published chart';

  return (
    <article className={panel(isDarkMode, 'group flex min-h-[360px] flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-blue-200')}>
      <div className="relative h-44 overflow-hidden bg-slate-100/60">
        {hasChart ? <PublicPublishedChartPreviewMap projectId={chart._id} initialRaster={chart.raster} isDarkMode={isDarkMode} height={null} className="h-full w-full rounded-none border-0" aria-label={`${title} preview map`} /> : <ChartFallback />}
        <div className="absolute left-4 top-4 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/20">{coverage}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={cx('text-base font-black leading-snug', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h3>
        <dl className={cx('mt-4 grid gap-2 text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
          <div><dt className="sr-only">Valid date and time</dt><dd>Valid: {hasChart ? formatDateTime(chart.forecastDate) : 'Unavailable'}</dd></div>
          <div><dt className="sr-only">Region or coverage area</dt><dd>Coverage: {coverage}</dd></div>
        </dl>
        <div className="mt-auto pt-5">
          {hasChart ? <Link to={`/charts/${chart._id}`} className="inline-flex items-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70">View Chart <ArrowRight size={14} aria-hidden="true" /></Link> : <span className={cx('text-sm font-black', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Chart unavailable</span>}
        </div>
      </div>
    </article>
  );
}

function GuideCard({ icon: Icon, title, children, isDarkMode }) {
  return (
    <article className={panel(isDarkMode, 'p-6')}>
      <div className={cx('mb-5 flex h-14 w-14 items-center justify-center rounded-2xl', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50/80 text-blue-700')}><Icon size={28} aria-hidden="true" /></div>
      <h3 className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h3>
      <p className={cx('mt-2 text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{children}</p>
    </article>
  );
}

function AccessCard({ icon: Icon, title, children, isDarkMode }) {
  return (
    <article className={cx('liquid-row rounded-[1.55rem] border p-5', isDarkMode ? 'is-dark border-white/[0.16]' : 'border-white/[0.62]')}>
      <div className="relative z-10 flex items-start gap-4">
        <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', isDarkMode ? 'bg-white/[0.055] text-cyan-200' : 'bg-white/[0.13] text-blue-700')}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <span>
          <span className={cx('block text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</span>
          <span className={cx('mt-1 block text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{children}</span>
        </span>
      </div>
    </article>
  );
}

function LatestForecastCard({ latestDate, forecastPeriodLabel, availableCount, latestUpdatedAt, latestPrimaryChart, pdfState, onRetry, isDarkMode }) {
  const forecastLink = latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts';

  return (
    <section id="latest" aria-labelledby="latest-forecast-heading" className={panel(isDarkMode, 'grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]')}>
      <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-blue-700 text-white shadow-lg shadow-blue-900/20"><CalendarDays size={38} aria-hidden="true" /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Latest Published Forecast</p>
          <h2 id="latest-forecast-heading" className={cx('mt-3 text-3xl font-black leading-tight sm:text-4xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Wave Forecast Package {latestDate ? formatDate(latestDate) : 'Latest'}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700"><CheckCircle2 size={14} aria-hidden="true" /> Published</span>
            <span className={cx('rounded-full px-3 py-1 text-xs font-black', isDarkMode ? 'bg-blue-400/10 text-cyan-100' : 'bg-blue-50 text-blue-800')}>Valid: {forecastPeriodLabel}</span>
          </div>
          <p className={cx('mt-5 max-w-2xl text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>This public view only lists forecast outputs that have completed the publication workflow. Drafts, review notes, and internal workflow details are not shown.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ForecastDetail icon={CalendarDays} label="Forecast Date" value={latestDate ? formatDate(latestDate) : 'Latest'} isDarkMode={isDarkMode} />
            <ForecastDetail icon={Clock} label="Valid Period" value={forecastPeriodLabel} isDarkMode={isDarkMode} />
            <ForecastDetail icon={Layers} label="Available Charts" value={`${availableCount} published chart${availableCount === 1 ? '' : 's'}`} isDarkMode={isDarkMode} />
            <ForecastDetail icon={Clock} label="Last Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Unavailable'} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
      <aside className={panel(isDarkMode, 'rounded-[1.6rem] p-5')}>
        <p className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Open the latest forecast</p>
        <p className={cx('mt-2 text-sm leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>Go directly to the newest published chart package, or browse the full public chart archive.</p>
        <div className="mt-5 grid gap-3">
          <CTAButton to={forecastLink} icon={ArrowRight} isDarkMode={isDarkMode}>Open Forecast</CTAButton>
          <PdfAction state={pdfState} onRetry={onRetry} isDarkMode={isDarkMode} />
          <CTAButton to="/charts" variant="secondary" icon={FileText} isDarkMode={isDarkMode}>Browse Archive</CTAButton>
        </div>
      </aside>
    </section>
  );
}

export default function Home() {
  const { isDarkMode, setIsDarkMode } = useTheme();
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
    <main className={cx('relative min-h-screen overflow-hidden transition-colors duration-500', isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950')}>
      <style>{LIQUID_CSS}</style>
      <PublicLandingHeader lastUpdated={latestUpdatedAt} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} onCloseMenu={() => setMenuOpen(false)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <div className="relative z-10">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="hero-bg-layer absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(248,250,252,0.96) 0%, rgba(239,246,255,0.86) 34%, rgba(240,253,250,0.44) 58%, rgba(255,255,255,0.04) 100%), url(${PUBLIC_HERO_IMAGE_URL})`, opacity: isDarkMode ? 0 : 1 }} aria-hidden="true" />
          <div className="hero-bg-layer absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,0.88) 0%, rgba(15,23,42,0.72) 34%, rgba(15,23,42,0.34) 58%, rgba(2,6,23,0.04) 100%), url(${PUBLIC_DARK_HERO_IMAGE_URL})`, opacity: isDarkMode ? 1 : 0 }} aria-hidden="true" />
          <div className={cx('absolute inset-0 transition-opacity duration-700', isDarkMode ? 'opacity-100 bg-[radial-gradient(circle_at_20%_18%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_68%_18%,rgba(45,212,191,0.10),transparent_26%)]' : 'opacity-100 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_68%_18%,rgba(6,182,212,0.08),transparent_26%)]')} aria-hidden="true" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pb-20 lg:pt-20">
            <div>
              <div className={cx('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-white/[0.08] text-cyan-100' : 'border-blue-100 bg-white/75 text-blue-700')}><Waves size={16} aria-hidden="true" /> Wavelab Public</div>
              <h1 className={cx('mt-6 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-7xl', isDarkMode ? 'text-white drop-shadow-[0_8px_34px_rgba(0,0,0,0.35)]' : 'text-slate-950')}>Public Wave Forecasts, Made Easier to Access</h1>
              <p className={cx('mt-6 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>View the latest published wave forecast charts and marine forecast outputs from Wavelab in one clear public portal.</p>
              <p className={cx('mt-4 inline-flex max-w-2xl items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-bold leading-relaxed shadow-sm backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/35 text-slate-100' : 'border-white/70 bg-white/70 text-slate-700')}><ShieldCheck size={18} className={cx('mt-0.5 shrink-0', isDarkMode ? 'text-cyan-200' : 'text-emerald-600')} aria-hidden="true" /> Published forecast outputs are prepared and reviewed before public release.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <CTAButton to={latestPrimaryChart?._id ? `/charts/${latestPrimaryChart._id}` : '/charts'} icon={Layers} isDarkMode={isDarkMode}>View Latest Forecast Charts</CTAButton>
                <CTAButton to="/charts" variant="secondary" icon={FileText} isDarkMode={isDarkMode}>Browse Forecast Archive</CTAButton>
              </div>
            </div>

            <aside className={cx('liquid-summary relative self-center overflow-hidden rounded-[2.35rem] border p-5 lg:translate-x-4', isDarkMode ? 'is-dark ring-1 ring-white/[0.08]' : 'ring-1 ring-white/[0.50]')} aria-label="Latest public forecast summary">
              <div className="relative z-10">
                <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>Latest summary</p>
                <h2 className={cx('mt-3 text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{latestDate ? formatDate(latestDate) : 'Published charts'}</h2>
                <p className={cx('mt-1 text-sm font-semibold', isDarkMode ? 'text-slate-200/90' : 'text-slate-700')}>{state.loading ? 'Preparing latest public forecast access...' : state.error ? 'Forecast data is temporarily unavailable.' : recentProjects.length ? forecastPeriodLabel : 'No published forecast charts are available right now.'}</p>
                <div className="mt-5 grid gap-3">
                  <SummaryGlassRow icon={Layers} label="Charts" value={state.loading ? 'Preparing' : `${availableCount} available`} isDarkMode={isDarkMode} />
                  <SummaryGlassRow icon={Clock} label="Updated" value={latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Unavailable'} isDarkMode={isDarkMode} />
                  <SummaryGlassRow icon={Eye} label="Public status" value={state.loading ? 'Preparing' : recentProjects.length ? 'Published' : 'Unavailable'} isDarkMode={isDarkMode} />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          {state.loading ? (
            <div className="grid gap-5">
              <StateNotice title="Loading latest forecast" isDarkMode={isDarkMode}>Fetching published WaveLab charts and preparing the public forecast summary.</StateNotice>
              <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className={panel(isDarkMode, 'h-48 animate-pulse')} />)}</div>
            </div>
          ) : null}
          {!state.loading && state.error ? <StateNotice tone="red" title="Forecasts could not be loaded" action={<CTAButton icon={RefreshCw} onClick={() => setReloadToken((value) => value + 1)} isDarkMode={isDarkMode}>Try Again</CTAButton>} isDarkMode={isDarkMode}><p>{state.error}</p><p className="mt-1">Refresh the public forecast list or try again later.</p></StateNotice> : null}
          {!state.loading && !state.error && !recentProjects.length ? <StateNotice tone="amber" title="No published forecast charts are available right now" isDarkMode={isDarkMode}>Published forecast charts will appear here once they are available for public release. Please refer to official advisory channels for current marine updates.</StateNotice> : null}
          {!state.loading && !state.error && recentProjects.length > 0 ? <LatestForecastCard latestDate={latestDate} forecastPeriodLabel={forecastPeriodLabel} availableCount={availableCount} latestUpdatedAt={latestUpdatedAt} latestPrimaryChart={latestPrimaryChart} pdfState={pdfState} onRetry={() => setReloadToken((value) => value + 1)} isDarkMode={isDarkMode} /> : null}
        </section>

        <section aria-labelledby="latest-charts-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Latest chart previews</p>
              <h2 id="latest-charts-heading" className={cx('mt-2 text-3xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Published forecast charts</h2>
            </div>
            <Link to="/charts" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70">View all charts <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {!state.loading && !state.error && recentProjects.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{PUBLIC_CHART_SLOTS.map((slot) => <ChartPreviewCard key={slot.chartType} slot={slot} chart={chartByType.get(slot.chartType)} isDarkMode={isDarkMode} />)}</div> : <StateNotice title="Chart previews unavailable" isDarkMode={isDarkMode}>No published forecast charts are available for preview right now.</StateNotice>}
        </section>

        <section id="guide" aria-labelledby="forecast-guide-heading" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">How to read the forecast</p>
            <h2 id="forecast-guide-heading" className={cx('mt-2 text-3xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Simple guide for public users</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <GuideCard icon={Waves} title="Wave Height" isDarkMode={isDarkMode}>Wave height values show estimated sea wave conditions in meters.</GuideCard>
            <GuideCard icon={Globe2} title="Color Scale" isDarkMode={isDarkMode}>Colors represent wave height ranges. Higher values may indicate rougher sea conditions.</GuideCard>
            <GuideCard icon={Clock} title="Forecast Time" isDarkMode={isDarkMode}>Each forecast chart is valid for a specific date and time.</GuideCard>
            <GuideCard icon={ShieldCheck} title="Safety Reminder" isDarkMode={isDarkMode}>Use forecasts together with official advisories and local conditions.</GuideCard>
          </div>
        </section>

        <section aria-labelledby="access-guide-heading" className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className={panel(isDarkMode, 'p-6 sm:p-8')}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Forecast access guide</p>
            <h2 id="access-guide-heading" className={cx('mt-2 text-3xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>What you can do in Wavelab Public</h2>
            <p className={cx('mt-3 max-w-2xl text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>This page focuses on published forecast outputs only. Use it to quickly open the newest forecast package, review available chart times, and access the public archive without internal workflow details.</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <AccessCard icon={Layers} title="Open chart packages" isDarkMode={isDarkMode}>View the latest published analysis and forecast chart set.</AccessCard>
              <AccessCard icon={Clock} title="Check valid periods" isDarkMode={isDarkMode}>See forecast dates, update times, and available forecast windows.</AccessCard>
              <AccessCard icon={Download} title="Download outputs" isDarkMode={isDarkMode}>Use available PDF or chart actions for sharing and reference.</AccessCard>
              <AccessCard icon={FileText} title="Browse the archive" isDarkMode={isDarkMode}>Find previous public forecast packages by opening the chart archive.</AccessCard>
              <AccessCard icon={Eye} title="Public-only view" isDarkMode={isDarkMode}>Only published outputs are shown here; drafts and review notes stay hidden.</AccessCard>
              <AccessCard icon={ShieldCheck} title="Use for awareness" isDarkMode={isDarkMode}>Pair the forecast with official marine advisories and local conditions.</AccessCard>
            </div>
          </div>

          <div className="grid gap-5">
            <section className={panel(isDarkMode, 'p-6')} aria-labelledby="archive-heading">
              <h2 id="archive-heading" className={cx('text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Need an earlier forecast?</h2>
              <p className={cx('mt-3 text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>Browse published forecast packages by date or chart type.</p>
              <div className="mt-5"><CTAButton to="/charts" icon={ArrowRight} isDarkMode={isDarkMode}>Open Forecast Archive</CTAButton></div>
            </section>
            <section id="about" className={panel(isDarkMode, 'p-6')} aria-labelledby="about-wavelab-heading">
              <h2 id="about-wavelab-heading" className={cx('text-2xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>About Wavelab</h2>
              <p className={cx('mt-3 text-sm font-medium leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>Wavelab is a forecasting workflow system that helps prepare, review, and publish wave forecast outputs. Wavelab Public provides easier access to published charts and forecast packages for communities, agencies, and marine users.</p>
            </section>
          </div>
        </section>

        <section aria-labelledby="forecast-notice-heading" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className={cx('rounded-[2rem] border p-6 shadow-sm backdrop-blur-xl sm:p-8', isDarkMode ? 'border-amber-300/20 bg-amber-950/25' : 'border-amber-200 bg-amber-50/65')}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <AlertTriangle size={34} className="shrink-0 text-amber-500" aria-hidden="true" />
              <div>
                <h2 id="forecast-notice-heading" className={cx('text-xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Important Notice</h2>
                <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/90' : 'text-slate-700')}>Forecast information is provided for guidance and situational awareness. Always refer to official marine advisories, warnings, and local conditions before making travel or operational decisions.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
