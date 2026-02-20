import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from 'framer-motion';
import {
  ArrowRight, Waves, Wind, TrendingUp,
  MapPin, Eye, BarChart3, Compass, CheckCircle2,
} from 'lucide-react';

/* ─── Reusable animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'backOut' } },
};

/* ─── Mini bar chart bar ─── */
const Bar = ({ height, index, isDark }) => (
  <motion.div
    className={`flex-1 rounded-t ${
      isDark
        ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
        : 'bg-gradient-to-t from-blue-500 to-cyan-500'
    }`}
    initial={{ scaleY: 0, originY: 1 }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 0.6, delay: 0.9 + index * 0.07, ease: 'backOut' }}
    style={{ height: `${(height / 4) * 100}%` }}
    whileHover={{ opacity: 0.75 }}
  />
);

/* ─── Stat counter ─── */
const Stat = ({ value, label, isDark, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      className="text-center lg:text-left"
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
    >
      <div
        className={`text-3xl sm:text-4xl font-black bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent`}
      >
        {value}
      </div>
      <div className={`text-sm font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════════ */
const WaveHeroSection = ({ isDark }) => {
  const containerRef = useRef(null);

  /* Scroll-linked parallax */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
  const heroY = useTransform(smoothProgress, [0, 1], ['0%', '-14%']);
  const cardY = useTransform(smoothProgress, [0, 1], ['0%', '-6%']);
  const opacity = useTransform(smoothProgress, [0, 0.55], [1, 0]);
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const progressBarScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const detail = [
    { Icon: TrendingUp, label: 'Wave Period',        value: '12–14 sec', color: isDark ? 'text-emerald-400' : 'text-emerald-500' },
    { Icon: Compass,    label: 'Direction',          value: 'SW 225°',   color: isDark ? 'text-purple-400' : 'text-purple-500' },
    { Icon: Wind,       label: 'Marine Wind',        value: '8–12 kts',  color: isDark ? 'text-cyan-400'   : 'text-cyan-500'   },
    { Icon: Eye,        label: 'Visibility',         value: '10+ km',    color: isDark ? 'text-amber-400'  : 'text-amber-500'  },
  ];

  return (
    <section
      ref={containerRef}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-700 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave-pulse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-6px) rotate(8deg); }
        }
      `}</style>

      {/* ── Dot-grid background (matching About/Contact) ── */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none">
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
          } bg-[length:30px_30px]`}
        />
      </div>

      {/* ── Soft ambient glow blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl ${
            isDark ? 'bg-blue-600/10' : 'bg-blue-400/15'
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl ${
            isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/12'
          }`}
        />
      </div>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
        style={{ y: heroY, opacity }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">

          {/* ── Left: text ── */}
          <motion.div
            className="text-center lg:text-left space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Badge — matches About/Contact style exactly */}
            <motion.div variants={scaleIn}>
              <div
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
                    : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
                }`}
              >
                <Waves className="animate-pulse" size={18} />
                DOST-MECO-TECO-VOTE III · Component B · Project 1
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div className="space-y-5" variants={fadeUp} custom={0.1}>
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span
                  className={`bg-gradient-to-r bg-clip-text text-transparent ${
                    isDark
                      ? 'from-blue-400 via-cyan-400 to-emerald-400'
                      : 'from-blue-600 via-cyan-600 to-emerald-600'
                  }`}
                >
                  Typhoon &amp; Marine
                </span>{' '}
                Weather Services Excellence
              </h1>

              <p
                className={`text-lg sm:text-xl leading-relaxed max-w-2xl ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Advancing enhanced typhoon forecast support, operational wave prediction, and
                integrated marine weather services for confident coastal decision-making.
              </p>
            </motion.div>

            {/* CTA buttons — matches About/Contact button style */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              variants={fadeUp}
              custom={0.22}
            >
              <motion.a
                href="#objectives"
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                whileTap={{ scale: 0.97 }}
              >
                View Project Objectives
                <ArrowRight
                  className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300"
                />
              </motion.a>

              <motion.a
                href="#forecast"
                className={`inline-flex items-center justify-center gap-2.5 rounded-xl border px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    : 'border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <BarChart3 size={16} />
                Explore Forecast Tools
              </motion.a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className={`grid grid-cols-3 gap-6 pt-8 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Stat value="6"    label="Strategic Objectives" isDark={isDark} delay={0.3} />
              <Stat value="3"    label="Component Projects"   isDark={isDark} delay={0.4} />
              <Stat value="24/7" label="Operations Support"   isDark={isDark} delay={0.5} />
            </motion.div>
          </motion.div>

          {/* ── Right: forecast card — matches About/Contact card style ── */}
          <motion.div
            className="flex justify-center lg:justify-end"
            style={{ y: cardY }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          >
            {/* Outer group for shine effect */}
            <div className="group relative w-full max-w-md">
              <motion.div
                className={`relative h-full p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                }`}
                whileHover={{ scale: 1.02, y: -6 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                {/* Hover background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />

                {/* Shine sweep */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                {/* Decorative corner dots */}
                <motion.div
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 1.1 }}
                />

                {/* Card header */}
                <div className="relative">
                  <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                  >
                    <div
                      className={`flex items-center justify-center gap-2 mb-1.5 font-semibold text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <MapPin size={16} />
                      PAGASA Marine Forecast Desk
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Operational Guidance &bull;{' '}
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric',
                      })}
                    </div>
                  </motion.div>

                  {/* Wave height */}
                  <motion.div
                    className="text-center mb-8"
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.65 }}
                  >
                    <div className="relative inline-block">
                      <span
                        className={`text-6xl font-black ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        2.8m
                      </span>
                      <div
                        className="absolute -top-3 -right-10"
                        style={{ animation: 'wave-pulse 3s ease-in-out infinite' }}
                      >
                        <Waves
                          className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
                        />
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold mt-2 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      Operational Wave Guidance
                    </div>
                  </motion.div>

                  {/* Detail grid — same card pattern as About/Contact */}
                  <motion.div
                    className="grid grid-cols-2 gap-3 mb-5"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {detail.map(({ Icon, label, value, color }) => (
                      <motion.div
                        key={label}
                        variants={scaleIn}
                        className={`group/item text-center p-4 rounded-xl border transition-all duration-300 hover:scale-[1.04] ${
                          isDark
                            ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mx-auto mb-2 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-6 ${color}`}
                        />
                        <div
                          className={`text-xs font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {label}
                        </div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {value}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Mini bar chart */}
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? 'bg-slate-800/30 border-slate-700/40'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                      >
                        7-Day Marine Outlook
                      </span>
                      <BarChart3
                        className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      />
                    </div>
                    <div className="flex items-end justify-between h-14 gap-1">
                      {[2.1, 2.8, 3.2, 2.9, 2.3, 2.6, 3.1, 3.4].map((h, i) => (
                        <Bar key={i} height={h} index={i} isDark={isDark} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Today
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        7 Days
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ── Keyword pills (matching program badge style) ── */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-16 pt-10 border-t border-dashed"
          style={{
            borderColor: isDark ? 'rgba(51,65,85,0.6)' : 'rgba(203,213,225,0.8)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {[
            { icon: CheckCircle2, label: 'Typhoon Forecast' },
            { icon: Waves,        label: 'Wave Prediction' },
            { icon: BarChart3,    label: 'Radar Technology' },
            { icon: Compass,      label: 'Climate Services' },
            { icon: Wind,         label: 'Marine Weather' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'border-slate-700 text-slate-300 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-500'
                  : 'border-slate-200 text-slate-600 bg-white/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <Icon size={13} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
              {label}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll progress bar at bottom ── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        style={{ scaleX: progressBarScale, transformOrigin: 'left' }}
      />

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <span
          className={`text-xs tracking-widest uppercase font-medium ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Scroll
        </span>
        <div
          className={`w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5 ${
            isDark ? 'border-slate-700' : 'border-slate-300'
          }`}
        >
          <motion.div
            className={`w-1 h-2 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`}
            animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default WaveHeroSection;