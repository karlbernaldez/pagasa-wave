import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { createFeature } from '@/api/featureServices';
import { getPreviewCurvePoints, handlePointerUp } from './canvasUtils';
import { useProjectId } from '@dashboards/forecaster/hooks/useStudio';
import { CheckCircle2, GripHorizontal, Minus, Plus, RotateCcw, Waves } from 'lucide-react';

const MIN_POINT_DISTANCE = 3.5;
const PREVIEW_FRAME_MS = 24;
const SLIDER_WIDTH = 420;
const SLIDER_HEIGHT = 154;
const SLIDER_STORAGE_KEY = 'wavelab-wave-height-panel-position-v1';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const clampWaveValue = (nextValue) => Math.max(1, Math.min(15, nextValue));
const getViewportWidth = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);
const getViewportHeight = () => (typeof window === 'undefined' ? 900 : window.innerHeight);

const getDefaultPanelPosition = () => ({
  x: Math.min(Math.max(360, Math.round((getViewportWidth() - SLIDER_WIDTH) / 2)), Math.max(16, getViewportWidth() - SLIDER_WIDTH - 380)),
  y: 88,
});

const getSafePanelPosition = (position) => {
  const margin = 16;
  return {
    x: Math.min(Math.max(position.x, margin), Math.max(margin, getViewportWidth() - SLIDER_WIDTH - margin)),
    y: Math.min(Math.max(position.y, 72), Math.max(72, getViewportHeight() - SLIDER_HEIGHT - margin)),
  };
};

const getMapContainerRect = (mapRef) => {
  const container = mapRef?.current?.getContainer?.();
  return container?.getBoundingClientRect?.() || null;
};

const getPointerPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
};

const distanceFromLastPoint = (points, x, y) => {
  if (points.length < 2) return Infinity;
  const lastX = points[points.length - 2];
  const lastY = points[points.length - 1];
  return Math.hypot(x - lastX, y - lastY);
};

const WaveHeightSlider = memo(({ value, onChange, isDarkMode, closedMode, onClosedModeChange }) => {
  const marks = [1, 3, 5, 8, 10, 12, 15];
  const pct = ((value - 1) / 14) * 100;
  const setWaveValue = (nextValue) => onChange(clampWaveValue(nextValue));
  const dragRef = useRef(null);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [position, setPosition] = useState(() => getDefaultPanelPosition());
  const positionRef = useRef(position);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SLIDER_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      const next = Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y) ? parsed : getDefaultPanelPosition();
      const safe = getSafePanelPosition(next);
      positionRef.current = safe;
      setPosition(safe);
    } catch {
      const safe = getSafePanelPosition(getDefaultPanelPosition());
      positionRef.current = safe;
      setPosition(safe);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const safe = getSafePanelPosition(positionRef.current);
      positionRef.current = safe;
      setPosition(safe);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const persistPosition = useCallback((next) => {
    try {
      window.localStorage.setItem(SLIDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingPanel(true);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: positionRef.current.x, originY: positionRef.current.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleDragMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = getSafePanelPosition({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY });
    positionRef.current = next;
    setPosition(next);
  }, []);

  const handleDragEnd = useCallback((event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setIsDraggingPanel(false);
    persistPosition(positionRef.current);
  }, [persistPosition]);

  const handleResetPosition = useCallback((event) => {
    event.stopPropagation();
    const safe = getSafePanelPosition(getDefaultPanelPosition());
    positionRef.current = safe;
    setPosition(safe);
    persistPosition(safe);
  }, [persistPosition]);

  return (
    <div className={cn('studio-liquid-panel fixed z-[110] rounded-2xl border px-3 py-3 shadow-2xl transition-shadow duration-200', isDraggingPanel && 'select-none shadow-[0_26px_70px_rgba(34,211,238,0.22)]', isDarkMode ? 'studio-liquid-dark border-white/[0.18] text-white shadow-cyan-950/20' : 'studio-liquid-light border-white/80 text-slate-950 shadow-blue-950/10')} style={{ left: position.x, top: position.y, width: `min(${SLIDER_WIDTH}px, calc(100vw - 2rem))` }}>
      <div className={cn('absolute left-8 right-8 top-0 h-px', isDarkMode ? 'bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/35 to-transparent')} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <button type="button" className={cn('flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2.5 rounded-xl text-left active:cursor-grabbing', isDarkMode ? 'text-white' : 'text-slate-950')} title="Drag wave height panel" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd}>
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', isDarkMode ? 'bg-cyan-400/12 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}><GripHorizontal size={16} strokeWidth={2.4} /></span>
          <div className="min-w-0"><div className={cn('text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/80' : 'text-slate-700')}>Wave Height</div><div className={cn('mt-0.5 flex items-center gap-1.5 text-[10px] font-bold', isDarkMode ? 'text-white/45' : 'text-slate-500')}><CheckCircle2 size={12} strokeWidth={2.5} /><span className="truncate">{closedMode ? 'Loop / closed contour' : 'Open line'}</span></div></div>
        </button>
        <button type="button" onClick={handleResetPosition} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all', isDarkMode ? 'border-white/10 bg-white/[0.055] text-white/70 hover:bg-white/[0.09] hover:text-white' : 'border-white/80 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-950')} title="Reset panel position"><RotateCcw size={14} strokeWidth={2.5} /></button>
        <div className={cn('flex h-10 min-w-20 items-baseline justify-center rounded-xl border px-3', isDarkMode ? 'border-cyan-300/20 bg-cyan-400/12' : 'border-blue-300/40 bg-blue-50')}><span className={cn('text-2xl font-black leading-10 tabular-nums', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}>{value}</span><span className={cn('ml-1 text-[10px] font-black', isDarkMode ? 'text-cyan-300/70' : 'text-blue-500/70')}>m</span></div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onClosedModeChange?.(false)} className={cn('flex h-9 items-center justify-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all', !closedMode ? isDarkMode ? 'border-cyan-300/35 bg-cyan-400/18 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-700' : isDarkMode ? 'border-white/8 bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/80' : 'border-white/70 bg-white/45 text-slate-500 hover:bg-white hover:text-slate-800')}><Waves size={14} />Open</button>
        <button type="button" onClick={() => onClosedModeChange?.(true)} className={cn('flex h-9 items-center justify-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all', closedMode ? isDarkMode ? 'border-emerald-300/35 bg-emerald-400/18 text-emerald-100' : 'border-emerald-300 bg-emerald-50 text-emerald-700' : isDarkMode ? 'border-white/8 bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/80' : 'border-white/70 bg-white/45 text-slate-500 hover:bg-white hover:text-slate-800')}><CheckCircle2 size={14} />Loop</button>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setWaveValue(value - 1)} className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45', isDarkMode ? 'border-white/10 bg-white/[0.055] text-white/70 hover:bg-white/[0.09] hover:text-white' : 'border-white/80 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-950')} title="Decrease wave height"><Minus size={17} strokeWidth={2.6} /></button>
        <div className="min-w-0 flex-1"><input type="range" min="1" max="15" step="1" value={value} onChange={(e) => setWaveValue(parseInt(e.target.value, 10))} className={cn('h-2 w-full cursor-pointer touch-pan-x appearance-none rounded-full', '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5', '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full', '[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white', '[&::-webkit-slider-thumb]:shadow-[0_4px_14px_rgba(0,0,0,0.22)]', '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100', '[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-110', isDarkMode ? '[&::-webkit-slider-thumb]:bg-cyan-300' : '[&::-webkit-slider-thumb]:bg-blue-600', '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5', '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px]', '[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-[0_4px_14px_rgba(0,0,0,0.22)]')} style={{ background: `linear-gradient(to right, ${isDarkMode ? '#22d3ee' : '#2563eb'} 0%, ${isDarkMode ? '#22d3ee' : '#2563eb'} ${pct}%, ${isDarkMode ? 'rgba(255,255,255,0.13)' : 'rgba(15,23,42,0.1)'} ${pct}%, ${isDarkMode ? 'rgba(255,255,255,0.13)' : 'rgba(15,23,42,0.1)'} 100%)` }} />
          <div className="mt-2 grid grid-cols-7 gap-1">{marks.map((mark) => { const active = value === mark; return <button key={mark} type="button" onClick={() => setWaveValue(mark)} className={cn('h-7 rounded-lg border text-[10px] font-black tabular-nums transition-all', active ? isDarkMode ? 'border-cyan-300/35 bg-cyan-400/18 text-cyan-100' : 'border-blue-300 bg-blue-50 text-blue-700' : isDarkMode ? 'border-white/8 bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/80' : 'border-white/70 bg-white/45 text-slate-500 hover:bg-white hover:text-slate-800')} title={`Set wave height to ${mark} meters`}>{mark}</button>; })}</div>
        </div>
        <button type="button" onClick={() => setWaveValue(value + 1)} className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45', isDarkMode ? 'border-white/10 bg-white/[0.055] text-white/70 hover:bg-white/[0.09] hover:text-white' : 'border-white/80 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-950')} title="Increase wave height"><Plus size={17} strokeWidth={2.6} /></button>
      </div>
      <div className={cn('mt-2.5 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}><span>Calm</span><span>Moderate</span><span>High sea</span></div>
    </div>
  );
});

WaveHeightSlider.displayName = 'WaveHeightSlider';

const DrawingCanvas = ({ mapRef, drawCounter = 0, setDrawCounter, isDarkMode, setLayersRef, closedMode = false, setClosedMode, lineCount = 0 }) => {
  const canvasRef = useRef(null);
  const activeLineRef = useRef(null);
  const rafRef = useRef(null);
  const lastPreviewTimeRef = useRef(0);
  const pointerIdRef = useRef(null);
  const isDrawing = useRef(false);
  const drawLock = useRef(false);
  const [labelValue, setLabelValue] = useState(3);
  const [localClosedMode, setLocalClosedMode] = useState(Boolean(closedMode));
  const [projectId] = useProjectId();
  const activeClosedMode = setClosedMode ? closedMode : localClosedMode;

  useEffect(() => { setLocalClosedMode(Boolean(closedMode)); }, [closedMode]);
  const updateClosedMode = useCallback((nextValue) => { setLocalClosedMode(nextValue); setClosedMode?.(nextValue); }, [setClosedMode]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = getMapContainerRect(mapRef) || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, bottom: window.innerHeight };
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(rect.width * dpr);
    canvas.height = Math.ceil(rect.height * dpr);
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [mapRef]);

  const clearPreview = useCallback(() => { const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return; ctx.clearRect(0, 0, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight); }, []);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const line = activeLineRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
    if (!line?.points || line.points.length < 4) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(line.points[0], line.points[1]);
    for (let i = 2; i < line.points.length; i += 2) ctx.lineTo(line.points[i], line.points[i + 1]);
    ctx.strokeStyle = isDarkMode ? '#19b8b7' : '#000000';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(Number(labelValue) < 2 ? [3, 3] : []);
    ctx.stroke();
    ctx.restore();
  }, [isDarkMode, labelValue]);

  const schedulePreviewDraw = useCallback(() => { if (rafRef.current) return; rafRef.current = window.requestAnimationFrame(() => { rafRef.current = null; drawPreview(); }); }, [drawPreview]);
  const setSaveLines = useCallback((nextLines) => { const next = typeof nextLines === 'function' ? nextLines(activeLineRef.current ? [activeLineRef.current] : []) : nextLines; activeLineRef.current = Array.isArray(next) && next.length ? next[next.length - 1] : null; if (activeLineRef.current) schedulePreviewDraw(); else clearPreview(); }, [clearPreview, schedulePreviewDraw]);

  useEffect(() => { const preventScroll = (event) => { if (isDrawing.current) event.preventDefault(); }; document.body.addEventListener('touchmove', preventScroll, { passive: false }); return () => document.body.removeEventListener('touchmove', preventScroll); }, []);
  useEffect(() => { resizeCanvas(); window.addEventListener('resize', resizeCanvas); const map = mapRef?.current; map?.on?.('resize', resizeCanvas); map?.on?.('move', resizeCanvas); map?.on?.('zoom', resizeCanvas); return () => { window.removeEventListener('resize', resizeCanvas); map?.off?.('resize', resizeCanvas); map?.off?.('move', resizeCanvas); map?.off?.('zoom', resizeCanvas); if (rafRef.current) window.cancelAnimationFrame(rafRef.current); }; }, [mapRef, resizeCanvas]);

  const onPointerDown = useCallback((event) => { if (drawLock.current) return; resizeCanvas(); event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); const [x, y] = getPointerPoint(event, event.currentTarget); pointerIdRef.current = event.pointerId; isDrawing.current = true; lastPreviewTimeRef.current = 0; activeLineRef.current = { points: [x, y], rawPoints: [x, y] }; clearPreview(); }, [clearPreview, resizeCanvas]);
  const onPointerMove = useCallback((event) => { if (drawLock.current) return; if (!isDrawing.current || pointerIdRef.current !== event.pointerId) return; event.preventDefault(); const line = activeLineRef.current; if (!line) return; const now = performance.now(); if (now - lastPreviewTimeRef.current < PREVIEW_FRAME_MS) return; const [x, y] = getPointerPoint(event, event.currentTarget); if (distanceFromLastPoint(line.rawPoints, x, y) < MIN_POINT_DISTANCE) return; line.rawPoints = line.rawPoints.concat([x, y]); line.points = getPreviewCurvePoints(line.rawPoints); lastPreviewTimeRef.current = now; schedulePreviewDraw(); }, [schedulePreviewDraw]);

  const finishDrawing = useCallback(async (event) => {
    if (drawLock.current) return;
    event?.preventDefault();
    event?.currentTarget?.releasePointerCapture?.(event.pointerId);
    const line = activeLineRef.current;
    pointerIdRef.current = null;
    if (!line?.rawPoints || line.rawPoints.length < 4) { isDrawing.current = false; activeLineRef.current = null; clearPreview(); return; }
    drawLock.current = true;
    await handlePointerUp(mapRef, [line], setSaveLines, isDrawing, drawCounter, setDrawCounter, setLayersRef, createFeature, activeClosedMode, lineCount, labelValue, isDarkMode, projectId);
    activeLineRef.current = null;
    clearPreview();
    setTimeout(() => { drawLock.current = false; }, 50);
  }, [activeClosedMode, clearPreview, drawCounter, isDarkMode, labelValue, lineCount, mapRef, projectId, setDrawCounter, setLayersRef, setSaveLines]);

  return (
    <>
      <WaveHeightSlider value={labelValue} onChange={setLabelValue} isDarkMode={isDarkMode} closedMode={activeClosedMode} onClosedModeChange={updateClosedMode} />
      <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} className="fixed z-10 touch-none pointer-events-auto" />
    </>
  );
};

export default memo(DrawingCanvas);
