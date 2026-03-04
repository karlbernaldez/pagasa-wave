import { useMemo } from 'react';
import { TbTools } from 'react-icons/tb';
import { ChevronRight, X, Circle } from 'lucide-react';

import wave from '@/assets/draw_icons/wave.png';
import l1 from '@/assets/draw_icons/L1.png';
import lpa from '@/assets/draw_icons/LPA.png';
import hpa from '@/assets/draw_icons/HPA.png';
import storm from '@/assets/draw_icons/hurricane.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { getThemeStyles } from './config/toolbarConfig';
import { useDrawToolbar } from './hooks/useDrawToolbar';
import { ToolButton, ToolbarDivider, ActiveToolIndicator } from './ToolbarParts';

const DrawToolbar = ({
  draw,
  onToggleCanvas,
  onToggleFlagCanvas,
  isCanvasActive,
  isDarkMode,
  setLayersRef,
  setLayers,
  closedMode,
  setClosedMode,
  setType,
  selectedToolRef,
}) => {
  const theme = getThemeStyles(isDarkMode);

  const tools = useMemo(() => [
    { id: 'low_pressure',  icon: <img src={lpa}   alt="Low Pressure Area" className="w-4 h-5" />, label: 'Low Pressure Area', hotkey: 'A', modal: 'pointInputChoice' },
    { id: 'high_pressure', icon: <img src={hpa}   alt="High Pressure Area" className="w-4 h-5" />, label: 'High Pressure Area', hotkey: 'H', modal: 'pointInputChoice' },
    { id: 'typhoon',       icon: <img src={storm} alt="Draw Storm" className="w-5 h-5" />,        label: 'Draw Storm',        hotkey: 'M', modal: 'pointInputChoice' },
  ], []);

  const {
    isDrawing, isFlagDrawing, isCollapsed, selectedToolType,
    openModals, toggleModal,
    handleToolClick, handlePointInputChoice,
    handleMarkerTitleSubmit, handleManualInputSubmit,
    handleToggleDrawing, handleToggleFlagDrawing,
    handleSelectLess1, handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({ draw, setLayersRef, setLayers, setType, selectedToolRef, onToggleCanvas, onToggleFlagCanvas });

  // ── Collapsed pill ───────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={handleToggleCollapse}
          className={`group flex items-center gap-2 px-3 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 shadow-lg ${theme.container}`}
        >
          <TbTools size={16} className={theme.accent} strokeWidth={2.5} />
          <span className={`text-xs font-semibold ${theme.text}`}>Drawing Tools</span>
          <ChevronRight size={14} className={theme.textMuted} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Modals ── */}
      <PointInputChoiceModal
        isOpen={openModals.pointInputChoice}
        onClose={() => toggleModal('pointInputChoice', false)}
        onSelect={handlePointInputChoice}
        isDarkMode={isDarkMode}
      />
      <MarkerTitleModal
        isOpen={openModals.markerTitle}
        onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }}
        onSubmit={handleMarkerTitleSubmit}
        isDarkMode={isDarkMode}
        markerType={selectedToolType}
      />
      <ManualInputModal
        isOpen={openModals.manualInput}
        onClose={() => toggleModal('manualInput', false)}
        onSubmit={handleManualInputSubmit}
        isDarkMode={isDarkMode}
      />
      <FeatureNotAvailableModal
        isOpen={openModals.featureNotAvailable}
        onClose={() => toggleModal('featureNotAvailable', false)}
      />

      {/* ── Toolbar ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl backdrop-blur-xl border shadow-xl ${theme.container}`}>

          {/* Collapse */}
          <ToolButton onClick={handleToggleCollapse} isActive={false} theme={theme} title="Collapse Toolbar">
            <TbTools size={16} className={theme.textMuted} strokeWidth={2.5} />
          </ToolButton>

          <ToolbarDivider theme={theme} />

          {/* Weather tool buttons */}
          {tools.map((tool) => (
            <ToolButton
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              isActive={selectedToolType === tool.id}
              theme={theme}
              title={tool.label}
              hotkey={tool.hotkey}
            >
              {tool.icon}
            </ToolButton>
          ))}

          <ToolbarDivider theme={theme} />

          {/* Flag drawing */}
          <ToolButton
            onClick={handleToggleFlagDrawing}
            isActive={isFlagDrawing}
            theme={theme}
            title={isFlagDrawing ? 'Stop Flag Drawing' : 'Start Flag Drawing'}
          >
            <span className="text-lg">{isFlagDrawing ? '❌' : '🚩'}</span>
          </ToolButton>

          {/* Less than 1m */}
          <ToolButton
            onClick={handleSelectLess1}
            isActive={selectedToolType === 'less_1'}
            theme={theme}
            title="Mark Less than 1 Meter"
            hotkey="1"
          >
            <img src={l1} alt="Less than 1 Meter" className="w-5 h-5" />
          </ToolButton>

          {/* Wave height drawing */}
          <ToolButton
            onClick={handleToggleDrawing}
            isActive={isCanvasActive}
            theme={theme}
            title={isDrawing ? 'Stop Wave Height Drawing' : 'Start Wave Height Drawing'}
          >
            {isDrawing
              ? <X size={20} className={theme.accent} strokeWidth={2.5} />
              : <img src={wave} alt="Wave Height Drawing" className="w-5 h-5" />
            }
          </ToolButton>

          {/* Closed mode toggle (canvas only) */}
          {isCanvasActive && (
            <>
              <ToolbarDivider theme={theme} />
              <button
                onClick={() => setClosedMode((prev) => !prev)}
                className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
                  closedMode
                    ? 'bg-green-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
                    : 'bg-red-500/20 border-red-400/40 shadow-lg shadow-red-500/20'
                }`}
                title={closedMode ? 'Closed Shape Mode' : 'Open Shape Mode'}
              >
                <Circle
                  size={20}
                  className={closedMode ? 'text-green-400' : 'text-red-400'}
                  strokeWidth={2.5}
                  fill={closedMode ? 'currentColor' : 'none'}
                />
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  closedMode ? 'bg-green-400 text-green-950' : 'bg-red-400 text-red-950'
                }`}>
                  {closedMode ? 'C' : 'O'}
                </div>
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
                  <div className={`text-xs font-semibold ${theme.text}`}>
                    {closedMode ? 'Closed Shape Mode' : 'Open Shape Mode'}
                  </div>
                  <div className={`text-[10px] mt-1 ${theme.textMuted}`}>Click to toggle</div>
                </div>
              </button>
            </>
          )}
        </div>

        <ActiveToolIndicator
          selectedToolType={selectedToolType}
          tools={tools}
          isDarkMode={isDarkMode}
          theme={theme}
        />
      </div>
    </>
  );
};

export default DrawToolbar;