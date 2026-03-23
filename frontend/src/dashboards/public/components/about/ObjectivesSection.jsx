// ╔══════════════════════════════════════════════════════╗
// ║                  ObjectivesSection                   ║
// ║  Props:                                              ║
// ║    sectionBadge   — badge text above heading         ║
// ║    sectionTitle   — heading text                     ║
// ║    sectionSubtitle — paragraph below heading         ║
// ║    programObjectives — array of { title, description }║
// ║  Responsive: auto-fills grid cleanly for 1–N items   ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { CheckCircle2, Cloud, Waves, Activity, Zap, Target, Globe2, Star, Shield } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const ICON_POOL = [Cloud, Waves, Activity, Zap, Target, Globe2, Star, Shield];

// Responsive grid: 3 cols for ≥6, 2 cols for 3–5, 1 col for 1–2
const getGridCols = (count) => {
  if (count <= 2) return 'md:grid-cols-2';
  if (count <= 5) return 'md:grid-cols-2 lg:grid-cols-3';
  return 'md:grid-cols-2 lg:grid-cols-3';
};

const ObjectivesSection = ({
  sectionBadge = 'MECO-TECO-VOTE III Program',
  sectionTitle = 'Program Objectives',
  sectionSubtitle = '',
  programObjectives = [],
}) => {
  const { isDarkMode } = useTheme();

  if (!programObjectives.length) return null;

  return (
    <section className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm ${
            isDarkMode
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20'
              : 'bg-emerald-100/80 text-emerald-700 border border-emerald-200'
          }`}
        >
          <CheckCircle2 size={18} />
          {sectionBadge}
        </div>
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
            className={`text-base md:text-lg max-w-4xl mx-auto transition-colors duration-700 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {sectionSubtitle}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className={`grid gap-6 ${getGridCols(programObjectives.length)}`}>
        {programObjectives.map(({ title, description }, index) => {
          const Icon = ICON_POOL[index % ICON_POOL.length];

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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-black text-sm ${
                        isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {index + 1}
                    </div>
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

export default ObjectivesSection;