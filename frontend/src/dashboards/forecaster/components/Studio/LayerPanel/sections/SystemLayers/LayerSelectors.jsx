import React from 'react';

// ── Model selector ────────────────────────────────────────────────────────────

/**
 * Grid of toggle buttons for selecting one or more forecast models.
 */
export const ModelSelector = React.memo(({ models, selected, onToggle, isDarkMode, cols = 3 }) => (
  <div className="space-y-1">
    <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
      Model
    </div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {models.map((model) => {
        const active   = selected.includes(model.id);
        const disabled = model.available === false;

        return (
          <button
            key={model.id}
            onClick={() => !disabled && onToggle(model.id)}
            disabled={disabled}
            title={disabled ? 'Coming soon' : undefined}
            className={`relative px-2 py-1.5 rounded text-[10px] font-semibold transition-all border ${
              disabled
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
              <span className={`absolute bottom-0.5 right-1 text-[7px] font-bold ${
                isDarkMode ? 'text-white/20' : 'text-slate-300'
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

// ── Element selector ──────────────────────────────────────────────────────────

/**
 * Dropdown for choosing a single forecast element (or None).
 */
export const ElementSelector = React.memo(({ elements, value, onChange, isDarkMode }) => (
  <div className="space-y-1">
    <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
      Elements
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-cyan-400 ${
        isDarkMode
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

// ── Wave direction style panel ────────────────────────────────────────────────

/**
 * Shown only when "Wave Direction" element is active.
 * Lets the user choose arrow color theme (colored / black) and adjust size.
 *
 * Props:
 *   style      : { theme: 'colored' | 'black', size: number }
 *   onChange   : (patch: Partial<style>) => void
 *   isDarkMode : boolean
 */
export const WaveDirectionStylePanel = React.memo(({ style, onChange, isDarkMode }) => {
  const { theme = 'colored', size = 1.0 } = style || {};

  const label = (text) => (
    <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
      {text}
    </span>
  );

  // Theme pill button
  const ThemeBtn = ({ id, icon, children }) => {
    const active = theme === id;
    return (
      <button
        onClick={() => onChange({ theme: id })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex-1 justify-center transition-all border ${
          active
            ? isDarkMode
              ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
              : 'bg-blue-500/15 text-blue-700 border-blue-500/40'
            : isDarkMode
              ? 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <span>{icon}</span>
        <span>{children}</span>
      </button>
    );
  };

  return (
    <div className={`mt-1 rounded-lg px-2.5 py-2 space-y-2.5 ${
      isDarkMode ? 'bg-white/[0.04] border border-white/8' : 'bg-black/[0.03] border border-black/8'
    }`}>

      {/* Color theme */}
      <div className="space-y-1.5">
        {label('Arrow Color')}
        <div className="flex gap-1">
          <ThemeBtn id="colored" icon="🌈">Colored</ThemeBtn>
          <ThemeBtn id="black"   icon="⚫">Black</ThemeBtn>
        </div>
      </div>

      {/* Size slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          {label('Arrow Size')}
          <span className={`text-[10px] font-bold tabular-nums ${
            isDarkMode ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            {size.toFixed(1)}×
          </span>
        </div>

        {/* Custom-styled range input */}
        <div className="relative flex items-center h-4">
          <input
            type="range"
            min="0.4"
            max="2.0"
            step="0.1"
            value={size}
            onChange={(e) => onChange({ size: parseFloat(e.target.value) })}
            className="w-full appearance-none h-1 rounded-full outline-none cursor-pointer"
            style={{
              background: (() => {
                const pct = ((size - 0.4) / (2.0 - 0.4)) * 100;
                const track = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
                const fill  = isDarkMode ? '#22d3ee' : '#2563eb';
                return `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`;
              })(),
            }}
          />
        </div>

        {/* Tick labels */}
        <div className="flex justify-between">
          {['S', 'M', 'L', 'XL'].map((lbl) => (
            <span key={lbl} className={`text-[9px] ${isDarkMode ? 'text-white/25' : 'text-slate-400'}`}>
              {lbl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

WaveDirectionStylePanel.displayName = 'WaveDirectionStylePanel';