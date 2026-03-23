import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from 'framer-motion';
import { Database, BarChart3, FileText, ExternalLink, Zap } from 'lucide-react';

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const featureVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ─── Single service card ─── */
const ServiceCard = ({ service, isDark }) => {
  const Icon = service.icon;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={cardVariant}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="group h-full"
    >
      <motion.div
        className={`relative h-full p-8 rounded-2xl border backdrop-blur-sm cursor-pointer overflow-hidden ${
          isDark
            ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700'
            : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
        }`}
        whileHover={{
          scale: 1.03,
          y: -6,
          boxShadow: isDark
            ? '0 30px 60px -15px rgba(0,0,0,0.5)'
            : '0 30px 60px -15px rgba(0,0,0,0.12)',
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* Gradient wash on hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${service.color} pointer-events-none rounded-2xl`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.04 }}
          transition={{ duration: 0.4 }}
        />

        {/* Shine sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
          initial={false}
        >
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12"
            initial={{ x: '-200%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="relative z-10">
          {/* Icon + Badge */}
          <div className="flex items-start justify-between mb-6">
            <motion.div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3.5 shadow-lg`}
              whileHover={{ scale: 1.15, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Icon className="w-full h-full text-white" strokeWidth={2} />
            </motion.div>

            <motion.span
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${service.badgeColor}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 16 }}
            >
              {service.badge}
            </motion.span>
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold mb-3 tracking-tight ${
            isDark
              ? 'text-white group-hover:text-blue-300'
              : 'text-slate-900 group-hover:text-blue-700'
          } transition-colors duration-300`}>
            {service.title}
          </h3>

          {/* Description */}
          <p className={`text-base leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {service.description}
          </p>

          {/* Feature pills — stagger on inView */}
          <motion.div
            className="grid grid-cols-2 gap-2 mb-6"
            variants={stagger}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
          >
            {service.features.map((feature) => (
              <motion.div
                key={feature}
                variants={featureVariant}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  isDark
                    ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                } transition-colors duration-200`}
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color} flex-shrink-0`} />
                {feature}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA button */}
          <motion.button
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm ${
              isDark
                ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-900/20'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
            } transition-colors duration-300`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Access Portal
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ExternalLink className="w-4 h-4" />
            </motion.span>
          </motion.button>
        </div>

        {/* Corner dots */}
        <motion.div
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-br ${service.color}`}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-gradient-to-br ${service.color}`}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
        />
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════════ */
const QuickAccessServices = ({ isDark }) => {
  const sectionRef = useRef(null);
  const headerRef  = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-100px' });

  /* Scroll-linked parallax for the background orbs */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  const orb1Y = useTransform(smoothProgress, [0, 1], ['-15%', '15%']);
  const orb2Y = useTransform(smoothProgress, [0, 1], ['15%', '-15%']);

  /* Grid lines drift very slightly on scroll */
  const gridY = useTransform(smoothProgress, [0, 1], ['0%', '6%']);

  const services = [
    {
      icon: Database,
      title: 'Typhoon Forecast Support',
      description:
        'Analysis and forecast aids that strengthen operational decision-making for tropical cyclone monitoring.',
      color: 'from-blue-500 to-cyan-500',
      features: ['Forecast aids', 'Operational guidance', 'Scenario analysis', 'Regional support'],
      badge: 'Objective 01',
      badgeColor: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: BarChart3,
      title: 'Wave Prediction Operations',
      description:
        'Optimized wave prediction system delivering dependable marine weather services for Philippine coastal waters.',
      color: 'from-purple-500 to-pink-500',
      features: ['Operational wave models', 'Marine outlooks', 'Coastal guidance', 'Service delivery'],
      badge: 'Objective 02',
      badgeColor: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
    },
    {
      icon: FileText,
      title: 'Radar & Climate Applications',
      description:
        'Dual-pol radar QC, QPE/QPN rainfall monitoring, data assimilation, and S2S climate services.',
      color: 'from-amber-500 to-orange-500',
      features: ['Radar QC', 'QPE/QPN products', 'Data assimilation', 'S2S services'],
      badge: 'Objectives 03–06',
      badgeColor: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`relative py-20 lg:py-32 overflow-hidden transition-colors duration-700 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
    >
      {/* ── Parallax grid background ── */}
      <motion.div
        className={`absolute inset-0 opacity-[0.025] pointer-events-none ${
          isDark
            ? 'bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)]'
        } bg-[size:3rem_3rem]`}
        style={{ y: gridY }}
      />

      {/* ── Parallax gradient orbs ── */}
      <motion.div
        className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-blue-500/6' : 'bg-blue-400/8'
        }`}
        style={{ y: orb1Y }}
      />
      <motion.div
        className={`absolute bottom-20 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-purple-500/6' : 'bg-purple-400/8'
        }`}
        style={{ y: orb2Y }}
      />

      {/* ── Scroll-reveal top divider line ── */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent`}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ transformOrigin: 'center' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16 lg:mb-20"
          variants={stagger}
          initial="hidden"
          animate={headerInView ? 'show' : 'hidden'}
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm border ${
              isDark
                ? 'bg-blue-500/10 text-blue-300 border-blue-400/20'
                : 'bg-blue-100/80 text-blue-700 border-blue-200'
            }`}
            whileHover={{ scale: 1.04 }}
          >
            <motion.span
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={16} />
            </motion.span>
            Project Focus Areas
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={fadeUp}
            className={`text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Component B{' '}
            <motion.span
              className={`bg-gradient-to-r bg-clip-text text-transparent ${
                isDark ? 'from-blue-400 to-cyan-400' : 'from-blue-600 to-cyan-600'
              }`}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Objectives
            </motion.span>
          </motion.h2>

          {/* Sub-copy */}
          <motion.p
            variants={fadeUp}
            className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Aligned with the DOST-PAGASA objectives for typhoon, marine weather, radar rainfall,
            and S2S climate services.
          </motion.p>

          {/* Decorative animated underline */}
          <motion.div
            className={`mx-auto mt-8 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500`}
            initial={{ width: 0, opacity: 0 }}
            animate={headerInView ? { width: '6rem', opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
          />
        </motion.div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessServices;