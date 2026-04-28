export function LineStyleControls({ layerIds, style, onChange, setPaint }) {
    const handle = (property, value, mapboxProp, isPaint = true) => {
        onChange({ ...style, [property]: value });
        if (isPaint) setPaint(layerIds, mapboxProp, value);
    };

    const DASH_PATTERNS = {
        solid:  [1],
        dashed: [4, 2],
        dotted: [1, 2],
    };

    return (
        <div className="style-section">
            <p className="section-title">Stroke</p>

            <div className="control-row">
                <label>Color</label>
                <input
                    type="color"
                    value={style.lineColor ?? '#ffffff'}
                    onChange={(e) => handle('lineColor', e.target.value, 'line-color')}
                />
            </div>

            <div className="control-row">
                <label>Width</label>
                <input
                    type="range" min={1} max={20} step={1}
                    value={style.lineWidth ?? 3}
                    onChange={(e) => handle('lineWidth', +e.target.value, 'line-width')}
                />
                <span className="val">{style.lineWidth ?? 3}px</span>
            </div>

            <div className="control-row">
                <label>Opacity</label>
                <input
                    type="range" min={0} max={1} step={0.01}
                    value={style.lineOpacity ?? 1}
                    onChange={(e) => handle('lineOpacity', +e.target.value, 'line-opacity')}
                />
                <span className="val">{Math.round((style.lineOpacity ?? 1) * 100)}%</span>
            </div>

            <div className="control-row">
                <label>Dash</label>
                <select
                    value={style.lineDash ?? 'solid'}
                    onChange={(e) => {
                        onChange({ ...style, lineDash: e.target.value });
                        setPaint(layerIds, 'line-dasharray', DASH_PATTERNS[e.target.value]);
                    }}
                >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>
            </div>
        </div>
    );
}