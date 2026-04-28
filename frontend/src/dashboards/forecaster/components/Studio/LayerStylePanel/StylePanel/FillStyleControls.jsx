import { Section, PropColor, PropSlider } from '../LayerStylePanel';

export function FillStyleControls({ fillId, lineId, style, onChange, setPaint, isDarkMode }) {
    const fp = (key, prop, val) => { onChange({ ...style, [key]: val }); if (fillId) setPaint([fillId], prop, val); };
    const lp = (key, prop, val) => { onChange({ ...style, [key]: val }); if (lineId) setPaint([lineId], prop, val); };

    return (
        <>
            <Section title="Fill" isDarkMode={isDarkMode}>
                <PropColor
                    label="Color" isDarkMode={isDarkMode}
                    value={style.fillColor ?? '#0080ff'}
                    onChange={(v) => fp('fillColor', 'fill-color', v)}
                />
                <PropSlider
                    label="Opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                    value={style.fillOpacity ?? 0.2}
                    display={`${Math.round((style.fillOpacity ?? 0.2) * 100)}%`}
                    onChange={(v) => fp('fillOpacity', 'fill-opacity', v)}
                />
            </Section>
            <Section title="Outline" isDarkMode={isDarkMode}>
                <PropColor
                    label="Color" isDarkMode={isDarkMode}
                    value={style.outlineColor ?? '#000000'}
                    onChange={(v) => lp('outlineColor', 'line-color', v)}
                />
                <PropSlider
                    label="Width" min={0} max={10} step={0.5} isDarkMode={isDarkMode}
                    value={style.outlineWidth ?? 2}
                    display={`${style.outlineWidth ?? 2}px`}
                    onChange={(v) => lp('outlineWidth', 'line-width', v)}
                />
            </Section>
        </>
    );
}