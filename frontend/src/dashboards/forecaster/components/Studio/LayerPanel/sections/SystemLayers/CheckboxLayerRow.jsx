import React from 'react';
import { Check } from 'lucide-react';

/**
 * A checkbox-style toggle button row.
 * Used for Domain and Utility layer items.
 */
const CheckboxLayerRow = React.memo(({ id, name, subtitle, active, onToggle, isDarkMode }) => (
  <button
    onClick={() => onToggle(id)}
    className={`w-full flex min-h-12 items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-all ${
      active
        ? isDarkMode
          ? 'border-cyan-400/35 bg-cyan-400/10'
          : 'border-blue-500/35 bg-blue-500/10'
        : isDarkMode
          ? 'border-white/8 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]'
          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
    }`}
  >
    {/* Checkbox indicator */}
    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
      active
        ? isDarkMode ? 'bg-cyan-400 border-cyan-400' : 'bg-blue-600 border-blue-600'
        : isDarkMode ? 'border-white/30' : 'border-slate-300'
    }`}>
      {active && <Check size={13} className="text-white" strokeWidth={3} />}
    </div>

    <div className="flex-1 text-left min-w-0">
      <div className={`truncate text-[13px] font-black ${isDarkMode ? 'text-white/85' : 'text-slate-800'}`}>
        {name}
      </div>
      {subtitle && (
        <div className={`truncate text-[10px] font-semibold ${isDarkMode ? 'text-white/35' : 'text-slate-500'}`}>
          {subtitle}
        </div>
      )}
    </div>

    <span className={`h-2 w-2 rounded-full ${active
      ? isDarkMode ? 'bg-cyan-300' : 'bg-blue-600'
      : isDarkMode ? 'bg-white/15' : 'bg-slate-300'
    }`} />
  </button>
));

CheckboxLayerRow.displayName = 'CheckboxLayerRow';
export default CheckboxLayerRow;
