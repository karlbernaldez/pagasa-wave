import { v4 as uuidv4 } from 'uuid';
import { TbTools } from 'react-icons/tb';
import wave from "../../assets/draw_icons/wave.png";
import l1 from "../../assets/draw_icons/L1.png";
import lpa from "../../assets/draw_icons/LPA.png";
import hpa from "../../assets/draw_icons/HPA.png";
import storm from "../../assets/draw_icons/hurricane.png";
import PointInputChoiceModal from '../modals/MarkerChoice';
import ManualInputModal from '../modals/ManualInputModal';
import FeatureNotAvailableModal from '../modals/FeatureNotAvailable';
import { typhoonMarker as saveMarkerFn } from "../../utils/mapUtils";
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ToolbarContainer, ToolButton, CollapseToggle } from './styles/ToolBarStyles';
import { handleDrawModeChange, savePointFeature, toggleDrawing, toggleFlagDrawing, startDrawing, startFlagDrawing, stopDrawing, stopFlagDrawing, toggleCollapse } from './utils/ToolBarUtils';

const DrawToolbar = ({ draw, mapRef, onToggleCanvas, onToggleFlagCanvas, isCanvasActive, isdarkmode, setLayersRef, setLayers, closedMode, setClosedMode, setType, selectedToolRef, title }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlagDrawing, setIsFlagDrawing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedToolType, setSelectedToolType] = useState(null);
  const [manualInputData, setManualInputData] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [openModals, setOpenModals] = useState({ featureNotAvailable: false, pointInputChoice: false, manualInput: false });

  useEffect(() => {
    if (setLayersRef?.current !== setLayers) {
      setLayersRef.current = setLayers;
    }
  }, [setLayersRef, setLayers]);

  useEffect(() => {
  }, [title]);

  const toggleModal = (modalKey, isOpen) => {
    setOpenModals(prev => ({ ...prev, [modalKey]: isOpen }));
  };

  const tools = useMemo(() => [
    {
      id: 'low_pressure',
      icon: <img src={lpa} alt="Low Pressure Area" style={{ width: 16, height: 20 }} />,
      label: 'Low Pressure Area (A)',
      hotkey: 'a',
      modal: 'pointInputChoice',
    },
    {
      id: 'high_pressure',
      icon: <img src={hpa} alt="High Pressure Area" style={{ width: 16, height: 20 }} />,
      label: 'High Pressure Area (H)',
      hotkey: 'h',
      modal: 'pointInputChoice',
    },
    {
      id: 'typhoon',
      icon: <img src={storm} alt="Draw Storm" style={{ width: 20, height: 20 }} />,
      label: 'Draw Storm (M)',
      hotkey: 'm',
      modal: 'pointInputChoice',
    },


    // { id: 'draw_line_string', icon: '📏', label: 'Draw Line (L)', hotkey: 'l' },
    // { id: 'draw_polygon', icon: '⭐', label: 'Draw Polygon (P)', hotkey: 'p' },
    // { id: 'draw_rectangle', icon: '⬛', label: 'Draw Rectangle (R)', hotkey: 'r' },
    // { id: 'draw_circle', icon: '⚪', label: 'Draw Circle (C)', hotkey: 'c', modal: 'featureNotAvailable' },
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
            saveMarkerFn({ lat, lng }, mapRef, setShowTitleModal, selectedType)(title);
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

    saveMarkerFn({ lat: data.lat, lng: data.lng }, mapRef, setShowTitleModal, selectedType)(title);
    savePointFeature({ coords, title, selectedType, setLayersRef });

    setManualInputData(data);
    toggleModal('manualInput', false);
  };

  const handleDrawing = useCallback((event) => {

  }, [tools, draw, isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas, setLayersRef, setLayers]);

  useEffect(() => {
    window.addEventListener('keydown', handleDrawing);
    return () => window.removeEventListener('keydown', handleDrawing);
  }, [handleDrawing]);

  const toggleCollapseToolbar = () => toggleCollapse(setIsCollapsed);

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

      {/* Toolbar */}
      <ToolbarContainer isdarkmode={isdarkmode}>
        <CollapseToggle
          title={isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
          isdarkmode={isdarkmode}
          onClick={toggleCollapseToolbar}
        >
          {isCollapsed ? <TbTools size={20} /> : '✖'}
        </CollapseToggle>

        {!isCollapsed && (
          <>
            {tools.map((tool) => (
              <ToolButton
                key={tool.id}
                title={tool.label}
                isdarkmode={isdarkmode}
                onClick={() => handleToolClick(tool)}
              >
                {tool.icon}
              </ToolButton>
            ))}

            <ToolButton
              title={isFlagDrawing ? 'Stop Flag Drawing (X)' : 'Start Flag Drawing (🚩)'}
              isdarkmode={isdarkmode}
              onClick={() => {
                // Turn off freehand if it's active
                if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);

                // Toggle flag drawing mode
                toggleFlagDrawing(isFlagDrawing, setIsFlagDrawing, onToggleFlagCanvas);
              }}
            >
              {isFlagDrawing ? '❌' : '🚩'}
            </ToolButton>

            <ToolButton
              title="Mark Less than 1 Meter (1)"
              isdarkmode={isdarkmode}
              onClick={() => {
                selectedToolRef.current = 'less_1';
                setSelectedToolType('less_1');

                // Turn off any active drawing modes
                if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
                if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);

                // Open the input method choice modal
                toggleModal('pointInputChoice', true);
              }}
            >
              <img
                src={l1}
                alt="Less than 1 Meter"
                style={{ width: 36, height: 36 }}
              />
            </ToolButton>

            <ToolButton
              title={isDrawing ? 'Stop Wave Height Drawing (X)' : 'Start Wave Height Drawing (🖊️)'}
              $active={isCanvasActive}
              $isdarkmode={isdarkmode}
              onClick={() => {
                if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
                toggleDrawing(isDrawing, setIsDrawing, onToggleCanvas);
              }}
            >
              {isDrawing ? (
                '❌'
              ) : (
                <img src={wave} alt="Wave Height Drawing" style={{ width: 20, height: 20 }} />
              )}
            </ToolButton>


            {isCanvasActive && (
              <ToolButton
                title={closedMode ? 'Closed Shape Mode (O)' : 'Open Shape Mode (C)'}
                $active
                $isdarkmode={isdarkmode}
                onClick={() => setClosedMode((prev) => !prev)}
                style={{
                  backgroundColor: closedMode ? '#4CAF50' : '#F44336',
                  color: 'white',
                }}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {closedMode ? 'O' : 'C'}
                </span>
              </ToolButton>
            )}
          </>
        )}
      </ToolbarContainer>
    </>
  );
};

export default DrawToolbar;
