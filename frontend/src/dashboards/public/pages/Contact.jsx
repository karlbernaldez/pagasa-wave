// Contact.jsx — fully aligned to WaveHeroSection aesthetic
import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Clock, Send, MessageCircle,
  Globe, CheckCircle2, Zap, Users, Shield, Waves,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/providers/ThemeProvider';
import useContactSettings from '@/dashboards/public/hooks/useContactSettings';

/* ─── animation presets (identical to WaveHeroSection + StudioLanding) ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: d },
  }),
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'backOut' } },
};

const ICON_MAP = {
  mail: Mail, phone: Phone, 'map-pin': MapPin, globe: Globe,
  shield: Shield, users: Users, zap: Zap, clock: Clock,
  'message-circle': MessageCircle,
};

const Contact = () => {
  document.title = 'Contact Us | WaveLab';
  const { isDarkMode } = useTheme();
  const settings = useContactSettings();

  const [formData, setFormData] = useState({
    name: '', organization: '', email: '',
    phone: '', message: '', subscribe: false,
  });

  const contactCards    = (settings.contactCards    ?? []).map((c) => ({ ...c, icon: ICON_MAP[c.icon]    || Mail  }));
  const assistanceItems = (settings.assistanceItems ?? []).map((i) => ({ ...i, icon: ICON_MAP[i.icon]    || Globe }));
  const responseTargets = (settings.responseTargets ?? []).map((t) => ({ ...t, icon: ICON_MAP[t.icon]    || Clock }));
  const teamMembers     = settings.teamMembers ?? [];

  /* shared token helpers */
  const headText = isDarkMode ? 'text-white'      : 'text-slate-900';
  const muteText = isDarkMode ? 'text-slate-300'  : 'text-slate-600';
  const cardCls  = isDarkMode
    ? 'bg-slate-900/70 border-slate-700/60 backdrop-blur-sm hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
    : 'bg-white/90 border-slate-200 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-2xl';
  const inputCls = isDarkMode
    ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400';

  return (
    <div className={`relative min-h-screen pt-32 pb-20 px-4 md:px-6 overflow-hidden transition-all duration-700 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>

      {/* ── Scrolling keyframes (team carousel only) ── */}
      <style>{`
        @keyframes wavelab-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── Dot-grid background (matches hero exactly) ── */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0">
        <div className={`absolute inset-0 bg-[length:30px_30px] ${
          isDarkMode
            ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
            : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
        }`} />
      </div>

      {/* ── Ambient glow blobs (mirrors hero) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl ${
          isDarkMode ? 'bg-blue-600/10' : 'bg-blue-400/15'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full blur-3xl ${
          isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-400/12'
        }`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-20">

        {/* ══ Hero ══ */}
        <motion.section
          className="text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge — identical to WaveHeroSection badge */}
          <motion.div variants={scaleIn} className="mb-8">
            <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              isDarkMode
                ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
                : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
            }`}>
              <Globe className="animate-pulse" size={18} />
              {settings.heroBadgeText}
            </div>
          </motion.div>

          {/* Headline — gradient matches hero */}
          <motion.h1
            variants={fadeUp}
            custom={0.08}
            className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight ${headText}`}
          >
            {settings.heroTitlePrefix}{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
              isDarkMode
                ? 'from-blue-400 via-cyan-400 to-emerald-400'
                : 'from-blue-600 via-cyan-600 to-emerald-600'
            }`}>
              {settings.heroTitleHighlight}
            </span>{' '}
            {settings.heroTitleSuffix}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={0.16}
            className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed ${muteText}`}
          >
            {settings.heroDescription}
          </motion.p>
        </motion.section>

        {/* ══ Contact Cards ══ */}
        <motion.section
          className="grid gap-6 md:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {contactCards.map(({ title, description, value, icon: Icon, color }) => (
            <motion.div key={title} variants={scaleIn} className="group">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className={`relative h-full p-8 rounded-2xl border transition-all duration-300 overflow-hidden ${cardCls}`}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
                {/* Shine sweep */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
                {/* Corner dots */}
                <motion.div
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 pointer-events-none"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
                <div className="relative">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-5`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                  }`}>
                    {title}
                  </h3>
                  <p className={`text-sm mb-4 leading-relaxed ${muteText}`}>{description}</p>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{value}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.section>

        {/* ══ Response Targets Banner ══ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ scale: 1.01 }}
          className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-blue-700/30'
              : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border-blue-200/50'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
            <div className="lg:col-span-1">
              <h2 className={`text-2xl lg:text-3xl font-black mb-2 tracking-tight ${headText}`}>
                Response Targets
              </h2>
              <p className={`text-sm ${muteText}`}>We prioritize urgent coastal advisories</p>
            </div>
            <motion.div
              className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {responseTargets.map(({ type, time, icon: Icon }) => (
                <motion.div
                  key={type}
                  variants={scaleIn}
                  whileHover={{ scale: 1.02 }}
                  className={`p-5 rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white/70 hover:bg-white'
                  }`}
                >
                  <Icon className={`h-8 w-8 mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{type}</div>
                  <div className={`text-lg font-bold ${headText}`}>{time}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ══ Team Section ══ */}
        <motion.section
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="text-center">
            <h2 className={`text-3xl lg:text-4xl font-black mb-4 tracking-tight ${headText}`}>
              Meet the{' '}
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode
                  ? 'from-blue-400 via-cyan-400 to-emerald-400'
                  : 'from-blue-600 via-cyan-600 to-emerald-600'
              }`}>
                WaveLab Team
              </span>
            </h2>
            <p className={`text-base md:text-lg max-w-3xl mx-auto ${muteText}`}>
              Our coastal intelligence team is ready to help with forecasts, partnerships, and operational requests.
            </p>
          </div>

          <div className={`overflow-hidden rounded-2xl border p-8 shadow-xl backdrop-blur-sm ${
            isDarkMode ? 'border-slate-700/60 bg-slate-900/70' : 'border-slate-200 bg-white/90'
          }`}>
            <div className="relative">
              {/* Fade masks */}
              <div className={`pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r ${
                isDarkMode ? 'from-slate-900/90 via-slate-900/60' : 'from-white/90 via-white/60'
              } to-transparent z-10`} />
              <div className={`pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l ${
                isDarkMode ? 'from-slate-900/90 via-slate-900/60' : 'from-white/90 via-white/60'
              } to-transparent z-10`} />

              <div className="overflow-hidden">
                <div className="flex w-max gap-5" style={{ animation: 'wavelab-scroll 35s linear infinite' }}>
                  {[...teamMembers, ...teamMembers].map((member, index) => (
                    <div
                      key={`${member.name}-${index}`}
                      className={`group min-w-[280px] rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                        isDarkMode
                          ? 'border-slate-700/60 bg-slate-950/80 hover:bg-slate-950 hover:border-blue-500/40 hover:shadow-2xl'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-2xl'
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <img
                          src={member.avatar}
                          alt={`${member.name} profile`}
                          className="h-14 w-14 rounded-xl object-cover shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold mb-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                          }`}>
                            {member.name}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{member.role}</p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          <span className={`truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{member.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══ Contact Form + Sidebar ══ */}
        <motion.section
          className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          {/* ── Contact Form ── */}
          <div className={`rounded-2xl border p-8 lg:p-10 shadow-xl backdrop-blur-sm ${
            isDarkMode ? 'border-slate-700/60 bg-slate-900/70' : 'border-slate-200 bg-white/90'
          }`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <Send className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl lg:text-3xl font-black ${headText}`}>Send a Request</h2>
                <p className={`text-sm ${muteText}`}>
                  Tell us about your location, urgency, and the wave products you need.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { label: 'Full name',     key: 'name',         type: 'text',  placeholder: 'Juan dela Cruz'       },
                  { label: 'Organization',  key: 'organization', type: 'text',  placeholder: 'PAGASA Coastal Desk'  },
                  { label: 'Email address', key: 'email',        type: 'email', placeholder: 'name@email.com'       },
                  { label: 'Contact number',key: 'phone',        type: 'tel',   placeholder: '+63 9XX XXX XXXX'     },
                ].map(({ label, key, type, placeholder }) => (
                  <label key={key} className="flex flex-col gap-2.5 text-sm font-semibold">
                    <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{label}</span>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50 ${inputCls}`}
                    />
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-2.5 text-sm font-semibold">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>How can we help?</span>
                <textarea
                  rows="5"
                  placeholder="Share your coastal area, time sensitivity, and preferred response channel."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50 resize-none ${inputCls}`}
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.subscribe}
                    onChange={(e) => setFormData({ ...formData, subscribe: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400/50 cursor-pointer"
                  />
                  <span className={`transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-700'
                  }`}>
                    Subscribe to WaveLab operational updates
                  </span>
                </label>

                {/* Primary CTA — identical gradient to hero */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl"
                >
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                  Send Request
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-6">
            {/* Assistance Items */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
                isDarkMode ? 'border-slate-700/60 bg-slate-900/70' : 'border-slate-200 bg-white/90'
              }`}
            >
              <h3 className={`text-xl font-black mb-6 ${headText}`}>How We Can Assist</h3>
              <div className="flex flex-col gap-4">
                {assistanceItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    variants={scaleIn}
                    whileHover={{ scale: 1.02 }}
                    className={`group flex gap-4 p-4 rounded-xl transition-all duration-300 ${
                      isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br ${
                      index === 0 ? 'from-blue-500 to-cyan-500'
                        : index === 1 ? 'from-emerald-500 to-teal-500'
                        : 'from-purple-500 to-violet-500'
                    } flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold mb-1 ${headText}`}>{item.title}</p>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Operations Center */}
            <div className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
              isDarkMode ? 'border-slate-700/60 bg-slate-900/70' : 'border-slate-200 bg-white/90'
            }`}>
              <h3 className={`text-xl font-black mb-6 ${headText}`}>Operations Center</h3>
              <div className="flex flex-col gap-5 text-sm">
                {[
                  {
                    Icon: MapPin,
                    title: 'WaveLab Forecast Hub',
                    body:  'Agham Road, Diliman, Quezon City, Philippines',
                  },
                  {
                    Icon: Clock,
                    title: 'Hours of Operation',
                    body:  'Monday to Friday · 08:00 AM – 06:00 PM (GMT+8)',
                  },
                  {
                    Icon: Phone,
                    title: 'Emergency Line',
                    body:  '+63 (02) 8123-9999',
                  },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4">
                    <Icon className="mt-1 h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <div>
                      <p className={`font-bold mb-1 ${headText}`}>{title}</p>
                      <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default Contact;