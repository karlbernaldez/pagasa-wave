import React, { useState, useRef, useEffect } from "react";
import { removeFeature } from "./utils/layerUtils";
import { Layers, ChevronDown, ChevronRight, Plus, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import { addGeoJsonLayer, toggleLayerVisibility, toggleLayerLock, removeLayer, updateLayerName, handleDragStart, handleDragOver, handleDrop, setActiveLayerOnMap } from "./utils/layerUtils";
import Modal from "@/components/ui/modals/MapNotReady";
import Swal from 'sweetalert2';
import ConfirmationDialog from "@/components/ui/modals/ConfirmationDialog";
import 'sweetalert2/dist/sweetalert2.min.css';

import { addWaveLayer, addWaveSource } from '@/components/pages/studio/map/layers/waveLayer';

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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, layer: null });
  const [isSwitchingWaveModel, setIsSwitchingWaveModel] = useState(false);

  // System layer group expansion states
  const [expandedGroups, setExpandedGroups] = useState({
    domains: true,
    utilities: true,
    satellite: true,
    wind: true,
    wave: true
  });

  // Multi-select layer states (Domains)
  const [domainLayers, setDomainLayers] = useState({
    PAR: false,
    TCID: false,
    TCAD: false
  });

  // Utilities layer states
  const [utilitiesLayers, setUtilitiesLayers] = useState({
    GRATICULES: false,
    SHIPPING_ZONE: false
  });

  // Single-select layer states (Satellite)
  const [satelliteLayer, setSatelliteLayer] = useState(false);

  // Wind Layer configuration
  const [windConfig, setWindConfig] = useState({
    enabled: false,
    model: 'ECMWF', // GFS, ECMWF, NOAA, etc.
    elements: {
      particles: false,
      raster: false,
      barbs: false
    }
  });

  // Wave Layer configuration
  const [waveConfig, setWaveConfig] = useState({
    enabled: false,
    model: 'SWAN', // SWAN, WW3, etc.
    elements: {
      particles: false,
      raster: false,
      waveDirection: false,
      wavePeriod: false
    }
  });

  // Initialize layers using saved stated from local storage
  useEffect(() => {
    console.log('Initializing layers...');

    const savedDomains = {
      PAR: localStorage.getItem('PAR') === 'true',
      TCID: localStorage.getItem('TCID') === 'true',
      TCAD: localStorage.getItem('TCAD') === 'true'
    };

    const savedUtilities = {
      GRATICULES: localStorage.getItem('GRATICULES') === 'true',
      SHIPPING_ZONE: localStorage.getItem('SHIPPING_ZONE') === 'true'
    };

    const savedSatellite = localStorage.getItem('SATELLITE') === 'true';

    const savedWind = {
      enabled: localStorage.getItem('WIND_ENABLED') === 'true',
      model: localStorage.getItem('WIND_MODEL') || 'ECMWF',
      elements: {
        particles: localStorage.getItem('WIND_PARTICLES') === 'true',
        raster: localStorage.getItem('WIND_RASTER') === 'true',
        barbs: localStorage.getItem('WIND_BARBS') === 'true'
      }
    };

    const savedWave = {
      enabled: localStorage.getItem('WAVE_ENABLED') === 'true',
      model: localStorage.getItem('WAVE_MODEL') || 'SWAN',
      elements: {
        particles: localStorage.getItem('WAVE_PARTICLES') === 'true',
        raster: localStorage.getItem('WAVE_RASTER') === 'true',
        waveDirection: localStorage.getItem('WAVE_DIRECTION') === 'true',
        wavePeriod: localStorage.getItem('WAVE_PERIOD') === 'true'
      }
    };

    console.log('Saved Wave Config:', savedWave);

    setDomainLayers(savedDomains);
    setUtilitiesLayers(savedUtilities);
    setSatelliteLayer(savedSatellite);
    setWindConfig(savedWind);
    setWaveConfig(savedWave);

    if (!map) return;

    const applySavedLayers = async () => {
      // Domains
      map.setLayoutProperty('PAR', 'visibility', savedDomains.PAR ? 'visible' : 'none');
      map.setLayoutProperty('PAR_dash', 'visibility', savedDomains.PAR ? 'visible' : 'none');
      map.setLayoutProperty('TCID', 'visibility', savedDomains.TCID ? 'visible' : 'none');
      map.setLayoutProperty('TCAD', 'visibility', savedDomains.TCAD ? 'visible' : 'none');

      // Utilities
      map.setLayoutProperty(
        'SHIPPING_ZONE_FILL',
        'visibility',
        savedUtilities.SHIPPING_ZONE ? 'visible' : 'none'
      );
      map.setLayoutProperty(
        'SHIPPING_ZONE_LABELS',
        'visibility',
        savedUtilities.SHIPPING_ZONE ? 'visible' : 'none'
      );
      map.setLayoutProperty(
        'SHIPPING_ZONE_OUTLINE',
        'visibility',
        savedUtilities.SHIPPING_ZONE ? 'visible' : 'none'
      );
      map.setLayoutProperty('graticules', 'visibility', savedUtilities.GRATICULES ? 'visible' : 'none');
      map.setLayoutProperty('graticules_blur', 'visibility', savedUtilities.GRATICULES ? 'visible' : 'none');

      // Satellite
      map.setLayoutProperty('Satellite', 'visibility', savedSatellite ? 'visible' : 'none');

      // Wind
      if (savedWind.enabled) {
        applyWindLayers(savedWind);
      }

      // 🌊 Wave
      if (savedWave.enabled) {
        console.log('Wave Layer Enabled');
        applyWaveLayers(savedWave);
      }
    };

    if (map.isStyleLoaded()) {
      applySavedLayers();
    } else {
      // ⏳ Wait once
      map.once('load', applySavedLayers);
      console.log("LOADING MAP")
    }
  }, [map]);

  const applyWindLayers = (config) => {

    console.log('THIS IS CONFIG: ', config)
    if (!mapRef.current) return;

    const { elements } = config;

    // Wind particles
    mapRef.current.setLayoutProperty('wind-particles', 'visibility', elements.particles ? 'visible' : 'none');

    // Wind raster map
    mapRef.current.setLayoutProperty('wind-raster-layer', 'visibility', elements.raster ? 'visible' : 'none');

    // Wind barbs
    mapRef.current.setLayoutProperty('wind-arrows', 'visibility', elements.barbs ? 'visible' : 'none');
    mapRef.current.setLayoutProperty('wind-labels', 'visibility', elements.barbs ? 'visible' : 'none');

    // Glass layers (base visualization for wind)
    const showBase = elements.particles || elements.raster || elements.barbs;
    mapRef.current.setLayoutProperty('glass-fill', 'visibility', showBase ? 'visible' : 'none');
    mapRef.current.setLayoutProperty('glass-stroke', 'visibility', showBase ? 'visible' : 'none');
    mapRef.current.setLayoutProperty('glass-depth', 'visibility', showBase ? 'visible' : 'none');
  };

  const applyWaveLayers = async (config) => {
    if (!map) return;

    const { elements } = config;

    console.log('ELEMENTS: ', elements)

    // Wave raster
    if (map.getLayer('wave-raster')) {
      console.log("WAVE RASTER LAYER FOUND")
      map.setLayoutProperty('wave-raster', 'visibility', elements.raster ? 'visible' : 'none');
    }

  };

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

  const checkProjectId = () => {
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
      return false;
    }
    return true;
  };

  const toggleDomainLayer = (layerId) => {
    if (!checkProjectId()) return;

    setDomainLayers(prev => {
      const newState = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, newState[layerId].toString());

      // Apply to map
      if (mapRef.current) {
        switch (layerId) {
          case 'PAR':
            mapRef.current.setLayoutProperty('PAR', 'visibility', newState.PAR ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('PAR_dash', 'visibility', newState.PAR ? 'visible' : 'none');
            break;
          case 'TCID':
            mapRef.current.setLayoutProperty('TCID', 'visibility', newState.TCID ? 'visible' : 'none');
            break;
          case 'TCAD':
            mapRef.current.setLayoutProperty('TCAD', 'visibility', newState.TCAD ? 'visible' : 'none');
            break;
        }
      }

      return newState;
    });
  };

  const toggleUtilityLayer = (layerId) => {
    if (!checkProjectId()) return;

    setUtilitiesLayers(prev => {
      const newState = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, newState[layerId].toString());

      // Apply to map
      if (mapRef.current) {
        switch (layerId) {
          case 'GRATICULES':
            mapRef.current.setLayoutProperty('graticules', 'visibility', newState.GRATICULES ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('graticules_blur', 'visibility', newState.GRATICULES ? 'visible' : 'none');
            break;
          case 'SHIPPING_ZONE':
            mapRef.current.setLayoutProperty('SHIPPING_ZONE_LABELS', 'visibility', newState.SHIPPING_ZONE ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', newState.SHIPPING_ZONE ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('SHIPPING_ZONE_FILL', 'visibility', newState.SHIPPING_ZONE ? 'visible' : 'none');
            break;
        }
      }

      return newState;
    });
  };

  const toggleSatelliteLayer = () => {
    if (!checkProjectId()) return;

    setSatelliteLayer(prev => {
      const newState = !prev;
      localStorage.setItem('SATELLITE', newState.toString());
      mapRef.current?.setLayoutProperty('Satellite', 'visibility', newState ? 'visible' : 'none');
      return newState;
    });
  };

  const toggleWindLayer = () => {
    if (!checkProjectId()) return;

    setWindConfig(prev => {
      const newState = { ...prev, enabled: !prev.enabled };
      localStorage.setItem('WIND_ENABLED', newState.enabled.toString());

      if (!newState.enabled) {
        // Turn off all elements when disabled
        applyWindLayers({ elements: { particles: false, raster: false, wind: false } });
      } else {
        applyWindLayers(newState);

      }

      return newState;
    });
  };

  const toggleWindElement = (element) => {
    console.log(element)
    setWindConfig(prev => {
      const newState = {
        ...prev,
        elements: {
          ...prev.elements,
          [element]: !prev.elements[element]
        }
      };

      localStorage.setItem(`WIND_${element.toUpperCase()}`, newState.elements[element].toString());
      applyWindLayers(newState);

      return newState;
    });
  };

  const setWindModel = (model) => {
    setWindConfig(prev => {
      const newState = { ...prev, model };
      localStorage.setItem('WIND_MODEL', model);
      return newState;
    });
  };

  const toggleWaveLayer = () => {
    if (!checkProjectId()) return;

    setWaveConfig(prev => {
      const newState = { ...prev, enabled: !prev.enabled };
      localStorage.setItem('WAVE_ENABLED', newState.enabled.toString());

      if (!newState.enabled) {
        // Turn off all wave elements
        applyWaveLayers({
          elements: {
            particles: false,
            raster: false,
            waveDirection: false,
            wavePeriod: false
          }
        });

        if (mapRef.current.getLayer('wave-raster')) {
          mapRef.current.setLayoutProperty('wave-raster', 'visibility', 'none');
        }

      } else {
        const map = mapRef.current;

        // ✅ Check if wave layer already exists
        if (map.getLayer('wave-raster')) {
          applyWaveLayers(newState);
        } else {
          addWaveLayer(map, isDarkMode);
        }
      }

      return newState;
    });
  };

  const toggleWaveElement = (element) => {
    setWaveConfig(prev => {
      const newState = {
        ...prev,
        elements: {
          ...prev.elements,
          [element]: !prev.elements[element]
        }
      };

      localStorage.setItem(`WAVE_${element.toUpperCase()}`, newState.elements[element].toString());
      applyWaveLayers(newState);

      return newState;
    });
  };

  const setWaveModel = async (model) => {
    console.log('[Wave] Model changed to:', model);

    setIsSwitchingWaveModel(true);

    try {
      if (map.getLayer('wave-raster')) {
        console.log('[Wave] Removing raster layer');
        map.removeLayer('wave-raster');
      }

      if (map.getSource('wave-light')) {
        console.log('[Wave] Removing source');
        map.removeSource('wave-light');
      }

      await addWaveSource(map, isDarkMode, model);
      addWaveLayer(map, isDarkMode);

      setWaveConfig(prev => {
        const newState = { ...prev, model };
        applyWaveLayers(newState);
        localStorage.setItem('WAVE_MODEL', model);
        return newState;
      });

    } catch (err) {
      console.error('[Wave] Failed to switch model:', err);
    } finally {
      setIsSwitchingWaveModel(false);
    }
  };

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Calculate active system layers count
  const activeSystemLayersCount =
    Object.values(domainLayers).filter(Boolean).length +
    Object.values(utilitiesLayers).filter(Boolean).length +
    (satelliteLayer ? 1 : 0) +
    (windConfig.enabled ? 1 : 0) +
    (waveConfig.enabled ? 1 : 0);

  const visibleCount = layers.filter(l => l.visible).length + activeSystemLayersCount;

  const startEditing = (layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    updateLayerName(editingLayerId, editingName, setLayers, mapRef.current);
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
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto hide-scrollbar">
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

                            setConfirmDialog({ isOpen: true, layer });
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
                    {activeSystemLayersCount}
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
                <div className="space-y-2">
                  {/* Domains Group (Multi-select) */}
                  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <button
                      onClick={() => toggleGroupExpansion('domains')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🗺️</span>
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                          }`}>
                          Domains
                        </span>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-white/10 text-white/60' : 'bg-black/10 text-slate-600'
                          }`}>
                          {Object.values(domainLayers).filter(Boolean).length}
                        </div>
                      </div>
                      {expandedGroups.domains ? (
                        <ChevronDown size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      )}
                    </button>

                    {expandedGroups.domains && (
                      <div className="px-2 pb-2 space-y-1">
                        {[
                          { id: 'PAR', name: 'PAR', subtitle: 'Philippine Area of Responsibility' },
                          { id: 'TCID', name: 'TCID', subtitle: 'Tropical Cyclone Info Domain' },
                          { id: 'TCAD', name: 'TCAD', subtitle: 'Tropical Cyclone Advisory Domain' }
                        ].map((domain) => (
                          <button
                            key={domain.id}
                            onClick={() => toggleDomainLayer(domain.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${domainLayers[domain.id]
                              ? isDarkMode
                                ? 'bg-cyan-400/10 border border-cyan-400/30'
                                : 'bg-blue-500/10 border border-blue-500/30'
                              : isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                                : 'bg-black/5 hover:bg-black/10 border border-transparent'
                              }`}
                          >
                            <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${domainLayers[domain.id]
                              ? isDarkMode
                                ? 'bg-cyan-400 border-cyan-400'
                                : 'bg-blue-600 border-blue-600'
                              : isDarkMode
                                ? 'border-white/30'
                                : 'border-slate-300'
                              }`}>
                              {domainLayers[domain.id] && (
                                <Check size={10} className="text-white" strokeWidth={3} />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                                }`}>
                                {domain.name}
                              </div>
                              <div className={`text-[10px] truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'
                                }`}>
                                {domain.subtitle}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Utilities Group (Multi-select) */}
                  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <button
                      onClick={() => toggleGroupExpansion('utilities')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛠️</span>
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                          }`}>
                          Utilities
                        </span>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-white/10 text-white/60' : 'bg-black/10 text-slate-600'
                          }`}>
                          {Object.values(utilitiesLayers).filter(Boolean).length}
                        </div>
                      </div>
                      {expandedGroups.utilities ? (
                        <ChevronDown size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      )}
                    </button>

                    {expandedGroups.utilities && (
                      <div className="px-2 pb-2 space-y-1">
                        {[
                          { id: 'GRATICULES', name: 'Graticules', subtitle: 'Coordinate Grid Lines' },
                          { id: 'SHIPPING_ZONE', name: 'Shipping Zones', subtitle: 'Maritime Shipping Areas' }
                        ].map((utility) => (
                          <button
                            key={utility.id}
                            onClick={() => toggleUtilityLayer(utility.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${utilitiesLayers[utility.id]
                              ? isDarkMode
                                ? 'bg-cyan-400/10 border border-cyan-400/30'
                                : 'bg-blue-500/10 border border-blue-500/30'
                              : isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                                : 'bg-black/5 hover:bg-black/10 border border-transparent'
                              }`}
                          >
                            <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${utilitiesLayers[utility.id]
                              ? isDarkMode
                                ? 'bg-cyan-400 border-cyan-400'
                                : 'bg-blue-600 border-blue-600'
                              : isDarkMode
                                ? 'border-white/30'
                                : 'border-slate-300'
                              }`}>
                              {utilitiesLayers[utility.id] && (
                                <Check size={10} className="text-white" strokeWidth={3} />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                                }`}>
                                {utility.name}
                              </div>
                              <div className={`text-[10px] truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'
                                }`}>
                                {utility.subtitle}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Satellite Layer (Single-select) */}
                  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <button
                      onClick={toggleSatelliteLayer}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${satelliteLayer
                        ? isDarkMode
                          ? 'bg-cyan-400/10 border border-cyan-400/30'
                          : 'bg-blue-500/10 border border-blue-500/30'
                        : isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                          : 'bg-black/5 hover:bg-black/10 border border-transparent'
                        }`}
                    >
                      <div className="text-lg leading-none flex-shrink-0">🛰️</div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-xs font-semibold truncate ${satelliteLayer
                          ? isDarkMode ? 'text-cyan-300' : 'text-blue-700'
                          : isDarkMode ? 'text-white/80' : 'text-slate-700'
                          }`}>
                          Satellite
                        </div>
                        <div className={`text-[10px] font-medium truncate ${isDarkMode ? 'text-white/40' : 'text-slate-500'
                          }`}>
                          Himawari Satellite Image
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${satelliteLayer
                        ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
                        : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                        }`} />
                    </button>
                  </div>

                  {/* Wind Layer (Configurable) */}
                  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg">
                      <button
                        onClick={() => toggleGroupExpansion('wind')}
                        className={`flex-1 flex items-center gap-2 text-left ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                      >
                        <span className="text-base">💨</span>
                        <div className="flex-1">
                          <div className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>Wind</div>
                          <div className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                            {windConfig.enabled ? `${windConfig.model} Model` : 'Disabled'}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={toggleWindLayer}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${windConfig.enabled
                          ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
                          : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                          }`}
                      />

                      {expandedGroups.wind ? (
                        <ChevronDown size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      )}
                    </div>

                    {expandedGroups.wind && windConfig.enabled && (
                      <div className="px-2 pb-2 space-y-2">
                        {/* Model Selection - Dropdown */}
                        <div className="space-y-1">
                          <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                            }`}>
                            Model
                          </div>
                          <select
                            value={windConfig.model}
                            onChange={(e) => setWindModel(e.target.value)}
                            className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-all ${isDarkMode
                              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                              } outline-none focus:ring-2 focus:ring-cyan-400`}
                          >
                            <option value="GFS">GFS (Global Forecast System)</option>
                            <option value="ECMWF">ECMWF (European Centre)</option>
                            <option value="NOAA">NOAA (National Oceanic)</option>
                            <option value="NAM">NAM (North American Mesoscale)</option>
                            <option value="HRRR">HRRR (High-Resolution Rapid)</option>
                          </select>
                        </div>

                        {/* Elements */}
                        <div className="space-y-1">
                          <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                            }`}>
                            Elements
                          </div>
                          {[
                            { id: 'particles', name: 'Particles', icon: '✨' },
                            { id: 'raster', name: 'Raster Map', icon: '🗾' },
                            { id: 'barbs', name: 'Wind Barbs', icon: '🎐' }
                          ].map((element) => (
                            <button
                              key={element.id}
                              onClick={() => toggleWindElement(element.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${windConfig.elements[element.id]
                                ? isDarkMode
                                  ? 'bg-cyan-400/10 border border-cyan-400/30'
                                  : 'bg-blue-500/10 border border-blue-500/30'
                                : isDarkMode
                                  ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                                  : 'bg-black/5 hover:bg-black/10 border border-transparent'
                                }`}
                            >
                              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${windConfig.elements[element.id]
                                ? isDarkMode
                                  ? 'bg-cyan-400 border-cyan-400'
                                  : 'bg-blue-600 border-blue-600'
                                : isDarkMode
                                  ? 'border-white/30'
                                  : 'border-slate-300'
                                }`}>
                                {windConfig.elements[element.id] && (
                                  <Check size={10} className="text-white" strokeWidth={3} />
                                )}
                              </div>
                              <span className="text-xs mr-1">{element.icon}</span>
                              <div className={`text-xs font-medium flex-1 text-left ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                                }`}>
                                {element.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wave Layer (Configurable) */}
                  <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg">
                      <button
                        onClick={() => toggleGroupExpansion('wave')}
                        className={`flex-1 flex items-center gap-2 text-left ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                      >
                        <span className="text-base">🌊</span>
                        <div className="flex-1">
                          <div className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>Wave</div>
                          <div className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                            {waveConfig.enabled ? `${waveConfig.model} Model` : 'Disabled'}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={toggleWaveLayer}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${waveConfig.enabled
                          ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
                          : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                          }`}
                      />

                      {expandedGroups.wave ? (
                        <ChevronDown size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
                      )}
                    </div>

                    {expandedGroups.wave && waveConfig.enabled && (
                      <div className="px-2 pb-2 space-y-2">
                        {/* Model Selection - Dropdown */}
                        <div className="space-y-1">
                          <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                            }`}>
                            Model
                          </div>
                          <select
                            value={waveConfig.model}
                            onChange={(e) => setWaveModel(e.target.value)}
                            className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-all ${isDarkMode
                              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                              } outline-none focus:ring-2 focus:ring-cyan-400`}
                          >
                            <option value="SWAN">SWAN (Simulating Waves)</option>
                            <option value="WW3">WW3 (WaveWatch III)</option>
                            <option value="ECWAM">ECWAM (Wave Model)</option>
                            <option value="MRI3">MRI3 (Steady-State Wave)</option>
                          </select>
                        </div>

                        {/* Elements */}
                        <div className="space-y-1">
                          <div className={`text-[10px] font-semibold px-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'
                            }`}>
                            Elements
                          </div>
                          {[
                            // { id: 'particles', name: 'Particles', icon: '✨' },
                            { id: 'raster', name: 'Raster Map', icon: '🗾' },
                            { id: 'waveDirection', name: 'Wave Direction', icon: '➡️' },
                            { id: 'wavePeriod', name: 'Mean Period', icon: '⏱️' }
                          ].map((element) => (
                            <button
                              key={element.id}
                              onClick={() => toggleWaveElement(element.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${waveConfig.elements[element.id]
                                ? isDarkMode
                                  ? 'bg-cyan-400/10 border border-cyan-400/30'
                                  : 'bg-blue-500/10 border border-blue-500/30'
                                : isDarkMode
                                  ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                                  : 'bg-black/5 hover:bg-black/10 border border-transparent'
                                }`}
                            >
                              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${waveConfig.elements[element.id]
                                ? isDarkMode
                                  ? 'bg-cyan-400 border-cyan-400'
                                  : 'bg-blue-600 border-blue-600'
                                : isDarkMode
                                  ? 'border-white/30'
                                  : 'border-slate-300'
                                }`}>
                                {waveConfig.elements[element.id] && (
                                  <Check size={10} className="text-white" strokeWidth={3} />
                                )}
                              </div>
                              <span className="text-xs mr-1">{element.icon}</span>
                              <div className={`text-xs font-medium flex-1 text-left ${isDarkMode ? 'text-white/90' : 'text-slate-800'
                                }`}>
                                {element.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, layer: null })}
        onConfirm={() => {
          removeLayer(mapRef.current, confirmDialog.layer, setLayers, draw);
          removeFeature(draw, confirmDialog.layer.id, mapRef);
        }}
        title="Delete Layer?"
        message="Are you sure you want to delete"
        layerName={confirmDialog.layer?.name}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default LayerPanel;