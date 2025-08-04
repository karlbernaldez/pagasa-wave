import React, { useState, useRef } from "react";
import LayerItem from "./LayerItem";
import { FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { addGeoJsonLayer, toggleLayerVisibility, toggleLayerLock, removeLayer, updateLayerName, handleDragStart, handleDragOver, handleDrop, setActiveLayerOnMap } from "./utils/layerUtils";
import { theme, darkTheme } from "../../styles/theme";
import { panelStyle, headerStyle, buttonStyle, listStyle, footerStyle } from "./styles/LayerPanelStyles";
import Modal from "../modals/MapNotReady";

const LayerPanel = ({ mapRef, isDarkMode, layers, setLayers, draw }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mapNotReady, setMapNotReady] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [activeMapboxLayerId, setActiveMapboxLayerId] = useState(null);
  const [isDragging, setDragging] = useState(false); // ✅ correct
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const fileInputRef = useRef();

  const currentTheme = isDarkMode ? darkTheme : theme;

  const handleGeoJSONUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !mapRef.current) return;
    addGeoJsonLayer(mapRef.current, file, layers, setLayers);
  };

  const addLayer = () => {
    if (!mapRef.current) {
      console.error("Map is not ready yet.");
      setMapNotReady(true);
      return;
    }

    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const setActiveLayer = (id) => {
    console.log(mapRef.current.getStyle().layers)
    setActiveLayerOnMap({
      id,
      mapRef,
      draw,
      layers,
      activeLayerId,
      setActiveLayerId,
      setActiveMapboxLayerId
    });
  };

  return (
    <>
      <div
        style={{
          ...panelStyle(currentTheme, isCollapsed),
          display: "flex",
          flexDirection: "column",
        }}
        onDragOver={handleDragOver}
      >
        <div
          style={headerStyle(currentTheme, isCollapsed)}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span>Layers</span>
          <div>{isCollapsed ? <FaChevronUp /> : <FaChevronDown />}</div>
        </div>

        {!isCollapsed && (
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <ul style={listStyle(currentTheme)}>
                {layers.map((layer, index) => (
                  <LayerItem
                    key={layer.id || `layer-${index}`}
                    layer={layer}
                    toggleLayerVisibility={() =>
                      toggleLayerVisibility(mapRef.current, layer, setLayers)
                    }
                    toggleLayerLock={() => toggleLayerLock(layer, setLayers)}
                    removeLayer={() =>
                      removeLayer(mapRef.current, layer, setLayers, draw)
                    }
                    updateLayerName={(id, newName, setLayers) => {
                      updateLayerName(layer.id, newName, setLayers); // Call the updateLayerName function
                    }}
                    isActiveLayer={activeLayerId === layer.id}
                    setActiveLayer={setActiveLayer}
                    index={index}
                    isDarkMode={isDarkMode}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index, setDragging, setDraggedLayerIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) =>
                      handleDrop(
                        e,
                        index,
                        draggedLayerIndex,
                        layers,
                        setLayers,
                        setDragging
                      )
                    }
                    draw={draw}
                    mapRef={mapRef.current}
                    setDragging={setDragging}
                    setDraggedLayerIndex={setDraggedLayerIndex}
                    setLayers={setLayers}
                  />
                ))}
              </ul>
            </div>

            <div
              style={{
                ...footerStyle(currentTheme),
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <button onClick={addLayer} style={buttonStyle(currentTheme)}>
                <input
                  type="file"
                  accept=".geojson,application/geo+json,application/json"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleGeoJSONUpload}
                />
                <FaPlus style={{ marginRight: 4 }} /> Add GeoJSON Layer
              </button>

            </div>
          </>
        )}
      </div>

      {mapNotReady && (
        <Modal isOpen={mapNotReady} onClose={() => setMapNotReady(false)} />
      )}
    </>
  );
};

export default LayerPanel;
