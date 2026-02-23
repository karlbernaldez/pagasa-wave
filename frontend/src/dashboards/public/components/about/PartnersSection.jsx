// ╔══════════════════════════════════════════════════════╗
// ║              components/PartnersSection.jsx          ║
// ║  Public page — displays partner logos in a grid.     ║
// ║  partners: [{ name, logo }]                          ║
// ╚══════════════════════════════════════════════════════╝
import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

// Single logo card with name label underneath
const PartnerCard = ({ partner, isDarkMode }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.04] ${
        isDarkMode
          ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
      }`}
    >
      {/* Logo */}
      <div className="h-12 flex items-center justify-center w-full">
        {!imgError && partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.name}
            className={`max-h-12 w-full object-contain transition-all duration-300 group-hover:scale-110 ${
              isDarkMode ? 'brightness-90 group-hover:brightness-110' : ''
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback: show name initials if logo fails or is missing
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl text-sm font-black ${
            isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
          }`}>
            {partner.name?.slice(0, 2).toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Name label */}
      {partner.name && (
        <span className={`text-xs font-semibold uppercase tracking-widest text-center ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {partner.name}
        </span>
      )}
    </div>
  );
};

// Responsive grid — adjusts columns based on partner count
const getGridCols = (count) => {
  if (count <= 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
  return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
};

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
          <h2 className={`text-xl font-black transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Partner Agencies
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {partners.length} {partners.length === 1 ? 'partner' : 'partners'}
          </p>
        </div>
      </div>

      {/* Logo Grid */}
      <div className={`grid gap-4 ${getGridCols(partners.length)}`}>
        {partners.map((partner, index) => (
          <PartnerCard key={index} partner={partner} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};

export default PartnersSection;