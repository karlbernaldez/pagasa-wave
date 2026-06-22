import { useCallback, useEffect, useRef, useState } from 'react';
import { TbTools } from 'react-icons/tb';
import { CheckCircle2, ChevronDown, ChevronUp, Flag, GripHorizontal, RotateCcw, Type, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const EXPANDED_WIDTH = 760;
const COLLAPSED_WIDTH = 176;
const DOCK_HEIGHT = 74;
const STORAGE_KEY = 'wavelab-draw-tools-position';

const getViewportWidth = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);
const getViewportHeight = () => (typeof window === 'undefined' ? 900 : window.innerHeight);

const getDockWidth = (collapsed = false) => {
  const viewportWidth = getViewportWidth();
  return Math.min(collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH, Math.max(320, viewportWidth - 24));
};

const getDefaultPosition = (collapsed = false) => {
  const width = getDockWidth(collapsed);
  return {
    x: Math.round((getViewportWidth() - width) / 2),
    y: Math.max(72, getViewportHeight() - DOCK_HEIGHT - 18),
  };
};

const getTheme = (isDarkMode) => ({
  dock: isDarkMode
    ? 'border-cyan-200/20 bg-[#0b2638]/78 text-cyan-50 shadow-[0_18px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.16)]'
    : 'border-white/80 bg-white/74 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]',
  button: isDarkMode
    ? 'border-white/8 bg-white/[0.045] text-cyan-100/78 hover:border-cyan-200/24 hover:bg-cyan-300/10 hover:text-cyan-50'
    : 'border-white/70 bg-white/48 text-slate-700 hover:border-blue-200 hover:bg-blue-50/75 hover:text-blue-800',
  disabled: isDarkMode
    ? 'border-white/5 bg-white/[0.025] text-cyan-100/28 opacity-60'
    : 'border-white/50 bg-white/30 text-slate-400 opacity-70',
  active: isDarkMode
    ? 'border-cyan-200/36 bg-cyan-300/18 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-blue-300/80 bg-blue-100/80 text-blue-800 shadow-[0_0_22px_rgba(59,130,246,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  activeClosed: isDarkMode
    ? 'border-emerald-200/38 bg-emerald-300/18 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-emerald-300/80 bg-emerald-100/80 text-emerald-800 shadow-[0_0_22px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]',
  iconRail: isDarkMode ? 'bg-white/[0.07] ring-1 ring-white/10' : 'bg-white/55 ring-1 ring-white/80',
  divider: isDarkMode ? 'bg-cyan-100/12' : 'bg-slate-200/80',
  subtle: isDarkMode ? 'text-cyan-100/58' : 'text-slate-500',
});

const getSafePosition = (position, width) => {
  const margin = 12;
  const maxX = Math.max(margin, getViewportWidth() - width - margin);
  const maxY = Math.max(72, getViewportHeight() - DOCK_HEIGHT - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, 72), maxY),
  };
};

const Divider = ({ theme }) => (
  <div className={cn('h-9 w-px shrink-0', theme.divider)} aria-hidden="true" />
);

const TrayButton = ({ active, activeClassName, disabled = false, icon, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      'flex h-12 min-w-[76px] shrink-0 items-center justify-center gap-2 rounded-2xl border px-2.5 transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80',
      disabled ? theme.disabled : active ? activeClassName || theme.active : theme.button
    )}
  >
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-xl', theme.iconRail)}>
      {icon}
    </span>
    <span className="truncate text-[10px] font-black leading-tight">{label}</span>
  </button>
);

const IconButton = ({ children, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={onClick}
    className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors', theme.button)}
  >
    {children}
  </button>
);

const FloatingShell = ({ children, isDragging, position, width, theme }) => (
  <div
    className={cn('fixed z-[65]', isDragging && 'select-none')}
    style={{ left: position.x, top: position.y, width }}
  >
    <div
      className={cn(
        'relative rounded-[26px] border p-2 shadow-2xl backdrop-blur-2xl transition-shadow',
        'before:pointer-events-none before:absolute before:inset-x-8 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
        'after:pointer-events-none after:absolute after:inset-1 after:rounded-[22px] after:ring-1 after:ring-white/10',
        isDragging && 'shadow-[0_24px_70px_rgba(34,211,238,0.2)]',
        theme.dock
      )}
    >
      {children}
    </div>
  </div>
);

const DrawToolbar = ({
  draw, onToggleCanvas, onToggleFlagCanvas,
  isCanvasActive, isDarkMode,
  setLayersRef, setLayers,
  closedMode, setClosedMode,
  setType, selectedToolRef,
  projectId,
}) => {
  const theme = getTheme(isDarkMode);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => getDefaultPosition(false));
  const positionRef = useRef(position);

  const {
    isDrawing, isFlagDrawing, isCollapsed, selectedToolType,
    openModals, toggleModal,
    handlePointInputChoice,
    handleMarkerTitleSubmit, handleManualInputSubmit,
    handleToggleDrawing, handleToggleFlagDrawing,
    handleSelectLess1, handleSelectTextNote, handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({ draw, setLayersRef, setLayers, setType, selectedToolRef, onToggleCanvas, onToggleFlagCanvas, projectId });

  const waveActive = isCanvasActive || isDrawing;
  const dockWidth = getDockWidth(isCollapsed);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const next = saved ? JSON.parse(saved) : getDefaultPosition(isCollapsed);
      if (Number.isFinite(next?.x) && Number.isFinite(next?.y)) {
        const safe = getSafePosition(next, dockWidth);
        positionRef.current = safe;
        setPosition(safe);
      }
    } catch {
      const safe = getDefaultPosition(isCollapsed);
      positionRef.current = safe;
      setPosition(safe);
    }
  }, [dockWidth, isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const safe = getSafePosition(positionRef.current, dockWidth);
      positionRef.current = safe;
      setPosition(safe);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dockWidth]);

  const persistPosition = useCallback((nextPosition) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosition));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
      width: dockWidth,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [dockWidth]);

  const handleDragMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const next = getSafePosition({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }, drag.width);

    positionRef.current = next;
    setPosition(next);
  }, []);

  const handleDragEnd = useCallback((event) => {
    if (!dragRef.current) return;
    event.currentTarget.releasePointerCapture?.(dragRef.current.pointerId);
    dragRef.current = null;
    setIsDragging(false);
    persistPosition(positionRef.current);
  }, [persistPosition]);

  const handleResetPosition = useCallback(() => {
    const safe = getDefaultPosition(isCollapsed);
    positionRef.current = safe;
    setPosition(safe);
    persistPosition(safe);
  }, [isCollapsed, persistPosition]);

  const dragHandleProps = {
    onPointerDown: handleDragStart,
    onPointerMove: handleDragMove,
    onPointerUp: handleDragEnd,
    onPointerCancel: handleDragEnd,
  };

  return (
    <>
      <PointInputChoiceModal isOpen={openModals.pointInputChoice} onClose={() => toggleModal('pointInputChoice', false)} onSelect={handlePointInputChoice} isDarkMode={isDarkMode} />
      <MarkerTitleModal isOpen={openModals.markerTitle} onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit} isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal isOpen={openModals.manualInput} onClose={() => toggleModal('manualInput', false)} onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      <FloatingShell isDragging={isDragging} position={position} width={dockWidth} theme={theme}>
        {isCollapsed ? (
          <div className="relative z-10 flex h-12 items-center gap-1.5">
            <button
              type="button"
              aria-label="Open drawing tools"
              title="Open drawing tools"
              onClick={handleToggleCollapse}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[18px] px-1.5 py-1 text-xs font-black"
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl', theme.iconRail)}>
                <TbTools size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-left">Draw Tools</span>
              <ChevronUp size={14} className={theme.subtle} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex h-14 min-w-0 items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-label="Drag draw tools"
              title="Drag to move"
              className={cn('flex h-12 w-12 shrink-0 cursor-grab touch-none items-center justify-center rounded-2xl border active:cursor-grabbing', theme.button)}
              {...dragHandleProps}
            >
              <GripHorizontal size={16} aria-hidden="true" />
            </button>

            <Divider theme={theme} />

            <TrayButton
              label="Text"
              active={selectedToolType === 'text_note'}
              onClick={handleSelectTextNote}
              theme={theme}
              icon={<Type size={16} aria-hidden="true" />}
            />
            <TrayButton
              label="Low Wave"
              active={selectedToolType === 'less_1'}
              onClick={handleSelectLess1}
              theme={theme}
              icon={<img src={l1} alt="" className="h-5 w-5 object-contain" aria-hidden="true" />}
            />

            <Divider theme={theme} />

            <TrayButton
              label={waveActive ? 'Stop Wave' : 'Wave'}
              active={waveActive}
              onClick={handleToggleDrawing}
              theme={theme}
              icon={waveActive ? <X size={16} aria-hidden="true" /> : <Waves size={16} aria-hidden="true" />}
            />
            <TrayButton
              label={isFlagDrawing ? 'Stop Flag' : 'Flag'}
              active={isFlagDrawing}
              onClick={handleToggleFlagDrawing}
              theme={theme}
              icon={<Flag size={16} aria-hidden="true" />}
            />

            <Divider theme={theme} />

            <TrayButton
              label="Open"
              active={waveActive && !closedMode}
              disabled={!waveActive}
              onClick={() => setClosedMode(false)}
              theme={theme}
              icon={<Waves size={16} aria-hidden="true" />}
            />
            <TrayButton
              label="Loop"
              active={waveActive && closedMode}
              activeClassName={theme.activeClosed}
              disabled={!waveActive}
              onClick={() => setClosedMode(true)}
              theme={theme}
              icon={<CheckCircle2 size={16} aria-hidden="true" />}
            />

            <Divider theme={theme} />

            <IconButton label="Reset draw tools position" onClick={handleResetPosition} theme={theme}>
              <RotateCcw size={15} aria-hidden="true" />
            </IconButton>
            <IconButton label="Collapse drawing tools" onClick={handleToggleCollapse} theme={theme}>
              <ChevronDown size={17} aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </FloatingShell>
    </>
  );
};

export default DrawToolbar;
