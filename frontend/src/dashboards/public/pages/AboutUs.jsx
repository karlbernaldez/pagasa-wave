import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Globe2,
  Layers,
  Mail,
  Map,
  PenTool,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Users,
  Waves,
} from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import useAboutSettings from '@dashboards/public/hooks/useAboutSettings';

const ABOUT_HERO_IMAGE_URL = '/images/WavelabAboutHero.png';

const FALLBACK_STATS = [
  { label: 'Chart products', value: '4', description: 'Daily public wave chart slots grouped by forecast package.' },
  { label: 'Publication workflow', value: 'Reviewed', description: 'Preparation, review, approval, and publishing in one flow.' },
  { label: 'Forecast archive', value: 'Public', description: 'Published charts organized by date, type, and package.' },
];

const FALLBACK_HIGHLIGHTS = [
  {
    title: 'Clear preparation',
    description: 'A consistent workspace for preparing map-based wave chart outputs and annotations.',
    icon: PenTool,
  },
  {
    title: 'Responsible review',
    description: 'Chart packages are checked before becoming public forecast products.',
    icon: ClipboardCheck,
  },
  {
    title: 'Public access',
    description: 'Published wave forecast information becomes easier to find and scan.',
    icon: Globe2,
  },
];

const FALLBACK_OBJECTIVES = [
  'Improve the clarity and consistency of wave forecast chart publication.',
  'Support forecasters with review-ready workflows and map-based annotation tools.',
  'Provide an accessible public portal for coastal forecast products.',
  'Strengthen collaboration between research, operations, and public information teams.',
];

const FALLBACK_FOCUS_AREAS = [
  { title: 'Forecast preparation', description: 'Map-based tools for organizing wave, wind, and annotation outputs.' },
  { title: 'Operational review', description: 'Structured states for approving, returning, and publishing chart packages.' },
  { title: 'Public access', description: 'A public portal for browsing the latest published WaveLab chart sets.' },
];

const FALLBACK_PARTNERS = ['DOST-PAGASA', 'MECO-TECO-VOTE III', 'WaveLab Research and Operations'];

const WORKFLOW_STEPS = [
  {
    label: 'Prepare',
    description: 'Forecasters create wave forecast outputs using map-based tools.',
    icon: PenTool,
  },
  {
    label: 'Review',
    description: 'Chart packages are checked for quality and completeness.',
    icon: SearchCheck,
  },
  {
    label: 'Publish',
    description: 'Approved outputs are released as published chart sets.',
    icon: CloudUpload,
  },
  {
    label: 'Access',
    description: 'The public browses charts by date and type.',
    icon: Globe2,
  },
];

const AUDIENCE_CARDS = [
  {
    title: 'Forecast teams',
    description: 'Prepare and organize forecast chart outputs.',
    icon: Users,
  },
  {
    title: 'Reviewers and admins',
    description: 'Review, approve, publish, and manage packages.',
    icon: ShieldCheck,
  },
  {
    title: 'Public users',
    description: 'Access wave forecasts for safety and awareness.',
    icon: Globe2,
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function glassPanel(isDark, extra = '') {
  return cx(
    'rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-colors duration-500',
    isDark ? 'border-white/10 bg-slate-900/70 shadow-cyan-950/20' : 'border-white/70 bg-white/78 shadow-blue-100/70',
    extra
  );
}

function innerCard(isDark, extra = '') {
  return cx(
    'rounded-3xl border transition-all duration-300',
    isDark ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/68',
    extra
  );
}

function LiquidBackdrop({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={cx('absolute -left-40 -top-36 h-[560px] w-[560px] rounded-full blur-3xl', isDark ? 'bg-cyan-500/10' : 'bg-blue-300/25')} />
      <div className={cx('absolute -right-32 top-40 h-[560px] w-[560px] rounded-full blur-3xl', isDark ? 'bg-blue-700/10' : 'bg-cyan-200/30')} />
      <div className={cx('absolute bottom-[-220px] left-1/3 h-[560px] w-[560px] rounded-full blur-3xl', isDark ? 'bg-sky-400/5' : 'bg-indigo-200/20')} />
    </div>
  );
}

function SectionHeading({ isDark, eyebrow, title, description, centered = false }) {
  return (
    <div className={cx('flex flex-col gap-2', centered && 'items-center text-center')}>
      <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-cyan-300/80' : 'text-blue-600')}>{eyebrow}</p>
      <h2 className={cx('text-2xl font-black tracking-tight sm:text-3xl', isDark ? 'text-white' : 'text-slate-950')}>{title}</h2>
      {description ? <p className={cx('max-w-3xl text-sm font-semibold leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>{description}</p> : null}
    </div>
  );
}

function IconBubble({ icon: Icon, tone = 'blue' }) {
  const toneClass = tone === 'green'
    ? 'from-emerald-500 to-teal-500 shadow-emerald-500/20'
    : tone === 'violet'
      ? 'from-violet-500 to-indigo-500 shadow-violet-500/20'
      : tone === 'amber'
        ? 'from-amber-400 to-orange-500 shadow-amber-500/20'
        : 'from-blue-600 to-cyan-500 shadow-blue-500/20';

  return (
    <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', toneClass)}>
      <Icon size={22} />
    </div>
  );
}

function getText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getBriefText(value, fallback = '', maxLength = 118) {
  const text = getText(value, fallback).replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function normalizeStat(stat, index) {
  if (typeof stat === 'string') return { label: `Metric ${index + 1}`, value: stat, description: 'WaveLab public portal indicator.' };
  return {
    label: stat?.label || stat?.title || `Metric ${index + 1}`,
    value: stat?.value || stat?.number || stat?.count || '-',
    description: stat?.description || stat?.sublabel || stat?.caption || 'Operational wave forecast support indicator.',
  };
}

function normalizeCard(item, index, icons) {
  const Icon = icons[index % icons.length];
  if (typeof item === 'string') return { title: item, description: 'Aligned with WaveLab operational and public service goals.', icon: Icon };
  return {
    title: item?.title || item?.name || `Focus ${index + 1}`,
    description: item?.description || item?.body || item?.summary || 'Aligned with WaveLab operational and public service goals.',
    icon: item?.icon || Icon,
  };
}

const AboutUs = () => {
  const { isDarkMode } = useTheme();
  const { settings = {}, loading } = useAboutSettings();

  useEffect(() => {
    document.title = 'About Us | WaveLab';
  }, []);

  const title = getText(settings.title, 'About WaveLab');
  const subtitle = getText(
    settings.subtitle,
    'WaveLab helps DOST-PAGASA teams prepare, review, and publish wave forecast charts through a clear operational workflow and public chart archive.'
  );
  const stats = (Array.isArray(settings.stats) && settings.stats.length ? settings.stats : FALLBACK_STATS).map(normalizeStat);
  const highlights = (Array.isArray(settings.highlights) && settings.highlights.length ? settings.highlights : FALLBACK_HIGHLIGHTS).map((item, index) => normalizeCard(item, index, [PenTool, ClipboardCheck, Globe2]));
  const objectives = Array.isArray(settings.programObjectives) && settings.programObjectives.length ? settings.programObjectives : FALLBACK_OBJECTIVES;
  const focusAreas = (Array.isArray(settings.pillars) && settings.pillars.length ? settings.pillars : FALLBACK_FOCUS_AREAS).map((item, index) => normalizeCard(item, index, [Waves, Layers, BarChart3]));
  const partners = Array.isArray(settings.partners) && settings.partners.length ? settings.partners : FALLBACK_PARTNERS;
  const leaders = Array.isArray(settings.leaders) ? settings.leaders : [];
  const faqs = Array.isArray(settings.faqs) ? settings.faqs : [];

  return (
    <main className={cx('relative min-h-screen overflow-hidden px-4 pb-16 pt-28 transition-colors duration-500 sm:px-6 lg:px-8', isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950')}>
      <LiquidBackdrop isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7">
        <section className={glassPanel(isDarkMode, 'overflow-hidden p-0')}>
          <div className="relative grid min-h-[520px] gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:p-10">
            <div className="absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${ABOUT_HERO_IMAGE_URL})` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/58 to-slate-950/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,0.20),transparent_30%),radial-gradient(circle_at_78%_26%,rgba(45,212,191,0.14),transparent_24%)]" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
            </div>

            <div className="relative z-10 flex max-w-3xl flex-col justify-center py-8">
              <p className="w-fit rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">Public marine forecasting platform</p>
              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white drop-shadow-[0_8px_34px_rgba(0,0,0,0.35)] sm:text-6xl">
                {title.includes('WaveLab') ? (
                  <>
                    About <span className="bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">WaveLab</span>
                  </>
                ) : title}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">{subtitle}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={settings.ctaSecondaryLink || '/charts'} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                  <BarChart3 size={17} /> {settings.ctaSecondaryLabel || 'View Published Charts'}
                </Link>
                <Link to={settings.ctaPrimaryLink || '/contact'} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                  <Mail size={17} /> {settings.ctaPrimaryLabel || 'Contact Team'}
                </Link>
              </div>
            </div>

            <div className="relative z-10 self-center rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">The WaveLab workflow</p>
                  <h2 className="mt-1 text-2xl font-black text-white">From forecast work to public access</h2>
                </div>
                <Map className="h-9 w-9 text-cyan-100" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                  <article key={label} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <IconBubble icon={Icon} tone={index === 2 ? 'green' : index === 3 ? 'violet' : 'blue'} />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Step {index + 1}</p>
                        <h3 className="text-base font-black text-white">{label}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-300">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className={glassPanel(isDarkMode, 'h-40 animate-pulse')} />)}
          </section>
        ) : (
          <>
            <section className={glassPanel(isDarkMode, 'grid gap-4 p-4 md:grid-cols-3')}>
              {stats.slice(0, 3).map((stat, index) => (
                <article key={`${stat.label}-${stat.value}`} className={innerCard(isDarkMode, 'p-5')}>
                  <div className="flex items-start gap-4">
                    <IconBubble icon={index === 0 ? Layers : index === 1 ? ClipboardCheck : Globe2} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                    <div>
                      <p className={cx('text-3xl font-black tracking-tight', isDarkMode ? 'text-cyan-100' : 'text-blue-700')}>{stat.value}</p>
                      <h2 className={cx('mt-1 text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{stat.label}</h2>
                      <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{getBriefText(stat.description, '', 105)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
              <SectionHeading
                isDark={isDarkMode}
                eyebrow="How it works"
                title="A clear path from preparation to publication"
                description="WaveLab is designed around the real work behind public forecast products."
                centered
              />
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                  <article key={`workflow-${label}`} className={innerCard(isDarkMode, 'relative p-5 text-center')}>
                    <span className={cx('absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black', isDarkMode ? 'bg-cyan-300/10 text-cyan-100' : 'bg-blue-50 text-blue-700')}>{index + 1}</span>
                    <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                      <Icon size={25} />
                    </div>
                    <h3 className={cx('mt-5 text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{label}</h3>
                    <p className={cx('mt-3 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading
                  isDark={isDarkMode}
                  eyebrow="Purpose"
                  title="Built for published wave forecasts"
                  description="The page explains why WaveLab exists without losing the operational context behind the charts."
                />
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {highlights.map(({ title: cardTitle, description, icon: Icon }, index) => (
                    <article key={cardTitle} className={innerCard(isDarkMode, 'p-5')}>
                      <IconBubble icon={Icon} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                      <h3 className={cx('mt-4 text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{cardTitle}</h3>
                      <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading
                  isDark={isDarkMode}
                  eyebrow="Focus"
                  title="Operational clarity"
                  description="Each public page should feel connected to the same WaveLab product system."
                />
                <div className="mt-6 space-y-4">
                  {focusAreas.map(({ title: cardTitle, description, icon: Icon }) => (
                    <article key={cardTitle} className={innerCard(isDarkMode, 'p-5')}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"><Icon size={18} /></div>
                        <div>
                          <h3 className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{cardTitle}</h3>
                          <p className={cx('mt-1 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
              <SectionHeading
                isDark={isDarkMode}
                eyebrow="Users"
                title="Built for different users"
                description="The About page should help visitors understand who WaveLab supports and why each role matters."
                centered
              />
              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {AUDIENCE_CARDS.map(({ title: cardTitle, description, icon: Icon }, index) => (
                  <article key={cardTitle} className={innerCard(isDarkMode, 'p-5')}>
                    <div className="flex items-start gap-4">
                      <IconBubble icon={Icon} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                      <div>
                        <h3 className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{cardTitle}</h3>
                        <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={cx('rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-colors duration-500 sm:p-8', isDarkMode ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50/80')}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                  <ShieldAlert size={32} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={cx('text-2xl font-black', isDarkMode ? 'text-amber-50' : 'text-slate-950')}>Important Notice</h2>
                  <p className={cx('mt-2 max-w-4xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/85' : 'text-slate-700')}>
                    WaveLab published charts are guidance products for marine weather awareness. Always refer to official DOST-PAGASA bulletins, warnings, advisories, and local conditions before making travel or operational decisions.
                  </p>
                </div>
              </div>
            </section>

            <section className={glassPanel(isDarkMode, 'grid gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center')}>
              <div>
                <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Next step</p>
                <h2 className={cx('mt-2 text-2xl font-black sm:text-3xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Explore the published chart archive</h2>
                <p className={cx('mt-2 max-w-2xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Browse the latest wave chart sets, previous forecast periods, and available chart styles.</p>
              </div>
              <Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                Open Charts <ArrowRight size={17} />
              </Link>
            </section>

            {objectives.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="Program" title="Objectives" description="Practical goals for forecasting work and public communication." />
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`} className={cx('flex gap-3 rounded-2xl border p-4', isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-700')}>
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-500" />
                      <p className="text-sm font-semibold leading-relaxed">{getBriefText(typeof objective === 'string' ? objective : objective?.description || objective?.title, '', 105)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {faqs.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="FAQ" title="Quick questions" description="Short answers only, so the page stays easy to scan." />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {faqs.slice(0, 3).map((faq, index) => (
                    <article key={`${faq.question}-${index}`} className={innerCard(isDarkMode, 'p-5')}>
                      <h3 className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{getBriefText(faq.question, 'Question', 70)}</h3>
                      <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{getBriefText(faq.answer, 'Answer will be added soon.', 120)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className={cx('relative overflow-hidden rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl', isDarkMode ? 'border-white/10 bg-slate-900/76' : 'border-white/70 bg-white/82')}>
              <div className="absolute bottom-0 right-0 h-full w-1/2 opacity-80" aria-hidden="true">
                <div className={cx('absolute inset-0', isDarkMode ? 'bg-gradient-to-l from-cyan-500/10 via-slate-900/20 to-transparent' : 'bg-gradient-to-l from-blue-100 via-white/30 to-transparent')} />
                <div className={cx('absolute bottom-0 right-6 h-32 w-52 rounded-t-[2rem] border', isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80')} />
                <div className={cx('absolute bottom-0 right-20 h-44 w-28 rounded-t-[1.5rem] border', isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/70')} />
              </div>
              <div className="relative z-10 grid gap-7 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <SectionHeading isDark={isDarkMode} eyebrow="Our partners" title="Program collaboration" description="WaveLab is developed and operated with forecasting, research, and public service teams." />
                  <div className="mt-5 flex flex-wrap gap-3">
                    {partners.map((partner) => {
                      const label = typeof partner === 'string' ? partner : partner?.name || partner?.title || 'Program partner';
                      return <span key={label} className={cx('rounded-full border px-4 py-2 text-xs font-black', isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-600')}>{label}</span>;
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeading isDark={isDarkMode} eyebrow="Governance" title="Responsible publication" description="WaveLab follows DOST-PAGASA review, quality, and operational procedures for public forecast products." />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {(leaders.length ? leaders.slice(0, 4) : [
                      { name: 'Forecast operations', role: 'Chart preparation and technical review' },
                      { name: 'Public portal', role: 'Published chart access and communication' },
                    ]).map((leader) => (
                      <article key={`${leader.name}-${leader.role}`} className={innerCard(isDarkMode, 'p-5')}>
                        <Building2 className="mb-3 h-5 w-5 text-cyan-500" />
                        <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{leader.name}</p>
                        <p className={cx('mt-1 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{getBriefText(leader.role || leader.description, '', 90)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default AboutUs;
