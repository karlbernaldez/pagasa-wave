import { Section, PropColor, PropSlider, PropSelect } from '../LayerStylePanel';
import { queuePersistAnnotationStyle } from '@dashboards/forecaster/utils/layers/annotationStylePersistence';
import { applyRuntimeMarkerStyle } from '@dashboards/forecaster/map/layers/markerLayer';

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

const TEXT_NOTE_STYLE_DEFAULTS = {
    ...SYMBOL_STYLE_DEFAULTS,
    textSize: 16,
    textColor: '#0f172a',
    textHaloColor: '#ffffff',
    textHaloWidth: 1.5,
};

function getDefaults(layerInfo) {
    const markerType = layerInfo?.properties?.markerType || layerInfo?.properties?.type || layerInfo?.type;
    return markerType === 'text_note' ? TEXT_NOTE_STYLE_DEFAULTS : SYMBOL_STYLE_DEFAULTS;
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
    const defaults = getDefaults(layerInfo);

    const update = (patch) => {
        const beforeStyle = { ...style };
        Object.keys(patch).forEach((key) => {
            if (beforeStyle[key] === undefined && key in defaults) beforeStyle[key] = defaults[key];
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

    const apply = (kind, key, property, value) => {
        update({ [key]: value });

        const applied = applyRuntimeMarkerStyle(
            mapRef?.current,
            layerInfo,
            { [key]: value }
        );
        if (applied) return;

        if (kind === 'layout') setLayout(layerIds, property, value);
        else setPaint(layerIds, property, value);
    };

    const l = (key, property, value) => apply('layout', key, property, value);
    const p = (key, property, value) => apply('paint', key, property, value);

    const iconSection = (
        <Section title="Icon" isDarkMode={isDarkMode} compact>
            <PropSlider
                label="Size" min={0.01} max={0.5} step={0.005} isDarkMode={isDarkMode}
                value={style.iconSize ?? defaults.iconSize}
                display={`${Math.round((style.iconSize ?? defaults.iconSize) * 100)}%`}
                onChange={(value) => l('iconSize', 'icon-size', value)}
            />
            <PropSlider
                label="Opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                value={style.iconOpacity ?? defaults.iconOpacity}
                display={`${Math.round((style.iconOpacity ?? defaults.iconOpacity) * 100)}%`}
                onChange={(value) => p('iconOpacity', 'icon-opacity', value)}
            />
            <PropSlider
                label="Rotation" min={0} max={360} step={1} isDarkMode={isDarkMode}
                value={style.iconRotate ?? defaults.iconRotate}
                display={`${style.iconRotate ?? defaults.iconRotate} deg`}
                onChange={(value) => l('iconRotate', 'icon-rotate', value)}
            />
        </Section>
    );

    const labelSection = (
        <Section title="Label" isDarkMode={isDarkMode} compact>
            <PropSelect
                label="Transform" isDarkMode={isDarkMode}
                value={style.textTransform ?? defaults.textTransform}
                options={[
                    { value: 'none', label: 'None' },
                    { value: 'uppercase', label: 'Uppercase' },
                    { value: 'lowercase', label: 'Lowercase' },
                ]}
                onChange={(value) => l('textTransform', 'text-transform', value)}
            />
            <PropSlider
                label="Letter spacing" min={0} max={0.5} step={0.01} isDarkMode={isDarkMode}
                value={Math.max(style.textLetterSpacing ?? defaults.textLetterSpacing, 0)}
                display={`${Math.max(style.textLetterSpacing ?? defaults.textLetterSpacing, 0)}em`}
                onChange={(value) => l('textLetterSpacing', 'text-letter-spacing', value)}
            />
            <PropSlider
                label="Text size" min={8} max={32} step={1} isDarkMode={isDarkMode}
                value={style.textSize ?? defaults.textSize}
                display={`${style.textSize ?? defaults.textSize}px`}
                onChange={(value) => l('textSize', 'text-size', value)}
            />
            <PropColor
                label="Text color" isDarkMode={isDarkMode}
                value={style.textColor ?? defaults.textColor}
                onChange={(value) => p('textColor', 'text-color', value)}
            />
            <PropColor
                label="Halo color" isDarkMode={isDarkMode}
                value={style.textHaloColor ?? defaults.textHaloColor}
                onChange={(value) => p('textHaloColor', 'text-halo-color', value)}
            />
            <PropSlider
                label="Halo width" min={0} max={4} step={0.5} isDarkMode={isDarkMode}
                value={style.textHaloWidth ?? defaults.textHaloWidth}
                display={`${style.textHaloWidth ?? defaults.textHaloWidth}px`}
                onChange={(value) => p('textHaloWidth', 'text-halo-width', value)}
            />
        </Section>
    );

    if (tab === 'label') return labelSection;
    if (tab === 'all') return <>{iconSection}{labelSection}</>;

    return iconSection;
}
