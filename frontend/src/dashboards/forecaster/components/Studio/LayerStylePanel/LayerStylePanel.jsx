import { useState, useEffect } from 'react';
import { ChevronDown, Layers, Check, Pencil, X, SlidersHorizontal, Lock } from 'lucide-react';
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

const SYMBOL_LAYER_TYPES = new Set(['symbol', 'typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note']);
const PANEL_SURFACE = (isDarkMode) =>
    isDarkMode
        ? 'studio-liquid-dark border border-white/[0.18]'
        : 'studio-liquid-light border border-white/80';
const INNER_SURFACE = (isDarkMode) =>
    isDarkMode
        ? 'border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
        : 'border-white/80 bg-white/[0.52] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

// ── Read live style from Mapbox ───────────────────────────────────────────────
function readCurrentStyle(map, layerInfo, mapboxLayerIds) {
    if (!map || !layerInfo || !mapboxLayerIds?.length) return {};

    const lid = mapboxLayerIds[0];
    if (!lid || !map.getLayer(lid)) return {};

    const paint = (id, prop) => safeGet(() => map.getPaintProperty(id, prop));
    const layout = (id, prop) => safeGet(() => map.getLayoutProperty(id, prop));
    const { type } = layerInfo;

    switch (true) {
        case SYMBOL_LAYER_TYPES.has(type):
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
    typhoon: { label: 'Tropical Cyclone', color: 'from-rose-500 to-pink-600' },
    low_pressure: { label: 'Low Pressure', color: 'from-red-500 to-rose-600' },
    high_pressure: { label: 'High Pressure', color: 'from-blue-500 to-sky-600' },
    less_1: { label: 'Less Than 1m', color: 'from-emerald-500 to-teal-600' },
    text_note: { label: 'Text Label', color: 'from-amber-500 to-yellow-600' },
    'Wave Height': { label: 'Wave Height', color: 'from-teal-500 to-cyan-600' },
};

// ── Primitive components ──────────────────────────────────────────────────────
export function Section({ title, defaultOpen = true, isDarkMode, children, compact = false }) {
    const [open, setOpen] = useState(defaultOpen);

    if (compact) {
        return (
            <div className="space-y-2 px-2.5 py-2.5">
                {children}
            </div>
        );
    }

    return (
        <div className={cn(
            'mx-2 mt-2 overflow-hidden rounded-lg border',
            INNER_SURFACE(isDarkMode)
        )}>
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'w-full flex min-h-10 items-center justify-between px-2.5 py-2 transition-colors duration-150',
                    isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50'
                )}
            >
                <span className={cn(
                    'text-[10px] font-black uppercase tracking-wide',
                    isDarkMode ? 'text-white/55' : 'text-slate-500'
                )}>
                    {title}
                </span>
                <ChevronDown
                    size={14} strokeWidth={2.5}
                    className={cn(
                        'transition-transform duration-200',
                        isDarkMode ? 'text-white/20' : 'text-slate-300',
                        open ? 'rotate-0' : '-rotate-90'
                    )}
                />
            </button>
            {open && <div className={cn('space-y-3 border-t px-2.5 pb-2.5 pt-2.5', isDarkMode ? 'border-white/[0.08]' : 'border-slate-100')}>{children}</div>}
        </div>
    );
}

export function PropSlider({ label, min, max, step, value, display, onChange, isDarkMode, accent = 'cyan' }) {
    const accentColor = accent === 'cyan' ? '#22d3ee' : '#818cf8';
    const pct = `${((value - min) / (max - min)) * 100}%`;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white/55' : 'text-slate-600')}>
                    {label}
                </span>
                <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums',
                    isDarkMode ? 'text-cyan-200 bg-cyan-400/10' : 'text-blue-700 bg-blue-500/10'
                )}>
                    {display}
                </span>
            </div>
            <div className="relative flex h-7 items-center">
                <div className={cn('absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full', isDarkMode ? 'bg-white/10' : 'bg-black/10')} />
                <div
                    className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-all duration-75"
                    style={{ width: pct, background: `linear-gradient(to right, ${accentColor}99, ${accentColor})` }}
                />
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={(e) => onChange(+e.target.value)}
                    className="absolute inset-0 h-7 w-full cursor-pointer opacity-0"
                />
                <div
                    className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg"
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
        <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg">
            <span className={cn('text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>
                {label}
            </span>
            <label className="relative cursor-pointer group">
                <div
                    className="h-8 w-12 rounded-lg border transition-all duration-150 group-hover:scale-105"
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
        <div className="flex min-h-10 items-center justify-between gap-3">
            <span className={cn('shrink-0 text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>
                {label}
            </span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'min-h-10 flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-bold outline-none',
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
        <div className="flex min-h-10 items-center justify-between gap-3">
            <span className={cn('text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>
                {label}
            </span>
            <button
                onClick={onChange}
                className={cn(
                    'relative h-6 w-11 rounded-full transition-all duration-200 focus:outline-none',
                    value
                        ? isDarkMode ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-blue-500'
                        : isDarkMode ? 'bg-white/15' : 'bg-black/15'
                )}
            >
                <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
                    value ? 'left-[22px]' : 'left-0.5'
                )} />
            </button>
        </div>
    );
}

// ── Internal layout components ────────────────────────────────────────────────
function PanelHeader({ isDarkMode, dragHandleProps }) {
    return (
        <div className={cn(
            'flex min-h-11 flex-shrink-0 items-center gap-2.5 border-b px-2.5 py-2',
            dragHandleProps && 'cursor-grab select-none touch-none active:cursor-grabbing',
            isDarkMode ? 'border-white/10' : 'border-slate-200/70'
        )} {...dragHandleProps}>
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
                <SlidersHorizontal size={14} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
                <span className={cn(
                    'block truncate text-[11px] font-black uppercase tracking-wide',
                    isDarkMode ? 'text-white/75' : 'text-slate-700'
                )}>
                    Annotation Style
                </span>
                <span className={cn('block truncate text-[9px] font-bold uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}>
                    Selected layer controls
                </span>
            </div>
        </div>
    );
}

function EmptyPanel({ isDarkMode, panelClassName, panelStyle, dragHandleProps }) {
    return (
        <aside className={cn(
            panelClassName,
            'studio-liquid-panel relative overflow-hidden rounded-2xl shadow-2xl',
            PANEL_SURFACE(isDarkMode)
        )} style={panelStyle} data-floating-panel>
            <PanelHeader isDarkMode={isDarkMode} dragHandleProps={dragHandleProps} />
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-7 text-center">
                <div className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-100'
                )}>
                    <Layers size={18} strokeWidth={1.8} className={isDarkMode ? 'text-white/30' : 'text-slate-400'} />
                </div>
                <p className={cn('text-sm font-black leading-relaxed', isDarkMode ? 'text-white/45' : 'text-slate-600')}>
                    No annotation selected
                </p>
                <p className={cn('max-w-[15rem] text-xs font-semibold leading-relaxed', isDarkMode ? 'text-white/30' : 'text-slate-400')}>
                    Choose a layer from the Annotation Layers stack to edit its symbol, label, visibility, and opacity.
                </p>
            </div>
        </aside>
    );
}


// ── Control renderer ──────────────────────────────────────────────────────────
function renderControls(layerInfo, sharedProps, styleTab) {
    const { type } = layerInfo;

    if (SYMBOL_LAYER_TYPES.has(type)) {
        return <SymbolStyleControls {...sharedProps} tab={styleTab} />;
    }

    if (type === 'Wave Height') {
        return <WaveHeightStyleControls {...sharedProps} tab={styleTab} />;
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
    panelClassName = 'fixed top-16 right-2 z-40 mt-1 w-52',
    controlsClassName = 'max-h-[calc(100vh-240px)]',
    panelStyle,
    dragHandleProps,
}) {
    const [style, setStyle] = useState({});
    const [editingName, setEditingName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [styleTab, setStyleTab] = useState('symbol');
    const { setPaint, setLayout } = useLayerStyle(mapRef);

    const map = mapRef?.current ?? null;
    const layerInfo = layers.find((l) => l.id === activeLayerId) ?? null;

    useEffect(() => {
        setStyleTab(layerInfo?.type === 'text_note' ? 'label' : 'symbol');
        if (!layerInfo || !activeMapboxLayerIds?.length) { setStyle({}); return; }
        setStyle(readCurrentStyle(map, layerInfo, activeMapboxLayerIds));
        setIsEditingName(false);
        setEditingName('');
    }, [activeLayerId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!layerInfo) return <EmptyPanel isDarkMode={isDarkMode} panelClassName={panelClassName} panelStyle={panelStyle} dragHandleProps={dragHandleProps} />;

    const meta = TYPE_META[layerInfo.type] ?? TYPE_META.symbol;
    const styleTabs = layerInfo.type === 'Wave Height'
        ? [
            { key: 'symbol', label: 'Line' },
            { key: 'label', label: 'Label' },
            { key: 'layer', label: 'Layer' },
        ]
        : layerInfo.type === 'text_note'
            ? [
                { key: 'label', label: 'Text' },
                { key: 'layer', label: 'Layer' },
            ]
        : [
            { key: 'symbol', label: 'Symbol' },
            { key: 'label', label: 'Label' },
            { key: 'layer', label: 'Layer' },
        ];

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
            panelClassName,
            'studio-liquid-panel rounded-2xl shadow-2xl',
            'relative flex flex-col overflow-hidden',
            PANEL_SURFACE(isDarkMode)
        )} style={panelStyle} data-floating-panel>
            <PanelHeader isDarkMode={isDarkMode} dragHandleProps={dragHandleProps} />

            {/* Layer identity */}
            <div className={cn('border-b px-2.5 py-1.5 flex-shrink-0', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200/70 bg-white/[0.28]')}>
                {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelName();
                            }}
                            className={cn(
                                'min-h-9 flex-1 min-w-0 rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-400/35',
                                isDarkMode
                                    ? 'bg-white/[0.08] border-white/15 text-white/90'
                                    : 'bg-black/[0.04] border-black/10 text-slate-900'
                            )}
                        />
                        <button
                            onClick={handleSaveName}
                            className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                isDarkMode ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600'
                            )}
                        >
                            <Check size={15} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={handleCancelName}
                            className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white/60' : 'bg-black/10 hover:bg-black/15 text-slate-500'
                            )}
                        >
                            <X size={15} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <div className="flex min-h-9 items-center gap-2">
                        <span className={cn(
                            `bg-gradient-to-r ${meta.color}`,
                            'hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm sm:inline-flex'
                        )}>
                            {meta.label}
                        </span>
                        <button type="button" onClick={handleStartEditing} className={cn('group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left transition-colors', isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-white/70')}>
                            <p className={cn(
                                'flex-1 truncate text-sm font-bold leading-tight',
                                isDarkMode ? 'text-white/90' : 'text-slate-900'
                            )}>
                                {layerInfo.name}
                            </p>
                            <Pencil
                                size={12} strokeWidth={2.5}
                                className={cn(
                                    'flex-shrink-0 opacity-40 transition-opacity group-hover:opacity-90',
                                    isDarkMode ? 'text-white/60' : 'text-slate-400'
                                )}
                            />
                        </button>
                        {layerInfo.locked && (
                            <span className={cn(
                                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide',
                                isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-100 text-amber-800'
                            )}>
                                <Lock size={10} strokeWidth={2.5} />
                                Locked
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={cn('grid grid-cols-3 gap-1 border-b p-1.5 flex-shrink-0', isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200/70 bg-white/[0.24]')}>
                {styleTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStyleTab(tab.key)}
                        className={cn(
                            'min-h-9 rounded-lg border px-2 text-[10px] font-black uppercase tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35',
                            styleTab === tab.key
                                ? isDarkMode
                                    ? 'border-cyan-300/25 bg-cyan-400/15 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                                    : 'border-blue-200 bg-blue-100 text-blue-800 shadow-sm'
                                : isDarkMode
                                    ? 'border-white/10 bg-white/[0.035] text-white/45 hover:bg-white/[0.07] hover:text-white/75'
                                    : 'border-white/80 bg-white/55 text-slate-500 hover:bg-white/80 hover:text-slate-800'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable controls */}
            <div className={cn(
                'min-h-0 overflow-y-auto overscroll-contain flex-1',
                controlsClassName,
                '[&::-webkit-scrollbar]:w-[3px]',
                isDarkMode
                    ? '[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10'
                    : '[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10'
            )}>
                {styleTab === 'layer' ? (
                    <Section title="Layer" isDarkMode={isDarkMode}>
                        <PropToggle
                            label="Show layer"
                            value={layerInfo.visible}
                            isDarkMode={isDarkMode}
                            onChange={() => onToggleVisibility?.(layerInfo)}
                        />
                    </Section>
                ) : (
                    renderControls(layerInfo, sharedProps, styleTab)
                )}

                {styleTab !== 'layer' && (
                    <Section title="Visibility" isDarkMode={isDarkMode} defaultOpen={false}>
                        <PropToggle
                            label="Show layer"
                            value={layerInfo.visible}
                            isDarkMode={isDarkMode}
                            onChange={() => onToggleVisibility?.(layerInfo)}
                        />
                    </Section>
                )}

                <div className="h-2" />
            </div>
        </aside>
    );
}
