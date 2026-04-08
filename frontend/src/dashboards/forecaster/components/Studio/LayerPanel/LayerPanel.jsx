import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Layers, ChevronDown, Plus, Menu, Info, X, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

import { addGeoJsonLayer, removeLayer, removeFeature, setActiveLayerOnMap } from '@dashboards/forecaster/utils/layerUtils';
import { handleCreateProject as createProjectHandler } from '@dashboards/forecaster/utils/ProjectUtils';

import { useSystemLayers } from './hooks/useSystemLayers';
import { useWindConfig } from './hooks/useWindConfig';
import { useWaveConfig } from './hooks/useWaveConfig';
import { useCustomLayerEdit } from './hooks/useCustomLayerEdit';
import { useProjectData } from '../Menu/hooks/useProjectData';

import CustomLayersSection from './sections/CustomLayers';
import SystemLayersSection from './sections/SystemLayers';
import Modal from '@/components/ui/modals/MapNotReady';
import ConfirmationDialog from '@/components/ui/modals/ConfirmationDialog';
import WaveLegend from '@dashboards/forecaster/components/Studio/WaveLegend';
import ProjectInfo from '../ProjectInfo';
import SharedModals, { createDeleteHandler } from '../Menu/SharedModals';
import ShareProjectModal from '@/components/ui/modals/ShareProjectModal';
import { buildMenuSections } from '../Menu/constants/menuConfig';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const StudioPanel = ({
  mapRef,
  isDarkMode,
  layers,
  setLayers,
  draw,
  onNew,
  onSave,
  onView,
}) => {

  // ── Panel & menu state ───────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef();
  const menuRef = useRef();

  // ── Layer state ──────────────────────────────────────────────────────────────
  const [customLayersExpanded, setCustomLayersExpanded] = useState(true);
  const [systemLayersExpanded, setSystemLayersExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({
    domains: false, utilities: false, satellite: true, wind: true, wave: true,
  });
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [activeMapboxLayerId, setActiveMapboxLayerId] = useState(null);
  const [mapNotReady, setMapNotReady] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, layer: null });
  const fileInputRef = useRef();
  const [activeLayerStyles, setActiveLayerStyles] = useState(null);

  // ── Project / modal state ────────────────────────────────────────────────────
  const [activeMenu, setActiveMenu] = useState(null);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Close menu dropdown on outside click ────────────────────────────────────
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  // ── Project data hook ────────────────────────────────────────────────────────
  const { projectName, chartType, forecastDate, setProjectFromSelection, resetProject } = useProjectData();

  // ── Layer hooks ──────────────────────────────────────────────────────────────
  const {
    domainLayers, utilitiesLayers, satelliteLayer,
    activeCount: systemActiveCount,
    toggleDomainLayer, toggleUtilityLayer, toggleSatelliteLayer,
  } = useSystemLayers({ mapRef, isDarkMode });

  const { windConfig, toggleWindLayer, setWindElement, toggleWindModel, setWindBarbStyle } = useWindConfig({ mapRef, isDarkMode });
  const { waveConfig, toggleWaveLayer, setWaveElement, toggleWaveModel, setDirectionStyle } = useWaveConfig({ mapRef, isDarkMode });

  const editState = useCustomLayerEdit({ setLayers, mapRef });

  // ── Derived counts ───────────────────────────────────────────────────────────
  const toggleGroup = useCallback((id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const activeSystemLayersCount =
    systemActiveCount + (windConfig.enabled ? 1 : 0) + (waveConfig.enabled ? 1 : 0);

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
  const setActiveLayer = useCallback((layer) => {
    console.log(layer);
    const id = layer.id
    setActiveLayerOnMap({ layer, id, mapRef, draw, layers, activeLayerId, setActiveLayerId, setActiveMapboxLayerId });
  }, [mapRef, draw, layers, activeLayerId]);

  // ── Project handlers ─────────────────────────────────────────────────────────
  const handleSubmitFile = useCallback(async (file) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectFile', file);
      formData.append('projectId', localStorage.getItem('projectId'));
      setShowSubmitModal(false);
      Swal.fire('Success', 'File submitted successfully!', 'success');
    } catch {
      Swal.fire('Error', 'Failed to submit file.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleCreateProjectSubmit = useCallback((formData) => {
    createProjectHandler({
      projectName: formData.projectName,
      chartType: formData.chartType,
      description: formData.description,
      forecastDate: dayjs(formData.forecastDate),
      onNew,
      setShowModal,
    });
  }, [onNew]);

  const handleSelectProject = useCallback((proj) => {
    setProjectFromSelection(proj);
    if (onSave) onSave(proj);
  }, [onSave, setProjectFromSelection]);

  const handleDeleteProject = useMemo(() => createDeleteHandler({ resetProject }), [resetProject]);

  const handleShareProject = useCallback(async ({ users }) => {
    try {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Project shared with ${users.length} user${users.length !== 1 ? 's' : ''}`, showConfirmButton: false, timer: 2500 });
      setShowShareModal(false);
    } catch {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to share project', showConfirmButton: false, timer: 2500 });
    }
  }, []);

  // ── Menu sections ────────────────────────────────────────────────────────────
  const menuSections = useMemo(() =>
    buildMenuSections({
      openNewProject: () => { setShowModal(true); setMenuOpen(false); },
      openProjectList: () => { setShowProjectList(true); setMenuOpen(false); },
      openShareProject: () => { setShowShareModal(true); setMenuOpen(false); },
      openSubmitData: () => { setShowSubmitModal(true); setMenuOpen(false); },
      onView,
    }),
    [onView]
  );

  const toggleSubmenu = (id) => setActiveMenu((prev) => (prev === id ? null : id));

  // ── Shared modal props ────────────────────────────────────────────────────────
  const sharedModalProps = {
    isDarkMode, showModal, showProjectList, showSubmitModal,
    onCloseCreate: () => setShowModal(false),
    onCloseProjectList: () => setShowProjectList(false),
    onCloseSubmit: () => setShowSubmitModal(false),
    onCreateProject: handleCreateProjectSubmit,
    onSelectProject: handleSelectProject,
    onDeleteProject: handleDeleteProject,
    onSubmitFile: handleSubmitFile,
    projectName, chartType, forecastDate, isSubmitting,
  };

  // ── Collapsed pill ───────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <>
        <div className="fixed top-20 left-4 z-40">
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-xl shadow-lg',
              isDarkMode
                ? 'bg-black/40 hover:bg-black/50 border border-white/20'
                : 'bg-white/60 hover:bg-white/70 border border-black/10'
            )}
          >
            <Menu size={14} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2.5} />
            <span className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white/90' : 'text-slate-800')}>Studio</span>
            <div className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold', isDarkMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-blue-500/20 text-blue-700')}>
              {visibleCount}
            </div>
          </button>
        </div>
        <SharedModals {...sharedModalProps} />
        <ShareProjectModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShareProject} projectName={projectName} isDarkMode={isDarkMode} />
      </>
    );
  }

  // ── Expanded panel ───────────────────────────────────────────────────────────
  return (
    <>
      <div ref={panelRef} className="fixed top-16 left-2 z-40 w-64 mt-1">
        <div className={cn(
          'rounded-xl transition-all duration-300 backdrop-blur-xl shadow-xl flex flex-col',
          isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/60 border border-white/40'
        )}>

          {/* ── SECTION 1: Menu Button (top) ─────────────────────────────────── */}
          <div className={cn('p-2 border-b relative', isDarkMode ? 'border-white/10' : 'border-black/10')} ref={menuRef}>
            <div className="flex items-center gap-1.5">
              {/* Menu toggle button */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  'flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200',
                  menuOpen
                    ? isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-black/10 text-slate-900'
                    : isDarkMode
                      ? 'hover:bg-white/8 text-white/80 hover:text-white'
                      : 'hover:bg-black/5 text-slate-700 hover:text-slate-900'
                )}
              >
                <Menu size={13} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
                <span>Project Menu</span>
                <ChevronDown
                  size={11}
                  strokeWidth={2.5}
                  className={cn('ml-auto transition-transform duration-200', menuOpen ? 'rotate-180' : '')}
                />
              </button>

              {/* Collapse panel button */}
              <button
                onClick={() => setIsExpanded(false)}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200 hover:scale-110',
                  isDarkMode ? 'hover:bg-white/10 text-white/50 hover:text-white/90' : 'hover:bg-black/8 text-slate-400 hover:text-slate-700'
                )}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Menu dropdown ─────────────────────────────────────────────── */}
            {menuOpen && (
              <div className={cn(
                'absolute top-full mt-1 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[200px]',
                isDarkMode
                  ? 'bg-[#0f1117] border border-white/20'
                  : 'bg-white border border-black/10'
              )}>
                <div className="p-2 space-y-0.5">
                  {menuSections.map((section) => (
                    <div key={section.id}>
                      {/* Section header */}
                      <button
                        onClick={() => toggleSubmenu(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                          isDarkMode ? 'text-white/40 hover:text-white/60 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-black/4'
                        )}
                      >
                        {section.icon && <section.icon size={10} strokeWidth={2.5} />}
                        <span>{section.title}</span>
                        <ChevronRight
                          size={10}
                          strokeWidth={2.5}
                          className={cn('ml-auto transition-transform duration-150', activeMenu === section.id ? 'rotate-90' : '')}
                        />
                      </button>

                      {/* Section items */}
                      {activeMenu === section.id && (
                        <div className="ml-3 mt-0.5 space-y-0.5 mb-1">
                          {section.items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => { item.onClick(); setMenuOpen(false); }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 text-left',
                                isDarkMode
                                  ? 'text-white/70 hover:text-white hover:bg-white/8'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                              )}
                            >
                              {item.icon && <item.icon size={11} strokeWidth={2} className={isDarkMode ? 'text-cyan-400' : 'text-blue-500'} />}
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 2: Project Info ──────────────────────────────────────── */}
          <div className={cn('px-3 py-2.5 border-b', isDarkMode ? 'border-white/10' : 'border-black/10')}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Label */}
                <p className={cn('text-[9px] font-semibold uppercase tracking-widest mb-0.5', isDarkMode ? 'text-white/30' : 'text-slate-400')}>
                  Active Project
                </p>
                {/* Title */}
                <p className={cn('text-[12px] font-bold truncate leading-tight', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  {projectName}
                </p>
                {/* Chart type badge */}
                <span className={cn(
                  'inline-block mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide',
                  isDarkMode ? 'bg-cyan-400/15 text-cyan-300' : 'bg-blue-500/10 text-blue-700'
                )}>
                  {chartType}
                </span>
              </div>

              {/* Info button */}
              <button
                onClick={() => setShowProjectInfo((v) => !v)}
                title="Project Info"
                className={cn(
                  'p-1 rounded-md transition-all duration-200 hover:scale-110 mt-0.5 shrink-0',
                  showProjectInfo
                    ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-slate-900'
                    : isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white/80' : 'hover:bg-black/8 text-slate-400 hover:text-slate-700'
                )}
              >
                <Info size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ── SECTION 3: Layers Panel ──────────────────────────────────────── */}
          {/* Header row */}
          <div className={cn('flex items-center justify-between px-3 py-2', isDarkMode ? 'border-b border-white/10' : 'border-b border-black/10')}>
            <div className="flex items-center gap-1.5">
              <Layers size={11} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDarkMode ? 'text-white/60' : 'text-slate-500')}>
                Layers
              </span>
            </div>
            <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold', isDarkMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-blue-500/15 text-blue-700')}>
              {visibleCount} active
            </span>
          </div>

          {/* Scrollable layers content */}
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
              onSetWindBarbStyle={setWindBarbStyle}
              onSetWaveDirectionStyle={setDirectionStyle}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* ── Footer: Add Layer button ─────────────────────────────────────── */}
          <div className={cn('p-2.5 border-t', isDarkMode ? 'border-white/10' : 'border-black/10')}>
            <button
              onClick={addLayer}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-[11px] transition-all duration-200 hover:scale-[1.02]',
                isDarkMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'
              )}
            >
              <Plus size={12} strokeWidth={3} />
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

      {/* ── Project info panel ──────────────────────────────────────────────────── */}
      {showProjectInfo && (
        <ProjectInfo isDarkMode={isDarkMode} setShowModal={setShowModal} onView={onView} menuOpen={isExpanded} />
      )}

      {/* ── Layer modals ─────────────────────────────────────────────────────────── */}
      {mapNotReady && <Modal isOpen={mapNotReady} onClose={() => setMapNotReady(false)} />}

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

      {/* ── Project modals ───────────────────────────────────────────────────────── */}
      <SharedModals {...sharedModalProps} />
      <ShareProjectModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShareProject} projectName={projectName} isDarkMode={isDarkMode} />

      {/* ── Wave legend ──────────────────────────────────────────────────────────── */}
      {waveConfig.enabled && waveConfig.elements?.raster && <WaveLegend isDarkMode={isDarkMode} />}
    </>
  );
};

export default StudioPanel;