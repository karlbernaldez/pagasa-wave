import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
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

const ROUTING_NOTES = [
  'For official warnings, use DOST-PAGASA public channels.',
  'For chart issues, include chart date, product type, and forecast period.',
  'For coordination, include agency, location, urgency, and response channel.',
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
      <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDark ? 'bg-[radial-gradient(circle_at_18%_6%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(37,99,235,0.10),transparent_30%),linear-gradient(180deg,#020617_0%,#06111f_44%,#020617_100%)]' : 'bg-[radial-gradient(circle_at_16%_8%,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(6,182,212,0.18),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_45%,#f8fafc_100%)]')} />
      <div className={cx('absolute -left-44 top-36 h-[520px] w-[520px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-cyan-500/10' : 'bg-blue-300/18')} />
      <div className={cx('absolute -right-40 top-[520px] h-[560px] w-[560px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-blue-700/10' : 'bg-cyan-200/24')} />
      <div className={cx('absolute left-1/2 top-20 h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-white/[0.025]' : 'bg-white/65')} />
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

function SectionHeading({ isDark, eyebrow, title, description }) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-cyan-300/80' : 'text-blue-600')}>{eyebrow}</p> : null}
      {title ? <h2 className={cx('text-2xl font-black tracking-tight sm:text-3xl', isDark ? 'text-white' : 'text-slate-950')}>{title}</h2> : null}
      {description ? <p className={cx('max-w-3xl text-sm font-semibold leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>{description}</p> : null}
    </div>
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
        <header className={glassPanel(isDarkMode, 'p-6 sm:p-8 lg:p-9')}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)] lg:items-end">
            <div>
              <p className={cx('w-fit rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-xl', SURFACE_TRANSITION, isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-blue-200/90 bg-white/80 text-blue-700 shadow-sm shadow-blue-100/60')}>
                Public support desk
              </p>
              <h1 className={cx('mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Get the right <span className={cx('bg-clip-text text-transparent', isDarkMode ? 'bg-gradient-to-r from-blue-300 to-cyan-200' : 'bg-gradient-to-r from-blue-700 to-cyan-500')}>WaveLab support</span>
              </h1>
              <p className={cx('mt-5 max-w-3xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                {settings.heroDescription || 'Send chart questions, public portal feedback, operational coordination requests, or partnership inquiries to the proper WaveLab/PAGASA support channel.'}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#contact-request" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">
                  <Send size={17} /> Start request
                </a>
                <Link to="/charts" className={cx('inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto', isDarkMode ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200/90 bg-white/78 text-slate-700 shadow-sm shadow-blue-100/50 hover:bg-white')}>
                  <BarChart3 size={17} /> Check charts first
                </Link>
              </div>
            </div>

            <div className={cx('rounded-[1.75rem] border p-4', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-950/42' : 'border-slate-200/80 bg-white/72')}>
              <p className={cx('text-xs font-black uppercase tracking-[0.18em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Routing checklist</p>
              <div className="mt-4 grid gap-3">
                {ROUTING_NOTES.map((note, index) => (
                  <div key={note} className={cx('flex gap-3 rounded-2xl border p-3', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white/78 shadow-sm shadow-blue-100/40')}>
                    <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black', isDarkMode ? 'bg-cyan-300/10 text-cyan-100' : 'bg-blue-50 text-blue-700')}>{index + 1}</span>
                    <p className={cx('text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_330px]">
          <aside className="flex flex-col gap-5 xl:sticky xl:top-24 xl:self-start">
            <section className={glassPanel(isDarkMode, 'p-5 sm:p-6')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Contact channels" title="Choose a channel" description="Use the method that best matches your request." />
              <div className="mt-5 grid gap-4">
                {contactCards.map(({ title, description, value, Icon }, index) => (
                  <article key={title} className={cx(innerCard(isDarkMode, 'p-4'), HOVER_LIFT)}>
                    <div className="flex gap-4">
                      <IconBubble icon={Icon} compact tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                      <div className="min-w-0">
                        <h2 className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2>
                        <p className={cx('mt-1 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                        <p className={cx('mt-3 break-words text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{value}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <form id="contact-request" className={glassPanel(isDarkMode, 'p-6 sm:p-8 scroll-mt-24')} onSubmit={(event) => event.preventDefault()}>
            <div className="mb-7 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:pb-7">
              <div className="flex items-start gap-4">
                <IconBubble icon={Send} />
                <div>
                  <p className={cx('text-xs font-black uppercase tracking-[0.18em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Request form</p>
                  <h2 className={cx('mt-1 text-2xl font-black tracking-tight sm:text-3xl', isDarkMode ? 'text-white' : 'text-slate-950')}>Tell us what you need</h2>
                  <p className={cx('mt-2 max-w-2xl text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Include your organization, location, urgency, and the WaveLab chart or portal area involved.</p>
                </div>
              </div>
              <span className={cx('w-fit rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.14em]', isDarkMode ? 'bg-cyan-300/10 text-cyan-100' : 'bg-blue-50 text-blue-700')}>Non-emergency</span>
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
                  rows="7"
                  placeholder="Share the coastal area, chart date, urgency, and preferred response channel."
                  value={formData.message}
                  onChange={(event) => handleInputChange('message', event.target.value)}
                  className={cx(inputCls, 'resize-none')}
                />
              </label>

              <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:p-5">
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

          <aside className="flex flex-col gap-5 xl:sticky xl:top-24 xl:self-start">
            <section className={glassPanel(isDarkMode, 'p-5 sm:p-6')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Response targets" title="What happens next" description="Expected handling times depend on request type and urgency." />
              <div className="mt-5 grid gap-3">
                {responseTargets.map(({ type, time, Icon }, index) => (
                  <article key={type} className={cx(innerCard(isDarkMode, 'p-4'), HOVER_LIFT)}>
                    <div className="flex gap-4">
                      <IconBubble icon={Icon} compact tone={index === 0 ? 'amber' : index === 2 ? 'violet' : 'blue'} />
                      <div>
                        <p className={cx('text-xs font-black uppercase tracking-[0.14em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{type}</p>
                        <p className={cx('mt-1 text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{time}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={cx('relative overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6', SURFACE_TRANSITION, isDarkMode ? 'border-white/10 bg-slate-900/78' : 'border-white/80 bg-white/90 ring-1 ring-sky-100/70')}>
              <div className="absolute inset-0" aria-hidden="true">
                <ThemeImagePair
                  lightSrc={OPERATIONS_IMAGE_LIGHT_URL}
                  darkSrc={OPERATIONS_IMAGE_DARK_URL}
                  isDark={isDarkMode}
                  className="absolute inset-0 h-full w-full object-cover object-[80%_70%]"
                />
                <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDarkMode ? 'bg-slate-950/82' : 'bg-white/80')} />
              </div>
              <div className="relative z-10">
                <SectionHeading isDark={isDarkMode} eyebrow="Operations center" title="Forecast Hub" />
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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
            <SectionHeading isDark={isDarkMode} eyebrow="Support scope" title="How we can assist" description="These categories help users choose the correct request type before sending a message." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {assistanceItems.map(({ title, description, Icon }, index) => (
                <article key={title} className={cx(innerCard(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                  <IconBubble icon={Icon} compact tone={index === 1 ? 'green' : index === 2 ? 'violet' : 'blue'} />
                  <p className={cx('mt-4 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
                  <p className={cx('mt-2 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={cx('rounded-[2rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8', SURFACE_TRANSITION, isDarkMode ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50/85 ring-1 ring-amber-100/70')}>
            <div className="flex flex-col gap-5">
              <IconBubble icon={ShieldAlert} tone="amber" />
              <div>
                <h2 className={cx('text-2xl font-black', isDarkMode ? 'text-amber-50' : 'text-slate-950')}>Important Notice</h2>
                <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/85' : 'text-slate-700')}>
                  WaveLab contact channels are for public portal support and coordination. For official weather warnings, advisories, and emergency decisions, always follow DOST-PAGASA and local authority channels.
                </p>
              </div>
            </div>
          </section>
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
