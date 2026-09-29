import { useCallback, useEffect, useRef, useState } from 'react';
import { TbTools } from 'react-icons/tb';
import {
  ChevronDown,
  ChevronUp,
  Flag,
  GripHorizontal,
  RotateCcw,
  Type,
  Waves,
  X,
} from 'lucide-react';

import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';
import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import LowWaveMarkerChoice from '@/components/ui/modals/LowWaveMarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';

import AnnotationHistoryControls from './AnnotationHistoryControls';
import { useDrawToolbar } from './hooks/useDrawToolbar';
import { useSpacebarPan } from './hooks/useSpacebarPan';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const EXPANDED_WIDTH = 812;
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
    ? 'studio-liquid-dark border-white/[0.18] text-white shadow-black/35'
    : 'studio-liquid-light border-white/80 text-slate-950 shadow-slate-400/20',
  button: isDarkMode
    ? 'border-white/10 bg-white/[0.045] text-white/75 hover:border-white/15 hover:bg-white/[0.085] hover:text-white'
    : 'border-white/75 bg-white/[0.52] text-slate-700 hover:border-blue-200 hover:bg-white/85 hover:text-slate-950',
  disabled: isDarkMode
    ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.025] text-white/30'
    : 'cursor-not-allowed border-white/60 bg-white/35 text-slate-400',
  active: isDarkMode
    ? 'border-cyan-300/35 bg-cyan-400/[0.14] text-cyan-100 ring-1 ring-cyan-300/10'
    : 'border-blue-300/75 bg-blue-500/[0.10] text-blue-800 ring-1 ring-blue-200/70',
  iconRail: isDarkMode
    ? 'bg-white/[0.07] ring-1 ring-white/10 text-white/80'
    : 'bg-white/70 ring-1 ring-white/85 text-slate-700',
  activeIconRail: isDarkMode
    ? 'bg-cyan-400/[0.14] ring-1 ring-cyan-300/20 text-cyan-100'
    : 'bg-blue-500/[0.10] ring-1 ring-blue-200 text-blue-700',
  divider: isDarkMode ? 'bg-white/10' : 'bg-slate-300/70',
  subtle: isDarkMode ? 'text-white/45' : 'text-slate-500',
  label: isDarkMode ? 'text-white/75' : 'text-slate-700',
  activeLabel: isDarkMode ? 'text-cyan-100' : 'text-blue-800',
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
  <div className={cn('mx-0.5 h-8 w-px shrink-0', theme.divider)} aria-hidden="true" />
);

const TrayButton = ({ active, activeClassName, disabled = false, icon, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      'studio-liquid-control flex h-11 min-w-[82px] shrink-0 items-center justify-center gap-2 rounded-xl border px-2.5 transition-all duration-150 disabled:opacity-100',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40',
      disabled ? theme.disabled : active ? activeClassName || theme.active : theme.button
    )}
  >
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        active ? theme.activeIconRail : theme.iconRail
      )}
    >
      {icon}
    </span>
    <span
      className={cn(
        'truncate text-[11px] font-black leading-tight tracking-[0.02em]',
        active ? theme.activeLabel : theme.label
      )}
    >
      {label}
    </span>
  </button>
);

const IconButton = ({ children, disabled = false, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      'studio-liquid-control flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-100',
      disabled ? theme.disabled : theme.button
    )}
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
        'studio-liquid-panel relative rounded-2xl border p-2 shadow-2xl transition-shadow duration-200',
        'before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-cyan-300/25 before:to-transparent',
        isDragging && 'shadow-[0_24px_70px_rgba(34,211,238,0.2)]',
        theme.dock
      )}
    >
      {children}
    </div>
  </div>
);

const DrawToolbar = ({
  draw,
  drawInstance,
  onToggleCanvas,
  onToggleFlagCanvas,
  toggleCanvas,
  toggleFlagCanvas,
  isCanvasActive,
  isDarkMode,
  setLayersRef,
  setLayers,
  setType,
  selectedToolRef,
  projectId,
  disabled = false,
}) => {
  const theme = getTheme(isDarkMode);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => getDefaultPosition(false));
  const positionRef = useRef(position);
  const effectiveDraw = draw || drawInstance;
  const effectiveToggleCanvas = onToggleCanvas || toggleCanvas;
  const effectiveToggleFlagCanvas = onToggleFlagCanvas || toggleFlagCanvas;

  const {
    isDrawing,
    isFlagDrawing,
    isCollapsed,
    selectedToolType,
    openModals,
    toggleModal,
    handlePointInputChoice,
    handleLowWaveMarkerChoice,
    handleMarkerTitleSubmit,
    handleManualInputSubmit,
    handleToggleDrawing,
    handleToggleFlagDrawing,
    handleSelectLess1,
    handleSelectTextNote,
    handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({
    draw: effectiveDraw,
    setLayersRef,
    setLayers,
    setType,
    selectedToolRef,
    onToggleCanvas: effectiveToggleCanvas,
    onToggleFlagCanvas: effectiveToggleFlagCanvas,
    projectId,
  });

  const waveActive = isCanvasActive || isDrawing;
  const dockWidth = getDockWidth(isCollapsed);

  useSpacebarPan({
    disabled,
    isWaveActive: waveActive,
    isFrontActive: isFlagDrawing,
    onToggleCanvas: effectiveToggleCanvas,
    onToggleFlagCanvas: effectiveToggleFlagCanvas,
    openModals,
  });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
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
    });

    return () => window.cancelAnimationFrame(frameId);
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
      // Ignore unavailable storage.
    }
  }, []);

  const handleDragStart = useCallback(
    (event) => {
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
    },
    [dockWidth]
  );

  const handleDragMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = getSafePosition(
      {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
      drag.width
    );
    positionRef.current = next;
    setPosition(next);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      if (!dragRef.current) return;
      event.currentTarget.releasePointerCapture?.(dragRef.current.pointerId);
      dragRef.current = null;
      setIsDragging(false);
      persistPosition(positionRef.current);
    },
    [persistPosition]
  );

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
      <PointInputChoiceModal
        isOpen={openModals.pointInputChoice}
        onClose={() => toggleModal('pointInputChoice', false)}
        onSelect={handlePointInputChoice}
        isDarkMode={isDarkMode}
      />
      <LowWaveMarkerChoice
        isOpen={openModals.lowWaveMarkerChoice}
        onClose={() => toggleModal('lowWaveMarkerChoice', false)}
        onSelect={handleLowWaveMarkerChoice}
        isDarkMode={isDarkMode}
      />
      <MarkerTitleModal
        isOpen={openModals.markerTitle}
        onClose={() => {
          toggleModal('markerTitle', false);
          setPendingMapClick(null);
        }}
        onSubmit={handleMarkerTitleSubmit}
        isDarkMode={isDarkMode}
        markerType={selectedToolType}
      />
      <ManualInputModal
        isOpen={openModals.manualInput}
        onClose={() => toggleModal('manualInput', false)}
        onSubmit={handleManualInputSubmit}
        isDarkMode={isDarkMode}
        markerType={selectedToolType}
      />
      <FeatureNotAvailableModal
        isOpen={openModals.featureNotAvailable}
        onClose={() => toggleModal('featureNotAvailable', false)}
      />
      <FloatingShell isDragging={isDragging} position={position} width={dockWidth} theme={theme}>
        {isCollapsed ? (
          <div className="relative z-10 flex h-12 items-center gap-1.5">
            <button
              type="button"
              aria-label="Open drawing tools"
              title="Open drawing tools"
              onClick={handleToggleCollapse}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[18px] px-1.5 py-1 text-xs font-black tracking-[0.02em]"
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl',
                  theme.iconRail
                )}
              >
                <TbTools size={16} aria-hidden="true" />
              </span>
              <span className={cn('min-w-0 flex-1 truncate text-left', theme.label)}>
                Draw Tools
              </span>
              <ChevronUp size={14} className={theme.subtle} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex h-12 min-w-0 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-label="Drag draw tools"
              title="Drag to move"
              className={cn(
                'studio-liquid-control flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border active:cursor-grabbing',
                theme.button
              )}
              {...dragHandleProps}
            >
              <GripHorizontal size={16} aria-hidden="true" />
            </button>
            <Divider theme={theme} />
            <TrayButton
              label="Text"
              active={selectedToolType === 'text_note'}
              disabled={disabled}
              onClick={handleSelectTextNote}
              theme={theme}
              icon={<Type size={16} aria-hidden="true" />}
            />
            <TrayButton
              label="Low Wave"
              active={selectedToolType === 'less_1'}
              disabled={disabled}
              onClick={handleSelectLess1}
              theme={theme}
              icon={
                <span className="text-[10px] font-black leading-none" aria-hidden="true">
                  &lt;1
                </span>
              }
            />
            <Divider theme={theme} />
            <TrayButton
              label={waveActive ? 'Stop Wave' : 'Wave'}
              active={waveActive}
              disabled={disabled}
              onClick={handleToggleDrawing}
              theme={theme}
              icon={
                waveActive ? (
                  <X size={16} aria-hidden="true" />
                ) : (
                  <Waves size={16} aria-hidden="true" />
                )
              }
            />
            <TrayButton
              label={isFlagDrawing ? 'Stop Fronts' : 'Surface Fronts'}
              active={isFlagDrawing}
              disabled={disabled}
              onClick={handleToggleFlagDrawing}
              theme={theme}
              icon={<Flag size={16} aria-hidden="true" />}
            />
            <Divider theme={theme} />
            <AnnotationHistoryControls disabled={disabled} projectId={projectId} theme={theme} />
            <Divider theme={theme} />
            <IconButton
              label="Reset draw tools position"
              onClick={handleResetPosition}
              theme={theme}
            >
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
