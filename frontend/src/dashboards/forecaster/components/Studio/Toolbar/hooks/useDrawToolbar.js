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
  // ── State ────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlagDrawing, setIsFlagDrawing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedToolType, setSelectedToolType] = useState(null);
  const [lowWaveThreshold, setLowWaveThreshold] = useState('<1');
  const [pendingPointInputMethod, setPendingPointInputMethod] = useState(null);
  const [pendingMapClick, setPendingMapClick] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [openModals, setOpenModals] = useState({
    featureNotAvailable: false,
    pointInputChoice: false,
    lowWaveMarkerChoice: false,
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

  // Clear transient toolbar marker state when changing projects.
  useEffect(() => {
    setPendingMapClick(null);
    setSelectedToolType(null);
    setShowTitleModal(false);
    setOpenModals({
      featureNotAvailable: false,
      pointInputChoice: false,
      lowWaveMarkerChoice: false,
      manualInput: false,
      markerTitle: false,
    });
  }, [projectId]);

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

  // ── Save helpers ─────────────────────────────────────────
  const savePoint = useCallback(async ({ lat, lng, coords, title, selectedType, map, labelValue }) => {
    const savedFeature = await savePointFeature({
      coords,
      title,
      selectedType,
      setLayersRef,
      projectId,
      labelValue,
    });
    if (!savedFeature?.sourceId) return;

    await saveMarker({ lat, lng }, map, setShowTitleModal, selectedType)(
      savedFeature.labelValue || title,
      {
        sourceId: savedFeature.sourceId,
        layerId: savedFeature.sourceId,
        displayName: savedFeature.displayName,
        labelValue: savedFeature.labelValue || title,
      }
    );

    selectedToolRef.current = null;
    setSelectedToolType(null);
    setType?.(null);
    setPendingPointInputMethod(null);
  }, [setLayersRef, projectId, selectedToolRef, setType]);

  // ── Map click flow ───────────────────────────────────────
  const startPointInput = useCallback((method, selectedType, labelValue) => {
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

      const canvas = map.getCanvas?.();
      const previousCursor = canvas?.style?.cursor || '';
      if (canvas?.style) {
        canvas.style.cursor = 'crosshair';
      }

      map.once('click', (e) => {
        console.log('Map clicked at:', e.lngLat);
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const coords = [lng, lat];

        if (canvas?.style) {
          canvas.style.cursor = previousCursor;
        }
        draw.changeMode('simple_select');

        if (selectedType === TOOL_IDS.LESS_1) {
          savePoint({
            lat,
            lng,
            coords,
            title: labelValue,
            selectedType,
            map,
            labelValue,
          });
        } else {
          console.log('Storing pending map click for marker title input');
          setPendingMapClick({ lat, lng, coords });
          toggleModal('markerTitle', true);
        }
      });
    }
  }, [draw, setLayersRef, toggleModal, savePoint]);

  const handlePointInputChoice = useCallback((method) => {
    toggleModal('pointInputChoice', false);
    const selectedType = selectedToolRef.current || TOOL_IDS.LESS_1;

    if (selectedType === TOOL_IDS.LESS_1) {
      setPendingPointInputMethod(method);
      toggleModal('lowWaveMarkerChoice', true);
      return;
    }

    startPointInput(method, selectedType);
  }, [selectedToolRef, startPointInput, toggleModal]);

  const handleLowWaveMarkerChoice = useCallback((threshold) => {
    setLowWaveThreshold(threshold);
    toggleModal('lowWaveMarkerChoice', false);

    const method = pendingPointInputMethod;
    setPendingPointInputMethod(null);

    if (method) {
      startPointInput(method, TOOL_IDS.LESS_1, threshold);
    }
  }, [pendingPointInputMethod, startPointInput, toggleModal]);

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
    const selectedType = selectedToolRef.current || TOOL_IDS.LESS_1;
    setType?.(selectedType);

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    const coords = [lng, lat];
    const title =
      selectedType === TOOL_IDS.LESS_1
        ? lowWaveThreshold
        : data.title || MARKER_LABEL_MAP[selectedType] || MARKER_LABEL_MAP.less_1;
    const map = getLatestMapInstance();

    savePoint({
      lat,
      lng,
      coords,
      title,
      selectedType,
      map,
      labelValue: selectedType === TOOL_IDS.LESS_1 ? lowWaveThreshold : undefined,
    });
    toggleModal('manualInput', false);
  }, [selectedToolRef, setType, savePoint, toggleModal, lowWaveThreshold]);

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
    // State
    isDrawing,
    isFlagDrawing,
    isCollapsed,
    selectedToolType,
    lowWaveThreshold,
    pendingMapClick,
    showTitleModal,
    openModals,
    // Handlers
    toggleModal,
    handleToolClick,
    handleSelectMode,
    handleResetView,
    handlePointInputChoice,
    handleLowWaveMarkerChoice,
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
