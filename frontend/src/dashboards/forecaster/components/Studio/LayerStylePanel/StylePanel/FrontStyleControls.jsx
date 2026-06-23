import { Section, PropSlider, PropToggle } from '../LayerStylePanel';

const COLORS = { cold: '#1d4ed8', warm: '#ef4444', occluded: '#7c3aed' };
const FRONT_SYMBOL_RADIUS = 6;
const FRONT_TRIANGLE_SIZE = 7;
const STATIONARY_SEGMENT_LENGTH = 26;
const FRONT_TYPES = {
    cold: { spacing: 40, symbols: [{ kind: 'triangle', color: COLORS.cold, side: -1 }] },
    warm: { spacing: 40, symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }] },
    stationary: { spacing: 38, symbols: [{ kind: 'semicircle', color: COLORS.warm, side: -1 }, { kind: 'triangle', color: COLORS.cold, side: 1 }] },
    occluded: { spacing: 38, symbols: [{ kind: 'semicircle', color: COLORS.occluded, side: -1 }, { kind: 'triangle', color: COLORS.occluded, side: -1 }] },
};
const STATIONARY_SEGMENT_SYMBOLS = FRONT_TYPES.stationary.symbols;

const getFrontSourceId = (layerInfo) => layerInfo?.sourceID || layerInfo?.sourceId || layerInfo?.source || layerInfo?.id;
const getGeoJsonSourceData = (source) => source?._data || source?.serialize?.()?.data || null;
const normalizeFrontType = (frontType) => (FRONT_TYPES[frontType] ? frontType : 'cold');

function inferFrontType(layerInfo, sourceData) {
    const fromProps = sourceData?.features?.[0]?.properties?.frontType || layerInfo?.frontType || layerInfo?.properties?.frontType;
    if (FRONT_TYPES[fromProps]) return fromProps;

    const label = `${layerInfo?.type || ''} ${layerInfo?.name || ''}`.toLowerCase();
    if (label.includes('warm')) return 'warm';
    if (label.includes('stationary')) return 'stationary';
    if (label.includes('occluded')) return 'occluded';
    return 'cold';
}

function toLngLat(map, x, y) {
    const point = map.unproject([x, y]);
    return [point.lng, point.lat];
}

function triangleCoordinates(map, x, y, ux, uy, nx, ny, side) {
    const size = FRONT_TRIANGLE_SIZE;
    return [[
        toLngLat(map, x - ux * size, y - uy * size),
        toLngLat(map, x + ux * size, y + uy * size),
        toLngLat(map, x + nx * side * size * 1.35, y + ny * side * size * 1.35),
        toLngLat(map, x - ux * size, y - uy * size),
    ]];
}

function semicircleCoordinates(map, x, y, ux, uy, nx, ny, side) {
    const points = [];
    for (let i = 0; i <= 12; i += 1) {
        const theta = Math.PI - (Math.PI * i) / 12;
        points.push(toLngLat(
            map,
            x + ux * FRONT_SYMBOL_RADIUS * Math.cos(theta) + nx * side * FRONT_SYMBOL_RADIUS * Math.sin(theta),
            y + uy * FRONT_SYMBOL_RADIUS * Math.cos(theta) + ny * side * FRONT_SYMBOL_RADIUS * Math.sin(theta)
        ));
    }
    points.push(toLngLat(map, x - ux * FRONT_SYMBOL_RADIUS, y - uy * FRONT_SYMBOL_RADIUS));
    return [points];
}

function buildShapeFeature(map, symbol, sideMultiplier, x, y, ux, uy, nx, ny) {
    const side = symbol.side * sideMultiplier;
    const coordinates = symbol.kind === 'triangle'
        ? triangleCoordinates(map, x, y, ux, uy, nx, ny, side)
        : semicircleCoordinates(map, x, y, ux, uy, nx, ny, side);
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates }, properties: { color: symbol.color } };
}

function buildScreenPath(map, coordinates) {
    const points = (coordinates || []).map((coord) => map.project(coord));
    const segments = [];
    let total = 0;

    for (let i = 0; i < points.length - 1; i += 1) {
        const start = points[i];
        const end = points[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        segments.push({ start, dx, dy, len, startDistance: total });
        total += len;
    }

    return { segments, total };
}

function pointAtDistance(path, distance) {
    if (!path.segments.length) return null;
    const clamped = Math.min(Math.max(distance, 0), path.total);
    const segment = path.segments.find((item) => clamped <= item.startDistance + item.len) || path.segments[path.segments.length - 1];
    const local = Math.min(Math.max(clamped - segment.startDistance, 0), segment.len);
    const t = segment.len ? local / segment.len : 0;
    const ux = segment.dx / segment.len;
    const uy = segment.dy / segment.len;

    return {
        x: segment.start.x + segment.dx * t,
        y: segment.start.y + segment.dy * t,
        ux,
        uy,
        nx: -uy,
        ny: ux,
    };
}

function buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier) {
    const style = FRONT_TYPES[normalizeFrontType(frontType)];
    const path = buildScreenPath(map, coordinates);
    const features = [];
    if (!path.total) return features;

    let symbolIndex = 0;
    for (let distance = style.spacing; distance < path.total; distance += style.spacing) {
        const point = pointAtDistance(path, distance);
        const symbol = style.symbols[symbolIndex % style.symbols.length];
        if (point) features.push(buildShapeFeature(map, symbol, sideMultiplier, point.x, point.y, point.ux, point.uy, point.nx, point.ny));
        symbolIndex += 1;
    }

    return features;
}

function buildStationarySymbolFeatures(map, coordinates, sideMultiplier) {
    const path = buildScreenPath(map, coordinates);
    const features = [];
    if (!path.total) return features;

    for (let startDistance = 0, index = 0; startDistance < path.total; startDistance += STATIONARY_SEGMENT_LENGTH, index += 1) {
        const endDistance = Math.min(path.total, startDistance + STATIONARY_SEGMENT_LENGTH);
        if (endDistance - startDistance < STATIONARY_SEGMENT_LENGTH * 0.5) continue;
        const point = pointAtDistance(path, (startDistance + endDistance) / 2);
        const symbol = STATIONARY_SEGMENT_SYMBOLS[index % STATIONARY_SEGMENT_SYMBOLS.length];
        if (point) features.push(buildShapeFeature(map, symbol, sideMultiplier, point.x, point.y, point.ux, point.uy, point.nx, point.ny));
    }

    return features;
}

function setPaintOnExisting(map, layerIds, prop, value) {
    layerIds.forEach((layerId) => {
        if (!map?.getLayer(layerId)) return;
        try { map.setPaintProperty(layerId, prop, value); } catch { }
    });
}

function updateFrontSourceSide(sourceData, side) {
    const updateFeature = (feature) => ({
        ...feature,
        properties: {
            ...(feature.properties || {}),
            frontSymbolSide: side,
        },
    });

    if (sourceData?.type === 'FeatureCollection') {
        return { ...sourceData, features: (sourceData.features || []).map(updateFeature) };
    }

    if (sourceData?.type === 'Feature') return updateFeature(sourceData);
    return sourceData;
}

export function FrontStyleControls({ layerIds, layerInfo, style, onChange, setLayers, mapRef, isDarkMode, tab = 'symbol' }) {
    const map = mapRef?.current;
    const sourceId = getFrontSourceId(layerInfo);
    const lineLayerId = layerIds.find((id) => map?.getLayer(id)?.type === 'line') || `${sourceId}_dash`;
    const symbolLayerId = layerIds.find((id) => map?.getLayer(id)?.type === 'fill') || `${sourceId}_frontSymbols`;
    const isOppositeSide = (style.frontSymbolSide ?? layerInfo?.frontSymbolSide ?? 'normal') === 'opposite';

    const updateStyle = (patch) => onChange({ ...style, ...patch });

    const setLineWidth = (value) => {
        updateStyle({ lineWidth: value });
        setPaintOnExisting(map, [lineLayerId], 'line-width', value);
    };

    const setLineOpacity = (value) => {
        updateStyle({ lineOpacity: value });
        setPaintOnExisting(map, [lineLayerId], 'line-opacity', value);
    };

    const setSymbolOpacity = (value) => {
        updateStyle({ symbolOpacity: value });
        setPaintOnExisting(map, [symbolLayerId], 'fill-opacity', value);
    };

    const setSymbolSide = (opposite) => {
        const nextSide = opposite ? 'opposite' : 'normal';
        const sideMultiplier = opposite ? -1 : 1;
        const mainSource = map?.getSource(sourceId);
        const symbolSource = map?.getSource(`${sourceId}_frontSymbolSource`);
        const sourceData = getGeoJsonSourceData(mainSource);
        const coordinates = sourceData?.features?.[0]?.geometry?.coordinates || sourceData?.geometry?.coordinates || [];
        const frontType = inferFrontType(layerInfo, sourceData);

        updateStyle({ frontSymbolSide: nextSide });
        setLayers?.((prev) => prev.map((layer) => {
            const matches = layer.id === layerInfo?.id || layer.sourceID === sourceId || layer.sourceId === sourceId || layer.source === sourceId;
            return matches ? { ...layer, frontSymbolSide: nextSide } : layer;
        }));

        if (mainSource?.setData && sourceData) {
            mainSource.setData(updateFrontSourceSide(sourceData, nextSide));
        }

        if (symbolSource?.setData && coordinates.length) {
            symbolSource.setData({
                type: 'FeatureCollection',
                features: frontType === 'stationary'
                    ? buildStationarySymbolFeatures(map, coordinates, sideMultiplier)
                    : buildFrontSymbolFeatures(map, coordinates, frontType, sideMultiplier),
            });
        }
    };

    if (tab === 'label') {
        return (
            <Section title="Front glyph side" isDarkMode={isDarkMode}>
                <PropToggle
                    label="Move glyphs to other side"
                    value={isOppositeSide}
                    onChange={() => setSymbolSide(!isOppositeSide)}
                    isDarkMode={isDarkMode}
                />
            </Section>
        );
    }

    return (
        <>
            <Section title="Front line" isDarkMode={isDarkMode} compact>
                <PropSlider
                    label="Line width" min={1} max={10} step={0.25} isDarkMode={isDarkMode}
                    value={style.lineWidth ?? 2.75}
                    display={`${style.lineWidth ?? 2.75}px`}
                    onChange={setLineWidth}
                />
                <PropSlider
                    label="Line opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                    value={style.lineOpacity ?? 1}
                    display={`${Math.round((style.lineOpacity ?? 1) * 100)}%`}
                    onChange={setLineOpacity}
                />
            </Section>
            <Section title="Front glyphs" isDarkMode={isDarkMode} compact>
                <PropSlider
                    label="Glyph opacity" min={0} max={1} step={0.01} isDarkMode={isDarkMode}
                    value={style.symbolOpacity ?? 1}
                    display={`${Math.round((style.symbolOpacity ?? 1) * 100)}%`}
                    onChange={setSymbolOpacity}
                />
                <PropToggle
                    label="Move glyphs to other side"
                    value={isOppositeSide}
                    onChange={() => setSymbolSide(!isOppositeSide)}
                    isDarkMode={isDarkMode}
                />
            </Section>
        </>
    );
}
