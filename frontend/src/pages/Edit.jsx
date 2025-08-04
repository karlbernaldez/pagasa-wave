import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import MiscLayer from "../components/Edit/MiscLayer";
import MapComponent from "../components/Edit/MapComponent";
import LayerPanel from "../components/Edit/LayerPanel";
import DrawToolBar from "../components/Edit/Toolbar";
import Canvas from "../components/Edit/draw/canvas";
import FlagCanvas from "../components/Edit/draw/front";
import LegendBox from "../components/Edit/Legend";
import ProjectMenu from "../components/Edit/ProjectMenu";
import ProjectInfo from "../components/Edit/ProjectInfo";
import MarkerTitleModal from "../components/modals/MarkerTitleModal";
import MapLoading from "../components/modals/MapLoading";
import { typhoonMarker as saveMarkerFn } from "../utils/mapUtils";
import { savePointFeature } from "../components/Edit/utils/ToolBarUtils";
import { setupMap } from "../utils/mapSetup";
import { fetchFeatures } from "../api/featureServices";
import Swal from 'sweetalert2';

const Container = styled.div`
  position: relative;
  height: 92.6vh;
  width: 100%;
  display: flex;
  overflow: hidden;
`;

const MapWrapper = styled.div`
  flex-grow: 1;
  width: ${({ collapsed }) => (collapsed ? "100vw" : "calc(100vw - 250px)")};
  height: 100%;
  transition: width 0.3s ease;
  position: relative;
`;

const Edit = ({ isDarkMode, setIsDarkMode, logger }) => {
  // eslint-disable-next-line
  const [collapsed, setCollapsed] = useState(false);
  const [layers, setLayers] = useState([]);
  const [drawInstance, setDrawInstance] = useState(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [isFlagCanvasActive, setIsFlagCanvasActive] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [drawCounter, setDrawCounter] = useState(0);
  // eslint-disable-next-line
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [MarkerTitle, setMarkerTitle] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [closedMode, setClosedMode] = useState(false);
  const [type, setType] = useState(null);
  const [savedFeatures, setSavedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [capturedImages, setCapturedImages] = useState({
    light: null,
    dark: null
  });

  const selectedToolRef = useRef(null);
  const mapRef = useRef(null);
  const cleanupRef = useRef(null);
  const setLayersRef = useRef();
  const markerTitleRef = useRef('');

  const token = localStorage.getItem('authToken');
  const projectId = localStorage.getItem('projectId');

  // ─── Refs ─────────────────────────────────────────────
  useEffect(() => {
    setLayersRef.current = setLayers;
  }, [setLayers]);

  // ─── Toggle Drawing Modes ─────────────────────────────
  const toggleCanvas = useCallback(() => setIsCanvasActive(prev => !prev), []);
  const toggleFlagCanvas = useCallback(() => setIsFlagCanvasActive(prev => !prev), []);

  const handleSaveTitle = (title) => {
    markerTitleRef.current = title;
    setMarkerTitle(title);
    saveMarkerFn(selectedPoint, mapRef, setShowTitleModal, type)(title);

    const coords = [selectedPoint.lng, selectedPoint.lat];
    const selectedType = type;

    savePointFeature({ coords, title, selectedType, setLayersRef });
  };

  const handleTitleChange = (value) => {
    markerTitleRef.current = value;
    setMarkerTitle(value);
  };

  // ─── Map Load Setup ──────────────────────────────────
  const handleMapLoad = useCallback(async (map) => {
    mapRef.current = map;

    const setupFeaturesAndLayers = async () => {
      try {
        if (!projectId) {
          Swal.fire({
            icon: 'warning',
            title: 'No Project Selected',
            text: 'Please select a project first.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,  // The toast will auto-close after 3 seconds
          });
          setIsLoading(false);
          return;  // Stop the execution if no project is selected
        }

        const savedFeatures = await fetchFeatures(token);

        // ⚠️ Extra safety check: filter features by projectId from localStorage
        const filteredFeatures = savedFeatures.filter(
          f => f?.properties?.project === projectId
        );

        setSavedFeatures(filteredFeatures);

        const initialLayers = filteredFeatures.map(f => {
          return {
            id: f.sourceId,
            name: f.name || "Untitled Feature",
            visible: true,
            locked: false,
            type: f.properties.type || 'Wave Height',
          };
        });

        setLayers(initialLayers);

        cleanupRef.current = setupMap({
          map,
          mapRef,
          setDrawInstance,
          setMapLoaded,
          setSelectedPoint,
          setShowTitleModal,
          setLineCount,
          initialFeatures: {
            type: "FeatureCollection",
            features: filteredFeatures,
          },
          logger,
          setLoading: setIsLoading,
          selectedToolRef,
          setCapturedImages,
        });
      } catch (error) {
        console.error('[MAP LOAD ERROR]', error);

        // fallback setup if fetching features fails
        cleanupRef.current = setupMap({
          map,
          mapRef,
          setDrawInstance,
          setMapLoaded,
          setSelectedPoint,
          setShowTitleModal,
        });
      }
    };

    await setupFeaturesAndLayers();

    if (!map._hasStyleLoadListener) {
      map.on("style.load", setupFeaturesAndLayers);
      map._hasStyleLoadListener = true;
    }
  }, []);

  // ─── Cleanup on Unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        // cleanupRef.current(); // 🧹 Cancel animation + listeners
      }
    };
  }, []);

  // ─── Idle Timeout Detection ──────────────────────────
  useEffect(() => {
    let inactivityTimer;

    // Reset inactivity timer on any user activity (mousemove, click, keydown, scroll)
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Trigger page reload after 1 minute of inactivity
        window.location.reload();
      }, 90000); // 1 minute = 60000 ms
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Set an initial timer on component mount
    resetTimer();

    // Cleanup event listeners on component unmount
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  // ─── Delay Toolbar ───────────────────────────────────
  useEffect(() => {
    const toolbarDelay = setTimeout(() => setShowToolbar(true), 1000);
    return () => clearTimeout(toolbarDelay);
  }, []);

  // ─── Render ──────────────────────────────────────────
  return (
    <Container>
      <MapWrapper collapsed={collapsed}>
        <MapComponent onMapLoad={handleMapLoad} isDarkMode={isDarkMode} />
      </MapWrapper>

      {showToolbar && projectId && (
        <DrawToolBar
          draw={drawInstance}
          mapRef={mapRef}
          onToggleCanvas={toggleCanvas}
          onToggleFlagCanvas={toggleFlagCanvas}
          isCanvasActive={isCanvasActive}
          isFlagCanvasActive={isFlagCanvasActive}
          isDarkMode={isDarkMode}
          layers={layers}
          setLayers={setLayers}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
          setClosedMode={setClosedMode}
          setType={setType}
          selectedToolRef={selectedToolRef}
          title={MarkerTitle}
        />
      )}

      {isCanvasActive && (
        <Canvas
          mapRef={mapRef}
          drawRef={drawInstance}
          drawCounter={drawCounter}
          setDrawCounter={setDrawCounter}
          isDarkMode={isDarkMode}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
          lineCount={lineCount}
        />
      )}

      {isFlagCanvasActive && (
        <FlagCanvas
          mapRef={mapRef}
          drawRef={drawInstance}
          drawCounter={drawCounter}
          setDrawCounter={setDrawCounter}
          isDarkMode={isDarkMode}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
        />
      )}

      {projectId && (
        <LayerPanel
          layers={layers}
          setLayers={setLayers}
          mapRef={mapRef}
          isDarkMode={isDarkMode}
          draw={drawInstance}
        />
      )}

      <MarkerTitleModal
        isOpen={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        onSave={handleSaveTitle}
        inputValue={MarkerTitle}
        onInputChange={handleTitleChange}
      />

      <LegendBox isDarkMode={isDarkMode} />

      <ProjectMenu
        mapRef={mapRef}
        features={{ type: "FeatureCollection", features: savedFeatures }}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setMapLoaded={setMapLoaded}
        isLoading={isLoading}
      />

      <ProjectInfo />
      <MiscLayer
        mapRef={mapRef}
      />

      {isLoading && <MapLoading />}
    </Container>
  );
};

export default Edit;
