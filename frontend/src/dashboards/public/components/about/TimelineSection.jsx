// ╔══════════════════════════════════════════════════════╗
// ║                   TimelineSection                    ║
// ║  Props:                                              ║
// ║    sectionTitle — heading                            ║
// ║    sectionSubtitle — subtitle under heading          ║
// ║    milestones — array of { year, title, description }║
// ║                                                      ║
// ║  Design: Vertical timeline with connecting line      ║
// ║  → Scales to any number of items cleanly             ║
// ║  → Alternates left/right on desktop, stacks on mobile║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const COLOR_POOL = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-indigo-500',
  'from-lime-500 to-green-500',
  'from-fuchsia-500 to-purple-500',
];

const TimelineSection = ({
  sectionTitle = 'Program Timeline',
  sectionSubtitle = '',
  milestones = [],
}) => {
  const { isDarkMode } = useTheme();

  if (!milestones.length) return null;

  return (
    <section
      className={`rounded-2xl border p-8 lg:p-10 shadow-xl backdrop-blur-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg flex-shrink-0">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2
            className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {sectionSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Timeline — vertical line + alternating cards on md+ */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div
          className={`absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
          }`}
        />

        <div className="flex flex-col gap-0">
          {milestones.map((milestone, index) => {
            const color     = COLOR_POOL[index % COLOR_POOL.length];
            const isEven    = index % 2 === 0;

            return (
              <div
                key={`${milestone.year}-${index}`}
                className={`relative flex items-start gap-6 pb-10 last:pb-0
                  md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}
                `}
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.12}s both` }}
              >
                {/* Content card — takes 5/12 on each side */}
                <div className={`
                  group ml-14 flex-1
                  md:ml-0 md:w-5/12
                  ${isEven ? 'md:pr-10 md:text-right' : 'md:pl-10 md:text-left'}
                `}>
                  <div
                    className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800/90 hover:border-slate-600 hover:shadow-2xl'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                    <div className="relative">
                      <span
                        className={`inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-3 bg-gradient-to-r ${color} text-white`}
                      >
                        {milestone.year}
                      </span>
                      <h3
                        className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                        }`}
                      >
                        {milestone.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center dot — sits on the line */}
                <div
                  className={`
                    absolute left-6 top-6 -translate-x-1/2
                    md:static md:translate-x-0
                    md:flex md:w-2/12 md:items-start md:justify-center md:pt-6
                  `}
                >
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} shadow-lg ring-4 ${
                      isDarkMode ? 'ring-slate-900' : 'ring-white'
                    } transition-all duration-500 hover:scale-110 hover:rotate-6 z-10`}
                  >
                    <span className="text-xs font-black text-white leading-none text-center px-1">
                      {milestone.year.toString().slice(-2)}
                    </span>
                  </div>
                </div>

                {/* Empty spacer for the opposite side on desktop */}
                <div className="hidden md:block md:w-5/12" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;