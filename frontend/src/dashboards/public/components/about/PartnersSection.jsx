// ╔══════════════════════════════════════════════════════╗
// ║              components/PartnersSection.jsx          ║
// ║  Colored logos + hover modal with partner details.   ║
// ║  partners: [{ name, logo, link }]                    ║
// ╚══════════════════════════════════════════════════════╝
import React, { useState, useEffect, useRef } from 'react';
import { Building2, ExternalLink, X } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const STYLES = `
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-track {
    animation: marquee 22s linear infinite;
  }
  .marquee-wrap:hover .marquee-track {
    animation-play-state: paused;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-enter {
    animation: modalIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .backdrop-enter {
    animation: backdropIn 0.18s ease both;
  }
`;

/* ─── Partner Detail Modal ───────────────────────────────── */
const PartnerModal = ({ partner, isDarkMode, onClose }) => {
  const [imgError, setImgError] = useState(false);
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on outside click
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onBackdropClick}
    >
      <div
        ref={modalRef}
        className={`modal-enter relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <X size={13} />
        </button>

        {/* Logo banner */}
        <div className={`flex items-center justify-center h-36 px-8 border-b ${
          isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'
        }`}>
          {!imgError && partner.logo ? (
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-20 max-w-[180px] w-auto object-contain drop-shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`flex items-center justify-center h-16 w-16 rounded-2xl text-xl font-black ${
              isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-500'
            }`}>
              {partner.name?.slice(0, 2).toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-1 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>Agency</p>
            <p className={`text-base font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {partner.name || '—'}
            </p>
          </div>

          {/* Divider */}
          <div className={`h-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />

          {/* Link */}
          {partner.link ? (
            <a
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${
                  isDarkMode ? 'bg-emerald-500/15' : 'bg-emerald-100'
                }`}>
                  <ExternalLink size={12} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <span className={`text-xs font-medium truncate ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {partner.link.replace(/^https?:\/\//, '')}
                </span>
              </div>
              <ExternalLink
                size={11}
                className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
            </a>
          ) : (
            <p className={`text-xs italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              No website available
            </p>
          )}
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      </div>
    </div>
  );
};

/* ─── Single logo pill ───────────────────────────────────── */
const LogoPill = ({ partner, isDarkMode, onClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      title={partner.name}
      className={`group flex-shrink-0 flex items-center justify-center h-16 px-8 rounded-2xl border transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] ${
        isDarkMode
          ? 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/20'
          : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/60'
      }`}
    >
      {!imgError && partner.logo ? (
        <img
          src={partner.logo}
          alt={partner.name}
          className="h-8 w-auto max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`text-xs font-black tracking-widest uppercase ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {partner.name?.slice(0, 4) || '?'}
        </span>
      )}
    </button>
  );
};

/* ─── Main section ───────────────────────────────────────── */
const PartnersSection = ({ partners = [] }) => {
  const { isDarkMode } = useTheme();
  const [activePartner, setActivePartner] = useState(null);

  if (!partners.length) return null;

  const looped = [...partners, ...partners];
  const useMarquee = partners.length > 4;

  return (
    <>
      <style>{STYLES}</style>

      {/* Modal */}
      {activePartner && (
        <PartnerModal
          partner={activePartner}
          isDarkMode={isDarkMode}
          onClose={() => setActivePartner(null)}
        />
      )}

      <div className={`relative rounded-2xl border overflow-hidden transition-all duration-700 ${
        isDarkMode
          ? 'border-slate-700/60 bg-slate-900/70 backdrop-blur-md'
          : 'border-slate-200 bg-white/95 shadow-xl shadow-slate-100/60'
      }`}>

        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="p-6 sm:p-7">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
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

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
            <span className={`text-[8px] font-black uppercase tracking-[0.22em] ${
              isDarkMode ? 'text-slate-600' : 'text-slate-300'
            }`}>Click to learn more</span>
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
          </div>

          {/* ── Logo strip ── */}
          {useMarquee ? (
            <div className="marquee-wrap relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none ${
                isDarkMode
                  ? 'bg-gradient-to-r from-slate-900/80 to-transparent'
                  : 'bg-gradient-to-r from-white to-transparent'
              }`} />
              <div className={`absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none ${
                isDarkMode
                  ? 'bg-gradient-to-l from-slate-900/80 to-transparent'
                  : 'bg-gradient-to-l from-white to-transparent'
              }`} />
              <div className="marquee-track flex gap-3 w-max">
                {looped.map((partner, i) => (
                  <LogoPill
                    key={i}
                    partner={partner}
                    isDarkMode={isDarkMode}
                    onClick={() => setActivePartner(partner)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {partners.map((partner, i) => (
                <LogoPill
                  key={partner.id ?? i}
                  partner={partner}
                  isDarkMode={isDarkMode}
                  onClick={() => setActivePartner(partner)}
                />
              ))}
            </div>
          )}

        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      </div>
    </>
  );
};

export default PartnersSection;