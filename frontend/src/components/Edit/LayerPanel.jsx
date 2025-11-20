import React, { useState, useRef, useEffect } from "react";
import LayerItem from "./LayerItem";
import { FaPlus, FaChevronDown, FaChevronUp, FaLayerGroup, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { addGeoJsonLayer, toggleLayerVisibility, toggleLayerLock, removeLayer, updateLayerName, handleDragStart, handleDragOver, handleDrop, setActiveLayerOnMap } from "./utils/layerUtils";
import { theme, darkTheme } from "../../styles/theme";
import { panelStyle, headerStyle, buttonStyle, listStyle, footerStyle } from "./styles/LayerPanelStyles";
import Modal from "../modals/MapNotReady";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const LayerPanel = ({ mapRef, isDarkMode, layers, setLayers, draw }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMiscCollapsed, setIsMiscCollapsed] = useState(false);
  const [mapNotReady, setMapNotReady] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [activeMapboxLayerId, setActiveMapboxLayerId] = useState(null);
  const [isDragging, setDragging] = useState(false);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const fileInputRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  // MiscLayer states
  const [showPAR, setShowPAR] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showTCID, setShowTCID] = useState(false);
  const [showTCAD, setShowTCAD] = useState(false);
  const [showSHIPPINGZONE, setShowSHIPPINGZONE] = useState(false);
  const [showWindLayer, setShowWindLayer] = useState(false);

  const currentTheme = isDarkMode ? darkTheme : theme;

  // Initialize misc layers from localStorage
  useEffect(() => {
    const layersState = {
      PAR: localStorage.getItem('PAR') === 'true',
      Satellite: localStorage.getItem('Satellite') === 'true',
      TCID: localStorage.getItem('TCID') === 'true',
      TCAD: localStorage.getItem('TCAD') === 'true',
      ShippingZonestate: localStorage.getItem('SHIPPING_ZONE') === 'true',
      WindLayer: localStorage.getItem('wind-layer') === 'true',
    };

    setShowPAR(layersState.PAR);
    setShowSatellite(layersState.Satellite);
    setShowTCID(layersState.TCID);
    setShowTCAD(layersState.TCAD);
    setShowSHIPPINGZONE(layersState.ShippingZonestate);
    setShowWindLayer(layersState.WindLayer);

    if (mapRef.current) {
      mapRef.current.on('load', () => {
        // mapRef.current.setLayoutProperty('country-boundaries', 'visibility', layersState.ShippingZonestate ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('PAR', 'visibility', layersState.PAR ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('PAR_dash', 'visibility', layersState.PAR ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('Satellite', 'visibility', layersState.Satellite ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('TCID', 'visibility', layersState.TCID ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('TCAD', 'visibility', layersState.TCAD ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('graticules', 'visibility', layersState.ShippingZonestate ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('graticules_blur', 'visibility', layersState.ShippingZonestate ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('SHIPPING_ZONE_FILL', 'visibility', layersState.ShippingZonestate ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wind-layer', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wind-speed-layer', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wind-arrows', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wind-labels', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wave-arrows', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('wave-period-labels', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('glass-fill', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('glass-stroke', 'visibility', layersState.WindLayer ? 'visible' : 'none');
        mapRef.current.setLayoutProperty('glass-depth', 'visibility', layersState.WindLayer ? 'visible' : 'none');
      });
    }
  }, [mapRef]);

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

  const toggleMiscLayer = (layer) => {
    const projectId = localStorage.getItem('projectId');
    if (!projectId) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please select or create a project first.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: isDarkMode ? '#374151' : '#fff',
        color: isDarkMode ? '#f3f4f6' : '#111827',
        customClass: {
          popup: 'swal-toast-popup',
          title: 'swal-toast-title'
        }
      });
      return;
    }

    switch (layer) {
      case 'PAR':
        setShowPAR(prev => {
          const newState = !prev;
          localStorage.setItem('PAR', newState.toString());
          mapRef.current?.setLayoutProperty('PAR', 'visibility', newState ? 'visible' : 'none');
          mapRef.current?.setLayoutProperty('PAR_dash', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      case 'Satellite':
        setShowSatellite(prev => {
          const newState = !prev;
          localStorage.setItem('Satellite', newState.toString());
          mapRef.current?.setLayoutProperty('Satellite', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      case 'TCID':
        setShowTCID(prev => {
          const newState = !prev;
          localStorage.setItem('TCID', newState.toString());
          mapRef.current?.setLayoutProperty('TCID', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      case 'TCAD':
        setShowTCAD(prev => {
          const newState = !prev;
          localStorage.setItem('TCAD', newState.toString());
          mapRef.current?.setLayoutProperty('TCAD', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      case 'SHIPPING_ZONE':
        setShowSHIPPINGZONE(prev => {
          const newState = !prev;
          localStorage.setItem('SHIPPING_ZONE', newState.toString());
          mapRef.current?.setLayoutProperty('graticules', 'visibility', newState ? 'visible' : 'none');
          mapRef.current?.setLayoutProperty('graticules_blur', 'visibility', newState ? 'visible' : 'none');
          mapRef.current?.setLayoutProperty('SHIPPING_ZONE_LABELS', 'visibility', newState ? 'visible' : 'none');
          mapRef.current?.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', newState ? 'visible' : 'none');

          mapRef.current.setLayoutProperty('wind-arrows', 'visibility', newState ? 'visible' : 'none');
          mapRef.current.setLayoutProperty('wind-labels', 'visibility', newState ? 'visible' : 'none');
          mapRef.current.setLayoutProperty('wave-arrows', 'visibility', newState ? 'visible' : 'none');
          mapRef.current.setLayoutProperty('wave-period-labels', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      case 'Wind Layer':
        setShowWindLayer(prev => {
          const newState = !prev;
          localStorage.setItem('wind-layer', newState.toString());
          mapRef.current?.setLayoutProperty('wind-layer', 'visibility', newState ? 'visible' : 'none');
          mapRef.current?.setLayoutProperty('wind-solarstorm-layer', 'visibility', newState ? 'visible' : 'none');
          mapRef.current.setLayoutProperty('glass-fill', 'visibility', newState ? 'visible' : 'none');
          mapRef.current.setLayoutProperty('glass-depth', 'visibility', newState ? 'visible' : 'none');
          return newState;
        });
        break;
      default:
        break;
    }
  };

  // Enhanced misc layer item component
  const MiscLayerItem = ({ name, isVisible, onToggle, description }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        margin: '2px 0',
        borderRadius: currentTheme.borderRadius.small,
        backgroundColor: isVisible
          ? `${currentTheme.colors.primary}15`
          : currentTheme.colors.background,
        border: `1px solid ${isVisible ? currentTheme.colors.primary : currentTheme.colors.border}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={onToggle}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = isVisible
          ? `${currentTheme.colors.primary}25`
          : `${currentTheme.colors.border}20`;
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = isVisible
          ? `${currentTheme.colors.primary}15`
          : currentTheme.colors.background;
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: '500',
            fontSize: '0.875rem',
            color: isVisible ? currentTheme.colors.primary : currentTheme.colors.textPrimary,
            marginBottom: '2px',
          }}
        >
          {name}
        </div>
        {description && (
          <div
            style={{
              fontSize: '0.75rem',
              color: currentTheme.colors.textSecondary,
              opacity: 0.8,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isVisible ? '#10b981' : '#ef4444',
            boxShadow: `0 0 0 2px ${isVisible ? '#10b98120' : '#ef444420'}`,
          }}
        />
        {isVisible ? (
          <FaToggleOn
            style={{
              color: currentTheme.colors.primary,
              fontSize: '1.2rem',
            }}
          />
        ) : (
          <FaToggleOff
            style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '1.2rem',
            }}
          />
        )}
      </div>
    </div>
  );

  const miscLayers = [
    { name: 'PAR', state: showPAR, key: 'PAR', description: 'Protected Areas and Reserves' },
    { name: 'Satellite', state: showSatellite, key: 'Satellite', description: 'Satellite Imagery Layer' },
    { name: 'TCID', state: showTCID, key: 'TCID', description: 'Territorial Coverage ID' },
    { name: 'TCAD', state: showTCAD, key: 'TCAD', description: 'Territorial Coverage AD' },
    { name: 'Graticules, Wave & Wind', state: showSHIPPINGZONE, key: 'SHIPPING_ZONE', description: 'Graticules and Wave and Wind Elements' },
    { name: 'Wind Layer', state: showWindLayer, key: 'Wind Layer', description: 'Wind Speed & Direction' },
  ];

  return (
    <>
      <div
        style={{
          ...panelStyle(currentTheme, isCollapsed),
          ...(isHovered && {
            transform: "translateY(-4px) scale(1.02)",
            boxShadow: theme.isDark
              ? "0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              : "0 32px 64px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          }),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
      >
        {/* Main Header */}
        <div
          style={{
            ...headerStyle(currentTheme, isCollapsed),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: isCollapsed ? 'none' : `1px solid ${currentTheme.colors.border}`,
          }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaLayerGroup style={{ color: currentTheme.colors.primary }} />
            <span style={{ fontWeight: '600', fontSize: '1rem' }}>Layers</span>
            <div
              style={{
                backgroundColor: currentTheme.colors.primary,
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: '500',
              }}
            >
              {layers.length + miscLayers.filter(l => l.state).length}
            </div>
          </div>
          <div>{isCollapsed ? <FaChevronUp /> : <FaChevronDown />}</div>
        </div>

        {!isCollapsed && (
          <>
            {/* Custom Layers Section */}
            <div style={{ flex: 1, overflowY: "auto", padding: '8px' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: currentTheme.colors.textPrimary,
                  padding: '8px 4px',
                  borderBottom: `1px solid ${currentTheme.colors.border}`,
                  marginBottom: '8px',
                }}
              >
                Custom Layers ({layers.length})
              </div>
              <div
                style={{
                  maxHeight: "min(35vh, 350px)", // adjust as needed
                  overflowY: "auto",
                }}
              >
                <ul style={{ ...listStyle(currentTheme), margin: 0, padding: 0 }}>
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
                        updateLayerName(layer.id, newName, setLayers);
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

              {/* System Layers Section */}
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: currentTheme.colors.textPrimary,
                    padding: '8px 4px',
                    borderBottom: `1px solid ${currentTheme.colors.border}`,
                    marginBottom: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsMiscCollapsed(!isMiscCollapsed)}
                >
                  <span>System Layers ({miscLayers.filter(l => l.state).length})</span>
                  {isMiscCollapsed ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </div>

                {!isMiscCollapsed && (
                  <div style={{ paddingLeft: '4px' }}>
                    {miscLayers.map((layer) => (
                      <MiscLayerItem
                        key={layer.key}
                        name={layer.name}
                        description={layer.description}
                        isVisible={layer.state}
                        onToggle={() => toggleMiscLayer(layer.key)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                ...footerStyle(currentTheme),
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flexShrink: 0,
                padding: '12px 16px',
                borderTop: `1px solid ${currentTheme.colors.border}`,
              }}
            >
              <button
                onClick={addLayer}
                style={{
                  ...buttonStyle(currentTheme),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontWeight: '500',
                  borderRadius: currentTheme.borderRadius.medium,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <input
                  type="file"
                  accept=".geojson,application/geo+json,application/json"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleGeoJSONUpload}
                />
                <FaPlus />
                <span>Add GeoJSON Layer</span>
              </button>
            </div>
          </>
        )}
      </div >

      {mapNotReady && (
        <Modal isOpen={mapNotReady} onClose={() => setMapNotReady(false)} />
      )
      }
    </>
  );
};

export default LayerPanel;