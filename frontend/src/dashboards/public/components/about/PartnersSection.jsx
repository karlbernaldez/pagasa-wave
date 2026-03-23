// ╔══════════════════════════════════════════════════════╗
// ║              components/PartnersSection.jsx          ║
// ║  Layout C: categorized list rows.                   ║
// ║  partners: [{ name, acronym, role, logo,            ║
// ║               category, link }]                     ║
// ║  category: 'government' | 'international' |         ║
// ║             'academic'                              ║
// ╚══════════════════════════════════════════════════════╝
import React, { useState, useEffect } from 'react';
import { Building2, ExternalLink, X, ChevronRight } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const STYLES = `
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-enter { animation: modalIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .backdrop-enter { animation: backdropIn 0.18s ease both; }

  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .row-enter { animation: rowIn 0.2s ease both; }

  @keyframes detailSlide {
    from { opacity: 0; max-height: 0; }
    to   { opacity: 1; max-height: 200px; }
  }
  .detail-slide {
    animation: detailSlide 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow: hidden;
  }
`;

const CATEGORY_CONFIG = {
  government: {
    label: 'Government',
    darkBg: 'bg-blue-500/15',
    darkText: 'text-blue-400',
    darkBorder: 'border-blue-500/25',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    lightBorder: 'border-blue-200',
  },
  international: {
    label: 'International',
    darkBg: 'bg-emerald-500/15',
    darkText: 'text-emerald-400',
    darkBorder: 'border-emerald-500/25',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    lightBorder: 'border-emerald-200',
  },
  academic: {
    label: 'Academic',
    darkBg: 'bg-amber-500/15',
    darkText: 'text-amber-400',
    darkBorder: 'border-amber-500/25',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    lightBorder: 'border-amber-200',
  },
};

/* ─── Logo renderer ─────────────────────────────────────── */
const Logo = ({ logo, name }) => {
  const [err, setErr] = useState(false);
  const isUrl = typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('/'));

  if (isUrl && !err) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-6 w-auto max-w-[40px] object-contain"
        onError={() => setErr(true)}
      />
    );
  }
  if (!isUrl && logo) {
    return <span className="text-lg leading-none select-none">{logo}</span>;
  }
  return (
    <span className="text-[9px] font-black tracking-wider text-slate-400 text-center leading-tight">
      {name?.slice(0, 4).toUpperCase()}
    </span>
  );
};

/* ─── Category tag ───────────────────────────────────────── */
const CategoryTag = ({ category, isDarkMode }) => {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.government;
  return (
    <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
      isDarkMode
        ? `${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`
        : `${cfg.lightBg} ${cfg.lightText} ${cfg.lightBorder}`
    }`}>
      {cfg.label}
    </span>
  );
};

/* ─── Partner row ────────────────────────────────────────── */
const PartnerRow = ({ partner, isDarkMode, isActive, onClick }) => (
  <div className="row-enter">
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
        isActive
          ? isDarkMode
            ? 'bg-slate-800 border-slate-600'
            : 'bg-white border-slate-300 shadow-sm'
          : isDarkMode
            ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
      }`}
    >
      {/* Logo box */}
      <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border ${
        isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <Logo logo={partner.logo} name={partner.acronym || partner.name} />
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black leading-none mb-0.5 truncate transition-colors ${
          isActive
            ? isDarkMode ? 'text-white' : 'text-slate-900'
            : isDarkMode
              ? 'text-slate-200 group-hover:text-white'
              : 'text-slate-700 group-hover:text-slate-900'
        }`}>
          {partner.acronym || partner.name}
        </p>
        {partner.role && (
          <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {partner.role}
          </p>
        )}
      </div>

      {/* Category tag */}
      <CategoryTag category={partner.category} isDarkMode={isDarkMode} />

      {/* Chevron */}
      <ChevronRight
        size={12}
        className={`flex-shrink-0 transition-all duration-200 ${
          isActive ? 'rotate-90' : ''
        } ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
      />
    </button>

    {/* Inline detail drawer */}
    {isActive && (
      <div className={`detail-slide mx-1 px-4 py-3 rounded-b-xl border-x border-b -mt-1 ${
        isDarkMode
          ? 'bg-slate-800/60 border-slate-700/60'
          : 'bg-white border-slate-200'
      }`}>
        <p className={`text-[10px] leading-relaxed mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {partner.name}
        </p>
        {partner.link && (
          <a
            href={partner.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold transition-colors ${
              isDarkMode
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <ExternalLink size={10} />
            Visit website
          </a>
        )}
      </div>
    )}
  </div>
);

/* ─── Main section ───────────────────────────────────────── */
const PartnersSection = ({ partners = [] }) => {
  const { isDarkMode } = useTheme();
  const [activeId, setActiveId] = useState(null);

  if (!partners.length) return null;

  const toggle = (id) => setActiveId(prev => prev === id ? null : id);

  // Group by category for the legend counts
  const govCount = partners.filter(p => p.category === 'government').length;
  const intlCount = partners.filter(p => p.category === 'international').length;
  const acadCount = partners.filter(p => p.category === 'academic').length;

  return (
    <>
      <style>{STYLES}</style>

      <div className={`relative rounded-2xl border overflow-hidden transition-all duration-700 ${
        isDarkMode
          ? 'border-slate-700/60 bg-slate-900/70 backdrop-blur-md'
          : 'border-slate-200 bg-white/95 shadow-xl shadow-slate-100/60'
      }`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="p-6 sm:p-7">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isDarkMode
                  ? 'bg-emerald-500/15 border border-emerald-500/25'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-200'
              }`}>
                <Building2 size={15} className={isDarkMode ? 'text-emerald-400' : 'text-white'} />
              </div>
              <div>
                <h2 className={`text-base font-black tracking-tight leading-none ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Partner Agencies
                </h2>
                <p className={`text-[10px] mt-0.5 font-medium ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {partners.length} collaborating institutions
                </p>
              </div>
            </div>

            <span className={`text-xs font-bold tabular-nums px-2.5 py-1 rounded-full ${
              isDarkMode
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {String(partners.length).padStart(2, '0')}
            </span>
          </div>

          {/* ── Category legend ── */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {govCount > 0 && (
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isDarkMode
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}>
                {govCount} Government
              </span>
            )}
            {intlCount > 0 && (
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {intlCount} International
              </span>
            )}
            {acadCount > 0 && (
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isDarkMode
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {acadCount} Academic
              </span>
            )}
          </div>

          {/* ── Divider ── */}
          <div className={`h-px mb-4 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />

          {/* ── Partner list ── */}
          <div className="flex flex-col gap-2">
            {partners.map((p, i) => (
              <PartnerRow
                key={p.id ?? i}
                partner={p}
                isDarkMode={isDarkMode}
                isActive={activeId === (p.id ?? i)}
                onClick={() => toggle(p.id ?? i)}
              />
            ))}
          </div>

        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      </div>
    </>
  );
};

export default PartnersSection;