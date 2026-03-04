import React, { useState, useRef, useCallback } from 'react';
import { Layers, ChevronDown, Plus } from 'lucide-react';
import {
  addGeoJsonLayer,
  removeLayer,
  removeFeature,
  setActiveLayerOnMap,
} from '@dashboards/forecaster/utils/layerUtils';
import Modal from '@/components/ui/modals/MapNotReady';
import ConfirmationDialog from '@/components/ui/modals/ConfirmationDialog';

import { useSystemLayers } from './hooks/useSystemLayers';
import { useWindConfig }   from './hooks/useWindConfig';
import { useWaveConfig }   from './hooks/useWaveConfig';
import { useCustomLayerEdit } from './hooks/useCustomLayerEdit';

import CustomLayersSection from './sections/CustomLayers';
import SystemLayersSection from './sections/SystemLayers';

const LayerPanel = ({ mapRef, isDarkMode, layers, setLayers, draw }) => {
  // ── Panel expansion state ───────────────────────────────────────────────────
  const [isExpanded,           setIsExpanded]           = useState(true);
  const [customLayersExpanded, setCustomLayersExpanded] = useState(true);
  const [systemLayersExpanded, setSystemLayersExpanded] = useState(true);

  const [expandedGroups, setExpandedGroups] = useState({
    domains: false, utilities: false, satellite: true, wind: true, wave: true,
  });

  const toggleGroup = useCallback((id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ── Custom layer interaction state ──────────────────────────────────────────
  const [activeLayerId,       setActiveLayerId]       = useState(null);
  const [activeMapboxLayerId, setActiveMapboxLayerId] = useState(null);
  const [mapNotReady,         setMapNotReady]         = useState(false);
  const [confirmDialog,       setConfirmDialog]       = useState({ isOpen: false, layer: null });

  const fileInputRef = useRef();

  // ── Domain / utility / satellite ────────────────────────────────────────────
  const {
    domainLayers, utilitiesLayers, satelliteLayer,
    activeCount: systemActiveCount,
    toggleDomainLayer, toggleUtilityLayer, toggleSatelliteLayer,
  } = useSystemLayers({ mapRef, isDarkMode });

  // ── Wind ─────────────────────────────────────────────────────────────────────
  const {
    windConfig, toggleWindLayer, setWindElement, toggleWindModel,
  } = useWindConfig({ mapRef, isDarkMode });

  // ── Wave ─────────────────────────────────────────────────────────────────────
  const {
    waveConfig, toggleWaveLayer, setWaveElement, toggleWaveModel,
  } = useWaveConfig({ mapRef, isDarkMode });

  // ── Custom layer editing / drag ─────────────────────────────────────────────
  const editState = useCustomLayerEdit({ setLayers, mapRef });

  // ── Derived counts ───────────────────────────────────────────────────────────
  const activeSystemLayersCount =
    systemActiveCount +
    (windConfig.enabled ? 1 : 0) +
    (waveConfig.enabled ? 1 : 0);

  const visibleCount = layers.filter((l) => l.visible).length + activeSystemLayersCount;

  // ── GeoJSON upload ───────────────────────────────────────────────────────────
  const handleGeoJSONUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !mapRef.current) return;
    addGeoJsonLayer(mapRef.current, file, layers, setLayers);
  };

  const addLayer = () => {
    if (!mapRef.current) { setMapNotReady(true); return; }
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  // ── Active layer ─────────────────────────────────────────────────────────────
  const setActiveLayer = useCallback((id) => {
    setActiveLayerOnMap({
      id, mapRef, draw, layers, activeLayerId,
      setActiveLayerId, setActiveMapboxLayerId,
    });
  }, [mapRef, draw, layers, activeLayerId]);

  // ── Collapsed pill ───────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-xl shadow-lg ${
            isDarkMode
              ? 'bg-black/40 hover:bg-black/50 border border-white/20'
              : 'bg-white/60 hover:bg-white/70 border border-black/10'
          }`}
        >
          <Layers size={16} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2.5} />
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>
            Layers
          </span>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isDarkMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-blue-500/20 text-blue-700'
          }`}>
            {visibleCount}
          </div>
        </button>
      </div>
    );
  }

  // ── Expanded panel ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed top-16 right-2 z-40 w-80 mt-1">
        <div className={`rounded-2xl transition-all duration-300 backdrop-blur-xl shadow-xl ${
          isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/60 border border-white/40'
        }`}>
          {/* ── Panel header ─────────────────────────────────────────────────── */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            isDarkMode ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-400/20' : 'bg-blue-500/20'}`}>
                <Layers size={16} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2.5} />
              </div>
              <div>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Map Layers
                </div>
                <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/50' : 'text-slate-600'}`}>
                  {visibleCount} active
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Scrollable content ───────────────────────────────────────────── */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto hide-scrollbar">
            <CustomLayersSection
              layers={layers}
              setLayers={setLayers}
              mapRef={mapRef}
              draw={draw}
              expanded={customLayersExpanded}
              onToggleExpand={() => setCustomLayersExpanded((v) => !v)}
              activeLayerId={activeLayerId}
              onSetActiveLayer={setActiveLayer}
              onRequestDelete={(layer) => setConfirmDialog({ isOpen: true, layer })}
              isDarkMode={isDarkMode}
              {...editState}
            />

            <SystemLayersSection
              expanded={systemLayersExpanded}
              onToggleExpand={() => setSystemLayersExpanded((v) => !v)}
              activeCount={activeSystemLayersCount}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              domainLayers={domainLayers}
              utilitiesLayers={utilitiesLayers}
              satelliteLayer={satelliteLayer}
              windConfig={windConfig}
              waveConfig={waveConfig}
              onToggleDomain={toggleDomainLayer}
              onToggleUtility={toggleUtilityLayer}
              onToggleSatellite={toggleSatelliteLayer}
              onToggleWind={toggleWindLayer}
              onSetWindElement={setWindElement}
              onToggleWindModel={toggleWindModel}
              onToggleWave={toggleWaveLayer}
              onSetWaveElement={setWaveElement}
              onToggleWaveModel={toggleWaveModel}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* ── Footer: add layer ─────────────────────────────────────────────── */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <button
              onClick={addLayer}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] ${
                isDarkMode
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
              style={{ display: 'none' }}
              onChange={handleGeoJSONUpload}
            />
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
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