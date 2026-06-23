import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, Layers, Lock, Pencil, SlidersHorizontal, X } from 'lucide-react';
import { useLayerStyle } from './hooks/useLayerStyle';
import { updateLayerName } from '@dashboards/forecaster/utils/layers';
import { queuePersistAnnotationStyle } from '@dashboards/forecaster/utils/layers/annotationStylePersistence';
import { SymbolStyleControls } from './StylePanel/SymbolStyleControls';
import { WaveHeightStyleControls } from './StylePanel/WaveHeightStyleControls';
import { FrontStyleControls } from './StylePanel/FrontStyleControls';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const safeGet = (fn) => {
    try { const value = fn(); return value ?? undefined; }
    catch { return undefined; }
};

const SYMBOL_LAYER_TYPES = new Set(['symbol', 'typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note']);

const PANEL_SURFACE = (isDarkMode) => isDarkMode
    ? 'studio-liquid-dark border border-white/[0.18]'
    : 'studio-liquid-light border border-white/80';

const INNER_SURFACE = (isDarkMode) => isDarkMode
    ? 'border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'border-white/80 bg-white/[0.52] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

const TYPE_META = {
    symbol: { label: 'Symbol', color: 'from-violet-500 to-purple-600' },
    typhoon: { label: 'Tropical Cyclone', color: 'from-rose-500 to-pink-600' },
    low_pressure: { label: 'Low Pressure', color: 'from-red-500 to-rose-600' },
    high_pressure: { label: 'High Pressure', color: 'from-blue-500 to-sky-600' },
    less_1: { label: 'Less Than 1m', color: 'from-emerald-500 to-teal-600' },
    text_note: { label: 'Text Label', color: 'from-amber-500 to-yellow-600' },
    'Wave Height': { label: 'Wave Height', color: 'from-teal-500 to-cyan-600' },
};

const getSourceId = (layerInfo) => layerInfo?.sourceID || layerInfo?.sourceId || layerInfo?.source || layerInfo?.id;
const getGeoJsonSourceData = (source) => source?._data || source?.serialize?.()?.data || null;
const getSavedStyle = (layerInfo) => layerInfo?.properties?.style || layerInfo?.style || {};

const isFrontLayer = (layerInfo) => {
    const sourceId = getSourceId(layerInfo);
    const label = `${layerInfo?.type || ''} ${layerInfo?.name || ''}`.toLowerCase();
    return Boolean(layerInfo?.properties?.isFront || layerInfo?.isFront || sourceId?.startsWith?.('SF_') || label.includes('front'));
};

function findLayerIdByType(map, ids, type) {
    return ids?.find((id) => map?.getLayer(id)?.type === type);
}

function readCurrentStyle(map, layerInfo, mapboxLayerIds) {
    if (!map || !layerInfo || !mapboxLayerIds?.length) return {};

    const paint = (id, prop) => safeGet(() => map.getPaintProperty(id, prop));
    const layout = (id, prop) => safeGet(() => map.getLayoutProperty(id, prop));
    const firstLayerId = mapboxLayerIds.find((id) => map.getLayer(id));
    const type = layerInfo.type;

    if (isFrontLayer(layerInfo)) {
        const lineId = findLayerIdByType(map, mapboxLayerIds, 'line');
        const symbolId = findLayerIdByType(map, mapboxLayerIds, 'fill');
        const sourceData = getGeoJsonSourceData(map.getSource(getSourceId(layerInfo)));

        return {
            lineWidth: lineId ? (paint(lineId, 'line-width') ?? 2.75) : 2.75,
            lineOpacity: lineId ? (paint(lineId, 'line-opacity') ?? 1) : 1,
            symbolOpacity: symbolId ? (paint(symbolId, 'fill-opacity') ?? 1) : 1,
            frontSymbolSide:
                layerInfo.frontSymbolSide ||
                layerInfo.properties?.frontSymbolSide ||
                sourceData?.features?.[0]?.properties?.frontSymbolSide ||
                'normal',
        };
    }

    if (!firstLayerId || !map.getLayer(firstLayerId)) return {};

    if (SYMBOL_LAYER_TYPES.has(type)) {
        return {
            iconSize: layout(firstLayerId, 'icon-size') ?? 0.07,
            iconOpacity: paint(firstLayerId, 'icon-opacity') ?? 1,
            iconRotate: layout(firstLayerId, 'icon-rotate') ?? 0,
            textSize: layout(firstLayerId, 'text-size') ?? 12,
            textColor: paint(firstLayerId, 'text-color') ?? '#ffffff',
            textHaloColor: paint(firstLayerId, 'text-halo-color') ?? '#000000',
            textHaloWidth: paint(firstLayerId, 'text-halo-width') ?? 1,
            textLetterSpacing: layout(firstLayerId, 'text-letter-spacing') ?? 0,
            textTransform: layout(firstLayerId, 'text-transform') ?? 'none',
        };
    }

    if (type === 'Wave Height') {
        const lineId = findLayerIdByType(map, mapboxLayerIds, 'line') || firstLayerId;
        const labelId = findLayerIdByType(map, mapboxLayerIds, 'symbol') || mapboxLayerIds[1];
        return {
            lineColor: paint(lineId, 'line-color') ?? '#ffffff',
            lineWidth: paint(lineId, 'line-width') ?? 3,
            lineOpacity: paint(lineId, 'line-opacity') ?? 0.6,
            textSize: labelId ? (layout(labelId, 'text-size') ?? 18) : 18,
            textColor: labelId ? (paint(labelId, 'text-color') ?? '#ffffff') : '#ffffff',
            textHaloColor: labelId ? (paint(labelId, 'text-halo-color') ?? '#000000') : '#000000',
            textHaloWidth: labelId ? (paint(labelId, 'text-halo-width') ?? 2) : 2,
        };
    }

    const mapLayer = map.getLayer(firstLayerId);
    if (mapLayer?.type === 'line') {
        return {
            lineColor: paint(firstLayerId, 'line-color') ?? '#2563eb',
            lineWidth: paint(firstLayerId, 'line-width') ?? 3,
            lineOpacity: paint(firstLayerId, 'line-opacity') ?? 1,
        };
    }

    if (mapLayer?.type === 'fill') {
        return {
            fillColor: paint(firstLayerId, 'fill-color') ?? '#2563eb',
            fillOpacity: paint(firstLayerId, 'fill-opacity') ?? 0.25,
        };
    }

    return {};
}

function getLatestPanelStyle(map, layerInfo, mapboxLayerIds) {
    const liveStyle = readCurrentStyle(map, layerInfo, mapboxLayerIds);
    const savedStyle = getSavedStyle(layerInfo);
    const sideStyle = layerInfo?.frontSymbolSide || layerInfo?.properties?.frontSymbolSide
        ? { frontSymbolSide: layerInfo.frontSymbolSide || layerInfo.properties?.frontSymbolSide }
        : {};

    return { ...liveStyle, ...savedStyle, ...sideStyle };
}

export function Section({ title, defaultOpen = true, isDarkMode, children, compact = false }) {
    const [open, setOpen] = useState(defaultOpen);

    if (compact) return <div className="space-y-2 px-2.5 py-2.5">{children}</div>;

    return (
        <div className={cn('mx-2 mt-2 overflow-hidden rounded-lg border', INNER_SURFACE(isDarkMode))}>
            <button
                onClick={() => setOpen((value) => !value)}
                className={cn('flex min-h-10 w-full items-center justify-between px-2.5 py-2 transition-colors duration-150', isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50')}
            >
                <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/55' : 'text-slate-500')}>{title}</span>
                <ChevronDown size={14} strokeWidth={2.5} className={cn('transition-transform duration-200', isDarkMode ? 'text-white/20' : 'text-slate-300', open ? 'rotate-0' : '-rotate-90')} />
            </button>
            {open && <div className={cn('space-y-3 border-t px-2.5 pb-2.5 pt-2.5', isDarkMode ? 'border-white/[0.08]' : 'border-slate-100')}>{children}</div>}
        </div>
    );
}

export function PropSlider({ label, min, max, step, value, display, onChange, isDarkMode, accent = 'cyan' }) {
    const accentColor = accent === 'cyan' ? '#22d3ee' : '#818cf8';
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
    const pct = `${Math.min(100, Math.max(0, ((numericValue - min) / (max - min)) * 100))}%`;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white/55' : 'text-slate-600')}>{label}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums', isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-500/10 text-blue-700')}>{display}</span>
            </div>
            <div className="relative flex h-7 items-center">
                <div className={cn('absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full', isDarkMode ? 'bg-white/10' : 'bg-black/10')} />
                <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-all duration-75" style={{ width: pct, background: `linear-gradient(to right, ${accentColor}99, ${accentColor})` }} />
                <input type="range" min={min} max={max} step={step} value={numericValue} onChange={(event) => onChange(+event.target.value)} className="absolute inset-0 h-7 w-full cursor-pointer opacity-0" />
                <div className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg" style={{ left: pct, borderColor: accentColor, background: isDarkMode ? '#0f1117' : '#fff', boxShadow: `0 0 6px ${accentColor}66` }} />
            </div>
        </div>
    );
}

export function PropColor({ label, value, onChange, isDarkMode }) {
    const color = typeof value === 'string' && value.startsWith('#') ? value : '#2563eb';
    return (
        <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg">
            <span className={cn('text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>{label}</span>
            <label className="group relative cursor-pointer">
                <div className="h-8 w-12 rounded-lg border transition-all duration-150 group-hover:scale-105" style={{ background: color, borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', boxShadow: `0 2px 8px ${color}55` }} />
                <input type="color" value={color} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
        </div>
    );
}

export function PropSelect({ label, value, options, onChange, isDarkMode }) {
    return (
        <div className="flex min-h-10 items-center justify-between gap-3">
            <span className={cn('shrink-0 text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn('min-h-10 flex-1 cursor-pointer appearance-none rounded-lg border px-3 py-1.5 text-[12px] font-bold outline-none transition-colors duration-150', isDarkMode ? 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/[0.09]' : 'border-black/10 bg-black/[0.04] text-slate-600 hover:bg-black/[0.07]')}
            >
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </div>
    );
}

export function PropToggle({ label, value, onChange, isDarkMode }) {
    return (
        <div className="flex min-h-10 items-center justify-between gap-3">
            <span className={cn('text-[11px] font-bold', isDarkMode ? 'text-white/60' : 'text-slate-600')}>{label}</span>
            <button
                type="button"
                onClick={onChange}
                className={cn('relative h-6 w-11 rounded-full transition-all duration-200 focus:outline-none', value ? (isDarkMode ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-blue-500') : (isDarkMode ? 'bg-white/15' : 'bg-black/15'))}
            >
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200', value ? 'left-[22px]' : 'left-0.5')} />
            </button>
        </div>
    );
}

function GenericMapboxStyleControls({ layerIds, layerInfo, style, onChange, setPaint, isDarkMode, tab = 'symbol', mapRef }) {
    const map = mapRef?.current;
    const lineId = layerIds.find((id) => map?.getLayer(id)?.type === 'line');
    const fillId = layerIds.find((id) => map?.getLayer(id)?.type === 'fill');
    const p = (ids, key, prop, val) => {
        const nextStyle = { ...style, [key]: val };
        onChange(nextStyle);
        queuePersistAnnotationStyle(layerInfo, nextStyle);
        setPaint(ids.filter(Boolean), prop, val);
    };

    if (tab === 'label') return null;

    if (fillId) {
        return (
            <Section title="Fill" isDarkMode={isDarkMode} compact>
                <PropColor label="Fill color" value={style.fillColor ?? '#2563eb'} onChange={(value) => p([fillId], 'fillColor', 'fill-color', value)} isDarkMode={isDarkMode} />
                <PropSlider label="Fill opacity" min={0} max={1} step={0.01} value={style.fillOpacity ?? 0.25} display={`${Math.round((style.fillOpacity ?? 0.25) * 100)}%`} onChange={(value) => p([fillId], 'fillOpacity', 'fill-opacity', value)} isDarkMode={isDarkMode} />
            </Section>
        );
    }

    if (lineId) {
        return (
            <Section title="Line" isDarkMode={isDarkMode} compact>
                <PropColor label="Line color" value={style.lineColor ?? '#2563eb'} onChange={(value) => p([lineId], 'lineColor', 'line-color', value)} isDarkMode={isDarkMode} />
                <PropSlider label="Line width" min={0.5} max={12} step={0.25} value={style.lineWidth ?? 3} display={`${style.lineWidth ?? 3}px`} onChange={(value) => p([lineId], 'lineWidth', 'line-width', value)} isDarkMode={isDarkMode} />
                <PropSlider label="Line opacity" min={0} max={1} step={0.01} value={style.lineOpacity ?? 1} display={`${Math.round((style.lineOpacity ?? 1) * 100)}%`} onChange={(value) => p([lineId], 'lineOpacity', 'line-opacity', value)} isDarkMode={isDarkMode} />
            </Section>
        );
    }

    return null;
}

function PanelHeader({ isDarkMode, dragHandleProps }) {
    return (
        <div className={cn('flex min-h-11 flex-shrink-0 items-center gap-2.5 border-b px-2.5 py-2', dragHandleProps && 'cursor-grab touch-none select-none active:cursor-grabbing', isDarkMode ? 'border-white/10' : 'border-slate-200/70')} {...dragHandleProps}>
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
                <SlidersHorizontal size={14} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
                <span className={cn('block truncate text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/75' : 'text-slate-700')}>Annotation Style</span>
                <span className={cn('block truncate text-[9px] font-bold uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}>Selected layer controls</span>
            </div>
        </div>
    );
}

function EmptyPanel({ isDarkMode, panelClassName, panelStyle, dragHandleProps }) {
    return (
        <aside className={cn(panelClassName, 'studio-liquid-panel relative overflow-hidden rounded-2xl shadow-2xl', PANEL_SURFACE(isDarkMode))} style={panelStyle} data-floating-panel>
            <PanelHeader isDarkMode={isDarkMode} dragHandleProps={dragHandleProps} />
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-7 text-center">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-100')}>
                    <Layers size={18} strokeWidth={1.8} className={isDarkMode ? 'text-white/30' : 'text-slate-400'} />
                </div>
                <p className={cn('text-sm font-black leading-relaxed', isDarkMode ? 'text-white/45' : 'text-slate-600')}>No annotation selected</p>
                <p className={cn('max-w-[15rem] text-xs font-semibold leading-relaxed', isDarkMode ? 'text-white/30' : 'text-slate-400')}>Choose a layer from the Annotation Layers stack to edit its style.</p>
            </div>
        </aside>
    );
}

function renderControls(layerInfo, sharedProps, styleTab) {
    if (isFrontLayer(layerInfo)) return <FrontStyleControls {...sharedProps} tab={styleTab} />;
    if (SYMBOL_LAYER_TYPES.has(layerInfo.type)) return <SymbolStyleControls {...sharedProps} tab={styleTab} />;
    if (layerInfo.type === 'Wave Height') return <WaveHeightStyleControls {...sharedProps} tab={styleTab} />;
    return <GenericMapboxStyleControls {...sharedProps} tab={styleTab} />;
}

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
    const layerInfo = layers.find((layer) => layer.id === activeLayerId) ?? null;
    const layerStyleSignature = useMemo(() => JSON.stringify(getSavedStyle(layerInfo)), [layerInfo]);
    const activeMapboxLayerSignature = useMemo(() => (activeMapboxLayerIds || []).join('|'), [activeMapboxLayerIds]);

    useEffect(() => {
        if (isFrontLayer(layerInfo)) setStyleTab('symbol');
        else setStyleTab(layerInfo?.type === 'text_note' ? 'label' : 'symbol');

        if (!layerInfo || !activeMapboxLayerIds?.length) {
            setStyle({});
            return;
        }

        setStyle(getLatestPanelStyle(map, layerInfo, activeMapboxLayerIds));
        setIsEditingName(false);
        setEditingName('');
    }, [activeLayerId, activeMapboxLayerSignature, layerStyleSignature]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!layerInfo) return <EmptyPanel isDarkMode={isDarkMode} panelClassName={panelClassName} panelStyle={panelStyle} dragHandleProps={dragHandleProps} />;

    const handleStyleChange = (nextStyle) => {
        setStyle(nextStyle);
        setLayers?.((previousLayers) => previousLayers.map((layer) => {
            const matches = layer.id === layerInfo.id || layer.sourceID === getSourceId(layerInfo) || layer.sourceId === getSourceId(layerInfo);
            if (!matches) return layer;
            return {
                ...layer,
                style: nextStyle,
                frontSymbolSide: nextStyle.frontSymbolSide || layer.frontSymbolSide,
                properties: {
                    ...(layer.properties || {}),
                    style: nextStyle,
                    ...(nextStyle.frontSymbolSide ? { frontSymbolSide: nextStyle.frontSymbolSide } : {}),
                },
            };
        }));
    };

    const handleSaveName = () => {
        const newName = editingName.trim();
        if (!newName || !activeLayerId) return;
        if (newName !== layerInfo.name) updateLayerName(activeLayerId, newName, setLayers, mapRef.current);
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

    const meta = isFrontLayer(layerInfo) ? { label: 'Surface Front', color: 'from-blue-500 to-cyan-600' } : TYPE_META[layerInfo.type] ?? TYPE_META.symbol;
    const styleTabs = layerInfo.type === 'Wave Height'
        ? [{ key: 'symbol', label: 'Line' }, { key: 'label', label: 'Label' }, { key: 'layer', label: 'Layer' }]
        : layerInfo.type === 'text_note'
            ? [{ key: 'label', label: 'Text' }, { key: 'layer', label: 'Layer' }]
            : isFrontLayer(layerInfo)
                ? [{ key: 'symbol', label: 'Front' }, { key: 'label', label: 'Glyphs' }, { key: 'layer', label: 'Layer' }]
                : [{ key: 'symbol', label: 'Symbol' }, { key: 'label', label: 'Label' }, { key: 'layer', label: 'Layer' }];

    const sharedProps = {
        layerIds: activeMapboxLayerIds || [],
        layerInfo,
        style,
        onChange: handleStyleChange,
        setPaint,
        setLayout,
        setLayers,
        mapRef,
        isDarkMode,
    };

    return (
        <aside className={cn(panelClassName, 'studio-liquid-panel relative flex flex-col overflow-hidden rounded-2xl shadow-2xl', PANEL_SURFACE(isDarkMode))} style={panelStyle} data-floating-panel>
            <PanelHeader isDarkMode={isDarkMode} dragHandleProps={dragHandleProps} />

            <div className={cn('flex-shrink-0 border-b px-2.5 py-1.5', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200/70 bg-white/[0.28]')}>
                {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            autoFocus
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleSaveName();
                                if (event.key === 'Escape') handleCancelName();
                            }}
                            className={cn('min-h-9 min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-400/35', isDarkMode ? 'border-white/15 bg-white/[0.08] text-white/90' : 'border-black/10 bg-black/[0.04] text-slate-900')}
                        />
                        <button type="button" onClick={handleSaveName} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', isDarkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20')}>
                            <Check size={15} strokeWidth={2.5} />
                        </button>
                        <button type="button" onClick={handleCancelName} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', isDarkMode ? 'bg-white/10 text-white/60 hover:bg-white/15' : 'bg-black/10 text-slate-500 hover:bg-black/15')}>
                            <X size={15} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-lg', meta.color)}>
                            <Layers size={13} strokeWidth={2.5} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white/90' : 'text-slate-800')}>{layerInfo.name}</p>
                                {layerInfo.locked && <Lock size={11} className={isDarkMode ? 'text-white/35' : 'text-slate-400'} />}
                            </div>
                            <p className={cn('truncate text-[9px] font-bold uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}>{meta.label}</p>
                        </div>
                        <button type="button" onClick={handleStartEditing} className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors', isDarkMode ? 'text-white/45 hover:bg-white/10 hover:text-white/75' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')}>
                            <Pencil size={13} strokeWidth={2.4} />
                        </button>
                    </div>
                )}
            </div>

            <div className={cn('grid flex-shrink-0 gap-1 border-b p-1.5', isDarkMode ? 'border-white/10' : 'border-slate-200/70')} style={{ gridTemplateColumns: `repeat(${styleTabs.length}, minmax(0, 1fr))` }}>
                {styleTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStyleTab(tab.key)}
                        className={cn('rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all duration-150', styleTab === tab.key ? (isDarkMode ? 'bg-cyan-400/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]' : 'bg-blue-500/10 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22)]') : (isDarkMode ? 'text-white/35 hover:bg-white/[0.05] hover:text-white/60' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'))}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={cn('min-h-0 flex-1 overflow-y-auto py-1', controlsClassName)}>
                {styleTab === 'layer' ? (
                    <Section title="Layer" isDarkMode={isDarkMode} compact>
                        <button
                            type="button"
                            onClick={() => onToggleVisibility?.(layerInfo.id)}
                            className={cn('flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2 text-[11px] font-bold transition-colors', isDarkMode ? 'text-white/65 hover:bg-white/[0.06]' : 'text-slate-600 hover:bg-black/[0.04]')}
                        >
                            <span>Visibility</span>
                            <span className="flex items-center gap-1.5">
                                {layerInfo.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                {layerInfo.visible === false ? 'Hidden' : 'Visible'}
                            </span>
                        </button>
                    </Section>
                ) : renderControls(layerInfo, sharedProps, styleTab)}
            </div>
        </aside>
    );
}
