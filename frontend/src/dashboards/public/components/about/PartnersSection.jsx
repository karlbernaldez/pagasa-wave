// ╔══════════════════════════════════════════════════════╗
// ║                  PartnersSection                     ║
// ║  Props:                                              ║
// ║    partners — array of strings                       ║
// ║  Responsive: auto-wrapping flex badges               ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const PartnersSection = ({ partners = [] }) => {
  const { isDarkMode } = useTheme();

  if (!partners.length) return null;

  return (
    <div
      className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2
            className={`text-xl font-black transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Partner Agencies
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {partners.length} {partners.length === 1 ? 'partner' : 'partners'}
          </p>
        </div>
      </div>

      {/* Partner Badges — wrap gracefully */}
      <div className="flex flex-wrap gap-3">
        {partners.map((partner) => (
          <span
            key={partner}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 cursor-default ${
              isDarkMode
                ? 'border-slate-700 text-slate-200 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600'
                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            {partner}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PartnersSection;