import { useState, useEffect } from 'react';
import { ChevronDown, Layers, Check, Pencil, X } from 'lucide-react';
import { useLayerStyle } from './hooks/useLayerStyle';
import { updateLayerName } from '@dashboards/forecaster/utils/layers';
import { SymbolStyleControls } from './StylePanel/SymbolStyleControls';
import { WaveHeightStyleControls } from './StylePanel/WaveHeightStyleControls';


// ── Utilities ─────────────────────────────────────────────────────────────────
export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const safeGet = (fn) => {
    try { const v = fn(); return v ?? undefined; }
    catch { return undefined; }
};

// ── Read live style from Mapbox ───────────────────────────────────────────────
function readCurrentStyle(map, layerInfo, mapboxLayerIds) {
    if (!map || !layerInfo || !mapboxLayerIds?.length) return {};

    const lid = mapboxLayerIds[0];
    if (!lid || !map.getLayer(lid)) return {};

    const paint = (id, prop) => safeGet(() => map.getPaintProperty(id, prop));
    const layout = (id, prop) => safeGet(() => map.getLayoutProperty(id, prop));
    const { type } = layerInfo;

    switch (true) {
        case type === 'symbol' || type === 'typhoon':
            return {
                iconSize: layout(lid, 'icon-size') ?? 0.07,
                iconOpacity: paint(lid, 'icon-opacity') ?? 1,
                iconRotate: layout(lid, 'icon-rotate') ?? 0,
                textSize: layout(lid, 'text-size') ?? 12,
                textColor: paint(lid, 'text-color') ?? '#ffffff',
                textHaloColor: paint(lid, 'text-halo-color') ?? '#000000',
                textHaloWidth: paint(lid, 'text-halo-width') ?? 1,
                textLetterSpacing: layout(lid, 'text-letter-spacing') ?? 0,
                textTransform: layout(lid, 'text-transform') ?? 'none',
            };

        case type === 'Wave Height': {
            const labelId = mapboxLayerIds[1];

            const lp = (prop, def) =>
                labelId ? (paint(labelId, prop) ?? def) : def;

            const ll = (prop, def) =>
                labelId ? (layout(labelId, prop) ?? def) : def;

            return {
                textSize: ll('text-size', 18),
                textColor: lp('text-color', '#ffffff'),
                textHaloColor: lp('text-halo-color', '#000000'),
                textHaloWidth: lp('text-halo-width', 2),
            };
        }

        default:
            return {};
    }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_META = {
    symbol: { label: 'Symbol', color: 'from-violet-500 to-purple-600' },
    typhoon: { label: 'Typhoon', color: 'from-rose-500 to-pink-600' },
    'Wave Height': { label: 'Wave Height', color: 'from-teal-500 to-cyan-600' },
};

const BLEND_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
];

// ── Primitive components ──────────────────────────────────────────────────────
export function Section({ title, defaultOpen = true, isDarkMode, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={cn('border-b', isDarkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2 transition-colors duration-150',
                    isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                )}
            >
                <span className={cn(
                    'text-[9px] font-bold uppercase tracking-[0.12em]',
                    isDarkMode ? 'text-white/25' : 'text-slate-400'
                )}>
                    {title}
                </span>
                <ChevronDown
                    size={10} strokeWidth={2.5}
                    className={cn(
                        'transition-transform duration-200',
                        isDarkMode ? 'text-white/20' : 'text-slate-300',
                        open ? 'rotate-0' : '-rotate-90'
                    )}
                />
            </button>
            {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
        </div>
    );
}

export function PropSlider({ label, min, max, step, value, display, onChange, isDarkMode, accent = 'cyan' }) {
    const accentColor = accent === 'cyan' ? '#22d3ee' : '#818cf8';
    const pct = `${((value - min) / (max - min)) * 100}%`;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className={cn('text-[10px] font-medium', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                    {label}
                </span>
                <span className={cn(
                    'text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded',
                    isDarkMode ? 'text-cyan-300 bg-cyan-400/10' : 'text-blue-600 bg-blue-500/8'
                )}>
                    {display}
                </span>
            </div>
            <div className="relative h-[3px] flex items-center">
                <div className={cn('absolute inset-0 rounded-full', isDarkMode ? 'bg-white/10' : 'bg-black/10')} />
                <div
                    className="absolute left-0 h-full rounded-full transition-all duration-75"
                    style={{ width: pct, background: `linear-gradient(to right, ${accentColor}99, ${accentColor})` }}
                />
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={(e) => onChange(+e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-0.5"
                />
                <div
                    className="absolute w-3 h-3 rounded-full border-2 pointer-events-none shadow-lg -translate-x-1/2"
                    style={{
                        left: pct,
                        borderColor: accentColor,
                        background: isDarkMode ? '#0f1117' : '#fff',
                        boxShadow: `0 0 6px ${accentColor}66`,
                    }}
                />
            </div>
        </div>
    );
}

export function PropColor({ label, value, onChange, isDarkMode }) {
    return (
        <div className="flex items-center justify-between">
            <span className={cn('text-[10px] font-medium', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                {label}
            </span>
            <label className="relative cursor-pointer group">
                <div
                    className="w-8 h-5 rounded border transition-all duration-150 group-hover:scale-110"
                    style={{
                        background: value,
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        boxShadow: `0 2px 8px ${value}55`,
                    }}
                />
                <input
                    type="color" value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
            </label>
        </div>
    );
}

export function PropSelect({ label, value, options, onChange, isDarkMode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className={cn('text-[10px] font-medium flex-shrink-0', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                {label}
            </span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'text-[10px] font-medium px-2 py-1 rounded-md border outline-none flex-1',
                    'appearance-none cursor-pointer transition-colors duration-150',
                    isDarkMode
                        ? 'bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/[0.09]'
                        : 'bg-black/[0.04] border-black/10 text-slate-600 hover:bg-black/[0.07]'
                )}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

export function PropToggle({ label, value, onChange, isDarkMode }) {
    return (
        <div className="flex items-center justify-between">
            <span className={cn('text-[10px] font-medium', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                {label}
            </span>
            <button
                onClick={onChange}
                className={cn(
                    'relative w-8 h-4 rounded-full transition-all duration-200 focus:outline-none',
                    value
                        ? isDarkMode ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-blue-500'
                        : isDarkMode ? 'bg-white/15' : 'bg-black/15'
                )}
            >
                <span className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200',
                    value ? 'left-[18px]' : 'left-0.5'
                )} />
            </button>
        </div>
    );
}

// ── Internal layout components ────────────────────────────────────────────────
function PanelHeader({ isDarkMode }) {
    return (
        <div className={cn(
            'flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0',
            isDarkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}>
            <Layers size={11} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400' : 'text-blue-500'} />
            <span className={cn(
                'text-[10px] font-bold uppercase tracking-[0.1em] flex-1',
                isDarkMode ? 'text-white/50' : 'text-slate-500'
            )}>
                Style Panel
            </span>
        </div>
    );
}

function EmptyPanel({ isDarkMode }) {
    return (
        <aside className={cn(
            'fixed top-16 right-2 z-40 mt-1 w-52 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden',
            isDarkMode ? 'bg-black/40 border border-white/[0.08]' : 'bg-white/70 border border-white/60'
        )}>
            <PanelHeader isDarkMode={isDarkMode} />
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
                <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.04]'
                )}>
                    <Layers size={14} strokeWidth={1.5} className={isDarkMode ? 'text-white/20' : 'text-slate-300'} />
                </div>
                <p className={cn('text-[10px] text-center leading-relaxed', isDarkMode ? 'text-white/20' : 'text-slate-400')}>
                    Select a layer to<br />edit its style
                </p>
            </div>
        </aside>
    );
}


// ── Control renderer ──────────────────────────────────────────────────────────
function renderControls(layerInfo, sharedProps) {
    const { type } = layerInfo;

    if (type === 'symbol' || type === 'typhoon') {
        return <SymbolStyleControls {...sharedProps} />;
    }

    if (type === 'Wave Height') {
        return <WaveHeightStyleControls {...sharedProps} />;
    }

    return null;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ════════════════════════════════════════════════════════════════════════════
export function LayerStylePanel({
    mapRef,
    layers,
    setLayers,
    activeLayerId,
    activeMapboxLayerIds,
    isDarkMode,
    onToggleVisibility,
}) {
    const [style, setStyle] = useState({});
    const [editingName, setEditingName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const { setPaint, setLayout } = useLayerStyle(mapRef);

    const map = mapRef?.current ?? null;
    const layerInfo = layers.find((l) => l.id === activeLayerId) ?? null;

    useEffect(() => {
        if (!layerInfo || !activeMapboxLayerIds?.length) { setStyle({}); return; }
        setStyle(readCurrentStyle(map, layerInfo, activeMapboxLayerIds));
        setIsEditingName(false);
        setEditingName('');
    }, [activeLayerId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!layerInfo) return <EmptyPanel isDarkMode={isDarkMode} />;

    const meta = TYPE_META[layerInfo.type] ?? TYPE_META.symbol;

    const sharedProps = {
        layerIds: activeMapboxLayerIds,
        style,
        onChange: setStyle,
        setPaint,
        setLayout,
        isDarkMode,
    };

    const handleSaveName = () => {
        const newName = editingName.trim();
        if (!newName || !activeLayerId) return;
        if (newName !== layerInfo.name) {
            updateLayerName(activeLayerId, newName, setLayers, mapRef.current);
        }
        setIsEditingName(false);
    };

    const handleCancelName = () => {
        setEditingName('');
        setIsEditingName(false);
    };

    const handleStartEditing = () => {
        setEditingName(layerInfo.name);
        setIsEditingName(true);
    };

    return (
        <aside className={cn(
            'fixed top-16 right-2 z-40 mt-1 w-52 rounded-xl backdrop-blur-xl shadow-2xl',
            'flex flex-col overflow-hidden',
            isDarkMode ? 'bg-black/40 border border-white/[0.08]' : 'bg-white/70 border border-white/60'
        )}>
            <PanelHeader isDarkMode={isDarkMode} />

            {/* Layer identity */}
            <div className={cn('px-3 py-3 border-b flex-shrink-0', isDarkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={cn(
                        `bg-gradient-to-r ${meta.color}`,
                        'inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-[0.1em] text-white'
                    )}>
                        {meta.label}
                    </span>
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelName();
                            }}
                            className={cn(
                                'flex-1 min-w-0 text-[12px] font-semibold px-2 py-1 rounded-md border outline-none',
                                isDarkMode
                                    ? 'bg-white/[0.08] border-white/15 text-white/90'
                                    : 'bg-black/[0.04] border-black/10 text-slate-900'
                            )}
                        />
                        <button
                            onClick={handleSaveName}
                            className={cn(
                                'shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                                isDarkMode ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600'
                            )}
                        >
                            <Check size={11} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={handleCancelName}
                            className={cn(
                                'shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                                isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white/60' : 'bg-black/10 hover:bg-black/15 text-slate-500'
                            )}
                        >
                            <X size={11} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <div onClick={handleStartEditing} className="flex items-center gap-1.5 group mt-0.5 cursor-pointer">
                        <p className={cn(
                            'text-[13px] font-semibold leading-tight truncate flex-1',
                            isDarkMode ? 'text-white/90' : 'text-slate-900'
                        )}>
                            {layerInfo.name}
                        </p>
                        <Pencil
                            size={9} strokeWidth={2.5}
                            className={cn(
                                'flex-shrink-0 opacity-30 group-hover:opacity-80 transition-opacity',
                                isDarkMode ? 'text-white/60' : 'text-slate-400'
                            )}
                        />
                    </div>
                )}
            </div>

            {/* Scrollable controls */}
            <div className={cn(
                'overflow-y-auto flex-1 max-h-[calc(100vh-240px)]',
                '[&::-webkit-scrollbar]:w-[3px]',
                isDarkMode
                    ? '[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10'
                    : '[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10'
            )}>
                <Section title="Visibility" isDarkMode={isDarkMode}>
                    <PropToggle
                        label="Show layer"
                        value={layerInfo.visible}
                        isDarkMode={isDarkMode}
                        onChange={() => onToggleVisibility?.(layerInfo)}
                    />
                </Section>

                {renderControls(layerInfo, sharedProps)}

                <Section title="Blend mode" isDarkMode={isDarkMode}>
                    <PropSelect
                        label="Mode" isDarkMode={isDarkMode}
                        value="normal"
                        options={BLEND_OPTIONS}
                        onChange={() => { }}
                    />
                </Section>

                <div className="h-2" />
            </div>
        </aside>
    );
}