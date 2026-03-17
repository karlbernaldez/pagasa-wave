import React from 'react';

/**
 * Grid of toggle buttons for selecting one or more forecast models.
 * `cols` controls the grid columns (default 3).
 */
export const ModelSelector = React.memo(({ models, selected, onToggle, isDarkMode, cols = 3 }) => (
  <div className="space-y-1">
    <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
      Model
    </div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {models.map((model) => {
        const active = selected.includes(model.id);
        const disabled = model.available === false;

        return (
          <button
            key={model.id}
            onClick={() => !disabled && onToggle(model.id)}
            disabled={disabled}
            title={disabled ? 'Coming soon' : undefined}
            className={`relative px-2 py-1.5 rounded text-[10px] font-semibold transition-all border ${disabled
                ? isDarkMode
                  ? 'bg-white/[0.03] text-white/20 border-white/8 cursor-not-allowed'
                  : 'bg-black/[0.03] text-slate-300 border-slate-200 cursor-not-allowed'
                : active
                  ? isDarkMode
                    ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                    : 'bg-blue-500/15 text-blue-700 border-blue-500/40'
                  : isDarkMode
                    ? 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
          >
            {model.label}
            {disabled && (
              <span className={`absolute bottom-0.5 right-1 text-[7px] font-bold ${isDarkMode ? 'text-white/20' : 'text-slate-300'
                }`}>
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
));

ModelSelector.displayName = 'ModelSelector';

/**
 * Dropdown <select> for choosing a single forecast element (or None).
 */
export const ElementSelector = React.memo(({ elements, value, onChange, isDarkMode }) => (
  <div className="space-y-1">
    <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
      Elements
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-cyan-400 ${isDarkMode
          ? 'bg-slate-800 text-white border border-white/20 hover:bg-slate-700'
          : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
        }`}
    >
      <option value="">None</option>
      {elements.map((el) => (
        <option key={el.id} value={el.id}>
          {el.icon} {el.name}
        </option>
      ))}
    </select>
  </div>
));

ElementSelector.displayName = 'ElementSelector';