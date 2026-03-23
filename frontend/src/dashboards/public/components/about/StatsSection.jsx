// ╔══════════════════════════════════════════════════════╗
// ║                    StatsSection                      ║
// ║  Props: stats — array of { number, label, sublabel } ║
// ║  Responsive: auto-adjusts columns based on count     ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';

// Returns a Tailwind grid-cols class that fits any count nicely
const getGridCols = (count) => {
  if (count <= 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  if (count <= 6) return 'sm:grid-cols-2 md:grid-cols-3';
  return 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
};

const StatsSection = ({ stats = [] }) => {
  const { isDarkMode } = useTheme();

  if (!stats.length) return null;

  return (
    <section
      className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border ${
        isDarkMode
          ? 'bg-slate-900/30 border-slate-800'
          : 'bg-white/50 border-slate-200'
      }`}
    >
      <div className={`grid gap-8 ${getGridCols(stats.length)}`}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`text-center group transition-all duration-500 hover:scale-110 p-6 rounded-xl ${
              isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-white/70'
            }`}
            style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
          >
            <div className="text-3xl lg:text-4xl font-black mb-2 bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
              {stat.number}
            </div>
            <div
              className={`text-base font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {stat.label}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {stat.sublabel}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;