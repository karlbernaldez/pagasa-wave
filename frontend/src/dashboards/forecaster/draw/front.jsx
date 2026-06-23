import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, CloudSun, GripHorizontal, RotateCcw, Snowflake, Waves } from 'lucide-react';
import { createFeature } from '@/api/featureServices';
import { useProjectId } from '@dashboards/forecaster/hooks/useStudio';

const FRONT_TYPES = {
  cold: { label: 'Cold', fullLabel: 'Cold Front', color: '#1d4ed8', dash: [8, 5], icon: Snowflake },
  warm: { label: 'Warm', fullLabel: 'Warm Front', color: '#ef4444', dash: [14, 5], icon: CloudSun },
  stationary: { label: 'Stationary', fullLabel: 'Stationary Front', color: '#1d4ed8', secondaryColor: '#ef4444', dash: [7, 6], icon: Waves },
  occluded: { label: 'Occluded', fullLabel: 'Occluded Front', color: '#7c3aed', dash: [12, 4, 3, 4], icon: CheckCircle2 },
};

const PANEL_WIDTH = 430;
const PANEL_HEIGHT = 146;
const STORAGE_KEY = 'wavelab-surface-front-panel-position-v1';
const cn = (...classes) => classes.filter(Boolean).join(' ');
const getViewportWidth = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);
const getViewportHeight = () => (typeof window === 'undefined' ? 900 : window.innerHeight);
const getDefaultPosition = () => ({ x: 300, y: 100 });
const getSafePosition = (position) => ({ x: Math.min(Math.max(position.x, 16), Math.max(16, getViewportWidth() - PANEL_WIDTH - 16)), y: Math.min(Math.max(position.y, 72), Math.max(72, getViewportHeight() - PANEL_HEIGHT - 16)) });

const getMapContainerRect = (mapRef) => mapRef?.current?.getContainer?.()?.getBoundingClientRect?.() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
const getPointerPosition = (e) => e.target.getStage().getPointerPosition();
const buildFrontName = (frontType) => FRONT_TYPES[frontType]?.fullLabel || 'Surface Front';

function renderFrontLayers(map, sourceId, geojson, frontType) {
  const style = FRONT_TYPES[frontType] || FRONT_TYPES.stationary;
  const primaryLayerId = `${sourceId}_bg`;
  const secondaryLayerId = `${sourceId}_secondary`;
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;

  if (map.getLayer(primaryLayerId)) map.removeLayer(primaryLayerId);
  if (map.getLayer(secondaryLayerId)) map.removeLayer(secondaryLayerId);
  if (map.getSource(sourceId)) map.getSource(sourceId).setData(geojson);
  else map.addSource(sourceId, { type: 'geojson', data: geojson });

  map.addLayer({
    id: primaryLayerId,
    type: 'line',
    source: sourceId,
    slot: 'top',
    layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' },
    paint: { 'line-color': style.color, 'line-width': 6, 'line-opacity': 0.92, 'line-dasharray': style.dash },
  }, beforeLayer);

  if (style.secondaryColor) {
    map.addLayer({
      id: secondaryLayerId,
      type: 'line',
      source: sourceId,
      slot: 'top',
      layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' },
      paint: { 'line-color': style.secondaryColor, 'line-width': 6, 'line-opacity': 0.92, 'line-dasharray': [0, 7, 7] },
    }, beforeLayer);
  }
}

const SurfaceFrontPanel = ({ frontType, setFrontType, isDarkMode }) => {
  const dragRef = useRef(null);
  const [position, setPosition] = useState(() => getSafePosition(getDefaultPosition()));
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      const safe = getSafePosition(Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y) ? parsed : getDefaultPosition());
      positionRef.current = safe;
      setPosition(safe);
    } catch {
      const safe = getSafePosition(getDefaultPosition());
      positionRef.current = safe;
      setPosition(safe);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const safe = getSafePosition(positionRef.current);
      positionRef.current = safe;
      setPosition(safe);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const persistPosition = useCallback((next) => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: positionRef.current.x, originY: positionRef.current.y };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleDragMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = getSafePosition({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY });
    positionRef.current = next;
    setPosition(next);
  }, []);

  const handleDragEnd = useCallback((event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setIsDragging(false);
    persistPosition(positionRef.current);
  }, [persistPosition]);

  const resetPosition = useCallback((event) => {
    event.stopPropagation();
    const safe = getSafePosition(getDefaultPosition());
    positionRef.current = safe;
    setPosition(safe);
    persistPosition(safe);
  }, [persistPosition]);

  return (
    <div className={cn('studio-liquid-panel fixed z-[110] rounded-2xl border p-3 shadow-2xl', isDragging && 'select-none shadow-[0_26px_70px_rgba(34,211,238,0.22)]', isDarkMode ? 'studio-liquid-dark border-white/[0.18] text-white' : 'studio-liquid-light border-white/80 text-slate-950')} style={{ left: position.x, top: position.y, width: `min(${PANEL_WIDTH}px, calc(100vw - 2rem))` }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 text-left active:cursor-grabbing" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} title="Drag surface fronts panel">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', isDarkMode ? 'bg-cyan-400/12 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}><GripHorizontal size={16} /></span>
          <div><div className="text-[11px] font-black uppercase tracking-wide">Surface Fronts</div><div className={cn('text-[10px] font-bold', isDarkMode ? 'text-white/45' : 'text-slate-500')}>{FRONT_TYPES[frontType]?.fullLabel}</div></div>
        </button>
        <button type="button" onClick={resetPosition} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', isDarkMode ? 'border-white/10 bg-white/[0.055] text-white/70' : 'border-white/80 bg-white/60 text-slate-600')} title="Reset panel position"><RotateCcw size={14} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(FRONT_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const active = frontType === key;
          return <button key={key} type="button" onClick={() => setFrontType(key)} className={cn('flex h-10 items-center justify-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all', active ? isDarkMode ? 'border-cyan-300/35 bg-cyan-400/18 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-700' : isDarkMode ? 'border-white/8 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white' : 'border-white/70 bg-white/45 text-slate-500 hover:bg-white hover:text-slate-800')}><Icon size={14} /><span>{config.label}</span></button>;
        })}
      </div>
    </div>
  );
};

const FlagCanvas = ({ mapRef, isDarkMode }) => {
  const [projectId] = useProjectId();
  const [lines, setLines] = useState([]);
  const [frontType, setFrontType] = useState('cold');
  const isFlagDrawing = useRef(false);
  const mapBoundsRef = useRef(null);

  useEffect(() => {
    const preventScroll = (e) => { if (isFlagDrawing.current) e.preventDefault(); };
    document.body.addEventListener('touchmove', preventScroll, { passive: false });
    return () => document.body.removeEventListener('touchmove', preventScroll);
  }, []);

  const getAdjustedPoint = useCallback((e) => {
    const pos = getPointerPosition(e);
    const rect = mapBoundsRef.current || getMapContainerRect(mapRef);
    return { x: pos.x - rect.left, y: pos.y - rect.top };
  }, [mapRef]);

  const handleDown = useCallback((e) => {
    mapBoundsRef.current = getMapContainerRect(mapRef);
    isFlagDrawing.current = true;
    const pos = getAdjustedPoint(e);
    setLines([{ points: [pos.x, pos.y], color: FRONT_TYPES[frontType].color, frontType }]);
  }, [frontType, getAdjustedPoint, mapRef]);

  const handleMove = useCallback((e) => {
    if (!isFlagDrawing.current) return;
    const pos = getAdjustedPoint(e);
    setLines((prev) => {
      if (!prev.length) return prev;
      const lastLine = prev[prev.length - 1];
      return [...prev.slice(0, -1), { ...lastLine, points: [...lastLine.points, pos.x, pos.y] }];
    });
  }, [getAdjustedPoint]);

  const handleUp = useCallback(async () => {
    const map = mapRef.current;
    const line = lines[lines.length - 1];
    isFlagDrawing.current = false;
    if (!map || !line?.points || line.points.length < 4) { setLines([]); return; }

    const coords = [];
    for (let i = 0; i < line.points.length; i += 2) {
      const lngLat = map.unproject([line.points[i], line.points[i + 1]]);
      coords.push([lngLat.lng, lngLat.lat]);
    }

    const sourceId = `SF_${uuidv4()}`;
    const feature = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { isFront: true, frontType, project: projectId } };
    const geojson = { type: 'FeatureCollection', features: [feature] };
    renderFrontLayers(map, sourceId, geojson, frontType);

    const name = buildFrontName(frontType);
    createFeature({ geometry: feature.geometry, properties: feature.properties, name, sourceId }).catch((err) => console.error('Error saving surface front:', err));
    setLines([]);
  }, [frontType, lines, mapRef, projectId]);

  const currentStyle = FRONT_TYPES[frontType];

  return (
    <>
      <SurfaceFrontPanel frontType={frontType} setFrontType={setFrontType} isDarkMode={isDarkMode} />
      <Stage width={window.innerWidth} height={window.innerHeight} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp} style={{ position: 'fixed', top: 0, left: 0, zIndex: 10, pointerEvents: 'auto' }}>
        <Layer>{lines.map((line, i) => <Line key={i} points={line.points} stroke={currentStyle.color} strokeWidth={6} dash={currentStyle.dash} tension={0.45} lineCap="round" lineJoin="round" />)}</Layer>
      </Stage>
    </>
  );
};

export default FlagCanvas;
