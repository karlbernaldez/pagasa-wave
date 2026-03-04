import React from 'react';
import { Check } from 'lucide-react';

/**
 * A checkbox-style toggle button row.
 * Used for Domain and Utility layer items.
 */
const CheckboxLayerRow = React.memo(({ id, name, subtitle, active, onToggle, isDarkMode }) => (
  <button
    onClick={() => onToggle(id)}
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${
      active
        ? isDarkMode
          ? 'bg-cyan-400/10 border border-cyan-400/30'
          : 'bg-blue-500/10 border border-blue-500/30'
        : isDarkMode
          ? 'bg-white/5 hover:bg-white/10 border border-transparent'
          : 'bg-black/5 hover:bg-black/10 border border-transparent'
    }`}
  >
    {/* Checkbox indicator */}
    <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
      active
        ? isDarkMode ? 'bg-cyan-400 border-cyan-400' : 'bg-blue-600 border-blue-600'
        : isDarkMode ? 'border-white/30' : 'border-slate-300'
    }`}>
      {active && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>

    <div className="flex-1 text-left min-w-0">
      <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>
        {name}
      </div>
      {subtitle && (
        <div className={`text-[10px] truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
          {subtitle}
        </div>
      )}
    </div>
  </button>
));

CheckboxLayerRow.displayName = 'CheckboxLayerRow';
export default CheckboxLayerRow;