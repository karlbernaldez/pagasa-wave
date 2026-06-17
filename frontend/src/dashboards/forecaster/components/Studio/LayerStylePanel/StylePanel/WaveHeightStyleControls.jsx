import { Section, PropColor, PropSlider, PropSelect } from '../LayerStylePanel';

export function WaveHeightStyleControls({ layerIds, style, onChange, setPaint, setLayout, isDarkMode, tab = 'symbol' }) {
    const lineId = layerIds?.[0];
    const labelIds = layerIds?.slice(1).filter(Boolean) ?? [];

    const DASH_PATTERNS = {
        solid: [1],
        dashed: [4, 2],
        dotted: [1, 2],
    };

    const lp = (key, prop, val) => {
        onChange({ ...style, [key]: val });
        if (lineId) setPaint([lineId], prop, val);
    };
    const tp = (key, prop, val) => {
        onChange({ ...style, [key]: val });
        if (labelIds.length) setPaint(labelIds, prop, val);
    };
    const tl = (key, prop, val) => {
        onChange({ ...style, [key]: val });
        if (labelIds.length) setLayout(labelIds, prop, val);
    };

    const lineSection = (
        <Section title="Line" isDarkMode={isDarkMode} compact>
            <PropColor
                label="Color" isDarkMode={isDarkMode}
                value={style.lineColor ?? '#ffffff'}
                onChange={(v) => lp('lineColor', 'line-color', v)}
            />
            <PropSlider
                label="Width" min={1} max={20} step={0.5} isDarkMode={isDarkMode}
                value={style.lineWidth ?? 3}
                display={`${style.lineWidth ?? 3}px`}
                onChange={(v) => lp('lineWidth', 'line-width', v)}
            />
            <PropSlider
                label="Opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                value={style.lineOpacity ?? 0.6}
                display={`${Math.round((style.lineOpacity ?? 0.6) * 100)}%`}
                onChange={(v) => lp('lineOpacity', 'line-opacity', v)}
            />
            <PropSelect
                label="Dash" isDarkMode={isDarkMode}
                value={style.lineDash ?? 'solid'}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                ]}
                onChange={(v) => {
                    onChange({ ...style, lineDash: v });
                    if (lineId) setPaint([lineId], 'line-dasharray', DASH_PATTERNS[v]);
                }}
            />
        </Section>
    );

    const labelSection = (
        <Section title="Label" isDarkMode={isDarkMode} compact>
            <PropSlider
                label="Text size" min={8} max={32} step={1} isDarkMode={isDarkMode}
                value={style.textSize ?? 18}
                display={`${style.textSize ?? 18}px`}
                onChange={(v) => tl('textSize', 'text-size', v)}
            />
            <PropColor
                label="Text color" isDarkMode={isDarkMode}
                value={style.textColor ?? '#ffffff'}
                onChange={(v) => tp('textColor', 'text-color', v)}
            />
            <PropColor
                label="Halo color" isDarkMode={isDarkMode}
                value={style.textHaloColor ?? '#000000'}
                onChange={(v) => tp('textHaloColor', 'text-halo-color', v)}
            />
            <PropSlider
                label="Halo width" min={0} max={4} step={0.5} isDarkMode={isDarkMode}
                value={style.textHaloWidth ?? 2}
                display={`${style.textHaloWidth ?? 2}px`}
                onChange={(v) => tp('textHaloWidth', 'text-halo-width', v)}
            />
        </Section>
    );

    if (tab === 'label') return labelSection;
    if (tab === 'all') return <>{lineSection}{labelSection}</>;

    return lineSection;
}
