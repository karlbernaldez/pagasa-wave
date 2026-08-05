import { Section, PropColor, PropSlider, PropSelect } from '../LayerStylePanel';
import { queuePersistAnnotationStyle } from '@dashboards/forecaster/utils/layers/annotationStylePersistence';

const SYMBOL_STYLE_DEFAULTS = {
    iconSize: 0.07,
    iconOpacity: 1,
    iconRotate: 0,
    textTransform: 'none',
    textLetterSpacing: 0,
    textSize: 12,
    textColor: '#ffffff',
    textHaloColor: '#000000',
    textHaloWidth: 1,
};

function getCandidateLayerIds(map, layerIds, layerInfo) {
    const props = layerInfo?.properties || {};
    const sourceIds = new Set([
        layerInfo?.sourceID,
        layerInfo?.sourceId,
        layerInfo?.source,
        props.sourceId,
        props.stableId,
        props.annotationId,
    ].filter(Boolean));

    const directIds = new Set([
        ...(layerIds || []),
        props.mapLayerId,
        layerInfo?.mapLayerId,
        ...(props.layerAliases || []),
    ].filter(Boolean));

    const markerType = props.markerType || props.type || layerInfo?.type;
    const name = layerInfo?.name || props.displayName || props.name || props.title || props.labelValue;
    if (markerType && name) directIds.add(`${markerType}_${name}`);

    const resolved = new Set();
    const styleLayers = map?.getStyle?.()?.layers || [];

    directIds.forEach((id) => {
        if (map?.getLayer?.(id)) resolved.add(id);
    });

    styleLayers.forEach((layer) => {
        if (layer?.type !== 'symbol') return;
        if (sourceIds.has(layer.source) || directIds.has(layer.id)) resolved.add(layer.id);
    });

    return Array.from(resolved);
}

export function SymbolStyleControls({
    layerIds,
    layerInfo,
    style,
    onChange,
    setPaint,
    setLayout,
    mapRef,
    isDarkMode,
    tab = 'symbol',
}) {
    const update = (patch) => {
        const changedKeys = Object.keys(patch);
        const beforeStyle = { ...style };

        changedKeys.forEach((key) => {
            if (beforeStyle[key] === undefined && key in SYMBOL_STYLE_DEFAULTS) {
                beforeStyle[key] = SYMBOL_STYLE_DEFAULTS[key];
            }
        });

        const nextStyle = { ...style, ...patch };
        onChange(nextStyle);
        queuePersistAnnotationStyle(
            {
                ...layerInfo,
                properties: {
                    ...(layerInfo?.properties || {}),
                    style: beforeStyle,
                },
            },
            nextStyle
        );
        return nextStyle;
    };

    const getTargets = () => getCandidateLayerIds(mapRef?.current, layerIds, layerInfo);
    const l = (key, prop, val) => {
        update({ [key]: val });
        setLayout(getTargets(), prop, val);
    };
    const p = (key, prop, val) => {
        update({ [key]: val });
        setPaint(getTargets(), prop, val);
    };

    const iconSection = (
        <Section title="Icon" isDarkMode={isDarkMode} compact>
            <PropSlider
                label="Size" min={0.01} max={0.5} step={0.005} isDarkMode={isDarkMode}
                value={style.iconSize ?? 0.07}
                display={`${Math.round((style.iconSize ?? 0.07) * 100)}%`}
                onChange={(v) => l('iconSize', 'icon-size', v)}
            />
            <PropSlider
                label="Opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                value={style.iconOpacity ?? 1}
                display={`${Math.round((style.iconOpacity ?? 1) * 100)}%`}
                onChange={(v) => p('iconOpacity', 'icon-opacity', v)}
            />
            <PropSlider
                label="Rotation" min={0} max={360} step={1} isDarkMode={isDarkMode}
                value={style.iconRotate ?? 0}
                display={`${style.iconRotate ?? 0} deg`}
                onChange={(v) => l('iconRotate', 'icon-rotate', v)}
            />
        </Section>
    );

    const labelSection = (
        <Section title="Label" isDarkMode={isDarkMode} compact>
            <PropSelect
                label="Transform" isDarkMode={isDarkMode}
                value={style.textTransform ?? 'none'}
                options={[
                    { value: 'none', label: 'None' },
                    { value: 'uppercase', label: 'Uppercase' },
                    { value: 'lowercase', label: 'Lowercase' },
                ]}
                onChange={(v) => l('textTransform', 'text-transform', v)}
            />
            <PropSlider
                label="Letter spacing" min={0} max={0.5} step={0.01} isDarkMode={isDarkMode}
                value={Math.max(style.textLetterSpacing ?? 0, 0)}
                display={`${Math.max(style.textLetterSpacing ?? 0, 0)}em`}
                onChange={(v) => l('textLetterSpacing', 'text-letter-spacing', v)}
            />
            <PropSlider
                label="Text size" min={8} max={32} step={1} isDarkMode={isDarkMode}
                value={style.textSize ?? 12}
                display={`${style.textSize ?? 12}px`}
                onChange={(v) => l('textSize', 'text-size', v)}
            />
            <PropColor
                label="Text color" isDarkMode={isDarkMode}
                value={style.textColor ?? '#ffffff'}
                onChange={(v) => p('textColor', 'text-color', v)}
            />
            <PropColor
                label="Halo color" isDarkMode={isDarkMode}
                value={style.textHaloColor ?? '#000000'}
                onChange={(v) => p('textHaloColor', 'text-halo-color', v)}
            />
            <PropSlider
                label="Halo width" min={0} max={4} step={0.5} isDarkMode={isDarkMode}
                value={style.textHaloWidth ?? 1}
                display={`${style.textHaloWidth ?? 1}px`}
                onChange={(v) => p('textHaloWidth', 'text-halo-width', v)}
            />
        </Section>
    );

    if (tab === 'label') return labelSection;
    if (tab === 'all') return <>{iconSection}{labelSection}</>;

    return iconSection;
}
