import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { fetchFeatures, fetchProjectFeatureCollection } from '@/api/featureServices';
import { getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';

// ─── Constants ────────────────────────────────────────────────────────────────

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';
const DEFAULT_CENTER = [120.0, 15.5];
const DEFAULT_BOUNDS = [[93, 5], [153.8595159535438, 25]];
const SOURCE_ID = 'chart-detail-features';

const DIFF_COLOR_EXPRESSION = [
  'match', ['get', 'diffStatus'],
  'added',     '#22c55e',
  'changed',   '#f97316',
  'removed',   '#ef4444',
  'unchanged', '#64748b',
  '#0284c7',
];

const LINE_LABEL_TEXT = [
  'coalesce',
  ['to-string', ['get', 'labelValue']],
  ['to-string', ['get', 'waveHeight']],
  ['to-string', ['get', 'heightValue']],
  ['to-string', ['get', 'value']],
  ['to-string', ['get', 'label']],
  ['to-string', ['get', 'name']],
  ['to-string', ['get', 'title']],
  '',
];

const LINE_LABEL_FILTER = [
  'all',
  ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
  ['any', ['has', 'labelValue'], ['has', 'waveHeight'], ['has', 'heightValue'], ['has', 'value'], ['has', 'label']],
];

const LAYER_TOGGLES = [
  { key: 'contours',    label: 'Contours',    icon: '≋' },
  { key: 'annotations', label: 'Annotations', icon: '◎' },
  { key: 'windBarbs',   label: 'Wind',        icon: '↗' },
  { key: 'bathymetry',  label: 'Depth',       icon: '▿' },
];

const CHART_MODES = [
  { key: 'Wave Ht.',   label: 'Wave Ht.' },
  { key: 'Wind',       label: 'Wind' },
  { key: 'Swell Dir.', label: 'Swell' },
];

const WAVE_COLOR_STOPS = [
  [0.0, '#042c53'],
  [0.5, '#0c447c'],
  [1.0, '#185fa5'],
  [1.5, '#1d9e75'],
  [2.0, '#639922'],
  [2.5, '#ba7517'],
  [3.0, '#993c1d'],
  [3.5, '#f85149'],
];

const TREND_POINTS = [0.8, 1.2, 1.8, 2.3, 2.8, 3.2, 3.5, 3.4, 3.1, 2.8, 2.5, 2.2, 1.9, 1.6, 1.3, 1.0, 0.8, 0.7];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasDiffStyles(fc) {
  return fc.features.some((f) => Boolean(f?.properties?.diffStatus));
}

function extendBoundsFromCoordinates(bounds, coordinates) {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length >= 2 && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    bounds.extend(coordinates);
    return;
  }
  coordinates.forEach((child) => extendBoundsFromCoordinates(bounds, child));
}

function getFeatureBounds(fc) {
  const bounds = new mapboxgl.LngLatBounds();
  fc.features.forEach((f) => extendBoundsFromCoordinates(bounds, f?.geometry?.coordinates));
  return bounds.isEmpty() ? null : bounds;
}

async function loadChartFeatures(projectId, scope) {
  if (!projectId) return null;
  return scope === 'admin'
    ? fetchProjectFeatureCollection(projectId)
    : fetchFeatures(projectId);
}

// ─── Map layer helpers ────────────────────────────────────────────────────────

function applyLayerPaint(map, { showDiffStyles, styleMode }) {
  const paint = getChartStyleModePaint(styleMode);
  const polygonColor = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.polygonFill;
  const lineColor    = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.lineColor;
  const pointColor   = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.pointColor;

  const set = (id, type, prop, val) => {
    if (!map.getLayer(id)) return;
    type === 'layout' ? map.setLayoutProperty(id, prop, val) : map.setPaintProperty(id, prop, val);
  };

  const diffOpacity = (val) =>
    showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', val * 0.4, val] : val;

  set('cd-polygons',         'paint', 'fill-color',        polygonColor);
  set('cd-polygons',         'paint', 'fill-opacity',      showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.2, 0.42] : paint.polygonOpacity);
  set('cd-polygons-outline', 'paint', 'line-color',        showDiffStyles ? lineColor : paint.polygonOutline);
  set('cd-polygons-outline', 'paint', 'line-width',        paint.polygonOutlineWidth);
  set('cd-polygons-outline', 'paint', 'line-opacity',      showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : 0.9);
  set('cd-lines-casing',     'paint', 'line-color',        paint.lineCasing);
  set('cd-lines-casing',     'paint', 'line-width',        paint.lineCasingWidth);
  set('cd-lines',            'paint', 'line-color',        lineColor);
  set('cd-lines',            'paint', 'line-width',        paint.lineWidth);
  set('cd-lines',            'paint', 'line-opacity',      showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : 1);
  set('cd-line-labels',      'layout','text-size',         paint.lineLabelSize);
  set('cd-line-labels',      'paint', 'text-color',        paint.labelColor);
  set('cd-line-labels',      'paint', 'text-halo-color',   paint.labelHaloColor);
  set('cd-line-labels',      'paint', 'text-halo-width',   paint.labelHaloWidth);
  set('cd-points-halo',      'paint', 'circle-color',      pointColor);
  set('cd-points-halo',      'paint', 'circle-radius',     paint.pointRadius + 3);
  set('cd-points-halo',      'paint', 'circle-opacity',    paint.showPoints ? 0.28 : 0);
  set('cd-points',           'paint', 'circle-color',      pointColor);
  set('cd-points',           'paint', 'circle-radius',     paint.pointRadius);
  set('cd-points',           'paint', 'circle-stroke-color', paint.pointStroke);
  set('cd-points',           'paint', 'circle-stroke-width', paint.pointStrokeWidth);
  set('cd-points',           'paint', 'circle-opacity',    paint.showPoints ? 1 : 0);
  set('cd-points-label',     'layout','text-size',         paint.pointLabelSize);
  set('cd-points-label',     'paint', 'text-color',        paint.labelColor);
  set('cd-points-label',     'paint', 'text-halo-color',   paint.labelHaloColor);
  set('cd-points-label',     'paint', 'text-halo-width',   paint.labelHaloWidth);
}

function addChartLayers(map, fc, { showLabels = true, showDiffStyles = false, styleMode } = {}) {
  const paint        = getChartStyleModePaint(styleMode);
  const polygonColor = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.polygonFill;
  const lineColor    = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.lineColor;
  const pointColor   = showDiffStyles ? DIFF_COLOR_EXPRESSION : paint.pointColor;

  if (map.getSource(SOURCE_ID)) {
    map.getSource(SOURCE_ID).setData(fc);
    applyLayerPaint(map, { showDiffStyles, styleMode });
    if (map.getLayer('cd-line-labels'))
      map.setLayoutProperty('cd-line-labels', 'visibility', showLabels ? 'visible' : 'none');
    if (map.getLayer('cd-points-label'))
      map.setLayoutProperty('cd-points-label', 'visibility',
        showLabels && paint.showPointLabels ? 'visible' : 'none');
    return;
  }

  map.addSource(SOURCE_ID, { type: 'geojson', data: fc });

  map.addLayer({
    id: 'cd-polygons', type: 'fill', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'fill-color':   polygonColor,
      'fill-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.2, 0.42]
        : paint.polygonOpacity,
    },
  });

  map.addLayer({
    id: 'cd-polygons-outline', type: 'line', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: {
      'line-color':   showDiffStyles ? lineColor : paint.polygonOutline,
      'line-width':   paint.polygonOutlineWidth,
      'line-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : 0.9,
    },
  });

  map.addLayer({
    id: 'cd-lines-casing', type: 'line', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: { 'line-color': paint.lineCasing, 'line-width': paint.lineCasingWidth, 'line-opacity': 0.95 },
  });

  map.addLayer({
    id: 'cd-lines', type: 'line', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
    paint: {
      'line-color':   lineColor,
      'line-width':   paint.lineWidth,
      'line-opacity': showDiffStyles
        ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1]
        : 1,
    },
  });

  if (showLabels) {
    map.addLayer({
      id: 'cd-line-labels', type: 'symbol', source: SOURCE_ID,
      filter: LINE_LABEL_FILTER,
      layout: {
        'symbol-placement':      'line-center',
        'text-field':            LINE_LABEL_TEXT,
        'text-size':             paint.lineLabelSize,
        'text-anchor':           'center',
        'text-allow-overlap':    true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color':       paint.labelColor,
        'text-halo-color':  paint.labelHaloColor,
        'text-halo-width':  paint.labelHaloWidth,
      },
    });
  }

  map.addLayer({
    id: 'cd-points-halo', type: 'circle', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color':        pointColor,
      'circle-radius':       paint.pointRadius + 3,
      'circle-opacity':      paint.showPoints ? 0.28 : 0,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  });

  map.addLayer({
    id: 'cd-points', type: 'circle', source: SOURCE_ID,
    filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
    paint: {
      'circle-color':        pointColor,
      'circle-radius':       paint.pointRadius,
      'circle-opacity':      paint.showPoints ? 1 : 0,
      'circle-stroke-color': paint.pointStroke,
      'circle-stroke-width': paint.pointStrokeWidth,
    },
  });

  if (showLabels) {
    map.addLayer({
      id: 'cd-points-label', type: 'symbol', source: SOURCE_ID,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      layout: {
        'text-field':            ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], 'Marker'],
        'text-size':             paint.pointLabelSize,
        'text-offset':           [0, 1.8],
        'text-anchor':           'top',
        'text-allow-overlap':    true,
        'text-ignore-placement': true,
        'visibility':            paint.showPointLabels ? 'visible' : 'none',
      },
      paint: {
        'text-color':       paint.labelColor,
        'text-halo-color':  paint.labelHaloColor,
        'text-halo-width':  paint.labelHaloWidth,
      },
    });
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaveHeightLegend() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    WAVE_COLOR_STOPS.forEach(([stop, color]) => grad.addColorStop(stop / 3.5, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-white/8 bg-[#080e18]/90 px-3 py-2.5 text-xs backdrop-blur-md shadow-xl">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500">
        Wave Height · metres
      </p>
      <canvas ref={canvasRef} width={160} height={6} className="block rounded-full" />
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-slate-600">
        {['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5+'].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function TrendSparkline() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    const padL = 24, padR = 8, padT = 6, padB = 18;
    const maxH = 4, minH = 0;
    const scaleX = (i) => padL + (i / (TREND_POINTS.length - 1)) * (W - padL - padR);
    const scaleY = (v) => padT + (1 - (v - minH) / (maxH - minH)) * (H - padT - padB);

    ctx.clearRect(0, 0, W, H);

    // Grid
    [0, 1, 2, 3, 4].forEach((v) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padL, scaleY(v));
      ctx.lineTo(W - padR, scaleY(v));
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(v, padL - 3, scaleY(v) + 3);
    });

    // Warning threshold
    ctx.strokeStyle = 'rgba(234,88,12,0.5)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, scaleY(2.5));
    ctx.lineTo(W - padR, scaleY(2.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(234,88,12,0.8)';
    ctx.font = '7px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('2.5m ⚠', W - padR, scaleY(2.5) - 3);

    // Area fill
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, 'rgba(0,212,255,0.25)');
    grad.addColorStop(1, 'rgba(0,212,255,0.01)');
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(TREND_POINTS[0]));
    TREND_POINTS.forEach((v, i) => ctx.lineTo(scaleX(i), scaleY(v)));
    ctx.lineTo(scaleX(TREND_POINTS.length - 1), H - padB);
    ctx.lineTo(scaleX(0), H - padB);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    TREND_POINTS.forEach((v, i) =>
      i === 0 ? ctx.moveTo(scaleX(0), scaleY(v)) : ctx.lineTo(scaleX(i), scaleY(v)),
    );
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = '#475569';
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    [0, 6, 12, 17].forEach((i) =>
      ctx.fillText(i === 0 ? 'Now' : `+${Math.round(i * 2.6)}h`, scaleX(i), H - 3),
    );
  }, []);

  return <canvas ref={canvasRef} width={232} height={74} className="block w-full" />;
}

function StatusPill({ status }) {
  const configs = {
    completed:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: '#34d399', label: 'Completed' },
    'in-progress':{ cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',          dot: '#00d4ff', label: 'In Progress' },
    pending:     { cls: 'bg-slate-700/40 text-slate-400 border-slate-600/30',        dot: '#64748b', label: 'Pending' },
  };
  const cfg = configs[status] ?? configs.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide ${cfg.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot, boxShadow: `0 0 4px ${cfg.dot}` }} />
      {cfg.label}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
      {children}
    </p>
  );
}

function MetricCard({ label, value, unit, sub, accent }) {
  return (
    <div className={`rounded-lg border p-2.5 ${accent ? 'border-[#00d4ff]/20 bg-[#00d4ff]/5' : 'border-white/5 bg-white/[0.03]'}`}>
      <p className="mb-0.5 text-[10px] text-slate-500">{label}</p>
      <p className={`font-mono text-lg font-semibold leading-none ${accent ? 'text-[#00d4ff]' : 'text-slate-100'}`}>
        {value}
        {unit && <span className="ml-0.5 font-sans text-[10px] font-normal text-slate-500">{unit}</span>}
      </p>
      <p className="mt-1 text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}

function AnnotationRow({ color, label, sub }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-white/[0.04] py-2.5 last:border-0">
      <span
        className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
      />
      <div>
        <p className="text-[11px] leading-snug text-slate-200">{label}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForecastChartPage({
  projectId,
  features,
  featureScope = 'user',
  chartStyleMode,
  showLabels = true,
  isDarkMode = true,
  onSubmit,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const chart = location.state?.chart;

  if (!chart) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080e18] text-slate-500 font-mono text-sm">
        No chart data found.
      </div>
    );
  }

  // ── Refs ────────────────────────────────────────────────────────────────────
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const fittedKeyRef    = useRef('');

  // ── State ───────────────────────────────────────────────────────────────────
  const [isMapReady,        setIsMapReady]        = useState(false);
  const [remoteFeatures,    setRemoteFeatures]    = useState(null);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [activeMode,        setActiveMode]        = useState(CHART_MODES[0].key);
  const [layers,            setLayers]            = useState(() =>
    Object.fromEntries(LAYER_TOGGLES.map((l) => [l.key, l.key === 'contours' || l.key === 'annotations'])),
  );
  const [notes,       setNotes]       = useState(
    chart.notes ?? 'NE monsoon intensifying per 00Z GFS run. ITCZ-related convection noted near 8°N. Recommend issuing small craft advisory for Luzon Strait and Polillo waters.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab,    setActiveTab]    = useState('notes');

  // ── Derived ─────────────────────────────────────────────────────────────────
  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);

  const providedFeatureCollection = useMemo(
    () => normalizeFeatureCollection(features),
    [features],
  );
  const hasProvidedFeatures = providedFeatureCollection.features.length > 0;

  const featureCollection = useMemo(
    () => hasProvidedFeatures ? providedFeatureCollection : normalizeFeatureCollection(remoteFeatures),
    [hasProvidedFeatures, providedFeatureCollection, remoteFeatures],
  );
  const hasFeatures  = featureCollection.features.length > 0;
  const shouldUseDiff = hasDiffStyles(featureCollection);

  const featureKey = useMemo(
    () => JSON.stringify(featureCollection.features.map((f) => ({
      geometry:   f.geometry,
      id:         f.id || f._id || f.properties?.stableId || '',
      diffStatus: f.properties?.diffStatus,
      waveHeight: f.properties?.waveHeight,
      labelValue: f.properties?.labelValue,
    }))),
    [featureCollection],
  );

  const packageDate = chart.packageDate ?? 'June 15, 2026';
  const validUntil  = chart.validUntil  ?? 'Jun 17, 2026 04:00 PHT';

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Fetch remote features
  useEffect(() => {
    if (hasProvidedFeatures || !projectId) return;
    let mounted = true;
    setIsLoadingFeatures(true);
    loadChartFeatures(projectId, featureScope)
      .then((data) => { if (mounted) setRemoteFeatures(data); })
      .catch((err)  => console.error('[ForecastChartPage] feature load error:', err))
      .finally(()   => { if (mounted) setIsLoadingFeatures(false); });
    return () => { mounted = false; };
  }, [featureScope, hasProvidedFeatures, projectId]);

  // Initialise map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container:          mapContainerRef.current,
      style:              STYLE_URL,
      projection:         'mercator',
      center:             DEFAULT_CENTER,
      zoom:               4.8,
      interactive:        true,
      attributionControl: false,
      fadeDuration:       0,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    mapRef.current = map;
    map.on('load', () => {
      setIsMapReady(true);
      map.resize();
      map.fitBounds(DEFAULT_BOUNDS, { padding: 24, maxZoom: 6, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current     = null;
      fittedKeyRef.current = '';
      setIsMapReady(false);
    };
  }, []);

  // Add / update map layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !hasFeatures) return;

    addChartLayers(map, featureCollection, {
      showLabels,
      showDiffStyles: shouldUseDiff,
      styleMode:      normalizedStyleMode,
    });

    if (fittedKeyRef.current === featureKey) return;
    const bounds = getFeatureBounds(featureCollection);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: featureCollection.features.length === 1 ? 8 : 10,
        duration: 400,
      });
      fittedKeyRef.current = featureKey;
    }
  }, [featureCollection, featureKey, hasFeatures, isMapReady, normalizedStyleMode, shouldUseDiff, showLabels]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const map  = mapRef.current;
      if (map && isMapReady && key === 'annotations') {
        const vis = next[key] ? 'visible' : 'none';
        ['cd-line-labels', 'cd-points-label', 'cd-points', 'cd-points-halo'].forEach((id) => {
          if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
        });
      }
      return next;
    });
  }, [isMapReady]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ chartId: chart.id, notes });
    } finally {
      setIsSubmitting(false);
    }
  }, [chart.id, isSubmitting, notes, onSubmit]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Inline styles for radar pulse + monospace font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

        .radar-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.04) 50%, transparent 100%);
          animation: radarSweep 4s linear infinite;
          pointer-events: none;
        }
        @keyframes radarSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .mapboxgl-ctrl-bottom-right { bottom: 52px !important; }
        .mapboxgl-ctrl-bottom-left  { bottom: 52px !important; }
      `}</style>

      <div
        className="flex h-screen w-full overflow-hidden bg-[#080e18] text-slate-200"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13 }}
      >
        {/* ── Map column ─────────────────────────────────────────────────── */}
        <div className="relative flex flex-1 flex-col overflow-hidden">

          {/* Map toolbar */}
          <div className="radar-pulse relative z-10 flex items-center gap-2 overflow-hidden border-b border-white/[0.07] bg-[#0b1929] px-4 py-2.5">
            {/* Title */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#00d4ff]/10 text-[#00d4ff] text-[13px]">≋</span>
              <span className="truncate font-mono text-[12px] font-medium text-slate-100">
                Wave Ht. — Philippine Sea
                <span className="ml-2 font-sans text-[11px] font-normal text-slate-500">
                  {chart.title ?? '48-hr'} · {packageDate}
                </span>
              </span>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-lg border border-white/[0.08] bg-[#080e18]/60 p-0.5">
              {CHART_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveMode(key)}
                  className={`rounded-md px-3 py-1 font-mono text-[10px] font-medium transition-all ${
                    activeMode === key
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff] shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Layer toggles */}
            <div className="flex items-center gap-1">
              {LAYER_TOGGLES.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  title={label}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] transition-all ${
                    layers[key]
                      ? 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'border-white/[0.06] text-slate-600 hover:border-white/10 hover:text-slate-400'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mapbox canvas */}
          <div className="relative flex-1 bg-[#040a12]">
            <div ref={mapContainerRef} className="h-full w-full" aria-label="Wave forecast map" />

            {isLoadingFeatures && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#080e18]/70">
                <span className="font-mono text-[11px] text-slate-500 tracking-wider">
                  Loading annotations…
                </span>
              </div>
            )}

            <WaveHeightLegend />

            {/* Valid-until badge */}
            <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-white/[0.07] bg-[#080e18]/90 px-3 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">Valid until </span>
              <span className="font-mono text-[10px] text-slate-300">{validUntil}</span>
            </div>
          </div>
        </div>

        {/* ── Side panel ──────────────────────────────────────────────────── */}
        <aside className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-l border-white/[0.07] bg-[#0b1929]">

          {/* Chart header */}
          <section className="border-b border-white/[0.07] px-4 py-4">
            <SectionLabel>Chart Details</SectionLabel>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#00d4ff]/10">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M2 14 Q6 8 10 11 Q14 14 18 8" stroke="#00d4ff" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-slate-100">
                  {chart.title ?? '48-Hour Forecast'}
                </p>
                <p className="text-[10px] text-slate-500">Philippine Sea · {packageDate}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  label: 'Status',
                  value: <StatusPill status={chart.status ?? 'in-progress'} />,
                },
                {
                  label: 'Last opened',
                  value: chart.lastEditor
                    ? `${chart.lastEditor}, ${chart.lastOpenedAt}`
                    : 'Juan C. · 09:41 AM',
                },
                { label: 'Deadline',   value: '03:00 PM PHT', highlight: 'warn' },
                { label: 'Model run',  value: 'GFS 00Z · WW3 v7.1', highlight: 'info' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="flex-shrink-0 text-[10px] text-slate-600">{label}</span>
                  {typeof value === 'string' ? (
                    <span className={`truncate font-mono text-[11px] ${
                      highlight === 'warn' ? 'text-orange-400'
                      : highlight === 'info' ? 'text-[#00d4ff]'
                      : 'text-slate-300'
                    }`}>
                      {value}
                    </span>
                  ) : value}
                </div>
              ))}
            </div>
          </section>

          {/* Wave conditions */}
          <section className="border-b border-white/[0.07] px-4 py-4">
            <SectionLabel>Wave Conditions</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Sig. Wave Ht." value="3.2" unit="m"   sub="NE sector peak" accent />
              <MetricCard label="Mean Period"   value="9.4" unit="s"   sub="Dominant swell" />
              <MetricCard label="Swell Dir."    value="NNE" unit=""    sub="040° at 10 kts" />
              <MetricCard label="Wind Speed"    value="22"  unit="kts" sub="Gusts to 30" />
            </div>
            <div className="mt-3">
              <p className="mb-2 text-[10px] text-slate-600">Wave height trend — next 48 h</p>
              <TrendSparkline />
            </div>
          </section>

          {/* Map annotations */}
          <section className="border-b border-white/[0.07] px-4 py-4">
            <SectionLabel>Map Annotations</SectionLabel>
            <AnnotationRow
              color="#f85149"
              label="High wave warning — NE quadrant"
              sub="Sig. wave ht. exceeding 3.5 m · Luzon Strait"
            />
            <AnnotationRow
              color="#e8963a"
              label="Elevated swell — Central Phil. Sea"
              sub="2.0–2.8 m swell propagating SW at 9 s period"
            />
            <AnnotationRow
              color="#3fb950"
              label="Calm conditions — Visayan Sea"
              sub="Wave ht. below 0.8 m · favourable for navigation"
            />
            <AnnotationRow
              color="#00d4ff"
              label="Swell refraction — Sibuyan Sea"
              sub="Converging wave trains, period 7–8 s"
            />
          </section>

          {/* Notes / Validation / History tabs */}
          <div className="flex border-b border-white/[0.07]">
            {['notes', 'validation', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-[#00d4ff] text-[#00d4ff]'
                    : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <section className="flex flex-1 flex-col gap-3 px-4 py-4">
            {activeTab === 'notes' && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Add forecaster notes…"
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#080e18] px-3 py-2.5 text-[11px] leading-relaxed text-slate-300 placeholder-slate-700 outline-none transition-colors focus:border-[#00d4ff]/40 focus:ring-1 focus:ring-[#00d4ff]/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#00d4ff]/15 py-2.5 font-mono text-[11px] font-medium text-[#00d4ff] ring-1 ring-[#00d4ff]/30 transition-all hover:bg-[#00d4ff]/25 disabled:opacity-40"
                  >
                    {isSubmitting ? 'Submitting…' : '↑ Submit for Review'}
                  </button>
                  <button
                    className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-slate-500 transition-colors hover:text-slate-300"
                    title="Export"
                  >
                    ↓
                  </button>
                </div>
              </>
            )}

            {activeTab === 'validation' && (
              <div className="space-y-1.5">
                {[
                  { check: 'Grid coverage complete',    pass: true },
                  { check: 'Wave height range valid',   pass: true },
                  { check: 'Period values in bounds',   pass: true },
                  { check: 'All annotations labelled',  pass: false },
                  { check: 'Small craft advisory issued', pass: false },
                ].map(({ check, pass }) => (
                  <div
                    key={check}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      pass
                        ? 'border-emerald-500/15 bg-emerald-500/5'
                        : 'border-amber-500/15 bg-amber-500/5'
                    }`}
                  >
                    <span className="text-[11px] text-slate-300">{check}</span>
                    <span className={`font-mono text-[10px] font-medium ${pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {pass ? '✓ Pass' : '⚠ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {[
                  { time: '09:41 AM', actor: 'Juan C.',   action: 'Opened chart' },
                  { time: '08:15 AM', actor: 'System',    action: 'Package created' },
                  { time: '11:20 AM', actor: 'Juan C.',   action: 'Completed 36-Hour Forecast' },
                  { time: '11:45 AM', actor: 'Maria S.',  action: 'Completed 24-Hour Forecast' },
                ].map(({ time, actor, action }) => (
                  <div key={`${time}-${action}`} className="flex items-start gap-2.5">
                    <span className="mt-px flex-shrink-0 font-mono text-[10px] text-slate-600 tabular-nums">{time}</span>
                    <div>
                      <span className="text-[11px] font-medium text-[#00d4ff]">{actor} </span>
                      <span className="text-[11px] text-slate-400">{action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}