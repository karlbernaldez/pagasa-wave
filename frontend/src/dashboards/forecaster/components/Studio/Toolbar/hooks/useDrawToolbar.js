import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
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

export function useDrawToolbar({
  draw,
  setLayersRef,
  setLayers,
  setType,
  selectedToolRef,
  onToggleCanvas,
  onToggleFlagCanvas,
}) {
  // ── State ────────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────
  const toggleModal = useCallback((modalKey, isOpen) => {
    setOpenModals((prev) => ({ ...prev, [modalKey]: isOpen }));
  }, []);

  // Keep setLayersRef in sync
  useEffect(() => {
    if (setLayersRef?.current !== setLayers) {
      setLayersRef.current = setLayers;
    }
  }, [setLayersRef, setLayers]);

  // ── Tool selection ───────────────────────────────────────
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

  // ── Save helpers ─────────────────────────────────────────
  const savePoint = useCallback(({ lat, lng, coords, title, selectedType, map }) => {
    saveMarker({ lat, lng }, map, setShowTitleModal, selectedType)(title);
    savePointFeature({ coords, title, selectedType, setLayersRef });
  }, [setLayersRef]);

  // ── Map click flow ───────────────────────────────────────
  const handlePointInputChoice = useCallback((method) => {
    toggleModal('pointInputChoice', false);
    const selectedType = selectedToolRef.current || TOOL_IDS.TYPHOON;

    if (method === 'manual') {
      toggleModal('manualInput', true);
      return;
    }

    if (method === 'map' && MAP_CLICK_TYPES.includes(selectedType)) {
      console.log('Enabling map click for point input');
      const map = getLatestMapInstance();
      console.log('Latest map instance:', map);
      if (!map) {
        console.warn('Map is not ready yet.');
        return;
      }

      handleDrawModeChange('draw_point', draw, setLayersRef);

      map.once('click', (e) => {
        console.log('Map clicked at:', e.lngLat);
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const coords = [lng, lat];

        draw.changeMode('simple_select');

        if (selectedType === TOOL_IDS.LESS_1) {
          const title = `${MARKER_LABEL_MAP.less_1}_${uuidv4()}`;
          savePoint({ lat, lng, coords, title, selectedType, map });
        } else {
          console.log('Storing pending map click for marker title input');
          setPendingMapClick({ lat, lng, coords });
          toggleModal('markerTitle', true);
        }
      });
    }
  }, [draw, setLayersRef, selectedToolRef, toggleModal, savePoint]);

  // ── MarkerTitleModal submit (map click flow) ─────────────
  const handleMarkerTitleSubmit = useCallback((title) => {
    if (!pendingMapClick) return;
    const { lat, lng, coords } = pendingMapClick;
    const selectedType = selectedToolRef.current;
    const map = getLatestMapInstance();

    savePoint({ lat, lng, coords, title, selectedType, map });
    setPendingMapClick(null);
    toggleModal('markerTitle', false);
  }, [pendingMapClick, selectedToolRef, savePoint, toggleModal]);

  // ── ManualInputModal submit ──────────────────────────────
  const handleManualInputSubmit = useCallback(async (data) => {
    const selectedType = selectedToolRef.current || TOOL_IDS.TYPHOON;
    setType?.(selectedType);

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    const coords = [lng, lat];
    const title = data.title;
    const map = getLatestMapInstance();

    savePoint({ lat, lng, coords, title, selectedType, map });
    toggleModal('manualInput', false);
  }, [selectedToolRef, setType, savePoint, toggleModal]);

  // ── Drawing toggles ──────────────────────────────────────
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

  const handleToggleCollapse = useCallback(() => {
    toggleCollapse(setIsCollapsed);
  }, []);

  return {
    // State
    isDrawing,
    isFlagDrawing,
    isCollapsed,
    selectedToolType,
    pendingMapClick,
    showTitleModal,
    openModals,
    // Handlers
    toggleModal,
    handleToolClick,
    handlePointInputChoice,
    handleMarkerTitleSubmit,
    handleManualInputSubmit,
    handleToggleDrawing,
    handleToggleFlagDrawing,
    handleSelectLess1,
    handleToggleCollapse,
    setPendingMapClick,
  };
}