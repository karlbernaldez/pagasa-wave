import React, { useEffect } from 'react';
import { ArrowRight, BarChart3, Building2, CheckCircle2, CloudSun, Compass, Layers, ShieldCheck, Target, Waves } from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import useAboutSettings from '@dashboards/public/hooks/useAboutSettings';

const FALLBACK_STATS = [
  { label: 'Operational Focus', value: '24/7', description: 'Marine weather awareness and coastal forecast support.' },
  { label: 'Chart Categories', value: '4', description: 'Public wave chart products prepared for daily review.' },
  { label: 'Program Partners', value: 'PAGASA', description: 'Science-led collaboration for public service delivery.' },
];

const FALLBACK_HIGHLIGHTS = [
  {
    title: 'Mission',
    description: 'Support DOST-PAGASA marine forecasting teams with a consistent workspace for preparing, reviewing, and publishing operational wave guidance.',
    icon: Target,
  },
  {
    title: 'Vision',
    description: 'Make wave forecast information easier to review, communicate, and access across public, technical, and operational audiences.',
    icon: Compass,
  },
  {
    title: 'Public Service',
    description: 'Keep published outputs professional, traceable, and aligned with official bulletins, warnings, and advisories.',
    icon: ShieldCheck,
  },
];

const FALLBACK_OBJECTIVES = [
  'Improve the clarity and consistency of wave forecast chart publication.',
  'Support forecasters with review-ready workflows and map-based annotation tools.',
  'Provide the public portal with accessible, easy-to-scan coastal forecast products.',
  'Strengthen collaboration between research, operations, and public information teams.',
];

const FALLBACK_FOCUS_AREAS = [
  { title: 'Forecast Preparation', description: 'Map-based tools for organizing wave, wind, and annotation outputs before publication.' },
  { title: 'Operational Review', description: 'Structured review states that help teams approve, return, and publish chart packages.' },
  { title: 'Public Access', description: 'A public portal where users can browse the latest published WaveLab chart sets.' },
];

const FALLBACK_PARTNERS = ['DOST-PAGASA', 'MECO-TECO-VOTE III', 'WaveLab Research and Operations'];

function glassPanel(isDark, extra = '') {
  return `rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl ${isDark ? 'border-white/10 bg-slate-900/72 shadow-cyan-950/20' : 'border-white/70 bg-white/78 shadow-blue-100/70'} ${extra}`;
}

function LiquidBackdrop({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute -left-36 -top-36 h-[540px] w-[540px] rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-blue-300/25'}`} />
      <div className={`absolute -right-32 top-64 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? 'bg-blue-700/10' : 'bg-cyan-200/30'}`} />
      <div className={`absolute bottom-[-200px] left-1/3 h-[520px] w-[520px] rounded-full blur-3xl ${isDark ? 'bg-sky-400/5' : 'bg-indigo-200/20'}`} />
    </div>
  );
}

function SectionHeading({ isDark, eyebrow, title, description, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300/80' : 'text-blue-600'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      {description ? <p className={`mt-3 text-sm font-semibold leading-relaxed sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p> : null}
    </div>
  );
}

function getText(value, fallback = '') {
  if (typeof value === 'string') return value;
  return fallback;
}

function normalizeStat(stat, index) {
  if (typeof stat === 'string') return { label: `Metric ${index + 1}`, value: stat, description: 'WaveLab public portal indicator.' };
  return {
    label: stat?.label || stat?.title || `Metric ${index + 1}`,
    value: stat?.value || stat?.number || stat?.count || '—',
    description: stat?.description || stat?.caption || 'Operational wave forecast support indicator.',
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

  const heroTitle = [
    getText(settings.titlePrefix, 'About'),
    getText(settings.titleHighlight, 'WaveLab'),
    getText(settings.titleSuffix, ''),
  ].filter(Boolean).join(' ');
  const subtitle = getText(
    settings.subtitle,
    'WaveLab is a DOST-PAGASA public forecasting portal for preparing, reviewing, and sharing operational wave chart guidance with clarity and consistency.'
  );
  const stats = (Array.isArray(settings.stats) && settings.stats.length ? settings.stats : FALLBACK_STATS).map(normalizeStat);
  const highlights = (Array.isArray(settings.highlights) && settings.highlights.length ? settings.highlights : FALLBACK_HIGHLIGHTS).map((item, index) => normalizeCard(item, index, [Target, Compass, ShieldCheck]));
  const objectives = Array.isArray(settings.programObjectives) && settings.programObjectives.length ? settings.programObjectives : FALLBACK_OBJECTIVES;
  const focusAreas = (Array.isArray(settings.pillars) && settings.pillars.length ? settings.pillars : FALLBACK_FOCUS_AREAS).map((item, index) => normalizeCard(item, index, [Waves, Layers, BarChart3]));
  const partners = Array.isArray(settings.partners) && settings.partners.length ? settings.partners : FALLBACK_PARTNERS;
  const leaders = Array.isArray(settings.leaders) ? settings.leaders : [];
  const faqs = Array.isArray(settings.faqs) ? settings.faqs : [];

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <LiquidBackdrop isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7">
        <section className={glassPanel(isDarkMode, 'mx-auto w-full max-w-5xl p-7 text-center sm:p-9')}>
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-100/80 text-blue-700'}`}>
              <CloudSun size={15} />
              {settings.badgeText || 'DOST-PAGASA WaveLab'}
            </div>
          </div>
          <h1 className={`text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{heroTitle}</h1>
          <p className={`mx-auto mt-4 max-w-3xl text-base font-semibold leading-relaxed sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{subtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={settings.ctaPrimaryLink || '/charts'} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
              {settings.ctaPrimaryLabel || 'View Wave Charts'} <ArrowRight size={16} />
            </a>
            <a href={settings.ctaSecondaryLink || '/contact'} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'}`}>
              {settings.ctaSecondaryLabel || 'Contact WaveLab'}
            </a>
          </div>
        </section>

        {loading ? (
          <section className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className={glassPanel(isDarkMode, 'h-44 animate-pulse')} />)}
          </section>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              {stats.map((stat) => (
                <article key={`${stat.label}-${stat.value}`} className={glassPanel(isDarkMode, 'p-6')}>
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                  <p className={`mt-3 text-4xl font-black tracking-tight ${isDarkMode ? 'text-cyan-100' : 'text-blue-700'}`}>{stat.value}</p>
                  <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{stat.description}</p>
                </article>
              ))}
            </section>

            <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
              <SectionHeading
                isDark={isDarkMode}
                eyebrow="Purpose"
                title="A public portal for clearer marine forecast communication"
                description="WaveLab connects forecast preparation, technical review, and public access into one consistent experience for published wave products."
              />
              <div className="mt-7 grid gap-5 lg:grid-cols-3">
                {highlights.map(({ title, description, icon: Icon }) => (
                  <article key={title} className={`rounded-3xl border p-6 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                      <Icon size={22} />
                    </div>
                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
                    <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading
                  isDark={isDarkMode}
                  eyebrow="MECO-TECO-VOTE III Program"
                  title="Program objectives"
                  description="The platform is designed around practical forecasting work: prepare accurate chart outputs, review them responsibly, and publish them with confidence."
                />
                <div className="mt-7 grid gap-3">
                  {objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`} className={`flex gap-3 rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-700'}`}>
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-500" />
                      <p className="text-sm font-semibold leading-relaxed">{typeof objective === 'string' ? objective : objective?.description || objective?.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading
                  isDark={isDarkMode}
                  eyebrow="Focus Areas"
                  title="Built for operational clarity"
                  description="Each public page should feel connected to the same WaveLab product system."
                />
                <div className="mt-7 space-y-4">
                  {focusAreas.map(({ title, description, icon: Icon }) => (
                    <article key={title} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"><Icon size={18} /></div>
                        <div>
                          <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
                          <p className={`mt-1 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="Partners" title="Program collaboration" description="WaveLab reflects joint work across forecasting, research, and public service teams." />
                <div className="mt-6 flex flex-wrap gap-3">
                  {partners.map((partner) => {
                    const label = typeof partner === 'string' ? partner : partner?.name || partner?.title || 'Program Partner';
                    return <span key={label} className={`rounded-full border px-4 py-2 text-xs font-black ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-600'}`}>{label}</span>;
                  })}
                </div>
              </div>

              <div className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="Governance" title="Responsible publication workflow" description="Published charts are treated as reviewed public outputs and should be read alongside official DOST-PAGASA bulletins, warnings, and advisories." />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(leaders.length ? leaders.slice(0, 4) : [
                    { name: 'Forecast Operations', role: 'Chart preparation and technical review' },
                    { name: 'Public Portal', role: 'Published chart access and communication' },
                  ]).map((leader) => (
                    <article key={`${leader.name}-${leader.role}`} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                      <Building2 className="mb-3 h-5 w-5 text-cyan-500" />
                      <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{leader.name}</p>
                      <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{leader.role || leader.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {faqs.length ? (
              <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
                <SectionHeading isDark={isDarkMode} eyebrow="FAQ" title="Common questions" centered />
                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  {faqs.slice(0, 6).map((faq, index) => (
                    <article key={`${faq.question}-${index}`} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                      <h3 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{faq.question}</h3>
                      <p className={`mt-2 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className={glassPanel(isDarkMode, 'p-7 text-center sm:p-9')}>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-cyan-300/80' : 'text-blue-600'}`}>Next step</p>
              <h2 className={`mt-3 text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{settings.ctaTitle || 'Explore the latest public WaveLab charts'}</h2>
              <p className={`mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{settings.ctaDescription || 'Review recently published operational wave products and use them together with official DOST-PAGASA information.'}</p>
              <a href={settings.ctaButtonLink || '/charts'} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                {settings.ctaButtonLabel || 'Open Wave Charts'} <ArrowRight size={16} />
              </a>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AboutUs;
