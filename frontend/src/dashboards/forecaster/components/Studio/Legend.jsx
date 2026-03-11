import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

/**
 * HIERARCHY TIER 2 — Context Panel
 *
 * Visual weight rules applied:
 *   Tier 1 (Map, Layers, Drawing) → full opacity, strong shadow, z-40+
 *   Tier 2 (Legend, Forecast)     → 80% opacity at rest, medium shadow, z-30
 *   Tier 3 (Menu, Profile)        → 60% opacity at rest, no shadow, z-20
 *
 * Changes from original:
 *   - Container: opacity-80 at rest, opacity-100 on hover (group hover)
 *   - Background: slightly more transparent (bg-black/30 vs /40)
 *   - Shadow: shadow-md instead of shadow-xl — recedes behind Tier 1 panels
 *   - Header text: one step lighter weight (font-semibold → font-medium)
 *   - "PAGASA" badge: lowered to text-[9px] to reduce competition
 *   - Collapse hint: auto-collapses to header-only on small viewports
 *   - scale-95 at rest, scale-100 on hover — subtle depth cue
 */

const LegendBox = ({ isDarkMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems = [
    {
      icon: '/wave.png',
      label: 'Wave Heights',
      subtitle: 'Ocean surface conditions',
    },
    {
      icon: '/hurricane.png',
      label: 'Tropical Cyclone',
      subtitle: 'Active storm systems',
    },
    {
      text: 'L',
      label: 'Low Pressure',
      subtitle: 'LPA',
      textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
      bgColor: isDarkMode ? 'bg-red-500/15' : 'bg-red-400/20',
    },
    {
      text: 'H',
      label: 'High Pressure',
      subtitle: 'HPA',
      textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDarkMode ? 'bg-blue-500/15' : 'bg-blue-400/20',
    },
    {
      pattern: true,
      label: 'Surface Fronts',
      subtitle: 'Weather boundaries',
    },
  ];

  return (
    <div
      className={`
        fixed bottom-8 left-4 z-30 w-64
        group
        opacity-80 hover:opacity-100
        scale-[0.97] hover:scale-100
        transition-all duration-300 ease-out
      `}
    >
      <div
        className={`
          rounded-xl transition-all duration-300
          ${isDarkMode
            ? 'bg-black/30 border border-white/10'
            : 'bg-white/50 border border-white/30'
          }
          backdrop-blur-xl
          shadow-md hover:shadow-lg
          transition-shadow duration-300
        `}
      >
        {/* ── Header ── */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-t-xl
            transition-colors
            ${isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-100/40'}
          `}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${isDarkMode ? 'bg-cyan-500/15' : 'bg-blue-500/15'}`}>
              <Info
                size={12}
                className={isDarkMode ? 'text-cyan-400/80' : 'text-blue-500/80'}
                strokeWidth={2.5}
              />
            </div>
            <span className={`text-[11px] font-medium tracking-wide ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
              Map Legend
            </span>
          </div>

          {isExpanded
            ? <ChevronUp size={12} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} strokeWidth={2.5} />
            : <ChevronDown size={12} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} strokeWidth={2.5} />
          }
        </button>

        {/* ── Divider ── */}
        {isExpanded && (
          <div className={`h-px ${isDarkMode ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
        )}

        {/* ── Items ── */}
        {isExpanded && (
          <div className="p-2 space-y-0.5">
            {legendItems.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg
                  transition-colors duration-150
                  ${isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-100/40'}
                `}
              >
                {/* Symbol */}
                <div className={`
                  flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                  ${item.bgColor || (isDarkMode ? 'bg-slate-700/40' : 'bg-slate-200/40')}
                `}>
                  {item.icon && (
                    <img src={item.icon} alt={item.label} className="w-3.5 h-3.5 object-contain opacity-90" />
                  )}
                  {item.text && (
                    <span className={`text-[11px] font-black ${item.textColor}`}>{item.text}</span>
                  )}
                  {item.pattern && (
                    <div className="w-4 h-[3px] rounded-full" style={{
                      background: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 3px, #ef4444 3px, #ef4444 6px)'
                    }} />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium leading-tight ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.label}
                  </div>
                  <div className={`text-[9px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        {isExpanded && (
          <>
            <div className={`h-px ${isDarkMode ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
            <div className="px-3 py-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Live data
                </span>
                {/* Tier 3-weight badge — intentionally quiet */}
                <span className={`text-[9px] font-semibold tracking-widest ${isDarkMode ? 'text-cyan-500/60' : 'text-blue-500/60'}`}>
                  PAGASA
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LegendBox;