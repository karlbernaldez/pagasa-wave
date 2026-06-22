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
  shell: isDarkMode
    ? 'border-cyan-200/20 bg-[#0b2638]/72 text-cyan-50 shadow-[0_18px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.16)]'
    : 'border-white/80 bg-white/70 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]',
  rail: isDarkMode
    ? 'bg-white/[0.055] ring-1 ring-white/10'
    : 'bg-white/45 ring-1 ring-white/70',
  button: isDarkMode
    ? 'border-white/8 bg-white/[0.035] text-cyan-100/68 hover:border-cyan-200/24 hover:bg-cyan-300/10 hover:text-cyan-50'
    : 'border-white/70 bg-white/45 text-slate-600 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-800',
  active: isDarkMode
    ? 'border-cyan-200/36 bg-cyan-300/18 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-blue-300/80 bg-blue-100/80 text-blue-800 shadow-[0_0_22px_rgba(59,130,246,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  activeClosed: isDarkMode
    ? 'border-emerald-200/38 bg-emerald-300/18 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-emerald-300/80 bg-emerald-100/80 text-emerald-800 shadow-[0_0_22px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]',
  divider: isDarkMode ? 'bg-cyan-100/14' : 'bg-slate-300/70',
  subtle: isDarkMode ? 'text-cyan-100/58' : 'text-slate-500',
});

const Divider = ({ theme }) => (
  <div className={cn('h-8 w-px shrink-0', theme.divider)} aria-hidden="true" />
);

const LiquidButton = ({ active, activeClassName, children, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80',
      'before:pointer-events-none before:absolute before:inset-x-2 before:top-1 before:h-px before:rounded-full before:bg-white/28',
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
        'relative flex h-12 items-center gap-2 rounded-[22px] border px-4 text-xs font-black backdrop-blur-2xl transition-all',
        'before:pointer-events-none before:absolute before:inset-x-4 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
        theme.shell,
        isDarkMode ? 'hover:bg-[#0f3045]/78' : 'hover:bg-white/82'
      )}
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-2xl', theme.rail)}>
        <TbTools size={16} aria-hidden="true" />
      </span>
      <span>Draw Tools</span>
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
            'relative flex min-h-16 items-center justify-center gap-1.5 rounded-[26px] border px-2.5 py-2 shadow-2xl backdrop-blur-2xl',
            'before:pointer-events-none before:absolute before:inset-x-8 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
            'after:pointer-events-none after:absolute after:inset-1 after:rounded-[22px] after:ring-1 after:ring-white/10',
            theme.shell
          )}
        >
          <LiquidButton label="Collapse drawing tools" onClick={handleToggleCollapse} theme={theme}>
            <ChevronDown size={18} className={theme.subtle} aria-hidden="true" />
          </LiquidButton>

          <Divider theme={theme} />

          <LiquidButton label="Text label" active={selectedToolType === 'text_note'} onClick={handleSelectTextNote} theme={theme}>
            <Type size={18} aria-hidden="true" />
          </LiquidButton>

          <LiquidButton label="Low wave marker" active={selectedToolType === 'less_1'} onClick={handleSelectLess1} theme={theme}>
            <img src={l1} alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
          </LiquidButton>

          <Divider theme={theme} />

          <LiquidButton label={waveActive ? 'Stop wave drawing' : 'Wave drawing'} active={waveActive} onClick={handleToggleDrawing} theme={theme}>
            {waveActive ? <X size={18} aria-hidden="true" /> : <Waves size={18} aria-hidden="true" />}
          </LiquidButton>

          <LiquidButton label={isFlagDrawing ? 'Stop flag drawing' : 'Flag drawing'} active={isFlagDrawing} onClick={handleToggleFlagDrawing} theme={theme}>
            <Flag size={18} aria-hidden="true" />
          </LiquidButton>

          {waveActive && (
            <>
              <Divider theme={theme} />
              <LiquidButton label="Open line mode" active={!closedMode} onClick={() => setClosedMode(false)} theme={theme}>
                <Waves size={18} aria-hidden="true" />
              </LiquidButton>
              <LiquidButton label="Closed contour mode" active={closedMode} activeClassName={theme.activeClosed} onClick={() => setClosedMode(true)} theme={theme}>
                <CheckCircle2 size={18} aria-hidden="true" />
              </LiquidButton>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawToolbar;
