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

const SURFACE_TRANSITION = 'transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-500 ease-out motion-reduce:transition-none';
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
    description: 'For chart access, published output questions, and operational coordination.',
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
  { title: 'Published chart support', description: 'Questions about available chart sets, publication status, and public access.', icon: 'waves' },
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
      <div className={cx('absolute inset-0', SURFACE_TRANSITION, isDark ? 'bg-[radial-gradient(circle_at_20%_8%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#06111f_48%,#020617_100%)]' : 'bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.13),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_48%,#f8fafc_100%)]')} />
      <div className={cx('absolute -left-44 top-28 h-[520px] w-[520px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-cyan-500/10' : 'bg-blue-300/18')} />
      <div className={cx('absolute -right-40 top-[520px] h-[560px] w-[560px] rounded-full blur-3xl', SURFACE_TRANSITION, isDark ? 'bg-blue-700/10' : 'bg-cyan-200/24')} />
    </div>
  );
}

function panel(isDark, extra = '') {
  return cx(
    'rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl',
    SURFACE_TRANSITION,
    isDark ? 'border-white/10 bg-slate-900/78 shadow-cyan-950/20' : 'border-white/80 bg-white/88 shadow-blue-100/80',
    extra
  );
}

function card(isDark, extra = '') {
  return cx(
    'rounded-3xl border',
    SURFACE_TRANSITION,
    isDark ? 'border-white/10 bg-slate-950/38' : 'border-slate-200/80 bg-white/70',
    extra
  );
}

function IconBubble({ Icon }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
      <Icon size={20} />
    </span>
  );
}

function SectionHeading({ isDark, eyebrow, title, description }) {
  return (
    <div>
      {eyebrow ? <p className={cx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-cyan-300/80' : 'text-blue-600')}>{eyebrow}</p> : null}
      {title ? <h2 className={cx('mt-2 text-2xl font-black tracking-tight sm:text-3xl', isDark ? 'text-white' : 'text-slate-950')}>{title}</h2> : null}
      {description ? <p className={cx('mt-2 max-w-3xl text-sm font-semibold leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>{description}</p> : null}
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
    return cards.map((item) => ({ ...item, Icon: resolveIcon(item.icon, Mail) }));
  }, [settings.contactCards]);

  const assistanceItems = useMemo(() => {
    const items = Array.isArray(settings.assistanceItems) && settings.assistanceItems.length ? settings.assistanceItems : DEFAULT_ASSISTANCE_ITEMS;
    return items.map((item) => ({ ...item, Icon: resolveIcon(item.icon, Globe) }));
  }, [settings.assistanceItems]);

  const responseTargets = useMemo(() => {
    const targets = Array.isArray(settings.responseTargets) && settings.responseTargets.length ? settings.responseTargets : DEFAULT_RESPONSE_TARGETS;
    return targets.map((item) => ({ ...item, Icon: resolveIcon(item.icon, Clock) }));
  }, [settings.responseTargets]);

  const teamMembers = Array.isArray(settings.teamMembers) ? settings.teamMembers : [];

  const inputCls = cx(
    'rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400/60',
    SURFACE_TRANSITION,
    isDarkMode ? 'border-white/10 bg-slate-950/55 text-slate-100 placeholder:text-slate-600 focus:border-cyan-300/50' : 'border-slate-200/80 bg-white/75 text-slate-950 placeholder:text-slate-400 focus:border-blue-300'
  );

  const handleInputChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className={cx('relative min-h-screen overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8', SURFACE_TRANSITION, isDarkMode ? 'text-white' : 'text-slate-950')}>
      <PageBackground isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-7">
        <header className={panel(isDarkMode, 'p-6 sm:p-8 lg:p-10')}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className={cx('text-xs font-black uppercase tracking-[0.22em]', isDarkMode ? 'text-cyan-300/80' : 'text-blue-600')}>Public support desk</p>
              <h1 className={cx('mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Contact WaveLab
              </h1>
              <p className={cx('mt-4 max-w-3xl text-base font-semibold leading-relaxed sm:text-lg', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                {settings.heroDescription || 'Send published chart questions, public portal feedback, operational coordination requests, or partnership inquiries to the WaveLab/PAGASA support team.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="#contact-request" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <Send size={17} /> Send request
              </a>
              <Link to="/charts" className={cx('inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0', isDarkMode ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white')}>
                <BarChart3 size={17} /> View charts
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {contactCards.map(({ title, description, value, Icon }) => (
            <article key={title} className={cx(card(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
              <IconBubble Icon={Icon} />
              <h2 className={cx('mt-4 text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2>
              <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
              <p className={cx('mt-3 break-words text-sm font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form id="contact-request" className={panel(isDarkMode, 'p-6 sm:p-8 scroll-mt-24')} onSubmit={(event) => event.preventDefault()}>
            <SectionHeading
              isDark={isDarkMode}
              eyebrow="Request form"
              title="Tell us what you need"
              description="Include your organization, location, urgency, and the WaveLab chart or portal area involved."
            />

            <div className="mt-7 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  { label: 'Full name', key: 'name', type: 'text', placeholder: 'Juan dela Cruz' },
                  { label: 'Organization', key: 'organization', type: 'text', placeholder: 'PAGASA Coastal Desk' },
                  { label: 'Email address', key: 'email', type: 'email', placeholder: 'name@email.com' },
                  { label: 'Contact number', key: 'phone', type: 'tel', placeholder: '+63 9XX XXX XXXX' },
                ].map(({ label, key, type, placeholder }) => (
                  <label key={key} className="flex flex-col gap-2 text-sm font-black">
                    <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{label}</span>
                    <input type={type} placeholder={placeholder} value={formData[key]} onChange={(event) => handleInputChange(key, event.target.value)} className={inputCls} />
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-2 text-sm font-black">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Request type</span>
                <select value={formData.requestType} onChange={(event) => handleInputChange('requestType', event.target.value)} className={inputCls}>
                  {REQUEST_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-black">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>How can we help?</span>
                <textarea rows={7} placeholder="Share the coastal area, chart date, urgency, and preferred response channel." value={formData.message} onChange={(event) => handleInputChange('message', event.target.value)} className={cx(inputCls, 'resize-none')} />
              </label>

              <div className={cx('flex flex-col items-stretch justify-between gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:p-5', isDarkMode ? 'border-white/10 bg-slate-950/25' : 'border-slate-200/80 bg-white/55')}>
                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                  <input type="checkbox" checked={formData.subscribe} onChange={(event) => handleInputChange('subscribe', event.target.checked)} className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400/50" />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Subscribe to WaveLab operational updates</span>
                </label>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  Send request <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-5">
            <section className={panel(isDarkMode, 'p-6')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Response" title="What happens next" />
              <div className="mt-5 space-y-4">
                {responseTargets.map(({ type, time, Icon }) => (
                  <div key={type} className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-cyan-500" />
                    <div>
                      <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{type}</p>
                      <p className={cx('mt-1 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={panel(isDarkMode, 'p-6')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Operations center" title="WaveLab Forecast Hub" />
              <div className="mt-5 space-y-5 text-sm">
                {[
                  { Icon: MapPin, title: 'Location', body: settings.operationsLocation || 'Agham Road, Diliman, Quezon City, Philippines' },
                  { Icon: Clock, title: 'Hours', body: settings.operationsHours || 'Monday to Friday, 08:00 AM - 06:00 PM (GMT+8)' },
                  { Icon: Phone, title: 'Urgent coordination', body: settings.operationsPhone || '+63 (02) 8123-9999' },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-cyan-500" />
                    <div className="min-w-0">
                      <p className={cx('font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
                      <p className={cx('mt-1 break-words font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={cx(panel(isDarkMode, 'p-6'), isDarkMode ? 'border-amber-300/20 bg-amber-300/10' : 'border-amber-200 bg-amber-50/85')}>
              <ShieldAlert className="h-6 w-6 text-amber-500" />
              <h2 className={cx('mt-4 text-lg font-black', isDarkMode ? 'text-amber-50' : 'text-slate-950')}>Important notice</h2>
              <p className={cx('mt-2 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-amber-50/85' : 'text-slate-700')}>
                WaveLab contact channels are for public portal support and coordination. For official warnings, advisories, and emergency decisions, follow DOST-PAGASA and local authority channels.
              </p>
            </section>
          </aside>
        </section>

        <section className={panel(isDarkMode, 'p-6 sm:p-8')}>
          <SectionHeading isDark={isDarkMode} eyebrow="Support scope" title="How we can assist" description="Use these categories to choose the most accurate request type before sending your message." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {assistanceItems.map(({ title, description, Icon }) => (
              <article key={title} className={cx(card(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                <IconBubble Icon={Icon} />
                <p className={cx('mt-4 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p>
                <p className={cx('mt-2 text-xs font-semibold leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{description}</p>
              </article>
            ))}
          </div>
        </section>

        {teamMembers.length ? (
          <section className={panel(isDarkMode, 'p-6 sm:p-8')}>
            <SectionHeading isDark={isDarkMode} eyebrow="Team" title="WaveLab public support contacts" description="Selected team contacts for coordination and public portal support." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teamMembers.map((member) => (
                <article key={member.email || member.name} className={cx(card(isDarkMode, 'h-full p-5'), HOVER_LIFT)}>
                  {member.avatar ? <img src={member.avatar} alt={`${member.name} profile`} className="mb-4 h-14 w-14 rounded-2xl object-cover shadow-md" loading="lazy" /> : <Users className="mb-4 h-8 w-8 text-cyan-500" />}
                  <p className={cx('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{member.name}</p>
                  <p className={cx('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{member.role}</p>
                  {member.email ? <p className={cx('mt-4 break-words text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{member.email}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <p className={cx('text-center text-xs font-semibold', isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
          Public inquiries are handled by the appropriate WaveLab/PAGASA support channel. Official warnings and advisories remain the source of truth.
        </p>
      </div>
    </main>
  );
};

export default Contact;
