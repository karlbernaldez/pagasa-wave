import { useMemo } from 'react';
import { TbTools } from 'react-icons/tb';
import { ChevronRight, Circle, Flag, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';
import lpa from '@/assets/draw_icons/LPA.png';
import hpa from '@/assets/draw_icons/HPA.png';
import storm from '@/assets/draw_icons/hurricane.png';

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
    : 'border-white/80 bg-white/[0.46] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
  text: isDarkMode ? 'text-white/80' : 'text-slate-700',
  textStrong: isDarkMode ? 'text-white' : 'text-slate-950',
  textMuted: isDarkMode ? 'text-white/45' : 'text-slate-500',
  btnBase: isDarkMode
    ? 'border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
    : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900',
  btnActive: isDarkMode
    ? 'border-cyan-300/30 bg-cyan-400/[0.12] text-cyan-200 shadow-[0_0_0_1px_rgba(103,232,249,0.08)]'
    : 'border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(96,165,250,0.15)]',
  accent: isDarkMode ? 'text-cyan-300' : 'text-blue-600',
  accentBg: isDarkMode ? 'bg-cyan-400' : 'bg-blue-500',
  tooltip: isDarkMode
    ? 'bg-slate-950/95 border-white/10 text-white'
    : 'bg-white/95 border-slate-200 text-slate-900',
});

const ToolButton = ({ onClick, active, theme, title, hotkey, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45',
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
        'pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 whitespace-nowrap',
        'rounded-lg border px-3 py-2 opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100',
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

const ToolGroup = ({ theme, children }) => (
  <div className={cn('flex items-center gap-1 rounded-2xl border p-1', theme.group)}>
    {children}
  </div>
);

const ActiveToolBadge = ({ label, theme, isDarkMode }) => (
  <div
    className={cn(
      'mx-auto mb-2 flex min-h-9 w-fit items-center justify-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-xl',
      isDarkMode ? 'border-cyan-300/15 bg-slate-950/55 shadow-[0_10px_28px_rgba(8,145,178,0.12)]' : 'border-blue-300/30 bg-white/75 shadow-[0_10px_28px_rgba(37,99,235,0.1)]'
    )}
  >
    <span className="relative flex h-2 w-2">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-40', theme.accentBg)} style={{ animationDuration: '2s' }} />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', theme.accentBg)} />
    </span>
    <span className={cn('text-[11px] font-black', theme.text)}>{label}</span>
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

  const tools = useMemo(() => [
    {
      id: 'low_pressure',
      label: 'Low Pressure',
      hotkey: 'A',
      modal: 'pointInputChoice',
      icon: <img src={lpa} alt="Low pressure" className="h-7 w-7 object-contain drop-shadow-sm" />,
    },
    {
      id: 'high_pressure',
      label: 'High Pressure',
      hotkey: 'H',
      modal: 'pointInputChoice',
      icon: <img src={hpa} alt="High pressure" className="h-7 w-7 object-contain drop-shadow-sm" />,
    },
    {
      id: 'typhoon',
      label: 'Tropical Cyclone',
      hotkey: 'M',
      modal: 'pointInputChoice',
      icon: <img src={storm} alt="Tropical cyclone" className="h-7 w-7 object-contain drop-shadow-sm" />,
    },
  ], []);

  const {
    isDrawing, isFlagDrawing, isCollapsed, selectedToolType,
    openModals, toggleModal,
    handleToolClick, handlePointInputChoice,
    handleMarkerTitleSubmit, handleManualInputSubmit,
    handleToggleDrawing, handleToggleFlagDrawing,
    handleSelectLess1, handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({ draw, setLayersRef, setLayers, setType, selectedToolRef, onToggleCanvas, onToggleFlagCanvas, projectId });

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={cn(
      'studio-liquid-panel flex min-h-12 items-center gap-2.5 rounded-2xl border px-3.5 py-2 transition-all duration-200',
            theme.panel,
            isDarkMode ? 'hover:bg-slate-950/85' : 'hover:bg-white'
          )}
        >
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
            <TbTools size={17} />
          </span>
          <span className={cn('text-[12px] font-black', theme.text)}>Drawing Tools</span>
          <ChevronRight size={14} className={theme.textMuted} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  const selectedLabel =
    tools.find((tool) => tool.id === selectedToolType)?.label ||
    (selectedToolType === 'less_1' ? 'Less than 1 Meter' : selectedToolType);

  return (
    <>
      <PointInputChoiceModal isOpen={openModals.pointInputChoice} onClose={() => toggleModal('pointInputChoice', false)} onSelect={handlePointInputChoice} isDarkMode={isDarkMode} />
      <MarkerTitleModal isOpen={openModals.markerTitle} onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit} isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal isOpen={openModals.manualInput} onClose={() => toggleModal('manualInput', false)} onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 px-2">
        {selectedToolType && <ActiveToolBadge label={selectedLabel} theme={theme} isDarkMode={isDarkMode} />}

        <div
          className={cn(
            'studio-liquid-panel relative flex max-w-[calc(100vw-1rem)] items-center gap-2 overflow-x-auto rounded-2xl border px-2.5 py-2.5',
            '[&::-webkit-scrollbar]:hidden',
            theme.panel
          )}
        >
          <div className={cn('absolute left-8 right-8 top-0 h-px', isDarkMode ? 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent')} />

          <button
            type="button"
            onClick={handleToggleCollapse}
            title="Collapse drawing tools"
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 rounded-xl border px-2.5 transition-all',
              theme.group,
              isDarkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-white'
            )}
          >
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
              <TbTools size={16} />
            </span>
            <span className={cn('hidden text-[11px] font-black uppercase tracking-wide sm:inline', theme.textMuted)}>
              Tools
            </span>
          </button>

          <ToolGroup theme={theme}>
            {tools.map((tool) => (
              <ToolButton
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                active={selectedToolType === tool.id}
                theme={theme}
                title={tool.label}
                hotkey={tool.hotkey}
              >
                {tool.icon}
              </ToolButton>
            ))}
          </ToolGroup>

          <ToolGroup theme={theme}>
            <ToolButton
              onClick={handleToggleFlagDrawing}
              active={isFlagDrawing}
              theme={theme}
              title={isFlagDrawing ? 'Stop Flag Drawing' : 'Flag Drawing'}
            >
              <Flag size={19} className={isFlagDrawing ? theme.accent : theme.textMuted} strokeWidth={2.2} />
            </ToolButton>

            <ToolButton
              onClick={handleSelectLess1}
              active={selectedToolType === 'less_1'}
              theme={theme}
              title="Less than 1 Meter"
              hotkey="1"
            >
              <img src={l1} alt="Less than 1 meter" className="h-7 w-7 object-contain drop-shadow-sm" />
            </ToolButton>

            <ToolButton
              onClick={handleToggleDrawing}
              active={isCanvasActive}
              theme={theme}
              title={isDrawing ? 'Stop Wave Drawing' : 'Wave Height Drawing'}
            >
              {isDrawing
                ? <X size={20} className={theme.accent} strokeWidth={2.6} />
                : <Waves size={20} className={isCanvasActive ? theme.accent : theme.textMuted} strokeWidth={2.3} />
              }
            </ToolButton>
          </ToolGroup>

          {isCanvasActive && (
            <ToolGroup theme={theme}>
              <button
                type="button"
                onClick={() => setClosedMode((previous) => !previous)}
                title={closedMode ? 'Closed shape' : 'Open shape'}
                className={cn(
                  'group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150',
                  closedMode
                    ? 'border-emerald-300/30 bg-emerald-400/[0.12] text-emerald-300'
                    : 'border-rose-300/30 bg-rose-400/[0.12] text-rose-300'
                )}
              >
                <Circle
                  size={18}
                  strokeWidth={2.5}
                  fill={closedMode ? 'currentColor' : 'none'}
                />
                <span
                  className={cn(
                    'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black',
                    closedMode ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'
                  )}
                >
                  {closedMode ? 'C' : 'O'}
                </span>
              </button>
            </ToolGroup>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawToolbar;
