import { v4 as uuidv4 } from 'uuid';
import { TbTools } from 'react-icons/tb';
import wave from "@/assets/draw_icons/wave.png";
import l1 from "@/assets/draw_icons/L1.png";
import lpa from "@/assets/draw_icons/LPA.png";
import hpa from "@/assets/draw_icons/HPA.png";
import storm from "@/assets/draw_icons/hurricane.png";
import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';
import { saveMarker } from "@/utils/mapUtils";
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  handleDrawModeChange, 
  savePointFeature, 
  toggleDrawing, 
  toggleFlagDrawing, 
  startDrawing, 
  startFlagDrawing, 
  stopDrawing, 
  stopFlagDrawing, 
  toggleCollapse 
} from './utils/ToolBarUtils';
import { ChevronRight, X, Circle, Waves } from 'lucide-react';

const DrawToolbar = ({ 
  draw, 
  mapRef, 
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
  title 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlagDrawing, setIsFlagDrawing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedToolType, setSelectedToolType] = useState(null);
  const [manualInputData, setManualInputData] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [openModals, setOpenModals] = useState({ 
    featureNotAvailable: false, 
    pointInputChoice: false, 
    manualInput: false 
  });

  useEffect(() => {
    if (setLayersRef?.current !== setLayers) {
      setLayersRef.current = setLayers;
    }
  }, [setLayersRef, setLayers]);

  const toggleModal = (modalKey, isOpen) => {
    setOpenModals(prev => ({ ...prev, [modalKey]: isOpen }));
  };

  const tools = useMemo(() => [
    {
      id: 'low_pressure',
      icon: <img src={lpa} alt="Low Pressure Area" className="w-4 h-5" />,
      label: 'Low Pressure Area',
      hotkey: 'A',
      modal: 'pointInputChoice',
    },
    {
      id: 'high_pressure',
      icon: <img src={hpa} alt="High Pressure Area" className="w-4 h-5" />,
      label: 'High Pressure Area',
      hotkey: 'H',
      modal: 'pointInputChoice',
    },
    {
      id: 'typhoon',
      icon: <img src={storm} alt="Draw Storm" className="w-5 h-5" />,
      label: 'Draw Storm',
      hotkey: 'M',
      modal: 'pointInputChoice',
    },
  ], []);

  const handleToolClick = (tool) => {
    selectedToolRef.current = tool.id;
    setSelectedToolType(tool.id);
    if (setType) {
      setType(tool.id);
    }

    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);

    if (tool.modal) {
      toggleModal(tool.modal, true);
      return;
    }

    handleDrawModeChange(tool.id, draw, setLayersRef);
  };

  const handlePointInputChoice = (method) => {
    toggleModal('pointInputChoice', false);
    const selectedType = selectedToolRef.current || 'typhoon';

    if (method === 'manual') {
      toggleModal('manualInput', true);
    } else if (method === 'map') {
      if (['typhoon', 'low_pressure', 'high_pressure', 'less_1'].includes(selectedType)) {
        handleDrawModeChange('draw_point', draw, setLayersRef);

        const map = mapRef.current;
        if (!map) {
          console.warn('Map is not ready yet.');
          return;
        }

        const onDrawCreate = (e) => {
          const point = e.features[0];
          const [lng, lat] = point.geometry.coordinates;
          const coords = [lng, lat];

          if (selectedType.toLowerCase() === 'less_1') {
            const uuid = uuidv4();
            const title = `Low Waves_${uuid}`;
            setShowTitleModal(false);
            saveMarker({ lat, lng }, mapRef, setShowTitleModal, selectedType)(title);
            savePointFeature({ coords, title, selectedType, setLayersRef });
          }

          map.off('draw.create', onDrawCreate);
        };

        map.on('draw.create', onDrawCreate);
      }
    }
  };

  const handleManualInputSubmit = async (data) => {
    const selectedType = selectedToolRef.current || 'typhoon';
    if (setType) setType(selectedType);

    const coords = [parseFloat(data.lng), parseFloat(data.lat)];
    const title = data.title;

    saveMarker({ lat: data.lat, lng: data.lng }, mapRef, setShowTitleModal, selectedType)(title);
    savePointFeature({ coords, title, selectedType, setLayersRef });

    setManualInputData(data);
    toggleModal('manualInput', false);
  };

  const handleDrawing = useCallback((event) => {
    // Keyboard shortcuts implementation
  }, [tools, draw, isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas, setLayersRef, setLayers]);

  useEffect(() => {
    window.addEventListener('keydown', handleDrawing);
    return () => window.removeEventListener('keydown', handleDrawing);
  }, [handleDrawing]);

  const toggleCollapseToolbar = () => toggleCollapse(setIsCollapsed);

  // Theme-aware styles matching ProjectDashboard
  const getThemeStyles = () => {
    if (isDarkMode) {
      console.log('Dark mode styles applied');
      return {
        container: 'bg-black/40 border-white/20',
        button: 'bg-white/5 hover:bg-white/10 border-white/10',
        buttonActive: 'bg-cyan-500/20 border-cyan-400/40 shadow-lg shadow-cyan-500/20',
        text: 'text-white',
        textMuted: 'text-white/60',
        divider: 'bg-white/10',
        tooltip: 'bg-black/90 border-white/20',
        accent: 'text-cyan-400',
        accentBg: 'bg-cyan-400',
      };
    } else {
      console.log('Light mode styles applied');
      return {
        container: 'bg-white/60 border-white/40',
        button: 'bg-black/5 hover:bg-black/10 border-black/10',
        buttonActive: 'bg-blue-500/20 border-blue-400/40 shadow-lg shadow-blue-500/20',
        text: 'text-slate-800',
        textMuted: 'text-slate-600',
        divider: 'bg-black/10',
        tooltip: 'bg-white/90 border-black/20',
        accent: 'text-blue-600',
        accentBg: 'bg-blue-600',
      };
    }
  };

  const theme = getThemeStyles();

  // Collapsed pill view
  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={toggleCollapseToolbar}
          className={`group flex items-center gap-2 px-3 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 shadow-lg ${theme.container}`}
        >
          <TbTools 
            size={16} 
            className={theme.accent}
            strokeWidth={2.5}
          />
          <span className={`text-xs font-semibold ${theme.text}`}>
            Drawing Tools
          </span>
          <ChevronRight 
            size={14} 
            className={theme.textMuted}
            strokeWidth={2.5}
          />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <PointInputChoiceModal
        isOpen={openModals.pointInputChoice}
        onClose={() => toggleModal('pointInputChoice', false)}
        onSelect={handlePointInputChoice}
      />

      <FeatureNotAvailableModal
        isOpen={openModals.featureNotAvailable}
        onClose={() => toggleModal('featureNotAvailable', false)}
      />

      <ManualInputModal
        isOpen={openModals.manualInput}
        onClose={() => toggleModal('manualInput', false)}
        onSubmit={handleManualInputSubmit}
      />

      {/* Main Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl backdrop-blur-xl border shadow-xl ${theme.container}`}>
          
          {/* Collapse Button */}
          <button
            onClick={toggleCollapseToolbar}
            className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${theme.button}`}
            title="Collapse Toolbar"
          >
            <TbTools 
              size={16} 
              className={theme.textMuted}
              strokeWidth={2.5}
            />
          </button>

          {/* Divider */}
          <div className={`w-px h-8 ${theme.divider}`} />

          {/* Tool Buttons */}
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
                selectedToolType === tool.id ? theme.buttonActive : theme.button
              }`}
              title={tool.label}
            >
              {tool.icon}
              
              {/* Tooltip */}
              <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
                <div className={`text-xs font-semibold ${theme.text}`}>
                  {tool.label}
                </div>
                {tool.hotkey && (
                  <div className={`text-[10px] mt-1 ${theme.textMuted}`}>
                    Press <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${theme.buttonActive}`}>
                      {tool.hotkey}
                    </kbd>
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Divider */}
          <div className={`w-px h-8 ${theme.divider}`} />

          {/* Flag Drawing Button */}
          <button
            onClick={() => {
              if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
              toggleFlagDrawing(isFlagDrawing, setIsFlagDrawing, onToggleFlagCanvas);
            }}
            className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
              isFlagDrawing ? theme.buttonActive : theme.button
            }`}
            title={isFlagDrawing ? 'Stop Flag Drawing' : 'Start Flag Drawing'}
          >
            <span className="text-lg">{isFlagDrawing ? '❌' : '🚩'}</span>
            
            {/* Tooltip */}
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
              <div className={`text-xs font-semibold ${theme.text}`}>
                {isFlagDrawing ? 'Stop Flag Drawing' : 'Start Flag Drawing'}
              </div>
            </div>
          </button>

          {/* Less than 1 Meter Button */}
          <button
            onClick={() => {
              selectedToolRef.current = 'less_1';
              setSelectedToolType('less_1');

              if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
              if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);

              toggleModal('pointInputChoice', true);
            }}
            className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
              selectedToolType === 'less_1' ? theme.buttonActive : theme.button
            }`}
            title="Mark Less than 1 Meter"
          >
            <img src={l1} alt="Less than 1 Meter" className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
              <div className={`text-xs font-semibold ${theme.text}`}>
                Mark Less than 1 Meter
              </div>
              <div className={`text-[10px] mt-1 ${theme.textMuted}`}>
                Press <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${theme.buttonActive}`}>1</kbd>
              </div>
            </div>
          </button>

          {/* Wave Height Drawing Button */}
          <button
            onClick={() => {
              if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
              toggleDrawing(isDrawing, setIsDrawing, onToggleCanvas);
            }}
            className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
              isCanvasActive ? theme.buttonActive : theme.button
            }`}
            title={isDrawing ? 'Stop Wave Height Drawing' : 'Start Wave Height Drawing'}
          >
            {isDrawing ? (
              <X size={20} className={theme.accent} strokeWidth={2.5} />
            ) : (
              <img src={wave} alt="Wave Height Drawing" className="w-5 h-5" />
            )}
            
            {/* Tooltip */}
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
              <div className={`text-xs font-semibold ${theme.text}`}>
                {isDrawing ? 'Stop Wave Height Drawing' : 'Start Wave Height Drawing'}
              </div>
            </div>
          </button>

          {/* Closed Mode Toggle (only show when canvas is active) */}
          {isCanvasActive && (
            <>
              <div className={`w-px h-8 ${theme.divider}`} />
              <button
                onClick={() => setClosedMode((prev) => !prev)}
                className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
                  closedMode
                    ? isDarkMode 
                      ? 'bg-green-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
                      : 'bg-green-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
                    : isDarkMode
                      ? 'bg-red-500/20 border-red-400/40 shadow-lg shadow-red-500/20'
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
                
                {/* Mode Badge */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  closedMode ? 'bg-green-400 text-green-950' : 'bg-red-400 text-red-950'
                }`}>
                  {closedMode ? 'C' : 'O'}
                </div>

                {/* Tooltip */}
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
                  <div className={`text-xs font-semibold ${theme.text}`}>
                    {closedMode ? 'Closed Shape Mode' : 'Open Shape Mode'}
                  </div>
                  <div className={`text-[10px] mt-1 ${theme.textMuted}`}>
                    Click to toggle
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Active Tool Indicator */}
        {selectedToolType && (
          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border shadow-xl ${
            isDarkMode
              ? 'bg-black/90 border-cyan-400/30'
              : 'bg-white/90 border-blue-400/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${theme.accentBg}`} />
              <span className={`text-xs font-semibold ${theme.text}`}>
                {tools.find(t => t.id === selectedToolType)?.label || 
                 (selectedToolType === 'less_1' ? 'Mark Less than 1 Meter' : selectedToolType)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DrawToolbar;