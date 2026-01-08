import React, { useState, useRef, useEffect } from "react";
import { removeFeature } from "./utils/layerUtils";
import { Layers, ChevronDown, Plus, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import { addGeoJsonLayer, toggleLayerVisibility, toggleLayerLock, removeLayer, updateLayerName, handleDragStart, handleDragOver, handleDrop, setActiveLayerOnMap } from "./utils/layerUtils";
import Modal from "@/components/ui/modals/MapNotReady";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const LayerPanel = ({ mapRef, isDarkMode, layers, setLayers, draw }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customLayersExpanded, setCustomLayersExpanded] = useState(true);
  const [systemLayersExpanded, setSystemLayersExpanded] = useState(true);
  const [mapNotReady, setMapNotReady] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [activeMapboxLayerId, setActiveMapboxLayerId] = useState(null);
  const [isDragging, setDragging] = useState(false);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef();

  // System layer states
  const [showPAR, setShowPAR] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showTCID, setShowTCID] = useState(false);
  const [showTCAD, setShowTCAD] = useState(false);
  const [showSHIPPINGZONE, setShowSHIPPINGZONE] = useState(false);
  const [showWindLayer, setShowWindLayer] = useState(false);

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

  const systemLayers = [
    { id: 'PAR', name: 'PAR', subtitle: 'Philippine Area of Responsibility', visible: showPAR, icon: '🗺️' },
    { id: 'Satellite', name: 'Satellite', subtitle: 'Himawari Satellite Image', visible: showSatellite, icon: '🛰️' },
    { id: 'TCID', name: 'TCID', subtitle: 'Tropical Cyclone Info Domain', visible: showTCID, icon: '🌀' },
    { id: 'TCAD', name: 'TCAD', subtitle: 'Tropical Cyclone Advisory Domain', visible: showTCAD, icon: '⚠️' },
    { id: 'SHIPPING_ZONE', name: 'Graticules, Wave & Wind', subtitle: 'Graticules and Wave and Wind Elements', visible: showSHIPPINGZONE, icon: '🌊' },
    { id: 'Wind Layer', name: 'Wind Layer', subtitle: 'Wind Speed & Direction', visible: showWindLayer, icon: '💨' }
  ];

  const visibleCount = layers.filter(l => l.visible).length + systemLayers.filter(l => l.visible).length;

  const startEditing = (layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return; // Don't proceed if empty

    // Update the layer name
    updateLayerName(editingLayerId, editingName, setLayers, mapRef.current);

    // Reset editing state
    setEditingLayerId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingLayerId(null);
    setEditingName("");
  };

  // Collapsed pill state
  if (!isExpanded) {
    return (
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-black/40 hover:bg-black/50 border border-white/20'
            : 'bg-white/60 hover:bg-white/70 border border-black/10'
            } backdrop-blur-xl shadow-lg`}
        >
          <Layers
            size={16}
            className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
            strokeWidth={2.5}
          />
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'
            }`}>
            Layers
          </span>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-blue-500/20 text-blue-700'
            }`}>
            {visibleCount}
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-20 right-6 z-40 w-80">
        <div
          className={`rounded-2xl transition-all duration-300 ${isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
            } backdrop-blur-xl shadow-xl`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-400/20' : 'bg-blue-500/20'
                }`}>
                <Layers
                  size={16}
                  className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                  Map Layers
                </div>
                <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/50' : 'text-slate-600'
                  }`}>
                  {visibleCount} active
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
                ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
                }`}
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Custom Layers Section */}
            <div className="p-3">
              <button
                onClick={() => setCustomLayersExpanded(!customLayersExpanded)}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg mb-2 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'
                    }`}>
                    Custom Layers
                  </span>
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-slate-700'
                    }`}>
                    {layers.length}
                  </div>
                </div>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${customLayersExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}
                  strokeWidth={3}
                />
              </button>

              {customLayersExpanded && (
                <div className="space-y-1">
                  {layers.map((layer, index) => (
                    <div
                      key={layer.id || `layer-${index}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index, setDragging, setDraggedLayerIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index, draggedLayerIndex, layers, setLayers, setDragging)}
                      onClick={() => setActiveLayer(layer.id)}
                      className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 cursor-pointer ${activeLayerId === layer.id
                        ? isDarkMode
                          ? 'bg-cyan-400/10 border border-cyan-400/30'
                          : 'bg-blue-500/10 border border-blue-500/30'
                        : isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                          : 'bg-black/5 hover:bg-black/10 border border-transparent'
                        }`}
                    >
                      <button
                        className={`cursor-grab active:cursor-grabbing ${isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical size={14} strokeWidth={2} />
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingLayerId === layer.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveEdit();
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              className={`flex-1 px-1 py-0.5 text-xs rounded border ${isDarkMode
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                                } outline-none focus:ring-1 focus:ring-cyan-400`}
                              autoFocus
                            />
                            <button onClick={saveEdit} className="p-0.5 hover:bg-white/10 rounded">
                              <Check size={12} className="text-green-500" strokeWidth={2.5} />
                            </button>
                            <button onClick={cancelEdit} className="p-0.5 hover:bg-white/10 rounded">
                              <X size={12} className="text-red-500" strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                            }`}>
                            {layer.name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(layer);
                          }}
                          className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                        >
                          <Edit2 size={12} className={isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600'} strokeWidth={2} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(mapRef.current, layer, setLayers);
                          }}
                          className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                        >
                          {layer.visible ? (
                            <Eye size={14} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2} />
                          ) : (
                            <EyeOff size={14} className={isDarkMode ? 'text-white/40' : 'text-slate-400'} strokeWidth={2} />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerLock(layer, setLayers);
                          }}
                          className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                        >
                          {layer.locked ? (
                            <Lock size={14} className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} strokeWidth={2} />
                          ) : (
                            <Unlock size={14} className={isDarkMode ? 'text-white/40' : 'text-slate-400'} strokeWidth={2} />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            if (layer.locked) {
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'warning',
                                title: 'This layer is locked and cannot be deleted.',
                                showConfirmButton: false,
                                timer: 2000,
                                background: isDarkMode ? '#374151' : '#fff',
                                color: isDarkMode ? '#f3f4f6' : '#111827',
                              });
                              return;
                            }

                            removeLayer(mapRef.current, layer, setLayers, draw);
                            removeFeature(draw, layer.id, mapRef);

                          }}
                          disabled={layer.locked}
                          className={`p-1 rounded transition-colors ${layer.locked
                            ? 'opacity-40 cursor-not-allowed'
                            : isDarkMode
                              ? 'hover:bg-red-500/20 text-white/40 hover:text-red-400'
                              : 'hover:bg-red-500/20 text-slate-400 hover:text-red-600'
                            }`}
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Layers Section */}
            <div className={`p-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <button
                onClick={() => setSystemLayersExpanded(!systemLayersExpanded)}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg mb-2 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'
                    }`}>
                    System Layers
                  </span>
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-slate-700'
                    }`}>
                    {systemLayers.filter(l => l.visible).length}
                  </div>
                </div>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${systemLayersExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}
                  strokeWidth={3}
                />
              </button>

              {systemLayersExpanded && (
                <div className="space-y-1">
                  {systemLayers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => toggleMiscLayer(layer.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${layer.visible
                        ? isDarkMode
                          ? 'bg-cyan-400/10 border border-cyan-400/30'
                          : 'bg-blue-500/10 border border-blue-500/30'
                        : isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                          : 'bg-black/5 hover:bg-black/10 border border-transparent'
                        }`}
                    >
                      <div className={`text-lg leading-none flex-shrink-0`}>
                        {layer.icon}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-xs font-semibold truncate ${layer.visible
                          ? isDarkMode ? 'text-cyan-300' : 'text-blue-700'
                          : isDarkMode ? 'text-white/80' : 'text-slate-700'
                          }`}>
                          {layer.name}
                        </div>
                        <div className={`text-[10px] font-medium truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'
                          }`}>
                          {layer.subtitle}
                        </div>
                      </div>

                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${layer.visible
                        ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
                        : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                        }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Add Layer Button */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <button
              onClick={addLayer}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] ${isDarkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                }`}
            >
              <Plus size={14} strokeWidth={3} />
              Add GeoJSON Layer
            </button>
            <input
              type="file"
              accept=".geojson,application/geo+json,application/json"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleGeoJSONUpload}
            />
          </div>
        </div>
      </div>

      {mapNotReady && (
        <Modal isOpen={mapNotReady} onClose={() => setMapNotReady(false)} />
      )}
    </>
  );
};

export default LayerPanel;