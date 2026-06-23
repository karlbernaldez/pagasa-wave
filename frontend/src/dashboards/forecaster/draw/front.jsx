import { Stage, Layer, Line, RegularPolygon, Wedge } from 'react-konva';
import { useRef, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, CloudSun, GripHorizontal, RotateCcw, Snowflake, Waves } from 'lucide-react';
import { createFeature } from '@/api/featureServices';
import { useProjectId } from '@dashboards/forecaster/hooks/useStudio';

const FRONT_TYPES = {
  cold: { label: 'Cold', fullLabel: 'Cold Front', color: '#1d4ed8', lineWidth: 4, icon: Snowflake, imageId: 'surface-front-cold', symbols: [{ kind: 'triangle', color: '#1d4ed8', side: -1 }] },
  warm: { label: 'Warm', fullLabel: 'Warm Front', color: '#ef4444', lineWidth: 4, icon: CloudSun, imageId: 'surface-front-warm', symbols: [{ kind: 'semicircle', color: '#ef4444', side: -1 }] },
  stationary: { label: 'Stationary', fullLabel: 'Stationary Front', color: '#64748b', lineWidth: 3, icon: Waves, imageId: 'surface-front-stationary', symbols: [{ kind: 'semicircle', color: '#ef4444', side: -1, along: -14 }, { kind: 'triangle', color: '#1d4ed8', side: 1, along: 14 }] },
  occluded: { label: 'Occluded', fullLabel: 'Occluded Front', color: '#7c3aed', lineWidth: 4, icon: CheckCircle2, imageId: 'surface-front-occluded', symbols: [{ kind: 'semicircle', color: '#7c3aed', side: -1, along: -13 }, { kind: 'triangle', color: '#7c3aed', side: -1, along: 13 }] },
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
const normalizeFrontType = (frontType) => FRONT_TYPES[frontType] ? frontType : 'cold';

const drawTriangle = (ctx, x, y, size, color, side = -1) => { ctx.beginPath(); ctx.moveTo(x - size / 2, y); ctx.lineTo(x + size / 2, y); ctx.lineTo(x, y + side * size); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
const drawSemiCircle = (ctx, x, y, radius, color, side = -1) => { ctx.beginPath(); ctx.moveTo(x - radius, y); ctx.arc(x, y, radius, Math.PI, 0, side > 0); ctx.lineTo(x - radius, y); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
const createFrontIconCanvas = (frontType) => {
  const pixelRatio = 2;
  const width = 72;
  const height = 34;
  const canvas = document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);
  const baseline = height / 2;
  if (frontType === 'cold') drawTriangle(ctx, 36, baseline, 14, '#1d4ed8', -1);
  else if (frontType === 'warm') drawSemiCircle(ctx, 36, baseline, 10, '#ef4444', -1);
  else if (frontType === 'stationary') { drawSemiCircle(ctx, 24, baseline, 9, '#ef4444', -1); drawTriangle(ctx, 50, baseline, 13, '#1d4ed8', 1); }
  else if (frontType === 'occluded') { drawSemiCircle(ctx, 24, baseline, 9, '#7c3aed', -1); drawTriangle(ctx, 50, baseline, 13, '#7c3aed', -1); }
  return canvas;
};
function ensureSurfaceFrontImages(map) { if (typeof document === 'undefined' || !map?.addImage) return; Object.entries(FRONT_TYPES).forEach(([type, style]) => { if (map.hasImage?.(style.imageId)) return; map.addImage(style.imageId, createFrontIconCanvas(type), { pixelRatio: 2 }); }); }

function renderFrontLayers(map, sourceId, geojson, frontType) {
  const frozenFrontType = normalizeFrontType(frontType);
  const style = FRONT_TYPES[frozenFrontType];
  const beforeLayer = map.getLayer('custom-points-layer') ? 'custom-points-layer' : undefined;
  [`${sourceId}_bg`, `${sourceId}_frontSymbols`, `${sourceId}_triangles`, `${sourceId}_circles`, `${sourceId}_secondary`].forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
  if (map.getSource(sourceId)) map.getSource(sourceId).setData(geojson);
  else map.addSource(sourceId, { type: 'geojson', data: geojson });
  ensureSurfaceFrontImages(map);
  map.addLayer({ id: `${sourceId}_bg`, type: 'line', source: sourceId, slot: 'top', layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' }, paint: { 'line-color': style.color, 'line-width': style.lineWidth, 'line-opacity': 0.86 } }, beforeLayer);
  map.addLayer({ id: `${sourceId}_frontSymbols`, type: 'symbol', source: sourceId, slot: 'top', layout: { 'symbol-placement': 'line', 'symbol-spacing': 34, 'icon-image': style.imageId, 'icon-size': 0.92, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-keep-upright': false, 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map', visibility: 'visible' } }, beforeLayer);
}

function makePreviewSymbols(points, frontType) {
  const style = FRONT_TYPES[normalizeFrontType(frontType)];
  if (!Array.isArray(points) || points.length < 4) return [];
  const symbols = [];
  const spacing = 42;
  let carry = 0;
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i], y1 = points[i + 1], x2 = points[i + 2], y2 = points[i + 3];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    let distance = spacing - carry;
    while (distance < len) {
      const baseX = x1 + ux * distance;
      const baseY = y1 + uy * distance;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      style.symbols.forEach((symbol, idx) => {
        const sideOffset = symbol.kind === 'triangle' ? 5 * symbol.side : 4 * symbol.side;
        const alongOffset = symbol.along || 0;
        symbols.push({ id: `${i}-${distance}-${idx}`, kind: symbol.kind, color: symbol.color, x: baseX + nx * sideOffset + ux * alongOffset, y: baseY + ny * sideOffset + uy * alongOffset, rotation: angle + (symbol.kind === 'triangle' ? 90 : 0), side: symbol.side });
      });
      distance += spacing;
    }
    carry = len - (distance - spacing);
  }
  return symbols;
}

const SurfaceFrontPanel = ({ frontType, setFrontType, isDarkMode }) => {
  const dragRef = useRef(null);
  const [position, setPosition] = useState(() => getSafePosition(getDefaultPosition()));
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position);
  useEffect(() => { try { const saved = window.localStorage.getItem(STORAGE_KEY); const parsed = saved ? JSON.parse(saved) : null; const safe = getSafePosition(Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y) ? parsed : getDefaultPosition()); positionRef.current = safe; setPosition(safe); } catch { const safe = getSafePosition(getDefaultPosition()); positionRef.current = safe; setPosition(safe); } }, []);
  useEffect(() => { const handleResize = () => { const safe = getSafePosition(positionRef.current); positionRef.current = safe; setPosition(safe); }; window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  const persistPosition = useCallback((next) => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ } }, []);
  const handleDragStart = useCallback((event) => { if (event.button !== undefined && event.button !== 0) return; event.preventDefault(); event.stopPropagation(); dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: positionRef.current.x, originY: positionRef.current.y }; setIsDragging(true); event.currentTarget.setPointerCapture?.(event.pointerId); }, []);
  const handleDragMove = useCallback((event) => { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; event.preventDefault(); const next = getSafePosition({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY }); positionRef.current = next; setPosition(next); }, []);
  const handleDragEnd = useCallback((event) => { if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return; event.currentTarget.releasePointerCapture?.(event.pointerId); dragRef.current = null; setIsDragging(false); persistPosition(positionRef.current); }, [persistPosition]);
  const resetPosition = useCallback((event) => { event.stopPropagation(); const safe = getSafePosition(getDefaultPosition()); positionRef.current = safe; setPosition(safe); persistPosition(safe); }, [persistPosition]);
  return <div className={cn('studio-liquid-panel fixed z-[110] rounded-2xl border p-3 shadow-2xl', isDragging && 'select-none shadow-[0_26px_70px_rgba(34,211,238,0.22)]', isDarkMode ? 'studio-liquid-dark border-white/[0.18] text-white' : 'studio-liquid-light border-white/80 text-slate-950')} style={{ left: position.x, top: position.y, width: `min(${PANEL_WIDTH}px, calc(100vw - 2rem))` }}><div className="mb-3 flex items-center justify-between gap-2"><button type="button" className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 text-left active:cursor-grabbing" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} title="Drag surface fronts panel"><span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', isDarkMode ? 'bg-cyan-400/12 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}><GripHorizontal size={16} /></span><div><div className="text-[11px] font-black uppercase tracking-wide">Surface Fronts</div><div className={cn('text-[10px] font-bold', isDarkMode ? 'text-white/45' : 'text-slate-500')}>{FRONT_TYPES[frontType]?.fullLabel}</div></div></button><button type="button" onClick={resetPosition} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', isDarkMode ? 'border-white/10 bg-white/[0.055] text-white/70' : 'border-white/80 bg-white/60 text-slate-600')} title="Reset panel position"><RotateCcw size={14} /></button></div><div className="grid grid-cols-2 gap-2">{Object.entries(FRONT_TYPES).map(([key, config]) => { const Icon = config.icon; const active = frontType === key; return <button key={key} type="button" onClick={() => setFrontType(key)} className={cn('flex h-10 items-center justify-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all', active ? isDarkMode ? 'border-cyan-300/35 bg-cyan-400/18 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-700' : isDarkMode ? 'border-white/8 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white' : 'border-white/70 bg-white/45 text-slate-500 hover:bg-white hover:text-slate-800')}><Icon size={14} /><span>{config.label}</span></button>; })}</div></div>;
};

const FlagCanvas = ({ mapRef, isDarkMode }) => {
  const [projectId] = useProjectId();
  const [lines, setLines] = useState([]);
  const [frontType, setFrontType] = useState('cold');
  const isFlagDrawing = useRef(false);
  const mapBoundsRef = useRef(null);
  useEffect(() => { const preventScroll = (e) => { if (isFlagDrawing.current) e.preventDefault(); }; document.body.addEventListener('touchmove', preventScroll, { passive: false }); return () => document.body.removeEventListener('touchmove', preventScroll); }, []);
  const getAdjustedPoint = useCallback((e) => { const pos = getPointerPosition(e); const rect = mapBoundsRef.current || getMapContainerRect(mapRef); return { x: pos.x - rect.left, y: pos.y - rect.top }; }, [mapRef]);
  const handleDown = useCallback((e) => { const frozenFrontType = normalizeFrontType(frontType); mapBoundsRef.current = getMapContainerRect(mapRef); isFlagDrawing.current = true; const pos = getAdjustedPoint(e); setLines([{ points: [pos.x, pos.y], color: FRONT_TYPES[frozenFrontType].color, frontType: frozenFrontType }]); }, [frontType, getAdjustedPoint, mapRef]);
  const handleMove = useCallback((e) => { if (!isFlagDrawing.current) return; const pos = getAdjustedPoint(e); setLines((prev) => { if (!prev.length) return prev; const lastLine = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...lastLine, points: [...lastLine.points, pos.x, pos.y] }]; }); }, [getAdjustedPoint]);
  const handleUp = useCallback(async () => { const map = mapRef.current; const line = lines[lines.length - 1]; const frozenFrontType = normalizeFrontType(line?.frontType || frontType); isFlagDrawing.current = false; if (!map || !line?.points || line.points.length < 4) { setLines([]); return; } const coords = []; for (let i = 0; i < line.points.length; i += 2) { const lngLat = map.unproject([line.points[i], line.points[i + 1]]); coords.push([lngLat.lng, lngLat.lat]); } const sourceId = `SF_${uuidv4()}`; const feature = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { isFront: true, frontType: frozenFrontType, project: projectId } }; const geojson = { type: 'FeatureCollection', features: [feature] }; renderFrontLayers(map, sourceId, geojson, frozenFrontType); createFeature({ geometry: feature.geometry, properties: feature.properties, name: buildFrontName(frozenFrontType), sourceId }).catch((err) => console.error('Error saving surface front:', err)); setLines([]); }, [frontType, lines, mapRef, projectId]);
  const previewLine = lines[lines.length - 1];
  const previewFrontType = normalizeFrontType(previewLine?.frontType || frontType);
  const currentStyle = FRONT_TYPES[previewFrontType];
  const previewSymbols = previewLine ? makePreviewSymbols(previewLine.points, previewFrontType) : [];
  return <><SurfaceFrontPanel frontType={frontType} setFrontType={setFrontType} isDarkMode={isDarkMode} /><Stage width={window.innerWidth} height={window.innerHeight} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp} style={{ position: 'fixed', top: 0, left: 0, zIndex: 10, pointerEvents: 'auto' }}><Layer>{lines.map((line, i) => <Line key={i} points={line.points} stroke={FRONT_TYPES[normalizeFrontType(line.frontType)].color} strokeWidth={FRONT_TYPES[normalizeFrontType(line.frontType)].lineWidth} tension={0.45} lineCap="round" lineJoin="round" />)}{previewSymbols.map((symbol) => symbol.kind === 'triangle' ? <RegularPolygon key={symbol.id} x={symbol.x} y={symbol.y} sides={3} radius={9} fill={symbol.color} rotation={symbol.rotation} /> : <Wedge key={symbol.id} x={symbol.x} y={symbol.y} radius={9} angle={180} fill={symbol.color} rotation={symbol.rotation + (symbol.side < 0 ? 180 : 0)} />)}</Layer></Stage></>;
};

export default FlagCanvas;