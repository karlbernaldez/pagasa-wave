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

function glassPanel(_isDark, extra = '') {
  return cx(
    'rounded-[2rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(15,23,42,0.10)] shadow-blue-100/70 backdrop-blur-2xl transition-colors duration-500',
    extra
  );
}

function innerCard(_isDark, extra = '') {
  return cx(
    'rounded-3xl border border-slate-200/80 bg-white/72 transition-all duration-300',
    extra
  );
}

function LiquidBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-40 top-64 h-[560px] w-[560px] rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute -right-32 top-96 h-[560px] w-[560px] rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="absolute bottom-[-220px] left-1/3 h-[560px] w-[560px] rounded-full bg-indigo-200/20 blur-3xl" />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={cx('flex flex-col gap-2', centered && 'items-center text-center')}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">{description}</p> : null}
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
  const { settings = {}, loading } = useAboutSettings();
  const isDarkMode = false;

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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 text-slate-950 transition-colors duration-500">
      <LiquidBackdrop />

      <section className="relative isolate overflow-hidden pt-24 text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${ABOUT_HERO_IMAGE_URL})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/50 to-slate-950/12" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_78%_26%,rgba(45,212,191,0.10),transparent_24%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950/62 via-slate-950/12 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[610px] max-w-7xl gap-8 px-4 pb-32 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-8 lg:pt-16">
          <div className="flex max-w-3xl flex-col justify-center py-6">
            <p className="w-fit rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-xl">Public marine forecasting platform</p>
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

          <div className="self-center rounded-[2rem] border border-white/20 bg-white/[0.14] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">The WaveLab workflow</p>
                <h2 className="mt-1 text-2xl font-black text-white">From forecast work to public access</h2>
              </div>
              <Map className="h-9 w-9 text-cyan-100" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                <article key={label} className="rounded-3xl border border-white/10 bg-slate-950/32 p-4 transition-all duration-300 lg:min-h-[170px]">
                  <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                    <IconBubble icon={Icon} tone={index === 2 ? 'green' : index === 3 ? 'violet' : 'blue'} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Step {index + 1}</p>
                      <h3 className="text-base font-black text-white">{label}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-200">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px] z-20 h-40 overflow-hidden" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 1440 160" preserveAspectRatio="none" focusable="false">
            <path d="M0 78 C190 122 382 142 574 114 C750 88 874 36 1046 30 C1198 24 1326 46 1440 82 L1440 160 L0 160 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      <div className="relative z-30 mx-auto -mt-24 flex max-w-7xl flex-col gap-7 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <section className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className={glassPanel(isDarkMode, 'h-40 animate-pulse')} />)}
          </section>
        ) : (
          <>
            <section className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
              {stats.slice(0, 3).map((stat, index) => (
                <article key={`${stat.label}-${stat.value}`} className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
                  <div className="flex items-start gap-4">
                    <IconBubble icon={index === 0 ? Layers : index === 1 ? ClipboardCheck : Globe2} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                    <div>
                      <p className="text-3xl font-black tracking-tight text-blue-700">{stat.value}</p>
                      <h2 className="mt-1 text-base font-black text-slate-950">{stat.label}</h2>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{getBriefText(stat.description, '', 105)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="pt-3">
              <SectionHeading
                eyebrow="How it works"
                title="A clear path from preparation to public access."
                description="WaveLab ensures quality, accuracy, and transparency at every step."
                centered
              />
              <div className="mx-auto mt-8 grid max-w-5xl gap-8 md:grid-cols-2 xl:grid-cols-4">
                {WORKFLOW_STEPS.map(({ label, description, icon: Icon }, index) => (
                  <article key={`workflow-${label}`} className="relative rounded-3xl border border-slate-200/80 bg-white/76 p-5 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                    <span className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{index + 1}</span>
                    <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                      <Icon size={25} />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-950">{label}</h3>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="pt-2">
              <SectionHeading eyebrow="Built for different users" title="" centered />
              <div className="mx-auto mt-5 grid max-w-5xl gap-5 md:grid-cols-3">
                {AUDIENCE_CARDS.map(({ title: cardTitle, description, icon: Icon }, index) => (
                  <article key={cardTitle} className="rounded-3xl border border-slate-200/80 bg-white/76 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                    <div className="flex items-start gap-4">
                      <IconBubble icon={Icon} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                      <div>
                        <h3 className="text-base font-black text-slate-950">{cardTitle}</h3>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-colors duration-500 sm:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                  <ShieldAlert size={32} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black text-slate-950">Important Notice</h2>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-relaxed text-slate-700">
                    WaveLab published charts are guidance products for marine weather awareness. Always refer to official DOST-PAGASA bulletins, warnings, advisories, and local conditions before making travel or operational decisions.
                  </p>
                </div>
                <div className="hidden min-h-[96px] flex-1 rounded-3xl bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.2))] md:block" />
              </div>
            </section>

            <section className={glassPanel(isDarkMode, 'grid gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center')}>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Next step</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Explore the published chart archive</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600">Browse the latest wave chart sets, previous forecast periods, and available chart styles.</p>
              </div>
              <Link to="/charts" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                Open Charts <ArrowRight size={17} />
              </Link>
            </section>

            {objectives.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading eyebrow="Program" title="Objectives" description="Practical goals for forecasting work and public communication." />
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-500" />
                      <p className="text-sm font-semibold leading-relaxed">{getBriefText(typeof objective === 'string' ? objective : objective?.description || objective?.title, '', 105)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {faqs.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading eyebrow="FAQ" title="Quick questions" description="Short answers only, so the page stays easy to scan." />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {faqs.slice(0, 3).map((faq, index) => (
                    <article key={`${faq.question}-${index}`} className={innerCard(isDarkMode, 'p-5')}>
                      <h3 className="text-sm font-black text-slate-950">{getBriefText(faq.question, 'Question', 70)}</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{getBriefText(faq.answer, 'Answer will be added soon.', 120)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/86 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="absolute bottom-0 right-0 hidden h-full w-1/3 opacity-70 lg:block" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-l from-blue-100 via-white/30 to-transparent" />
                <div className="absolute bottom-0 right-6 h-32 w-52 rounded-t-[2rem] border border-slate-200 bg-slate-100/80" />
                <div className="absolute bottom-0 right-20 h-44 w-28 rounded-t-[1.5rem] border border-slate-200 bg-slate-100/70" />
              </div>
              <div className="relative z-10 grid gap-7 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <SectionHeading eyebrow="Our partners" title="Program collaboration" description="WaveLab is developed and operated with forecasting, research, and public service teams." />
                  <div className="mt-5 flex flex-wrap gap-3">
                    {partners.map((partner) => {
                      const label = typeof partner === 'string' ? partner : partner?.name || partner?.title || 'Program partner';
                      return <span key={label} className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-600">{label}</span>;
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeading eyebrow="Governance" title="Responsible publication" description="WaveLab follows DOST-PAGASA review, quality, and operational procedures for public forecast products." />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {(leaders.length ? leaders.slice(0, 4) : [
                      { name: 'Forecast operations', role: 'Chart preparation and technical review' },
                      { name: 'Public portal', role: 'Published chart access and communication' },
                    ]).map((leader) => (
                      <article key={`${leader.name}-${leader.role}`} className={innerCard(isDarkMode, 'p-5')}>
                        <Building2 className="mb-3 h-5 w-5 text-cyan-500" />
                        <p className="text-sm font-black text-slate-950">{leader.name}</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{getBriefText(leader.role || leader.description, '', 90)}</p>
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
