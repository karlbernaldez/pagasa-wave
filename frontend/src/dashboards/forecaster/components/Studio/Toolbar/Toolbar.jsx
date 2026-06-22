import { useCallback, useEffect, useRef, useState } from 'react';
import { TbTools } from 'react-icons/tb';
import { CheckCircle2, ChevronDown, ChevronUp, Flag, GripHorizontal, Type, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PALETTE_WIDTH = 264;
const DEFAULT_POSITION = { x: 360, y: 96 };
const STORAGE_KEY = 'wavelab-draw-tools-position';

const getTheme = (isDarkMode) => ({
  panel: isDarkMode
    ? 'border-cyan-200/20 bg-[#0b2638]/78 text-cyan-50 shadow-[0_18px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.16)]'
    : 'border-white/80 bg-white/74 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]',
  section: isDarkMode ? 'text-cyan-100/55' : 'text-slate-500',
  row: isDarkMode
    ? 'border-white/8 bg-white/[0.045] text-cyan-100/78 hover:border-cyan-200/24 hover:bg-cyan-300/10 hover:text-cyan-50'
    : 'border-white/70 bg-white/48 text-slate-700 hover:border-blue-200 hover:bg-blue-50/75 hover:text-blue-800',
  active: isDarkMode
    ? 'border-cyan-200/36 bg-cyan-300/18 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-blue-300/80 bg-blue-100/80 text-blue-800 shadow-[0_0_22px_rgba(59,130,246,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  activeClosed: isDarkMode
    ? 'border-emerald-200/38 bg-emerald-300/18 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-emerald-300/80 bg-emerald-100/80 text-emerald-800 shadow-[0_0_22px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]',
  iconRail: isDarkMode ? 'bg-white/[0.07] ring-1 ring-white/10' : 'bg-white/55 ring-1 ring-white/80',
  divider: isDarkMode ? 'border-cyan-100/12' : 'border-slate-200/80',
  subtle: isDarkMode ? 'text-cyan-100/58' : 'text-slate-500',
});

const getSafePosition = (position) => {
  if (typeof window === 'undefined') return position;

  const margin = 12;
  const maxX = Math.max(margin, window.innerWidth - PALETTE_WIDTH - margin);
  const maxY = Math.max(margin, window.innerHeight - 160);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, 72), maxY),
  };
};

const ToolButton = ({ active, activeClassName, icon, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'flex min-h-10 items-center gap-2 rounded-2xl border px-2.5 py-2 text-left transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80',
      active ? activeClassName || theme.active : theme.row
    )}
  >
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-xl', theme.iconRail)}>
      {icon}
    </span>
    <span className="min-w-0 truncate text-[11px] font-black leading-tight">{label}</span>
  </button>
);

const SectionTitle = ({ children, theme }) => (
  <p className={cn('px-1 text-[9px] font-black uppercase tracking-[0.16em]', theme.section)}>
    {children}
  </p>
);

const FloatingShell = ({ children, isDragging, position, styleWidth, theme }) => (
  <div
    className={cn('fixed z-[65]', isDragging && 'select-none')}
    style={{ left: position.x, top: position.y, width: styleWidth }}
  >
    <div
      className={cn(
        'relative rounded-[24px] border p-2.5 shadow-2xl backdrop-blur-2xl transition-shadow',
        'before:pointer-events-none before:absolute before:inset-x-8 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
        'after:pointer-events-none after:absolute after:inset-1 after:rounded-[20px] after:ring-1 after:ring-white/10',
        isDragging && 'shadow-[0_24px_70px_rgba(34,211,238,0.2)]',
        theme.panel
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
  const positionRef = useRef(DEFAULT_POSITION);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
        const safe = getSafePosition(parsed);
        positionRef.current = safe;
        setPosition(safe);
      }
    } catch {
      // Ignore invalid stored toolbar positions.
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
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleDragMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const next = getSafePosition({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });

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
    const safe = getSafePosition(DEFAULT_POSITION);
    positionRef.current = safe;
    setPosition(safe);
    persistPosition(safe);
  }, [persistPosition]);

  const headerDragProps = {
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

      <FloatingShell isDragging={isDragging} position={position} styleWidth={isCollapsed ? 180 : PALETTE_WIDTH} theme={theme}>
        {isCollapsed ? (
          <button
            type="button"
            aria-label="Open drawing tools"
            title="Open drawing tools"
            onClick={handleToggleCollapse}
            className="relative z-10 flex w-full items-center gap-2 rounded-[18px] px-1.5 py-1 text-xs font-black"
          >
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl', theme.iconRail)}>
              <TbTools size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left">Draw Tools</span>
            <ChevronUp size={14} className={theme.subtle} aria-hidden="true" />
          </button>
        ) : (
          <div className="relative z-10 space-y-2.5">
            <div
              className="flex cursor-grab touch-none items-center justify-between gap-2 active:cursor-grabbing"
              title="Drag to move Draw Tools"
              {...headerDragProps}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl', theme.iconRail)}>
                  <TbTools size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black leading-tight">Draw Tools</p>
                  <p className={cn('truncate text-[9px] font-semibold', theme.subtle)}>Drag to reposition</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Reset draw tools position"
                  title="Reset position"
                  onClick={handleResetPosition}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-xl border', theme.row)}
                >
                  <GripHorizontal size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Collapse drawing tools"
                  title="Collapse drawing tools"
                  onClick={handleToggleCollapse}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-xl border', theme.row)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={cn('space-y-1.5 border-t pt-2.5', theme.divider)}>
              <SectionTitle theme={theme}>Annotate</SectionTitle>
              <div className="grid grid-cols-2 gap-1.5">
                <ToolButton
                  label="Text"
                  active={selectedToolType === 'text_note'}
                  onClick={handleSelectTextNote}
                  theme={theme}
                  icon={<Type size={16} aria-hidden="true" />}
                />
                <ToolButton
                  label="Low Wave"
                  active={selectedToolType === 'less_1'}
                  onClick={handleSelectLess1}
                  theme={theme}
                  icon={<img src={l1} alt="" className="h-5 w-5 object-contain" aria-hidden="true" />}
                />
              </div>
            </div>

            <div className={cn('space-y-1.5 border-t pt-2.5', theme.divider)}>
              <SectionTitle theme={theme}>Draw</SectionTitle>
              <div className="grid grid-cols-2 gap-1.5">
                <ToolButton
                  label={waveActive ? 'Stop Wave' : 'Wave'}
                  active={waveActive}
                  onClick={handleToggleDrawing}
                  theme={theme}
                  icon={waveActive ? <X size={16} aria-hidden="true" /> : <Waves size={16} aria-hidden="true" />}
                />
                <ToolButton
                  label={isFlagDrawing ? 'Stop Flag' : 'Flag'}
                  active={isFlagDrawing}
                  onClick={handleToggleFlagDrawing}
                  theme={theme}
                  icon={<Flag size={16} aria-hidden="true" />}
                />
              </div>
            </div>

            {waveActive && (
              <div className={cn('space-y-1.5 border-t pt-2.5', theme.divider)}>
                <SectionTitle theme={theme}>Wave Mode</SectionTitle>
                <div className="grid grid-cols-2 gap-1.5">
                  <ToolButton
                    label="Open"
                    active={!closedMode}
                    onClick={() => setClosedMode(false)}
                    theme={theme}
                    icon={<Waves size={16} aria-hidden="true" />}
                  />
                  <ToolButton
                    label="Loop"
                    active={closedMode}
                    activeClassName={theme.activeClosed}
                    onClick={() => setClosedMode(true)}
                    theme={theme}
                    icon={<CheckCircle2 size={16} aria-hidden="true" />}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </FloatingShell>
    </>
  );
};

export default DrawToolbar;
