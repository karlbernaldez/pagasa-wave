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
  emoji,
  title,
  badge,
  expanded,
  onToggle,
  isDarkMode,
  headerRight,
  children,
}) => (
  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
    <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg">
      {/* Clickable header area */}
      <button
        onClick={onToggle}
        className="flex-1 flex items-center gap-2 text-left"
      >
        {emoji && <span className="text-base">{emoji}</span>}
        <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>
          {title}
        </span>
        {badge != null && (
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isDarkMode ? 'bg-white/10 text-white/60' : 'bg-black/10 text-slate-600'
          }`}>
            {badge}
          </div>
        )}
      </button>

      {/* Optional right-side slot (e.g. enable toggle dot) */}
      {headerRight}

      {/* Chevron */}
      {expanded
        ? <ChevronDown  size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
        : <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
      }
    </div>

    {expanded && (
      <div className="px-2 pb-2 space-y-1">
        {children}
      </div>
    )}
  </div>
);

export default React.memo(LayerGroupCard);