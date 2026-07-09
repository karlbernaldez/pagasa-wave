import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Globe, Mail, MapPin, MessageCircle, Phone, Send, Shield, Users, Waves, Zap } from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import useContactSettings from '@/dashboards/public/hooks/useContactSettings';

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
    title: 'Operations Email',
    description: 'For WaveLab chart access, published output questions, and operational coordination.',
    value: 'pagasa.wavelab@example.com',
    icon: 'mail',
  },
  {
    title: 'Forecast Desk',
    description: 'For time-sensitive coastal and marine weather coordination with PAGASA teams.',
    value: '+63 (02) 8123-9999',
    icon: 'phone',
  },
  {
    title: 'Forecast Hub',
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

function resolveIcon(icon, fallback = Mail) {
  if (typeof icon !== 'string') return fallback;
  return ICON_MAP[icon] || fallback;
}

function SectionHeading({ isDark, eyebrow, title, description }) {
  return (
    <div>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300/80' : 'text-blue-600'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-2xl font-black tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
      {description ? <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p> : null}
    </div>
  );
}

const Contact = () => {
  const { isDarkMode } = useTheme();
  const settings = useContactSettings() || {};
  const [formData, setFormData] = useState({ name: '', organization: '', email: '', phone: '', message: '', subscribe: false });

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
  const inputCls = isDarkMode
    ? 'border-white/10 bg-slate-950/55 text-slate-100 placeholder:text-slate-600 focus:border-cyan-300/50'
    : 'border-slate-200/80 bg-white/70 text-slate-950 placeholder:text-slate-400 focus:border-blue-300';

  const handleInputChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <LiquidBackdrop isDark={isDarkMode} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7">
        <section className={glassPanel(isDarkMode, 'mx-auto w-full max-w-5xl p-7 text-center sm:p-9')}>
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-100/80 text-blue-700'}`}>
              <Globe size={15} />
              {settings.heroBadgeText || 'WaveLab Public Support'}
            </div>
          </div>
          <h1 className={`text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {settings.heroTitlePrefix || 'Contact'}{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-blue-400 via-cyan-300 to-emerald-300' : 'from-blue-700 via-cyan-600 to-emerald-600'}`}>
              {settings.heroTitleHighlight || 'WaveLab'}
            </span>{' '}
            {settings.heroTitleSuffix || 'Support'}
          </h1>
          <p className={`mx-auto mt-4 max-w-3xl text-base font-semibold leading-relaxed sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {settings.heroDescription || 'Reach the WaveLab/PAGASA team for published chart questions, operational coordination, public portal feedback, and partnership requests.'}
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {contactCards.map(({ title, description, value, Icon }) => (
            <article key={title} className={`${glassPanel(isDarkMode, 'group p-6 transition duration-300')} ${isDarkMode ? 'hover:border-cyan-300/30' : 'hover:border-blue-200'}`}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                <Icon size={22} />
              </div>
              <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
              <p className={`mt-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
              <p className={`mt-4 break-words text-sm font-black ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>{value}</p>
            </article>
          ))}
        </section>

        <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeading
              isDark={isDarkMode}
              eyebrow="Response targets"
              title="Clear routing for public and operational requests"
              description="Use the form below for non-emergency WaveLab support. For official warnings and advisories, always follow DOST-PAGASA public channels."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {responseTargets.map(({ type, time, Icon }) => (
                <article key={type} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                  <Icon className="mb-3 h-6 w-6 text-cyan-500" />
                  <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{type}</p>
                  <p className={`mt-2 text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{time}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <form className={glassPanel(isDarkMode, 'p-6 sm:p-8')} onSubmit={(event) => event.preventDefault()}>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                <Send size={23} />
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>Send a Request</h2>
                <p className={`mt-1 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tell us your organization, location, urgency, and the WaveLab product or public portal issue you need help with.</p>
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
                      className={`rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-blue-400/60 ${inputCls}`}
                    />
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-2 text-sm font-black">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>How can we help?</span>
                <textarea
                  rows="5"
                  placeholder="Share the coastal area, chart date, urgency, and preferred response channel."
                  value={formData.message}
                  onChange={(event) => handleInputChange('message', event.target.value)}
                  className={`resize-none rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-blue-400/60 ${inputCls}`}
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.subscribe}
                    onChange={(event) => handleInputChange('subscribe', event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Subscribe to WaveLab operational updates</span>
                </label>

                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60">
                  Send Request <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-5">
            <section className={glassPanel(isDarkMode, 'p-6 sm:p-7')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Support scope" title="How we can assist" description="Choose the closest request type so the team can route your message properly." />
              <div className="mt-6 space-y-4">
                {assistanceItems.map(({ title, description, Icon }) => (
                  <article key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"><Icon size={18} /></div>
                      <div>
                        <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</p>
                        <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={glassPanel(isDarkMode, 'p-6 sm:p-7')}>
              <SectionHeading isDark={isDarkMode} eyebrow="Operations Center" title="WaveLab Forecast Hub" />
              <div className="mt-6 space-y-5 text-sm">
                {[
                  { Icon: MapPin, title: 'Location', body: settings.operationsLocation || 'Agham Road, Diliman, Quezon City, Philippines' },
                  { Icon: Clock, title: 'Hours', body: settings.operationsHours || 'Monday to Friday · 08:00 AM - 06:00 PM (GMT+8)' },
                  { Icon: Phone, title: 'Urgent Coordination', body: settings.operationsPhone || '+63 (02) 8123-9999' },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4">
                    <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-500" />
                    <div>
                      <p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{title}</p>
                      <p className={`mt-1 font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        {teamMembers.length ? (
          <section className={glassPanel(isDarkMode, 'p-6 sm:p-8')}>
            <SectionHeading isDark={isDarkMode} eyebrow="Team" title="WaveLab public support contacts" description="Selected team contacts for coordination and public portal support." />
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {teamMembers.slice(0, 4).map((member) => (
                <article key={member.email || member.name} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/65'}`}>
                  {member.avatar ? <img src={member.avatar} alt={`${member.name} profile`} className="mb-4 h-14 w-14 rounded-2xl object-cover shadow-md" loading="lazy" /> : <Users className="mb-4 h-8 w-8 text-cyan-500" />}
                  <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{member.name}</p>
                  <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{member.role}</p>
                  {member.email ? <p className={`mt-4 truncate text-xs font-black ${isDarkMode ? 'text-cyan-200' : 'text-blue-700'}`}>{member.email}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <p className={`text-center text-xs font-semibold tabular-nums ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Public inquiries are handled by the appropriate WaveLab/PAGASA support channel. Official warnings and advisories remain the source of truth.</p>
      </div>
    </div>
  );
};

export default Contact;
