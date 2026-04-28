import { useMemo } from 'react';
import { TbTools } from 'react-icons/tb';
import { ChevronRight, X, Circle, Waves, Wind, TrendingDown, TrendingUp, Flag, Ruler } from 'lucide-react';

import wave  from '@/assets/draw_icons/wave.png';
import l1    from '@/assets/draw_icons/L1.png';
import lpa   from '@/assets/draw_icons/LPA.png';
import hpa   from '@/assets/draw_icons/HPA.png';
import storm from '@/assets/draw_icons/hurricane.png';

import PointInputChoiceModal    from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal         from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal         from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const getTheme = (isDarkMode) => ({
  bg:          isDarkMode ? 'bg-black/40'     : 'bg-white/60',
  border:      isDarkMode ? 'border-white/10' : 'border-white/40',
  text:        isDarkMode ? 'text-white/80'   : 'text-slate-700',
  textMuted:   isDarkMode ? 'text-white/30'   : 'text-slate-400',
  divider:     isDarkMode ? 'bg-white/8'      : 'bg-slate-200/60',
  btnBase:     isDarkMode ? 'border-white/0 hover:bg-white/8 hover:border-white/10'
                          : 'border-transparent hover:bg-black/6 hover:border-black/8',
  btnActive:   isDarkMode ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                          : 'bg-blue-500/10 border-blue-400/30 text-blue-600',
  accent:      isDarkMode ? 'text-cyan-400'  : 'text-blue-500',
  accentBg:    isDarkMode ? 'bg-cyan-400'    : 'bg-blue-500',
  tooltip:     isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200',
});

// ─── Single tool button ───────────────────────────────────────────────────────
const Btn = ({ onClick, active, theme, title, hotkey, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      group relative w-9 h-9
      flex items-center justify-center
      rounded-lg border transition-all duration-150
      ${active ? theme.btnActive : theme.btnBase}
    `}
  >
    {children}

    {/* Tooltip */}
    <div className={`
      absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2
      px-2.5 py-1.5 rounded-lg border backdrop-blur-xl
      opacity-0 group-hover:opacity-100 pointer-events-none
      transition-opacity duration-150 whitespace-nowrap z-50
      ${theme.tooltip}
    `}>
      <span className={`text-[11px] font-semibold ${theme.text}`}>{title}</span>
      {hotkey && (
        <div className={`flex items-center gap-1 mt-0.5 ${theme.textMuted}`}>
          <span className="text-[9px]">Press</span>
          <kbd className={`px-1 py-px rounded-sm text-[9px] font-bold ${theme.btnActive}`}>{hotkey}</kbd>
        </div>
      )}
    </div>
  </button>
);

const Divider = ({ theme }) => (
  <div className={`w-px self-stretch my-1.5 ${theme.divider}`} />
);

// ─── DrawToolbar ──────────────────────────────────────────────────────────────
const DrawToolbar = ({
  draw, onToggleCanvas, onToggleFlagCanvas,
  isCanvasActive, isDarkMode,
  setLayersRef, setLayers,
  closedMode, setClosedMode,
  setType, selectedToolRef,
}) => {
  const theme = getTheme(isDarkMode);

  const tools = useMemo(() => [
    {
      id: 'low_pressure',
      label: 'Low Pressure',
      hotkey: 'A',
      modal: 'pointInputChoice',
      icon: (
        <span className={`text-xs font-black leading-none ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          L
        </span>
      ),
    },
    {
      id: 'high_pressure',
      label: 'High Pressure',
      hotkey: 'H',
      modal: 'pointInputChoice',
      icon: (
        <span className={`text-xs font-black leading-none ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          H
        </span>
      ),
    },
    {
      id: 'typhoon',
      label: 'Tropical Cyclone',
      hotkey: 'M',
      modal: 'pointInputChoice',
      icon: <img src={storm} alt="Cyclone" className="w-5 h-5 object-contain opacity-85" />,
    },
  ], [isDarkMode]);

  const {
    isDrawing, isFlagDrawing, isCollapsed, selectedToolType,
    openModals, toggleModal,
    handleToolClick, handlePointInputChoice,
    handleMarkerTitleSubmit, handleManualInputSubmit,
    handleToggleDrawing, handleToggleFlagDrawing,
    handleSelectLess1, handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({ draw, setLayersRef, setLayers, setType, selectedToolRef, onToggleCanvas, onToggleFlagCanvas });

  // ── Collapsed pill ────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={handleToggleCollapse}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl
            backdrop-blur-xl border shadow-lg
            transition-all duration-200
            ${isDarkMode
              ? 'bg-black/40 border-white/10 hover:bg-black/50'
              : 'bg-white/60 border-white/40 hover:bg-white/70'
            }
          `}
        >
          <TbTools size={15} className={isDarkMode ? 'text-cyan-400/70' : 'text-blue-500/70'} />
          <span className={`text-[11px] font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
            Drawing Tools
          </span>
          <ChevronRight size={11} className={isDarkMode ? 'text-white/25' : 'text-slate-300'} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <PointInputChoiceModal  isOpen={openModals.pointInputChoice}  onClose={() => toggleModal('pointInputChoice', false)}  onSelect={handlePointInputChoice}  isDarkMode={isDarkMode} />
      <MarkerTitleModal       isOpen={openModals.markerTitle}       onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit}  isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal       isOpen={openModals.manualInput}       onClose={() => toggleModal('manualInput', false)}       onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      {/* Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">

        {/* Active tool label — floats above */}
        {selectedToolType && (() => {
          const label =
            tools.find((t) => t.id === selectedToolType)?.label ||
            (selectedToolType === 'less_1' ? 'Less than 1 Meter' : selectedToolType);
          return (
            <div className={`
              flex items-center justify-center gap-1.5 mb-1.5
              px-2.5 py-1 rounded-lg border mx-auto w-fit
              backdrop-blur-xl
              ${isDarkMode
                ? 'bg-black/30 border-cyan-400/15'
                : 'bg-white/50 border-blue-400/15'
              }
            `}>
              <span className={`relative flex w-1.5 h-1.5`}>
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping ${theme.accentBg}`} style={{ animationDuration: '2s' }} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.accentBg}`} />
              </span>
              <span className={`text-[10px] font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{label}</span>
            </div>
          );
        })()}

        <div className={`
          flex items-center gap-1.5 px-3 py-2.5 rounded-2xl
          backdrop-blur-xl border shadow-xl relative
          ${theme.bg} ${theme.border}
        `}>
          {/* Top accent — Tier 1 */}
          <div className={`absolute top-0 left-6 right-6 h-px ${
            isDarkMode
              ? 'bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent'
              : 'bg-gradient-to-r from-transparent via-blue-400/25 to-transparent'
          }`} />

          {/* Collapse */}
          <Btn onClick={handleToggleCollapse} active={false} theme={theme} title="Collapse">
            <TbTools size={15} className={theme.textMuted} />
          </Btn>

          <Divider theme={theme} />

          {/* Weather tools */}
          {tools.map((tool) => (
            <Btn
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              active={selectedToolType === tool.id}
              theme={theme}
              title={tool.label}
              hotkey={tool.hotkey}
            >
              {tool.icon}
            </Btn>
          ))}

          <Divider theme={theme} />

          {/* Flag */}
          <Btn onClick={handleToggleFlagDrawing} active={isFlagDrawing} theme={theme} title={isFlagDrawing ? 'Stop Flag Drawing' : 'Flag Drawing'}>
            <Flag size={15} className={isFlagDrawing ? (isDarkMode ? 'text-cyan-400' : 'text-blue-600') : theme.textMuted} strokeWidth={2} />
          </Btn>

          {/* Less than 1m */}
          <Btn onClick={handleSelectLess1} active={selectedToolType === 'less_1'} theme={theme} title="Less than 1 Meter" hotkey="1">
            <img src={l1} alt="<1m" className="w-5 h-5 object-contain opacity-80" />
          </Btn>

          {/* Wave height */}
          <Btn onClick={handleToggleDrawing} active={isCanvasActive} theme={theme} title={isDrawing ? 'Stop Wave Drawing' : 'Wave Height Drawing'}>
            {isDrawing
              ? <X size={15} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2.5} />
              : <Waves size={15} className={isCanvasActive ? (isDarkMode ? 'text-cyan-400' : 'text-blue-600') : theme.textMuted} strokeWidth={2} />
            }
          </Btn>

          {/* Closed/open shape — canvas only */}
          {isCanvasActive && (
            <>
              <Divider theme={theme} />
              <button
                onClick={() => setClosedMode((p) => !p)}
                title={closedMode ? 'Closed shape' : 'Open shape'}
                className={`
                  group relative w-9 h-9
                  flex items-center justify-center
                  rounded-lg border transition-all duration-150
                  ${closedMode
                    ? 'bg-emerald-500/12 border-emerald-400/25'
                    : 'bg-rose-500/12 border-rose-400/25'
                  }
                `}
              >
                <Circle
                  size={15}
                  className={closedMode ? 'text-emerald-400' : 'text-rose-400'}
                  strokeWidth={2.5}
                  fill={closedMode ? 'currentColor' : 'none'}
                />
                <span className={`
                  absolute -top-1 -right-1 w-3 h-3 rounded-full
                  flex items-center justify-center text-[7px] font-black
                  ${closedMode ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'}
                `}>
                  {closedMode ? 'C' : 'O'}
                </span>
                <div className={`
                  absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2
                  px-2.5 py-1.5 rounded-lg border backdrop-blur-xl
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-150 whitespace-nowrap z-50
                  ${theme.tooltip}
                `}>
                  <span className={`text-[11px] font-semibold ${theme.text}`}>
                    {closedMode ? 'Closed shape' : 'Open shape'}
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawToolbar;