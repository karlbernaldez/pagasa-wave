import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Globe2,
  Layers,
  Mail,
  PenTool,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import useAboutSettings from '@dashboards/public/hooks/useAboutSettings';

const ABOUT_HERO_IMAGE_DARK_URL = '/images/WavelabAboutHeroDark.png';
const ABOUT_HERO_IMAGE_LIGHT_URL = '/images/WavelabAboutHeroLight.png';
const GOVERNANCE_SECTION_IMAGE_LIGHT_URL = '/images/PWS.png';
const GOVERNANCE_SECTION_IMAGE_DARK_URL = '/images/PWS_night.png';

const SURFACE_TRANSITION = 'transition-[background-color,border-color,color,box-shadow,opacity,transform,filter] duration-500 ease-out motion-reduce:transition-none';
const HOVER_LIFT = 'transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0 motion-reduce:transition-none';

const FALLBACK_STATS = [
  { label: 'Chart products', value: '4', description: 'Daily public wave chart slots grouped by forecast package.' },
  { label: 'Publication workflow', value: 'Reviewed', description: 'Preparation, review, approval, and publishing in one flow.' },
  { label: 'Forecast archive', value: 'Public', description: 'Published charts organized by date, type, and package.' },
];

const FALLBACK_OBJECTIVES = [
  'Improve the clarity and consistency of wave forecast chart publication.',
  'Support forecasters with review-ready workflows and map-based annotation tools.',
  'Provide an accessible public portal for coastal forecast products.',
  'Strengthen collaboration between research, operations, and public information teams.',
];

const FALLBACK_PARTNERS = ['DOST-PAGASA', 'MECO-TECO-VOTE III', 'WaveLab Research and Operations'];

const WORKFLOW_STEPS = [
  { label: 'Prepare', description: 'Create map-based wave forecast outputs.', icon: PenTool },
  { label: 'Review', description: 'Check chart quality and completeness.', icon: SearchCheck },
  { label: 'Publish', description: 'Release approved public chart sets.', icon: CloudUpload },
  { label: 'Access', description: 'Browse published charts by date and type.', icon: Globe2 },
];

const AUDIENCE_CARDS = [
  { title: 'Forecast teams', description: 'Prepare and organize forecast chart outputs.', icon: Users },
  { title: 'Reviewers and admins', description: 'Review, approve, publish, and manage packages.', icon: ShieldCheck },
  { title: 'Public users', description: 'Access wave forecasts for safety and awareness.', icon: Globe2 },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getBriefText(value, fallback = '', maxLength = 118) {
  const text = getText(value, fallback).replace(/\s+/g, ' ').trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`;
}

function normalizeStat(stat, index) {
  if (typeof stat === 'string') return { label: `Metric ${index + 1}`, value: stat, description: 'WaveLab public portal indicator.' };
  return {
    label: stat?.label || stat?.title || `Metric ${index + 1}`,
    value: stat?.value || stat?.number || stat?.count || '-',
    description: stat?.description || stat?.sublabel || stat?.caption || 'Operational wave forecast support indicator.',
  };
}

function IconBubble({ icon: Icon, tone = 'blue', compact = false }) {
  const toneClass = tone === 'green'
    ? 'from-emerald-500 to-teal-500 shadow-emerald-500/20'
    : tone === 'violet'
      ? 'from-violet-500 to-indigo-500 shadow-violet-500/20'
      : 'from-blue-600 to-cyan-500 shadow-blue-500/20';

  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', compact ? 'h-10 w-10' : 'h-12 w-12', toneClass)}>
      <Icon size={compact ? 18 : 22} />
    </div>
  );
}

function PageBackground({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDark ? 'bg-[radial-gradient(circle_at_16%_8%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.11),transparent_30%),linear-gradient(180deg,#020617_0%,#06111f_42%,#020617_100%)]' : 'bg-[radial-gradient(circle_at_14%_8%,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_86%_22%,rgba(6,182,212,0.18),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_45%,#f8fafc_100%)]')} />
      <div className={cx('absolute left-1/2 top-24 h-[680px] w-[680px] -translate-x-1/2 rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-cyan-500/5' : 'bg-white/70')} />
      <div className={cx('absolute -left-40 top-64 h-[520px] w-[520px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-cyan-500/10' : 'bg-blue-300/18')} />
      <div className={cx('absolute -right-32 top-[520px] h-[520px] w-[520px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-blue-700/10' : 'bg-cyan-200/24')} />
    </div>
  );
}

function ThemeImagePair({ lightSrc, darkSrc, isDark, className }) {
  return (
    <>
      <img src={lightSrc} alt="" className={cx(className, SURFACE_TRANSITION, isDark ? 'opacity-0' : 'opacity-100')} />
      <img src={darkSrc} alt="" className={cx(className, SURFACE_TRANSITION, isDark ? 'opacity-100' : 'opacity-0')} />
    </>
  );
}

function SectionHeading({ isDark, eyebrow, title, description, centered = false }) {
  return (
    <div className={cx('flex flex-col gap-2', centered && 'items-center text-center')}>
      {eyebrow ? <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-cyan-300/80' : 'text-blue-600')}>{eyebrow}</p> : null}
      {title ? <h2 className={cx('text-2xl font-black tracking-tight sm:text-3xl', isDark ? 'text-white' : 'text-slate-950')}>{title}</h2> : null}
      {description ? <p className={cx('max-w-3xl text-sm font-semibold leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>{description}</p> : null}
    </div>
  );
}

function glassPanel(isDark, extra = '') {
  return cx(
    'rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl',
    SURFACE_TRANSITION,
    isDark
      ? 'border-white/10 bg-slate-900/78 shadow-cyan-950/20 ring-1 ring-white/[0.03]'
      : 'border-white/80 bg-white/88 shadow-blue-100/80 ring-1 ring-sky-100/70',
    extra
  );
}

function innerCard(isDark, extra = '') {
  return cx(
    'rounded-3xl border shadow-[0_16px_42px_rgba(15,23,42,0.06)]',
    SURFACE_TRANSITION,
    isDark
      ? 'border-white/10 bg-slate-950/46 shadow-black/10'
      : 'border-slate-200/90 bg-white/86 shadow-blue-100/70',
    extra
  );
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
  const objectives = Array.isArray(settings.programObjectives) && settings.programObjectives.length ? settings.programObjectives : FALLBACK_OBJECTIVES;
  const partners = Array.isArray(settings.partners) && settings.partners.length ? settings.partners : FALLBACK_PARTNERS;
  const leaders = Array.isArray(settings.leaders) ? settings.leaders : [];
  const faqs = Array.isArray(settings.faqs) ? settings.faqs : [];

  return (
    <main className={cx('relative min-h-screen overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8', SURFACE_TRANSITION, isDarkMode ? 'text-white' : 'text-slate-950')}>
      <PageBackground isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 sm:gap-7">
        <section className={cx('relative overflow-hidden rounded-[2rem] border shadow-[0_32px_90px_rgba(15,23,42,0.16)] sm:rounded-[2.25rem]', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-900/90 ring-1 ring-white/[0.04]' : 'border-white/85 bg-white/90 ring-1 ring-sky-100/80')}>
          <div className="absolute inset-0" aria-hidden="true">
            <ThemeImagePair
              lightSrc={ABOUT_HERO_IMAGE_LIGHT_URL}
              darkSrc={ABOUT_HERO_IMAGE_DARK_URL}
              isDark={isDarkMode}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-gradient-to-r from-slate-950/96 via-slate-950/86 to-slate-950/58' : 'bg-gradient-to-r from-white/97 via-white/90 to-sky-50/50')} />
            <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.14),transparent_30%)]' : 'bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.42))]')} />
            <div className={cx('absolute inset-x-0 bottom-0 h-28', SURFACE_TRANSITION, isDarkMode ? 'bg-gradient-to-t from-slate-950/60 to-transparent' : 'bg-gradient-to-t from-white/58 to-transparent')} />
          </div>

          <div className="relative z-10 grid min-h-[440px] items-center gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:p-10">
            <div className="flex max-w-3xl flex-col justify-center py-4">
              <p className={cx('w-fit rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-xl', SURFACE_TRANSITION, isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-blue-200/90 bg-white/80 text-blue-700 shadow-sm shadow-blue-100/60')}>
                Public marine forecasting platform
              </p>
              <h1 className={cx('mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {title.includes('WaveLab') ? title.replace('WaveLab', '') : title}{' '}
                <span className={cx('bg-clip-text text-transparent', isDarkMode ? 'bg-gradient-to-r from-blue-300 to-cyan-200' : 'bg-gradient-to-r from-blue-700 to-cyan-500')}>WaveLab</span>
              </h1>
              <p className={cx('mt-5 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{subtitle}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to={settings.ctaSecondaryLink || '/charts'} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">
                  <BarChart3 size={17} /> {settings.ctaSecondaryLabel || 'View Published Charts'}
                </Link>
                <Link to={settings.ctaPrimaryLink || '/contact'} className={cx('inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto', isDarkMode ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200/90 bg-white/78 text-slate-700 shadow-sm shadow-blue-100/50 hover:bg-white')}>
                  <Mail size={17} /> {settings.ctaPrimaryLabel || 'Contact Team'}
                </Link>
              </div>
            </div>

            <aside className={cx('self-stretch rounded-[1.75rem] border p-5 shadow-2xl backdrop-blur-2xl lg:self-center', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-slate-950/20 ring-1 ring-white/[0.03]' : 'border-white/85 bg-white/78 shadow-blue-200/30 ring-1 ring-sky-100/80')}>
              <div className="mb-4">
                <p className={cx('text-xs font-black uppercase tracking-[0.18em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Operational workflow</p>
                <h2 className={cx('mt-1 text-xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Prepare, review, publish, access</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                  <article key={label} className={cx('flex h-full gap-3 rounded-2xl border p-3', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white/78 shadow-sm shadow-blue-100/40')}>
                    <IconBubble icon={Icon} compact tone={index === 2 ? 'green' : index === 3 ? 'violet' : 'blue'} />
                    <div>
                      <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{label}</p>
                      <p className={cx('mt-0.5 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {loading ? (
          <section className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className={glassPanel(isDarkMode, 'h-32 animate-pulse')} />)}
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {stats.slice(0, 3).map((stat, index) => (
                <article key={`${stat.label}-${stat.value}`} className={cx('relative h-full overflow-hidden rounded-3xl border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl', SURFACE_TRANSITION, HOVER_LIFT, isDarkMode ? 'border-white/10 bg-slate-900/82' : 'border-white/85 bg-white/92 ring-1 ring-sky-100/80')}>
                  <div className={cx('absolute inset-x-0 top-0 h-1', index === 1 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : index === 2 ? 'bg-gradient-to-r from-violet-400 to-indigo-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400')} />
                  <div className="flex h-full items-start gap-4">
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
              <SectionHeading isDark={isDarkMode} eyebrow="How it works" title="A clear path from preparation to public access" description="WaveLab keeps the forecast publication process understandable, traceable, and ready for public use." centered />
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                  <article key={`workflow-${label}`} className={cx(innerCard(isDarkMode, 'relative h-full p-5 text-center'), HOVER_LIFT)}>
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

            <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Users" title="Built for different users" description="The platform supports operational teams and public users without mixing their responsibilities." centered />
              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {AUDIENCE_CARDS.map(({ title: cardTitle, description, icon: Icon }, index) => (
                  <article key={cardTitle} className={cx(innerCard(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
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

            <section className={cx('rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8', SURFACE_TRANSITION, isDarkMode ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50/85 ring-1 ring-amber-100/70')}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20"><ShieldAlert size={32} /></div>
                <div className="min-w-0 flex-1">
                  <h2 className={cx('text-2xl font-black', isDarkMode ? 'text-amber-50' : 'text-slate-950')}>Important Notice</h2>
                  <p className={cx('mt-2 max-w-4xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/85' : 'text-slate-700')}>WaveLab published charts are guidance products for marine weather awareness. Always refer to official DOST-PAGASA bulletins, warnings, advisories, and local conditions before making travel or operational decisions.</p>
                </div>
              </div>
            </section>

            {objectives.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="Program" title="Objectives" description="Practical goals for forecasting work and public communication." />
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`} className={cx('flex h-full gap-3 rounded-2xl border p-4', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/76 text-slate-700')}>
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
                    <article key={`${faq.question}-${index}`} className={cx(innerCard(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                      <h3 className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{getBriefText(faq.question, 'Question', 70)}</h3>
                      <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{getBriefText(faq.answer, 'Answer will be added soon.', 120)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className={cx('relative min-h-[430px] overflow-hidden rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-900/78' : 'border-white/80 bg-white/90 ring-1 ring-sky-100/70')}>
              <div className="absolute inset-0" aria-hidden="true">
                <ThemeImagePair
                  lightSrc={GOVERNANCE_SECTION_IMAGE_LIGHT_URL}
                  darkSrc={GOVERNANCE_SECTION_IMAGE_DARK_URL}
                  isDark={isDarkMode}
                  className="absolute inset-0 h-full w-full object-cover object-[82%_68%] opacity-75 sm:object-[80%_70%] lg:object-[76%_72%] lg:opacity-[0.88]"
                />
                <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.94)_36%,rgba(2,6,23,0.84)_58%,rgba(2,6,23,0.68)_78%,rgba(2,6,23,0.50)_100%)]' : 'bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.94)_36%,rgba(255,255,255,0.84)_58%,rgba(255,255,255,0.68)_78%,rgba(255,255,255,0.50)_100%)]')} />
                <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-cyan-950/10' : 'bg-sky-100/14')} />
              </div>
              <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1fr] lg:items-start">
                <div className="max-w-xl">
                  <SectionHeading isDark={isDarkMode} eyebrow="Our partners" title="Program collaboration" description="WaveLab is developed and operated with forecasting, research, and public service teams." />
                  <div className="mt-5 flex flex-wrap gap-3">
                    {partners.map((partner) => {
                      const label = typeof partner === 'string' ? partner : partner?.name || partner?.title || 'Program partner';
                      return <span key={label} className={cx('rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-white/6 text-slate-300' : 'border-slate-200/80 bg-white/78 text-slate-700')}>{label}</span>;
                    })}
                  </div>
                </div>
                <div className="max-w-2xl lg:justify-self-end">
                  <SectionHeading isDark={isDarkMode} eyebrow="Governance" title="Responsible publication" description="WaveLab follows DOST-PAGASA review, quality, and operational procedures for public forecast products." />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {(leaders.length ? leaders.slice(0, 4) : [{ name: 'Forecast operations', role: 'Chart preparation and technical review' }, { name: 'Public portal', role: 'Published chart access and communication' }]).map((leader) => (
                      <article key={`${leader.name}-${leader.role}`} className={cx(innerCard(isDarkMode, isDarkMode ? 'p-5 bg-slate-950/58' : 'p-5 bg-white/84'), HOVER_LIFT)}>
                        <Building2 className="mb-3 h-5 w-5 text-cyan-500" />
                        <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{leader.name}</p>
                        <p className={cx('mt-1 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{getBriefText(leader.role || leader.description, '', 90)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className={glassPanel(isDarkMode, 'grid gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center')}>
              <div>
                <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Next step</p>
                <h2 className={cx('mt-2 text-2xl font-black sm:text-3xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Explore the published chart archive</h2>
                <p className={cx('mt-2 max-w-2xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Browse the latest wave chart sets, previous forecast periods, and available chart styles.</p>
              </div>
              <Link to="/charts" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">Open Charts</Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default AboutUs;
