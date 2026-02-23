// ╔══════════════════════════════════════════════════════╗
// ║                  FocusAreasSection                   ║
// ║  Props:                                              ║
// ║    sectionTitle — heading                            ║
// ║    sectionSubtitle — subheading                      ║
// ║    pillars — array of { title, description }         ║
// ║  Responsive: smart column count for any pillar count ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Cloud, Waves, Activity, Globe2, Zap, Target, Star, Shield } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const ICON_POOL  = [Cloud, Waves, Activity, Globe2, Zap, Target, Star, Shield];
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

// 1→1 col | 2→2 cols | 3→3 cols | 4→4 cols | 5+→ 2+3 wrap
const getGridCols = (count) => {
  if (count === 1) return 'grid-cols-1 max-w-sm mx-auto';
  if (count === 2) return 'md:grid-cols-2';
  if (count === 3) return 'md:grid-cols-3';
  if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4';
  if (count <= 6)  return 'md:grid-cols-2 lg:grid-cols-3';
  return 'md:grid-cols-2 lg:grid-cols-4';
};

const FocusAreasSection = ({
  sectionTitle = 'Program Focus Areas',
  sectionSubtitle = 'Key research and development areas driving seamless prediction capabilities.',
  pillars = [],
}) => {
  const { isDarkMode } = useTheme();

  if (!pillars.length) return null;

  return (
    <section className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <h2
          className={`text-3xl lg:text-4xl font-black mb-4 tracking-tight transition-colors duration-700 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Program{' '}
          <span
            className={`bg-gradient-to-r bg-clip-text text-transparent ${
              isDarkMode
                ? 'from-blue-400 via-cyan-400 to-emerald-400'
                : 'from-blue-600 via-cyan-600 to-emerald-600'
            }`}
          >
            {sectionTitle.replace('Program ', '')}
          </span>
        </h2>
        {sectionSubtitle && (
          <p
            className={`text-base md:text-lg max-w-3xl mx-auto transition-colors duration-700 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {sectionSubtitle}
          </p>
        )}
      </div>

      {/* Pillar Cards */}
      <div className={`grid gap-6 ${getGridCols(pillars.length)}`}>
        {pillars.map(({ title, description }, index) => {
          const Icon  = ICON_POOL[index % ICON_POOL.length];
          const color = COLOR_POOL[index % COLOR_POOL.length];

          return (
            <div
              key={title}
              className="group"
              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
            >
              <div
                className={`relative h-full p-7 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-5`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3
                    className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                    }`}
                  >
                    {title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FocusAreasSection;