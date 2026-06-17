import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * A rounded card with a header row that expands/collapses its children.
 * Used for Domains, Utilities, Wind, and Wave groups.
 *
 * Props:
 *  - emoji        : string — section icon
 *  - title        : string
 *  - badge        : string | number | null — shown in the pill next to the title
 *  - expanded     : boolean
 *  - onToggle     : () => void — called when the header row is clicked
 *  - isDarkMode   : boolean
 *  - headerRight  : ReactNode — optional slot for extra controls (e.g. enable dot)
 *  - children     : expanded content
 */
const LayerGroupCard = ({
  icon,
  title,
  badge,
  expanded,
  onToggle,
  isDarkMode,
  headerRight,
  children,
}) => (
  <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
    <div className="flex min-h-12 w-full items-center justify-between px-3 py-2">
      {/* Clickable header area */}
      <button
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[13px] font-black ${isDarkMode ? 'text-white/85' : 'text-slate-800'}`}>
            {title}
          </span>
          <span className={`block truncate text-[10px] font-semibold ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>
            Reference overlay
          </span>
        </span>
        {badge != null && (
          <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
            isDarkMode ? 'bg-white/10 text-white/55' : 'bg-slate-100 text-slate-500'
          }`}>
            {badge}
          </span>
        )}
      </button>

      {/* Optional right-side slot (e.g. enable toggle dot) */}
      {headerRight}

      {/* Chevron */}
      {expanded
        ? <ChevronDown size={15} className={isDarkMode ? 'text-white/50' : 'text-slate-500'} strokeWidth={2.5} />
        : <ChevronRight size={15} className={isDarkMode ? 'text-white/50' : 'text-slate-500'} strokeWidth={2.5} />
      }
    </div>

    {expanded && (
      <div className={`space-y-1.5 border-t px-2.5 py-2.5 ${isDarkMode ? 'border-white/8' : 'border-slate-100'}`}>
        {children}
      </div>
    )}
  </div>
);

export default React.memo(LayerGroupCard);
