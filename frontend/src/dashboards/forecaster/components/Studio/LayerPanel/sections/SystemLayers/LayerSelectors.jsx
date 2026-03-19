import React from 'react';

// ── Shared primitives (defined at module level — never inside render) ──────────

const StyleLabel = ({ text, isDarkMode }) => (
  <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
    {text}
  </span>
);

const StyleThemeBtn = ({ id, active, icon, children, onSelect, isDarkMode }) => (
  <button
    onClick={() => onSelect(id)}
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

const StyleSlider = ({
  label,
  field,
  min,
  max,
  step,
  value,
  onChange,
  isDarkMode,
  formatValue,
  ticks = ['S', 'M', 'L', 'XL'],   // ← configurable, defaults to size labels
}) => {
  const pct     = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value.toFixed(1)}×`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <StyleLabel text={label} isDarkMode={isDarkMode} />
        <span className={`text-[10px] font-bold tabular-nums ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange({ [field]: parseFloat(e.target.value) })}
        className="w-full appearance-none h-1 rounded-full outline-none cursor-pointer"
        style={{
          background: (() => {
            const track = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
            const fill  = isDarkMode ? '#22d3ee' : '#2563eb';
            return `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`;
          })(),
        }}
      />
      <div className="flex justify-between">
        {ticks.map((l) => (
          <span key={l} className={`text-[9px] ${isDarkMode ? 'text-white/25' : 'text-slate-400'}`}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

const PanelShell = ({ children, isDarkMode }) => (
  <div className={`mt-1 rounded-lg px-2.5 py-2 space-y-2.5 ${
    isDarkMode
      ? 'bg-white/[0.04] border border-white/8'
      : 'bg-black/[0.03] border border-black/8'
  }`}>
    {children}
  </div>
);

// ── Tick presets ──────────────────────────────────────────────────────────────

const SIZE_TICKS    = ['S', 'M', 'L', 'XL'];
const OPACITY_TICKS = ['10%', '25%', '50%', '100%'];

// ── Model selector ────────────────────────────────────────────────────────────

export const ModelSelector = React.memo(({ models, selected, onToggle, isDarkMode, cols = 3 }) => (
  <div className="space-y-1">
    <StyleLabel text="Model" isDarkMode={isDarkMode} />
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

export const ElementSelector = React.memo(({ elements, value, onChange, isDarkMode }) => (
  <div className="space-y-1">
    <StyleLabel text="Elements" isDarkMode={isDarkMode} />
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

export const WaveDirectionStylePanel = React.memo(({ style, onChange, isDarkMode }) => {
  const { theme = 'colored', size = 1.0, opacity = 1.0 } = style || {};
  const opacityPct = (v) => `${Math.round(v * 100)}%`;

  return (
    <PanelShell isDarkMode={isDarkMode}>

      {/* Color theme */}
      <div className="space-y-1.5">
        <StyleLabel text="Arrow Color" isDarkMode={isDarkMode} />
        <div className="flex gap-1">
          <StyleThemeBtn id="colored" active={theme === 'colored'} icon="🌈" onSelect={(id) => onChange({ theme: id })} isDarkMode={isDarkMode}>Colored</StyleThemeBtn>
          <StyleThemeBtn id="black"   active={theme === 'black'}   icon="⚫" onSelect={(id) => onChange({ theme: id })} isDarkMode={isDarkMode}>Black</StyleThemeBtn>
        </div>
      </div>

      <StyleSlider
        label="Arrow Size"
        field="size"
        min={0.4} max={2.0} step={0.1}
        value={size}
        onChange={onChange}
        isDarkMode={isDarkMode}
        ticks={SIZE_TICKS}
      />

      <StyleSlider
        label="Opacity"
        field="opacity"
        min={0.1} max={1.0} step={0.05}
        value={opacity}
        onChange={onChange}
        isDarkMode={isDarkMode}
        formatValue={opacityPct}
        ticks={OPACITY_TICKS}
      />

    </PanelShell>
  );
});

WaveDirectionStylePanel.displayName = 'WaveDirectionStylePanel';

// ── Wind barb style panel ─────────────────────────────────────────────────────

export const WindBarbStylePanel = React.memo(({ style, onChange, isDarkMode }) => {
  const { size = 1.0, opacity = 0.5 } = style || {};
  const opacityPct = (v) => `${Math.round(v * 100)}%`;

  return (
    <PanelShell isDarkMode={isDarkMode}>

      <StyleSlider
        label="Barb Size"
        field="size"
        min={0.5} max={2.0} step={0.1}
        value={size}
        onChange={onChange}
        isDarkMode={isDarkMode}
        ticks={SIZE_TICKS}
      />

      <StyleSlider
        label="Opacity"
        field="opacity"
        min={0.1} max={1.0} step={0.05}
        value={opacity}
        onChange={onChange}
        isDarkMode={isDarkMode}
        formatValue={opacityPct}
        ticks={OPACITY_TICKS}
      />

    </PanelShell>
  );
});

WindBarbStylePanel.displayName = 'WindBarbStylePanel';