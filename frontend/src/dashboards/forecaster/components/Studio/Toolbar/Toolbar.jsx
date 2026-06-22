import { useMemo } from 'react';
import { TbTools } from 'react-icons/tb';
import { CheckCircle2, ChevronDown, ChevronUp, Flag, PencilLine, Type, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getTheme = (isDarkMode) => ({
  panel: isDarkMode
    ? 'studio-liquid-dark border-white/[0.18] text-white'
    : 'studio-liquid-light border-white/80 text-slate-900',
  group: isDarkMode
    ? 'border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'border-white/80 bg-white/[0.5] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]',
  text: isDarkMode ? 'text-white/80' : 'text-slate-700',
  textMuted: isDarkMode ? 'text-white/45' : 'text-slate-500',
  btnBase: isDarkMode
    ? 'border-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
    : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-950',
  btnActive: isDarkMode
    ? 'border-cyan-300/30 bg-cyan-400/[0.14] text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.08)]'
    : 'border-blue-300 bg-blue-50 text-blue-800 shadow-[0_0_0_1px_rgba(96,165,250,0.16)]',
  modeOpenActive: isDarkMode
    ? 'border-cyan-300/35 bg-cyan-400/[0.16] text-cyan-100'
    : 'border-blue-300 bg-blue-50 text-blue-800',
  modeClosedActive: isDarkMode
    ? 'border-emerald-300/40 bg-emerald-400/[0.16] text-emerald-200'
    : 'border-emerald-300 bg-emerald-50 text-emerald-800',
  accent: isDarkMode ? 'text-cyan-300' : 'text-blue-600',
  accentBg: isDarkMode ? 'bg-cyan-400' : 'bg-blue-500',
  tooltip: isDarkMode
    ? 'studio-liquid-dark border-white/[0.18] text-white'
    : 'studio-liquid-light border-white/80 text-slate-900',
});

const ToolbarDivider = ({ isDarkMode }) => (
  <div className={cn('mx-0.5 h-8 w-px shrink-0', isDarkMode ? 'bg-white/10' : 'bg-slate-200/80')} />
);

const ToolButton = ({ onClick, active, theme, title, hotkey, children, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
    className={cn(
      'group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45',
      disabled && 'cursor-not-allowed opacity-45',
      active ? theme.btnActive : theme.btnBase
    )}
  >
    <span className="relative flex items-center justify-center">
      {children}
      {active && (
        <span className={cn('absolute -bottom-2 h-1 w-5 rounded-full', theme.accentBg)} />
      )}
    </span>

    <div
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap',
        'studio-liquid-panel rounded-lg border px-2.5 py-1.5 opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100',
        theme.tooltip
      )}
    >
      <span className="text-[11px] font-black">{title}</span>
      {hotkey && (
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-bold opacity-60">
          <span>Key</span>
          <kbd className="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">{hotkey}</kbd>
        </div>
      )}
    </div>
  </button>
);

const ModeButton = ({ active, onClick, theme, title, icon: Icon, tone }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={cn(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
      active
        ? tone === 'closed'
          ? theme.modeClosedActive
          : theme.modeOpenActive
        : theme.btnBase
    )}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

const ActiveToolBadge = ({ label, theme, isDarkMode }) => (
  <div
    className={cn(
      'mx-auto mb-1.5 flex min-h-7 w-fit items-center justify-center gap-2 rounded-full border px-2.5 py-1 backdrop-blur-xl',
      isDarkMode ? 'border-cyan-300/15 bg-slate-950/55 shadow-[0_10px_28px_rgba(8,145,178,0.12)]' : 'border-blue-300/30 bg-white/75 shadow-[0_10px_28px_rgba(37,99,235,0.1)]'
    )}
  >
    <span className="relative flex h-2 w-2">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-40', theme.accentBg)} style={{ animationDuration: '2s' }} />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', theme.accentBg)} />
    </span>
    <span className={cn('text-[10px] font-black', theme.text)}>{label}</span>
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
  const selectedToolLabels = useMemo(() => ({
    text_note: 'Text Label',
    less_1: 'Low Wave Marker',
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

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[55] -translate-x-1/2 sm:bottom-5">
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={cn(
            'studio-liquid-panel flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-200',
            theme.panel,
            isDarkMode ? 'hover:bg-slate-950/85' : 'hover:bg-white'
          )}
        >
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
            <TbTools size={14} />
          </span>
          <span className={cn('text-[10px] font-black', theme.text)}>Tools</span>
          <ChevronUp size={13} className={theme.textMuted} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  const selectedLabel = selectedToolLabels[selectedToolType] || selectedToolType;
  const waveActive = isCanvasActive || isDrawing;

  return (
    <>
      <PointInputChoiceModal isOpen={openModals.pointInputChoice} onClose={() => toggleModal('pointInputChoice', false)} onSelect={handlePointInputChoice} isDarkMode={isDarkMode} />
      <MarkerTitleModal isOpen={openModals.markerTitle} onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit} isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal isOpen={openModals.manualInput} onClose={() => toggleModal('manualInput', false)} onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      <div className="fixed bottom-3 left-1/2 z-[55] w-fit max-w-[calc(100vw-1rem)] -translate-x-1/2 px-2 sm:bottom-4">
        {(selectedToolType || waveActive || isFlagDrawing) && (
          <ActiveToolBadge
            label={waveActive ? `Wave Height - ${closedMode ? 'Closed contour' : 'Open line'}` : selectedLabel}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        )}

        <div
          className={cn(
            'studio-liquid-panel relative flex w-fit max-w-[calc(100vw-1rem)] items-center gap-1 overflow-x-auto rounded-2xl border px-2 py-1.5 shadow-2xl',
            '[&::-webkit-scrollbar]:hidden',
            theme.panel
          )}
        >
          <div className={cn('absolute left-8 right-8 top-0 h-px', isDarkMode ? 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent')} />

          <ToolButton onClick={handleToggleCollapse} active={false} theme={theme} title="Collapse drawing tools">
            <ChevronDown size={16} className={theme.textMuted} strokeWidth={2.5} />
          </ToolButton>

          <ToolbarDivider isDarkMode={isDarkMode} />

          <ToolButton onClick={handleSelectTextNote} active={selectedToolType === 'text_note'} theme={theme} title="Text Label" hotkey="T">
            <Type size={17} className={selectedToolType === 'text_note' ? theme.accent : theme.textMuted} strokeWidth={2.4} />
          </ToolButton>

          <ToolButton onClick={handleSelectLess1} active={selectedToolType === 'less_1'} theme={theme} title="Low Wave Marker" hotkey="1">
            <img src={l1} alt="Low wave marker" className="h-6 w-6 object-contain drop-shadow-sm" />
          </ToolButton>

          <ToolbarDivider isDarkMode={isDarkMode} />

          <ToolButton onClick={handleToggleDrawing} active={waveActive} theme={theme} title={waveActive ? 'Stop Wave Height Drawing' : 'Wave Height Drawing'}>
            {waveActive
              ? <X size={17} className={theme.accent} strokeWidth={2.6} />
              : <Waves size={17} className={theme.textMuted} strokeWidth={2.3} />
            }
          </ToolButton>

          <ToolButton onClick={handleToggleFlagDrawing} active={isFlagDrawing} theme={theme} title={isFlagDrawing ? 'Stop Flag Drawing' : 'Flag Drawing'}>
            <Flag size={17} className={isFlagDrawing ? theme.accent : theme.textMuted} strokeWidth={2.2} />
          </ToolButton>

          {waveActive && (
            <>
              <ToolbarDivider isDarkMode={isDarkMode} />
              <ModeButton active={!closedMode} onClick={() => setClosedMode(false)} theme={theme} title="Open line" icon={Waves} tone="open" />
              <ModeButton active={closedMode} onClick={() => setClosedMode(true)} theme={theme} title="Closed contour" icon={CheckCircle2} tone="closed" />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawToolbar;
