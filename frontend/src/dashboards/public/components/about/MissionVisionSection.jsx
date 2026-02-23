// ╔══════════════════════════════════════════════════════╗
// ║                MissionVisionSection                  ║
// ║  Props: highlights — array of { title, description } ║
// ║  Responsive: 1 col → 2 col → auto for more items     ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Target, Globe2, Star, Zap, Shield, Heart } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

// Cycle through icons & gradient colors for any number of items
const ICON_POOL = [Target, Globe2, Star, Zap, Shield, Heart];
const COLOR_POOL = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-indigo-500',
];

const getGridCols = (count) => {
  if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
  if (count === 2) return 'md:grid-cols-2';
  if (count === 3) return 'md:grid-cols-3';
  return 'md:grid-cols-2 lg:grid-cols-3';
};

const MissionVisionSection = ({ highlights = [] }) => {
  const { isDarkMode } = useTheme();

  if (!highlights.length) return null;

  return (
    <section className={`grid gap-6 ${getGridCols(highlights.length)}`}>
      {highlights.map(({ title, description }, index) => {
        const Icon  = ICON_POOL[index % ICON_POOL.length];
        const color = COLOR_POOL[index % COLOR_POOL.length];

        return (
          <div
            key={title}
            className="group"
            style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
          >
            <div
              className={`relative h-full p-8 lg:p-10 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                  : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
              }`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
              {/* Shine sweep */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>

              <div className="relative">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-6`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h2
                  className={`text-2xl lg:text-3xl font-black mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                  }`}
                >
                  {title}
                </h2>
                <p
                  className={`text-base md:text-lg leading-relaxed ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default MissionVisionSection;