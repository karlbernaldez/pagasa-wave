import { useState, useEffect, useCallback } from 'react';
import { saveMarker } from '@dashboards/forecaster/map/layers/markerLayer';
import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import {
  handleDrawModeChange,
  savePointFeature,
  toggleDrawing,
  toggleFlagDrawing,
  stopDrawing,
  stopFlagDrawing,
  toggleCollapse,
} from '@dashboards/forecaster/utils/ToolBarUtils';
import { MAP_CLICK_TYPES, MARKER_LABEL_MAP, TOOL_IDS } from '../config/toolbarConfig';
import { useSpacebarPan } from './useSpacebarPan';

export function useDrawToolbar({
  draw,
  setLayersRef,
  setLayers,
  setType,
  selectedToolRef,
  onToggleCanvas,
  onToggleFlagCanvas,
  projectId,
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlagDrawing, setIsFlagDrawing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedToolType, setSelectedToolType] = useState(null);
  const [pendingMapClick, setPendingMapClick] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [openModals, setOpenModals] = useState({
    featureNotAvailable: false,
    pointInputChoice: false,
    manualInput: false,
    markerTitle: false,
  });

  const toggleModal = useCallback((modalKey, isOpen) => {
    setOpenModals((prev) => ({ ...prev, [modalKey]: isOpen }));
  }, []);

  useSpacebarPan({
    isWaveActive: isDrawing,
    isFrontActive: isFlagDrawing,
    onToggleCanvas,
    onToggleFlagCanvas,
    openModals,
  });

  useEffect(() => {
    if (setLayersRef?.current !== setLayers) {
      setLayersRef.current = setLayers;
    }
  }, [setLayersRef, setLayers]);

  useEffect(() => {
    setPendingMapClick(null);
    setSelectedToolType(null);
    setShowTitleModal(false);
    setOpenModals({
      featureNotAvailable: false,
      pointInputChoice: false,
      manualInput: false,
      markerTitle: false,
    });
  }, [projectId]);

  const handleToolClick = useCallback((tool) => {
    selectedToolRef.current = tool.id;
    setSelectedToolType(tool.id);
    setType?.(tool.id);

    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);

    if (tool.modal) {
      toggleModal(tool.modal, true);
      return;
    }

    handleDrawModeChange(tool.id, draw, setLayersRef);
  }, [isDrawing, isFlagDrawing, draw, setLayersRef, selectedToolRef, setType, onToggleCanvas, onToggleFlagCanvas, toggleModal]);

  const handleSelectMode = useCallback(() => {
    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);

    selectedToolRef.current = null;
    setSelectedToolType(null);
    setType?.(null);
    draw?.changeMode?.('simple_select');
  }, [draw, isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas, selectedToolRef, setType]);

  const handleResetView = useCallback(() => {
    const map = getLatestMapInstance();
    if (!map) return;

    map.fitBounds(
      [
        [93, 5],
        [153.8595159535438, 25],
      ],
      {
        padding: { top: 50, bottom: 50, left: 200, right: 200 },
        maxZoom: 8,
        duration: 650,
      }
    );
  }, []);

  const savePoint = useCallback(async ({ lat, lng, coords, title, selectedType, map }) => {
    const savedFeature = await savePointFeature({ coords, title, selectedType, setLayersRef, projectId });
    if (!savedFeature?.sourceId) return;

    saveMarker({ lat, lng }, map, setShowTitleModal, selectedType)(savedFeature.labelValue || title, {
      sourceId: savedFeature.sourceId,
      layerId: savedFeature.sourceId,
      displayName: savedFeature.displayName,
      labelValue: savedFeature.labelValue || title,
    });
  }, [setLayersRef, projectId]);

  const handlePointInputChoice = useCallback((method) => {
    toggleModal('pointInputChoice', false);
    const selectedType = selectedToolRef.current || TOOL_IDS.LESS_1;

    if (method === 'manual') {
      toggleModal('manualInput', true);
      return;
    }

    if (method === 'map' && MAP_CLICK_TYPES.includes(selectedType)) {
      const map = getLatestMapInstance();
      if (!map) {
        console.warn('Map is not ready yet.');
        return;
      }

      handleDrawModeChange('draw_point', draw, setLayersRef);

      map.once('click', (e) => {
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const coords = [lng, lat];

        draw.changeMode('simple_select');

        if (selectedType === TOOL_IDS.LESS_1) {
          const title = MARKER_LABEL_MAP.less_1;
          savePoint({ lat, lng, coords, title, selectedType, map });
        } else {
          setPendingMapClick({ lat, lng, coords });
          toggleModal('markerTitle', true);
        }
      });
    }
  }, [draw, setLayersRef, selectedToolRef, toggleModal, savePoint]);

  const handleMarkerTitleSubmit = useCallback((title) => {
    if (!pendingMapClick) return;
    const { lat, lng, coords } = pendingMapClick;
    const selectedType = selectedToolRef.current;
    const map = getLatestMapInstance();

    savePoint({ lat, lng, coords, title, selectedType, map });
    setPendingMapClick(null);
    toggleModal('markerTitle', false);
  }, [pendingMapClick, selectedToolRef, savePoint, toggleModal]);

  const handleManualInputSubmit = useCallback(async (data) => {
    const selectedType = selectedToolRef.current || TOOL_IDS.LESS_1;
    setType?.(selectedType);

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    const coords = [lng, lat];
    const title = data.title || MARKER_LABEL_MAP[selectedType] || MARKER_LABEL_MAP.less_1;
    const map = getLatestMapInstance();

    savePoint({ lat, lng, coords, title, selectedType, map });
    toggleModal('manualInput', false);
  }, [selectedToolRef, setType, savePoint, toggleModal]);

  const handleToggleDrawing = useCallback(() => {
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
    toggleDrawing(isDrawing, setIsDrawing, onToggleCanvas);
  }, [isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas]);

  const handleToggleFlagDrawing = useCallback(() => {
    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    toggleFlagDrawing(isFlagDrawing, setIsFlagDrawing, onToggleFlagCanvas);
  }, [isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas]);

  const handleSelectLess1 = useCallback(() => {
    selectedToolRef.current = TOOL_IDS.LESS_1;
    setSelectedToolType(TOOL_IDS.LESS_1);
    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
    toggleModal('pointInputChoice', true);
  }, [isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas, selectedToolRef, toggleModal]);

  const handleSelectTextNote = useCallback(() => {
    selectedToolRef.current = TOOL_IDS.TEXT_NOTE;
    setSelectedToolType(TOOL_IDS.TEXT_NOTE);
    if (isDrawing) stopDrawing(setIsDrawing, onToggleCanvas);
    if (isFlagDrawing) stopFlagDrawing(setIsFlagDrawing, onToggleFlagCanvas);
    toggleModal('pointInputChoice', true);
  }, [isDrawing, isFlagDrawing, onToggleCanvas, onToggleFlagCanvas, selectedToolRef, toggleModal]);

  const handleToggleCollapse = useCallback(() => {
    toggleCollapse(setIsCollapsed);
  }, []);

  return {
    isDrawing,
    isFlagDrawing,
    isCollapsed,
    selectedToolType,
    pendingMapClick,
    showTitleModal,
    openModals,
    toggleModal,
    handleToolClick,
    handleSelectMode,
    handleResetView,
    handlePointInputChoice,
    handleMarkerTitleSubmit,
    handleManualInputSubmit,
    handleToggleDrawing,
    handleToggleFlagDrawing,
    handleSelectLess1,
    handleSelectTextNote,
    handleToggleCollapse,
    setPendingMapClick,
  };
}
