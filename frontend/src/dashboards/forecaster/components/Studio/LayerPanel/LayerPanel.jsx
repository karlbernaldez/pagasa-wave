import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Layers, ChevronDown, Plus, Menu, Info, X, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

import { addGeoJsonLayer, removeLayer, removeFeature, setActiveLayerOnMap, toggleLayerVisibility } from '@dashboards/forecaster/utils/layers/index';
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
import { LayerStylePanel } from '@dashboards/forecaster/components/Studio/LayerStylePanel/LayerStylePanel';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PANEL_CHROME =
  'studio-liquid-panel rounded-2xl transition-all duration-300 shadow-2xl flex flex-col overflow-hidden';
const PANEL_SURFACE = (isDarkMode) =>
  isDarkMode
    ? 'studio-liquid-dark border text-white'
    : 'studio-liquid-light border text-slate-900';
const INNER_SURFACE = (isDarkMode) =>
  isDarkMode
    ? 'border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'border-white/80 bg-white/[0.52] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]';
const DOCK_WIDTH = 'w-[min(23rem,calc(100vw-1rem))]';
const FLOATING_PANEL_WIDTH = 'min(23rem, calc(100vw - 1rem))';
const STYLE_PANEL_MAX_HEIGHT = 'clamp(16rem, calc(56vh - 3rem), 25rem)';
const ANNOTATION_LAYERS_MAX_HEIGHT = 'calc(100vh - 5.75rem)';
const STYLE_PANEL_RESET_KEY = 'annotation-style-right-default-v2';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function useFloatingPanelDrag(resetKey) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef(null);

  const resetPosition = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetPosition();
  }, [resetKey, resetPosition]);

  const startDrag = useCallback((event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    const panel = event.currentTarget.closest('[data-floating-panel]');
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset,
      rect,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();

    const handleMove = (moveEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== moveEvent.pointerId) return;

      const deltaX = moveEvent.clientX - dragState.startX;
      const deltaY = moveEvent.clientY - dragState.startY;
      const margin = 8;

      setOffset({
        x: clamp(
          dragState.startOffset.x + deltaX,
          dragState.startOffset.x + margin - dragState.rect.left,
          dragState.startOffset.x + window.innerWidth - margin - dragState.rect.right
        ),
        y: clamp(
          dragState.startOffset.y + deltaY,
          dragState.startOffset.y + margin - dragState.rect.top,
          dragState.startOffset.y + window.innerHeight - margin - dragState.rect.bottom
        ),
      });
    };

    const stopDrag = () => {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
  }, [offset]);

  return {
    panelStyle: { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` },
    resetPosition,
    handleProps: {
      onPointerDown: startDrag,
      onDoubleClick: resetPosition,
      title: 'Drag to reposition. Double-click to reset.',
    },
  };
}

const StudioPanel = ({
  mapRef,
  isDarkMode,
  layers,
  setLayers,
  draw,
  onNew,
  onSave,
  onView,
  readOnly = false,
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
  const [activeMapboxLayerIds, setActiveMapboxLayerIds] = useState([]);
  const [mapNotReady, setMapNotReady] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, layer: null });
  const fileInputRef = useRef();
  const map = mapRef?.current ?? null;

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
  } = useSystemLayers({ mapRef, isDarkMode, forecastDate });

  const { windConfig, toggleWindLayer, setWindElement, toggleWindModel, setWindBarbStyle } = useWindConfig({ mapRef, isDarkMode });
  const { waveConfig, toggleWaveLayer, setWaveElement, toggleWaveModel, setDirectionStyle } = useWaveConfig({ mapRef, isDarkMode });
  const showWaveLegend = Boolean(waveConfig.enabled && waveConfig.elements?.raster);

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
    if (!file || !map) return;
    addGeoJsonLayer(map, file, layers, setLayers);
  };

  const addLayer = () => {
    if (readOnly) return;
    if (!map) { setMapNotReady(true); return; }
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  // ── Active layer ─────────────────────────────────────────────────────────────
  const setActiveLayer = useCallback((layer) => {
    const id = layer.id;
    setActiveLayerOnMap({
      layer, id, mapRef, draw, layers,
      activeLayerId,
      setActiveLayerId,
      setActiveMapboxLayerId: setActiveMapboxLayerIds,
    });
  }, [mapRef, draw, layers, activeLayerId]);

  const hasSelectedAnnotationLayer = useMemo(
    () => Boolean(activeLayerId && layers.some((layer) => layer.id === activeLayerId)),
    [activeLayerId, layers]
  );
  const annotationStyleDrag = useFloatingPanelDrag(
    hasSelectedAnnotationLayer ? `${STYLE_PANEL_RESET_KEY}-${activeLayerId}` : STYLE_PANEL_RESET_KEY
  );
  const annotationLayersDrag = useFloatingPanelDrag('annotation-layers-right-default-v1');
  const annotationStylePanelStyle = useMemo(
    () => ({
      ...annotationStyleDrag.panelStyle,
      position: 'fixed',
      top: '4.75rem',
      right: '0.75rem',
      left: 'auto',
      width: FLOATING_PANEL_WIDTH,
      maxHeight: STYLE_PANEL_MAX_HEIGHT,
      zIndex: 45,
    }),
    [annotationStyleDrag.panelStyle]
  );
  const annotationLayersPanelStyle = useMemo(
    () => ({
      ...annotationLayersDrag.panelStyle,
      position: 'fixed',
      right: '0.75rem',
      bottom: '0.75rem',
      left: 'auto',
      width: FLOATING_PANEL_WIDTH,
      maxHeight: ANNOTATION_LAYERS_MAX_HEIGHT,
      overflow: 'hidden',
      zIndex: 40,
    }),
    [annotationLayersDrag.panelStyle]
  );

  useEffect(() => {
    if (hasSelectedAnnotationLayer) {
      annotationStyleDrag.resetPosition();
    }
  }, [activeLayerId, hasSelectedAnnotationLayer, annotationStyleDrag.resetPosition]);

  // ── Delete handling ──────────────────────────────────────────────────────────
  const confirmDeleteLayer = async () => {
    const layer = confirmDialog.layer;
    if (!layer) return;
    try {
      await removeFeature(layer.id);
      removeLayer(map, layer, setLayers, draw);
    } catch (error) {
      console.error('Failed to delete layer:', error);
      Swal.fire('Error', 'Could not delete layer from server.', 'error');
    } finally {
      setConfirmDialog({ isOpen: false, layer: null });
    }
  };

  // ── Menu actions ─────────────────────────────────────────────────────────────
  const menuActions = {
    onNew,
    onOpen: () => setShowProjectList(true),
    onSave,
    onSaveAs: () => setShowModal(true),
    onSubmit: () => setShowSubmitModal(true),
    onGeoJson: addLayer,
    onView,
  };

  const menuSections = buildMenuSections(menuActions);

  const toggleSubmenu = (id) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const handleCreateProject = (projectData) =>
    createProjectHandler({
      projectData,
      setLoading: setIsSubmitting,
      onSuccess: (project) => {
        setProjectFromSelection(project);
        setShowModal(false);
      },
    });

  const handleProjectSelected = (project) => {
    setProjectFromSelection(project);
    setShowProjectList(false);
  };

  const handleShareProject = ({ email, permission }) => {
    console.log('Share project', { email, permission, projectName });
    setShowShareModal(false);
  };

  const handleDeleteProject = createDeleteHandler({
    resetProject,
    projectName,
    setShowProjectList,
  });

  const sharedModalProps = {
    showModal, setShowModal,
    showProjectList, setShowProjectList,
    showSubmitModal, setShowSubmitModal,
    onCreateProject: handleCreateProject,
    onProjectSelected: handleProjectSelected,
    onDeleteProject: handleDeleteProject,
    projectName, chartType, forecastDate, isSubmitting,
  };

  // ── Collapsed pill ───────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <>
        <div className="fixed left-4 top-20 z-40">
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              'studio-liquid-panel group flex min-h-12 items-center gap-2 rounded-full border px-3 py-2 transition-all duration-300 hover:scale-105',
              isDarkMode
                ? 'studio-liquid-dark hover:bg-slate-950/80'
                : 'studio-liquid-light hover:bg-white'
            )}
          >
            <Menu size={16} className={isDarkMode ? 'text-cyan-300' : 'text-blue-600'} strokeWidth={2.5} />
            <span className={cn('text-sm font-black', isDarkMode ? 'text-white/90' : 'text-slate-800')}>Studio</span>
            <div className={cn('rounded-full px-2 py-1 text-[10px] font-black', isDarkMode ? 'bg-cyan-400/15 text-cyan-200' : 'bg-blue-500/10 text-blue-700')}>
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
      <div ref={panelRef} className={cn('fixed left-3 top-[4.75rem] z-40', DOCK_WIDTH)}>
        <div className={cn(PANEL_CHROME, 'max-h-[calc(100vh-5.75rem)]', PANEL_SURFACE(isDarkMode))}>

          {/* ── SECTION 1: Menu Button (top) ─────────────────────────────────── */}
          <div className={cn('relative border-b p-3', isDarkMode ? 'border-white/10' : 'border-slate-200/70')} ref={menuRef}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  'flex min-h-11 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-black transition-all duration-200',
                  menuOpen
                    ? isDarkMode
                      ? 'bg-cyan-400/10 text-cyan-100'
                      : 'bg-blue-500/10 text-blue-900'
                    : isDarkMode
                      ? 'hover:bg-white/[0.06] text-white/85 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                )}
              >
                <Menu size={15} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-300' : 'text-blue-600'} />
                <span>Forecaster Studio</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={cn('ml-auto transition-transform duration-200', menuOpen ? 'rotate-180' : '')}
                />
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse studio panel"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105',
                  isDarkMode ? 'hover:bg-white/10 text-white/50 hover:text-white/90' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                )}
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {menuOpen && (
              <div className={cn(
                'studio-liquid-panel absolute left-3 right-3 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-2xl',
                isDarkMode
                  ? 'studio-liquid-dark'
                  : 'studio-liquid-light'
              )}>
                <div className="space-y-1 p-2">
                  {menuSections.map((section) => (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSubmenu(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                          isDarkMode ? 'text-white/40 hover:text-white/60 hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
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

                      {activeMenu === section.id && (
                        <div className="ml-3 mt-0.5 space-y-0.5 mb-1">
                          {section.items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => { item.onClick(); setMenuOpen(false); }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 text-left',
                                isDarkMode
                                  ? 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
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

          <div className={cn('border-b px-3 py-3', isDarkMode ? 'border-white/10' : 'border-slate-200/70')}>
            <div className={cn(
              'flex items-start justify-between gap-3 rounded-xl border px-3 py-3',
              INNER_SURFACE(isDarkMode)
            )}>
              <div className="flex-1 min-w-0">
                <p className={cn('mb-1 text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}>
                  Active Project
                </p>
                <p className={cn('truncate text-sm font-black leading-tight', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  {projectName}
                </p>
                <span className={cn(
                  'mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'bg-cyan-400/[0.12] text-cyan-200' : 'bg-blue-500/10 text-blue-700'
                )}>
                  {chartType}
                </span>
              </div>

              <button
                onClick={() => setShowProjectInfo((v) => !v)}
                title="Project Info"
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105',
                  showProjectInfo
                    ? isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'
                    : isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white/80' : 'hover:bg-white text-slate-400 hover:text-slate-700'
                )}
              >
                <Info size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className={cn('flex items-center justify-between border-b px-3 py-3', isDarkMode ? 'border-white/10' : 'border-slate-200/70')}>
            <div className="flex items-center gap-2">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
                <Layers size={15} strokeWidth={2.5} />
              </span>
              <span className={cn('text-[12px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/70' : 'text-slate-600')}>
                Data Layers
              </span>
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black', isDarkMode ? 'bg-cyan-400/15 text-cyan-200' : 'bg-blue-500/10 text-blue-700')}>
              {activeSystemLayersCount} active
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto hide-scrollbar">
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

          <div className={cn('border-t p-3', isDarkMode ? 'border-white/10' : 'border-slate-200/70')}>
            <button
              onClick={addLayer}
              disabled={readOnly}
              className={cn(
                'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black transition-all duration-200 hover:scale-[1.01]',
                readOnly
                  ? isDarkMode
                    ? 'cursor-not-allowed bg-white/10 text-white/35'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'
              )}
            >
              <Plus size={15} strokeWidth={3} />
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

      {hasSelectedAnnotationLayer && (
        <LayerStylePanel
          mapRef={mapRef}
          layers={layers}
          setLayers={setLayers}
          activeLayerId={activeLayerId}
          activeMapboxLayerIds={activeMapboxLayerIds}
          isDarkMode={isDarkMode}
          onToggleVisibility={(layer) => toggleLayerVisibility(map, layer, setLayers)}
          panelClassName="min-h-0"
          controlsClassName="max-h-none"
          panelStyle={annotationStylePanelStyle}
          dragHandleProps={annotationStyleDrag.handleProps}
        />
      )}

      <div
        className="z-40 flex flex-col overflow-hidden"
        style={annotationLayersPanelStyle}
        data-floating-panel
      >
        <div className={cn(PANEL_CHROME, 'relative min-h-0 max-h-[inherit]', PANEL_SURFACE(isDarkMode))}>
          <div
            className={cn(
              'flex cursor-grab touch-none select-none items-center justify-between gap-2 border-b px-2.5 py-2 active:cursor-grabbing',
              isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200/70 bg-white/[0.28]'
            )}
            {...annotationLayersDrag.handleProps}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-blue-500/10 text-blue-600')}>
                <Layers size={14} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <span className={cn('block truncate text-[11px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/75' : 'text-slate-700')}>
                  Annotation Layers
                </span>
                <span className={cn('block truncate text-[9px] font-bold uppercase tracking-wide', isDarkMode ? 'text-white/35' : 'text-slate-400')}>
                  {layers.length} layers / {layers.filter((layer) => layer.visible).length} visible
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-black', isDarkMode ? 'bg-cyan-400/15 text-cyan-200' : 'bg-blue-500/10 text-blue-700')}>
                {layers.filter((layer) => layer.visible).length}/{layers.length}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
            <CustomLayersSection
              layers={layers}
              setLayers={setLayers}
              mapRef={mapRef}
              draw={draw}
              expanded={customLayersExpanded}
              onToggleExpand={() => setCustomLayersExpanded((v) => !v)}
              activeLayerId={activeLayerId}
              onSetActiveLayer={setActiveLayer}
              onRequestDelete={(layer) => !readOnly && setConfirmDialog({ isOpen: true, layer })}
              isDarkMode={isDarkMode}
              {...editState}
            />
          </div>
        </div>
      </div>

      {showProjectInfo && (
        <ProjectInfo isDarkMode={isDarkMode} setShowModal={setShowModal} onView={onView} menuOpen={isExpanded} />
      )}

      {mapNotReady && <Modal isOpen={mapNotReady} onClose={() => setMapNotReady(false)} />}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title="Delete layer?"
        message={`Are you sure you want to delete ${confirmDialog.layer?.name || 'this layer'}?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteLayer}
        onCancel={() => setConfirmDialog({ isOpen: false, layer: null })}
      />

      <SharedModals {...sharedModalProps} />
      <ShareProjectModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} onShare={handleShareProject} projectName={projectName} isDarkMode={isDarkMode} />
      {showWaveLegend && <WaveLegend mapRef={mapRef} isDarkMode={isDarkMode} />}
    </>
  );
};

export default StudioPanel;
