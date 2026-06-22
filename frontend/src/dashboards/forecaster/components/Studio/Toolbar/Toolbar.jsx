import { useMemo } from 'react';
import { TbTools } from 'react-icons/tb';
import { CheckCircle2, ChevronDown, ChevronUp, Flag, Type, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getTheme = (isDarkMode) => ({
  dock: isDarkMode
    ? 'border-white/15 bg-slate-950/90 text-slate-100 shadow-black/45'
    : 'border-white/85 bg-white/95 text-slate-900 shadow-slate-500/25',
  button: isDarkMode
    ? 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white'
    : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
  active: isDarkMode
    ? 'border-cyan-300/35 bg-cyan-400/20 text-cyan-100'
    : 'border-blue-300 bg-blue-50 text-blue-800',
  activeClosed: isDarkMode
    ? 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100'
    : 'border-emerald-300 bg-emerald-50 text-emerald-800',
  divider: isDarkMode ? 'bg-white/10' : 'bg-slate-200',
  subtle: isDarkMode ? 'text-slate-400' : 'text-slate-500',
});

const Divider = ({ theme }) => (
  <div className={cn('h-7 w-px shrink-0', theme.divider)} aria-hidden="true" />
);

const DockButton = ({ active, activeClassName, children, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
      active ? activeClassName || theme.active : theme.button
    )}
  >
    {children}
  </button>
);

const CollapsedDock = ({ isDarkMode, onOpen, theme }) => (
  <div className="fixed bottom-5 left-1/2 z-[55] -translate-x-1/2">
    <button
      type="button"
      aria-label="Open drawing tools"
      title="Open drawing tools"
      onClick={onOpen}
      className={cn(
        'flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-black backdrop-blur-xl transition-colors',
        theme.dock,
        isDarkMode ? 'hover:bg-slate-900' : 'hover:bg-white'
      )}
    >
      <TbTools size={16} aria-hidden="true" />
      Tools
      <ChevronUp size={14} className={theme.subtle} aria-hidden="true" />
    </button>
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
  useMemo(() => ({
    text_note: 'Text label',
    less_1: 'Low wave marker',
  }), []);

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

  if (isCollapsed) {
    return <CollapsedDock isDarkMode={isDarkMode} onOpen={handleToggleCollapse} theme={theme} />;
  }

  return (
    <>
      <PointInputChoiceModal isOpen={openModals.pointInputChoice} onClose={() => toggleModal('pointInputChoice', false)} onSelect={handlePointInputChoice} isDarkMode={isDarkMode} />
      <MarkerTitleModal isOpen={openModals.markerTitle} onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit} isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal isOpen={openModals.manualInput} onClose={() => toggleModal('manualInput', false)} onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      <div className="fixed bottom-5 left-1/2 z-[55] max-w-[calc(100vw-24px)] -translate-x-1/2">
        <div
          role="toolbar"
          aria-label="Drawing tools"
          className={cn(
            'flex h-13 items-center justify-center gap-1 rounded-2xl border px-2 py-1.5 shadow-2xl backdrop-blur-xl',
            theme.dock
          )}
        >
          <DockButton label="Collapse drawing tools" onClick={handleToggleCollapse} theme={theme}>
            <ChevronDown size={18} className={theme.subtle} aria-hidden="true" />
          </DockButton>

          <Divider theme={theme} />

          <DockButton label="Text label" active={selectedToolType === 'text_note'} onClick={handleSelectTextNote} theme={theme}>
            <Type size={18} aria-hidden="true" />
          </DockButton>

          <DockButton label="Low wave marker" active={selectedToolType === 'less_1'} onClick={handleSelectLess1} theme={theme}>
            <img src={l1} alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
          </DockButton>

          <Divider theme={theme} />

          <DockButton label={waveActive ? 'Stop wave drawing' : 'Wave drawing'} active={waveActive} onClick={handleToggleDrawing} theme={theme}>
            {waveActive ? <X size={18} aria-hidden="true" /> : <Waves size={18} aria-hidden="true" />}
          </DockButton>

          <DockButton label={isFlagDrawing ? 'Stop flag drawing' : 'Flag drawing'} active={isFlagDrawing} onClick={handleToggleFlagDrawing} theme={theme}>
            <Flag size={18} aria-hidden="true" />
          </DockButton>

          {waveActive && (
            <>
              <Divider theme={theme} />
              <DockButton label="Open line mode" active={!closedMode} onClick={() => setClosedMode(false)} theme={theme}>
                <Waves size={18} aria-hidden="true" />
              </DockButton>
              <DockButton label="Closed contour mode" active={closedMode} activeClassName={theme.activeClosed} onClick={() => setClosedMode(true)} theme={theme}>
                <CheckCircle2 size={18} aria-hidden="true" />
              </DockButton>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawToolbar;
