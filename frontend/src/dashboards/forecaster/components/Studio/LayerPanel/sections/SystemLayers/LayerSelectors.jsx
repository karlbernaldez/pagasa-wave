import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  EyeOff,
  Lock,
  Map,
  Navigation,
  Radio,
  Sparkles,
  Waves,
  Wind,
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ELEMENT_META = {
  barbs: { short: 'WB', tone: 'cyan', description: 'Directional wind symbols', icon: Wind },
  particles: { short: 'PT', tone: 'violet', description: 'Animated wind flow', icon: Sparkles },
  raster: { short: 'RS', tone: 'emerald', description: 'Color raster overlay', icon: Map },
  waveDirection: {
    short: 'WD',
    tone: 'sky',
    description: 'Wave direction arrows',
    icon: Navigation,
  },
  wavePeriod: { short: 'MP', tone: 'amber', description: 'Mean wave period', icon: Clock3 },
};

const toneClasses = {
  cyan: {
    active: 'border-cyan-400/45 bg-cyan-400/15 text-cyan-300',
    badge: 'bg-cyan-400/15 text-cyan-300',
  },
  violet: {
    active: 'border-violet-400/45 bg-violet-400/15 text-violet-300',
    badge: 'bg-violet-400/15 text-violet-300',
  },
  emerald: {
    active: 'border-emerald-400/45 bg-emerald-400/15 text-emerald-300',
    badge: 'bg-emerald-400/15 text-emerald-300',
  },
  sky: {
    active: 'border-sky-400/45 bg-sky-400/15 text-sky-300',
    badge: 'bg-sky-400/15 text-sky-300',
  },
  amber: {
    active: 'border-amber-400/45 bg-amber-400/15 text-amber-300',
    badge: 'bg-amber-400/15 text-amber-300',
  },
};

const getElementBadgeClass = (id, isDarkMode) => {
  const tone = ELEMENT_META[id]?.tone;
  return (
    toneClasses[tone]?.badge ||
    (isDarkMode ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500')
  );
};

const StyleLabel = ({ text, isDarkMode, hint }) => (
  <div className="flex items-center justify-between gap-2">
    <span
      className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}
    >
      {text}
    </span>
    {hint && (
      <span
        className={`text-[10px] font-semibold ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}
      >
        {hint}
      </span>
    )}
  </div>
);

const StyleThemeBtn = ({ id, active, children, onSelect, isDarkMode }) => (
  <button
    type="button"
    onClick={() => onSelect(id)}
    className={cn(
      'flex min-h-10 flex-1 items-center justify-center rounded-md border px-3 py-2 text-[11px] font-bold transition-all',
      active
        ? isDarkMode
          ? 'border-cyan-400/45 bg-cyan-400/15 text-cyan-300'
          : 'border-blue-500/40 bg-blue-500/10 text-blue-700'
        : isDarkMode
          ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
    )}
  >
    {children}
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
  ticks = ['S', 'M', 'L', 'XL'],
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value.toFixed(1)}x`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-bold ${isDarkMode ? 'text-white/65' : 'text-slate-600'}`}
        >
          {label}
        </span>
        <span
          className={`rounded px-2 py-1 text-[10px] font-black tabular-nums ${isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-700'}`}
        >
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
        className="h-8 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: (() => {
            const track = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)';
            const fill = isDarkMode ? '#22d3ee' : '#2563eb';
            return `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`;
          })(),
        }}
      />
      <div className="flex justify-between">
        {ticks.map((tick) => (
          <span
            key={tick}
            className={`text-[9px] font-semibold ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
};

const PanelShell = ({ children, isDarkMode }) => (
  <div
    className={cn(
      'studio-liquid-control mt-1 space-y-3 rounded-lg border px-3 py-3',
      isDarkMode ? 'border-white/10 bg-white/[0.055]' : 'border-white/80 bg-white/[0.58]'
    )}
  >
    {children}
  </div>
);

const SIZE_TICKS = ['S', 'M', 'L', 'XL'];
const OPACITY_TICKS = ['10%', '25%', '50%', '100%'];

export const ModelSelector = React.memo(
  ({ models, selected, onToggle, modelStatuses = {}, isDarkMode }) => (
    <div className="space-y-2">
      <StyleLabel
        text="Forecast source"
        hint={`${selected.length}/${models.length} active`}
        isDarkMode={isDarkMode}
      />
      <div
        className={cn(
          'studio-liquid-control overflow-hidden rounded-lg border',
          isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-white/80 bg-white/[0.58]'
        )}
      >
        {models.map((model) => {
          const active = selected.includes(model.id);
          const modelStatus = modelStatuses[model.id] || null;
          const disconnected = model.available === false;
          const blocked = disconnected || modelStatus?.selectable === false;
          const disabled = blocked && !active;
          const processing = modelStatus?.state === 'processing';
          const unavailable = modelStatus?.state === 'unavailable';
          const status = disconnected
            ? 'Soon'
            : modelStatus?.label || (active ? 'Active' : 'Ready');
          const subtitle = disconnected
            ? 'Dataset not connected'
            : modelStatus?.detail || (active ? 'Visible in map stack' : 'Tap to include');

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => (!blocked || active) && onToggle(model.id)}
              disabled={disabled}
              title={modelStatus?.detail || (disconnected ? 'Coming soon' : model.label)}
              className={cn(
                'group flex min-h-[3.75rem] w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-all last:border-b-0',
                isDarkMode ? 'border-white/[0.08]' : 'border-slate-100',
                disabled
                  ? isDarkMode
                    ? 'cursor-not-allowed bg-white/[0.02] text-white/35'
                    : 'cursor-not-allowed bg-slate-50 text-slate-400'
                  : active
                    ? isDarkMode
                      ? 'bg-cyan-400/10 text-cyan-100'
                      : 'bg-blue-500/[0.07] text-blue-900'
                    : isDarkMode
                      ? 'text-white/75 hover:bg-white/[0.06]'
                      : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                  disconnected
                    ? isDarkMode
                      ? 'border-white/10 bg-white/5 text-white/20'
                      : 'border-slate-200 bg-slate-100 text-slate-300'
                    : processing
                      ? isDarkMode
                        ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
                        : 'border-amber-300 bg-amber-50 text-amber-600'
                      : unavailable
                        ? isDarkMode
                          ? 'border-white/10 bg-white/5 text-white/30'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                        : active
                          ? isDarkMode
                            ? 'border-cyan-300/45 bg-cyan-300/15 text-cyan-200'
                            : 'border-blue-500/35 bg-blue-500/10 text-blue-700'
                          : isDarkMode
                            ? 'border-white/10 bg-white/[0.06] text-white/45'
                            : 'border-white/80 bg-white/70 text-slate-400'
                )}
              >
                {disconnected ? (
                  <Lock size={15} />
                ) : processing ? (
                  <Clock3 size={15} />
                ) : active ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Radio size={15} />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black leading-tight">
                  {model.label}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block truncate text-[10px] font-semibold',
                    isDarkMode ? 'text-white/35' : 'text-slate-400'
                  )}
                >
                  {subtitle}
                </span>
              </span>

              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide',
                  disconnected
                    ? isDarkMode
                      ? 'bg-white/5 text-white/20'
                      : 'bg-slate-100 text-slate-300'
                    : processing
                      ? isDarkMode
                        ? 'bg-amber-300/10 text-amber-200'
                        : 'bg-amber-100 text-amber-700'
                      : unavailable
                        ? isDarkMode
                          ? 'bg-white/5 text-white/30'
                          : 'bg-slate-100 text-slate-500'
                        : active
                          ? isDarkMode
                            ? 'bg-cyan-300/15 text-cyan-200'
                            : 'bg-blue-600/10 text-blue-700'
                          : isDarkMode
                            ? 'bg-white/5 text-white/35'
                            : 'bg-slate-100 text-slate-500'
                )}
              >
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  )
);

ModelSelector.displayName = 'ModelSelector';

export const ElementSelector = React.memo(({ elements, value, onChange, isDarkMode }) => {
  const selectedElement = elements.find((element) => element.id === value) || null;

  const optionRows = [
    {
      id: '',
      name: 'None',
      meta: { short: 'OFF', description: 'Hide all elements', icon: EyeOff },
    },
    ...elements.map((element) => ({
      ...element,
      meta: ELEMENT_META[element.id] || {},
    })),
  ];

  return (
    <div className="space-y-2">
      <StyleLabel
        text="Display mode"
        hint={selectedElement?.name || 'None'}
        isDarkMode={isDarkMode}
      />
      <div
        role="listbox"
        className={cn(
          'studio-liquid-control grid grid-cols-2 gap-2 rounded-lg border p-2',
          isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-white/80 bg-white/[0.58]'
        )}
      >
        {optionRows.map((element) => {
          const meta = element.meta || {};
          const Icon = meta.icon || Waves;
          const active = element.id === value;
          return (
            <button
              type="button"
              role="option"
              aria-selected={active}
              key={element.id || 'none'}
              onClick={() => onChange(element.id)}
              className={cn(
                'relative flex min-h-[6.25rem] flex-col items-start justify-between overflow-hidden rounded-lg border p-2.5 text-left transition-all',
                active
                  ? isDarkMode
                    ? 'border-cyan-300/45 bg-cyan-300/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(103,232,249,0.14)]'
                    : 'border-blue-500/45 bg-blue-500/[0.08] text-slate-950 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.10)]'
                  : isDarkMode
                    ? 'border-white/10 bg-white/[0.045] text-white/70 hover:border-white/20 hover:bg-white/[0.075]'
                    : 'border-white/80 bg-white/55 text-slate-700 hover:border-white hover:bg-white/80'
              )}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    element.id
                      ? getElementBadgeClass(element.id, isDarkMode)
                      : isDarkMode
                        ? 'bg-white/10 text-white/45'
                        : 'bg-slate-200 text-slate-500'
                  )}
                >
                  <Icon size={15} strokeWidth={2.4} />
                </span>
                {active && (
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      isDarkMode ? 'bg-cyan-300 text-slate-950' : 'bg-blue-600 text-white'
                    )}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-black leading-tight">{element.name}</span>
                <span
                  className={cn(
                    'mt-1 block min-h-8 text-[10px] font-semibold leading-snug',
                    isDarkMode ? 'text-white/35' : 'text-slate-500'
                  )}
                >
                  {meta.description || 'Layer element'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

ElementSelector.displayName = 'ElementSelector';

export const WaveDirectionStylePanel = React.memo(({ style, onChange, isDarkMode }) => {
  const { theme = 'colored', size = 1.0, opacity = 1.0 } = style || {};
  const opacityPct = (v) => `${Math.round(v * 100)}%`;

  return (
    <PanelShell isDarkMode={isDarkMode}>
      <div className="space-y-2">
        <StyleLabel text="Arrow color" isDarkMode={isDarkMode} />
        <div className="flex gap-1.5">
          <StyleThemeBtn
            id="colored"
            active={theme === 'colored'}
            onSelect={(id) => onChange({ theme: id })}
            isDarkMode={isDarkMode}
          >
            Colored
          </StyleThemeBtn>
          <StyleThemeBtn
            id="black"
            active={theme === 'black'}
            onSelect={(id) => onChange({ theme: id })}
            isDarkMode={isDarkMode}
          >
            Black
          </StyleThemeBtn>
        </div>
      </div>

      <StyleSlider
        label="Arrow size"
        field="size"
        min={0.4}
        max={2.0}
        step={0.1}
        value={size}
        onChange={onChange}
        isDarkMode={isDarkMode}
        ticks={SIZE_TICKS}
      />

      <StyleSlider
        label="Opacity"
        field="opacity"
        min={0.1}
        max={1.0}
        step={0.05}
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

export const WindBarbStylePanel = React.memo(({ style, onChange, isDarkMode }) => {
  const { size = 1.0, opacity = 0.5 } = style || {};
  const opacityPct = (v) => `${Math.round(v * 100)}%`;

  return (
    <PanelShell isDarkMode={isDarkMode}>
      <StyleSlider
        label="Barb size"
        field="size"
        min={0.5}
        max={2.0}
        step={0.1}
        value={size}
        onChange={onChange}
        isDarkMode={isDarkMode}
        ticks={SIZE_TICKS}
      />

      <StyleSlider
        label="Opacity"
        field="opacity"
        min={0.1}
        max={1.0}
        step={0.05}
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
