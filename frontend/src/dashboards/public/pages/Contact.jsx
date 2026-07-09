import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import useContactSettings from '@/dashboards/public/hooks/useContactSettings';

const CONTACT_HERO_IMAGE_LIGHT_URL = '/images/PAGASA_RADAR.png';
const CONTACT_HERO_IMAGE_DARK_URL = '/images/PAGASA_RADAR_DARK.png';
const OPERATIONS_IMAGE_LIGHT_URL = '/images/PWS.png';
const OPERATIONS_IMAGE_DARK_URL = '/images/PWS_night.png';

const SURFACE_TRANSITION = 'transition-[background-color,border-color,color,box-shadow,opacity,transform,filter] duration-500 ease-out motion-reduce:transition-none';
const HOVER_LIFT = 'transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0 motion-reduce:transition-none';

const ICON_MAP = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  globe: Globe,
  shield: Shield,
  users: Users,
  zap: Zap,
  clock: Clock,
  waves: Waves,
  'message-circle': MessageCircle,
};

const DEFAULT_CONTACT_CARDS = [
  {
    title: 'Operations email',
    description: 'For WaveLab chart access, published output questions, and operational coordination.',
    value: 'pagasa.wavelab@example.com',
    icon: 'mail',
  },
  {
    title: 'Forecast desk',
    description: 'For time-sensitive coastal and marine weather coordination with PAGASA teams.',
    value: '+63 (02) 8123-9999',
    icon: 'phone',
  },
  {
    title: 'Forecast hub',
    description: 'DOST-PAGASA operational support and public portal coordination.',
    value: 'Agham Road, Diliman, Quezon City',
    icon: 'map-pin',
  },
];

const DEFAULT_ASSISTANCE_ITEMS = [
  { title: 'Published chart support', description: 'Questions about available WaveLab chart sets, publication status, and public access.', icon: 'waves' },
  { title: 'Operational coordination', description: 'Support for agencies and partners coordinating marine weather information.', icon: 'shield' },
  { title: 'Technical feedback', description: 'Report usability issues, accessibility concerns, or public portal inconsistencies.', icon: 'message-circle' },
];

const DEFAULT_RESPONSE_TARGETS = [
  { type: 'Urgent coastal coordination', time: 'Same working day', icon: 'zap' },
  { type: 'Public portal support', time: '1-2 working days', icon: 'globe' },
  { type: 'Partnership requests', time: '2-3 working days', icon: 'users' },
];

const REQUEST_TYPES = [
  'Published chart support',
  'Operational coordination',
  'Technical feedback',
  'Partnership request',
  'Other',
];

const ROUTING_STEPS = [
  'For official warnings, check DOST-PAGASA public channels.',
  'For chart questions, include chart date, type, and forecast period.',
  'For coordination, include agency, location, urgency, and preferred response channel.',
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function resolveIcon(icon, fallback = Mail) {
  if (typeof icon !== 'string') return fallback;
  return ICON_MAP[icon] || fallback;
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

function IconBubble({ icon: Icon, tone = 'blue', compact = false }) {
  const toneClass = tone === 'green'
    ? 'from-emerald-500 to-teal-500 shadow-emerald-500/20'
    : tone === 'amber'
      ? 'from-amber-400 to-orange-500 shadow-amber-500/20'
      : tone === 'violet'
        ? 'from-violet-500 to-indigo-500 shadow-violet-500/20'
        : 'from-blue-600 to-cyan-500 shadow-blue-500/20';

  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', compact ? 'h-10 w-10' : 'h-12 w-12', toneClass)}>
      <Icon size={compact ? 18 : 22} />
    </div>
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

const Contact = () => {
  const { isDarkMode } = useTheme();
  const settings = useContactSettings() || {};
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    requestType: REQUEST_TYPES[0],
    message: '',
    subscribe: false,
  });

  useEffect(() => {
    document.title = 'Contact Us | WaveLab';
  }, []);

  const contactCards = useMemo(() => {
    const cards = Array.isArray(settings.contactCards) && settings.contactCards.length ? settings.contactCards : DEFAULT_CONTACT_CARDS;
    return cards.map((card) => ({ ...card, Icon: resolveIcon(card.icon, Mail) }));
  }, [settings.contactCards]);

  const assistanceItems = useMemo(() => {
    const items = Array.isArray(settings.assistanceItems) && settings.assistanceItems.length ? settings.assistanceItems : DEFAULT_ASSISTANCE_ITEMS;
    return items.map((item) => ({ ...item, Icon: resolveIcon(item.icon, Globe) }));
  }, [settings.assistanceItems]);

  const responseTargets = useMemo(() => {
    const targets = Array.isArray(settings.responseTargets) && settings.responseTargets.length ? settings.responseTargets : DEFAULT_RESPONSE_TARGETS;
    return targets.map((target) => ({ ...target, Icon: resolveIcon(target.icon, Clock) }));
  }, [settings.responseTargets]);

  const teamMembers = Array.isArray(settings.teamMembers) ? settings.teamMembers : [];

  const inputCls = cx(
    'rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400/60',
    SURFACE_TRANSITION,
    isDarkMode
      ? 'border-white/10 bg-slate-950/55 text-slate-100 placeholder:text-slate-600 focus:border-cyan-300/50'
      : 'border-slate-200/80 bg-white/70 text-slate-950 placeholder:text-slate-400 focus:border-blue-300'
  );

  const handleInputChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className={cx('relative min-h-screen overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8', SURFACE_TRANSITION, isDarkMode ? 'text-white' : 'text-slate-950')}>
      <PageBackground isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 sm:gap-7">
        <section className={cx('relative overflow-hidden rounded-[2rem] border shadow-[0_32px_90px_rgba(15,23,42,0.16)] sm:rounded-[2.25rem]', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-900/90 ring-1 ring-white/[0.04]' : 'border-white/85 bg-white/90 ring-1 ring-sky-100/80')}>
          <div className="absolute inset-0" aria-hidden="true">
            <ThemeImagePair
              lightSrc={CONTACT_HERO_IMAGE_LIGHT_URL}
              darkSrc={CONTACT_HERO_IMAGE_DARK_URL}
              isDark={isDarkMode}
              className="absolute inset-0 h-full w-full object-cover object-[72%_45%]"
            />
            <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-gradient-to-r from-slate-950/97 via-slate-950/88 to-slate-950/58' : 'bg-gradient-to-r from-white/98 via-white/91 to-sky-50/48')} />
            <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.14),transparent_30%)]' : 'bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.42))]')} />
            <div className={cx('absolute inset-x-0 bottom-0 h-28', SURFACE_TRANSITION, isDarkMode ? 'bg-gradient-to-t from-slate-950/60 to-transparent' : 'bg-gradient-to-t from-white/58 to-transparent')} />
          </div>

          <div className="relative z-10 grid min-h-[440px] items-center gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,410px)] lg:p-10">
            <div className="flex max-w-3xl flex-col justify-center py-4">
              <p className={cx('w-fit rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-xl', SURFACE_TRANSITION, isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-blue-200/90 bg-white/80 text-blue-700 shadow-sm shadow-blue-100/60')}>
                Public support and coordination
              </p>
              <h1 className={cx('mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Contact <span className={cx('bg-clip-text text-transparent', isDarkMode ? 'bg-gradient-to-r from-blue-300 to-cyan-200' : 'bg-gradient-to-r from-blue-700 to-cyan-500')}>WaveLab</span>
              </h1>
              <p className={cx('mt-5 max-w-2xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                {settings.heroDescription || 'Reach the WaveLab/PAGASA team for published chart questions, operational coordination, public portal feedback, and partnership requests.'}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#contact-request" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">
                  <Send size={17} /> Send a request
                </a>
                <Link to="/charts" className={cx('inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto', isDarkMode ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200/90 bg-white/78 text-slate-700 shadow-sm shadow-blue-100/50 hover:bg-white')}>
                  <BarChart3 size={17} /> View published charts
                </Link>
              </div>
            </div>

            <aside className={cx('self-stretch rounded-[1.75rem] border p-5 shadow-2xl backdrop-blur-2xl lg:self-center', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-slate-950/20 ring-1 ring-white/[0.03]' : 'border-white/85 bg-white/78 shadow-blue-200/30 ring-1 ring-sky-100/80')}>
              <div className="mb-4">
                <p className={cx('text-xs font-black uppercase tracking-[0.18em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Before you contact us</p>
                <h2 className={cx('mt-1 text-xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Send the right details</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {ROUTING_STEPS.map((step, index) => (
                  <article key={step} className={cx('flex h-full gap-3 rounded-2xl border p-3', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white/78 shadow-sm shadow-blue-100/40')}>
                    <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black', isDarkMode ? 'bg-cyan-300/10 text-cyan-100' : 'bg-blue-50 text-blue-700')}>{index + 1}</span>
                    <p className={cx('text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{step}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {contactCards.map(({ title, description, value, Icon }, index) => (
            <article key={title} className={cx('relative h-full overflow-hidden rounded-3xl border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl', SURFACE_TRANSITION, HOVER_LIFT, isDarkMode ? 'border-white/10 bg-slate-900/82' : 'border-white/85 bg-white/92 ring-1 ring-sky-100/80')}>
              <div className={cx('absolute inset-x-0 top-0 h-1', index === 1 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : index === 2 ? 'bg-gradient-to-r from-violet-400 to-indigo-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400')} />
              <div className="flex h-full items-start gap-4">
                <IconBubble icon={Icon} tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                <div className="min-w-0">
                  <h2 className={cx('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2>
                  <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                  <p className={cx('mt-3 break-words text-sm font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{value}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeading
              isDark={isDarkMode}
              eyebrow="Response targets"
              title="Clear routing for public and operational requests"
              description="Use the form below for non-emergency WaveLab support. For official warnings and advisories, always follow DOST-PAGASA public channels."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {responseTargets.map(({ type, time, Icon }, index) => (
                <article key={type} className={cx(innerCard(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                  <IconBubble icon={Icon} compact tone={index === 0 ? 'amber' : index === 2 ? 'violet' : 'blue'} />
                  <p className={cx('mt-4 text-xs font-black uppercase tracking-[0.14em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{type}</p>
                  <p className={cx('mt-2 text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{time}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <form id="contact-request" className={glassPanel(isDarkMode, 'p-6 sm:p-8 scroll-mt-24')} onSubmit={(event) => event.preventDefault()}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <IconBubble icon={Send} />
              <div>
                <h2 className={cx('text-2xl font-black tracking-tight', isDarkMode ? 'text-white' : 'text-slate-950')}>Send a request</h2>
                <p className={cx('mt-1 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Tell us your organization, location, urgency, and the WaveLab product or public portal issue you need help with.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  { label: 'Full name', key: 'name', type: 'text', placeholder: 'Juan dela Cruz' },
                  { label: 'Organization', key: 'organization', type: 'text', placeholder: 'PAGASA Coastal Desk' },
                  { label: 'Email address', key: 'email', type: 'email', placeholder: 'name@email.com' },
                  { label: 'Contact number', key: 'phone', type: 'tel', placeholder: '+63 9XX XXX XXXX' },
                ].map(({ label, key, type, placeholder }) => (
                  <label key={key} className="flex flex-col gap-2 text-sm font-black">
                    <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{label}</span>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[key]}
                      onChange={(event) => handleInputChange(key, event.target.value)}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-2 text-sm font-black">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Request type</span>
                <select
                  value={formData.requestType}
                  onChange={(event) => handleInputChange('requestType', event.target.value)}
                  className={inputCls}
                >
                  {REQUEST_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-black">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>How can we help?</span>
                <textarea
                  rows="5"
                  placeholder="Share the coastal area, chart date, urgency, and preferred response channel."
                  value={formData.message}
                  onChange={(event) => handleInputChange('message', event.target.value)}
                  className={cx(inputCls, 'resize-none')}
                />
              </label>

              <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.subscribe}
                    onChange={(event) => handleInputChange('subscribe', event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Subscribe to WaveLab operational updates</span>
                </label>

                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">
                  Send request <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-5">
            <section className={glassPanel(isDarkMode, 'p-6 sm:p-7')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Support scope" title="How we can assist" description="Choose the closest request type so the team can route your message properly." />
              <div className="mt-5 space-y-4">
                {assistanceItems.map(({ title, description, Icon }, index) => (
                  <article key={title} className={cx(innerCard(isDarkMode, 'p-4'), HOVER_LIFT)}>
                    <div className="flex gap-4">
                      <IconBubble icon={Icon} compact tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                      <div>
                        <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
                        <p className={cx('mt-1 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={cx('relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-7', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-900/78' : 'border-white/80 bg-white/90 ring-1 ring-sky-100/70')}>
              <div className="absolute inset-0" aria-hidden="true">
                <ThemeImagePair
                  lightSrc={OPERATIONS_IMAGE_LIGHT_URL}
                  darkSrc={OPERATIONS_IMAGE_DARK_URL}
                  isDark={isDarkMode}
                  className="absolute inset-0 h-full w-full object-cover object-[80%_70%] opacity-22"
                />
                <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-slate-950/80' : 'bg-white/78')} />
              </div>
              <div className="relative z-10">
                <SectionHeading isDark={isDarkMode} eyebrow="Operations center" title="WaveLab Forecast Hub" />
                <div className="mt-5 space-y-5 text-sm">
                  {[
                    { Icon: MapPin, title: 'Location', body: settings.operationsLocation || 'Agham Road, Diliman, Quezon City, Philippines' },
                    { Icon: Clock, title: 'Hours', body: settings.operationsHours || 'Monday to Friday · 08:00 AM - 06:00 PM (GMT+8)' },
                    { Icon: Phone, title: 'Urgent coordination', body: settings.operationsPhone || '+63 (02) 8123-9999' },
                  ].map(({ Icon, title, body }) => (
                    <div key={title} className="flex items-start gap-4">
                      <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-500" />
                      <div>
                        <p className={cx('font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
                        <p className={cx('mt-1 font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className={cx('rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8', SURFACE_TRANSITION, isDarkMode ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50/85 ring-1 ring-amber-100/70')}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <IconBubble icon={ShieldAlert} tone="amber" />
            <div className="min-w-0 flex-1">
              <h2 className={cx('text-2xl font-black', isDarkMode ? 'text-amber-50' : 'text-slate-950')}>Important Notice</h2>
              <p className={cx('mt-2 max-w-4xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/85' : 'text-slate-700')}>
                WaveLab contact channels are for public portal support and coordination. For official weather warnings, advisories, and emergency decisions, always follow DOST-PAGASA and local authority channels.
              </p>
            </div>
          </div>
        </section>

        {teamMembers.length ? (
          <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
            <SectionHeading isDark={isDarkMode} eyebrow="Team" title="WaveLab public support contacts" description="Selected team contacts for coordination and public portal support." />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {teamMembers.slice(0, 4).map((member) => (
                <article key={member.email || member.name} className={cx(innerCard(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                  {member.avatar ? <img src={member.avatar} alt={`${member.name} profile`} className="mb-4 h-14 w-14 rounded-2xl object-cover shadow-md" loading="lazy" /> : <Users className="mb-4 h-8 w-8 text-cyan-500" />}
                  <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{member.name}</p>
                  <p className={cx('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{member.role}</p>
                  {member.email ? <p className={cx('mt-4 truncate text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{member.email}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <p className={cx('text-center text-xs font-semibold tabular-nums', isDarkMode ? 'text-slate-600' : 'text-slate-400')}>Public inquiries are handled by the appropriate WaveLab/PAGASA support channel. Official warnings and advisories remain the source of truth.</p>
      </div>
    </main>
  );
};

export default Contact;
