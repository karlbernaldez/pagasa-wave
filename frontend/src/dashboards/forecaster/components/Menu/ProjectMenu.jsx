import React, { useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { Menu, Info, X } from "lucide-react";
import ProjectInfo from "../ProjectInfo";
import SharedModals, { createDeleteHandler } from "./SharedModals";
import { MenuSection, MenuItem } from "./MenuItems";
import { useProjectData } from "./hooks/useProjectData";
import { useMenuState } from "./hooks/useMenuState";
import { buildMenuSections } from "./constants/menuConfig";
import { handleCreateProject as createProjectHandler, downloadCachedSnapshotZip } from "@dashboards/forecaster/utils/ProjectUtils";

/* ─── Sub-components ────────────────────────────────────────────────────── */

const MenuToggleBar = ({ isDarkMode, onOpenMenu, showProjectInfo, onToggleInfo }) => (
  <div className="fixed top-20 left-4 z-40 flex gap-2">
    <button
      onClick={onOpenMenu}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-xl shadow-lg ${
        isDarkMode
          ? "bg-black/40 hover:bg-black/50 border border-white/20"
          : "bg-white/60 hover:bg-white/70 border border-white/40"
      }`}
    >
      <Menu
        size={16}
        className={isDarkMode ? "text-cyan-400" : "text-blue-600"}
        strokeWidth={2.5}
      />
      <span
        className={`text-xs font-semibold ${
          isDarkMode ? "text-white/90" : "text-slate-800"
        }`}
      >
        Menu
      </span>
    </button>

    <button
      onClick={onToggleInfo}
      title="Project Info"
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-xl shadow-lg ${
        isDarkMode
          ? "bg-black/40 hover:bg-black/50 border border-white/20"
          : "bg-white/60 hover:bg-white/70 border border-white/40"
      }`}
    >
      <Info
        size={16}
        className={isDarkMode ? "text-cyan-400" : "text-blue-600"}
        strokeWidth={2.5}
      />
    </button>
  </div>
);

const MenuHeader = ({
  projectName,
  isDarkMode,
  onToggleInfo,
  onClose,
}) => (
  <div
    className={`flex items-center justify-between px-4 py-3 border-b ${
      isDarkMode ? "border-white/10" : "border-black/10"
    }`}
  >
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      <div
        className={`p-1.5 rounded-lg ${
          isDarkMode ? "bg-cyan-500/20" : "bg-blue-500/20"
        }`}
      >
        <Menu
          size={16}
          className={isDarkMode ? "text-cyan-400" : "text-blue-600"}
          strokeWidth={2.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-bold truncate ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          {projectName}
        </div>
        <div
          className={`text-[10px] font-medium ${
            isDarkMode ? "text-white/50" : "text-slate-600"
          }`}
        >
          Project Menu
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1">
      <IconButton onClick={onToggleInfo} title="Show Project Info" isDarkMode={isDarkMode}>
        <Info size={16} strokeWidth={2.5} />
      </IconButton>
      <IconButton onClick={onClose} isDarkMode={isDarkMode}>
        <X size={16} strokeWidth={2.5} />
      </IconButton>
    </div>
  </div>
);

const IconButton = ({ onClick, title, isDarkMode, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
      isDarkMode
        ? "hover:bg-white/10 text-white/60 hover:text-white/90"
        : "hover:bg-black/10 text-slate-600 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */

const ProjectDashboard = ({
  onNew,
  onSave,
  onView,
  map,
  features,
  isDarkMode,
  setIsDarkMode,
  setCapturedImages,
}) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const {
    projectName,
    chartType,
    forecastDate,
    setProjectFromSelection,
    resetProject,
  } = useProjectData();

  const {
    menuOpen,
    setMenuOpen,
    activeMenu,
    toggleSubmenu,
    showProjectInfo,
    setShowProjectInfo,
    menuRef,
  } = useMenuState();

  const [showModal, setShowModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleExportProject = useCallback(async () => {
    if (!map) return;
    try {
      setIsExporting(true);
      await downloadCachedSnapshotZip(setIsDarkMode, features, setCapturedImages, isDarkMode);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Export complete", showConfirmButton: false, timer: 2000 });
    } catch (e) {
      console.error(e);
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Export failed", showConfirmButton: false, timer: 2000 });
    } finally {
      setIsExporting(false);
      setShowExportConfirm(false);
    }
  }, [map, features, isDarkMode, setIsDarkMode, setCapturedImages]);

  const handleSubmitFile = useCallback(async (file) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("projectFile", file);
      formData.append("projectId", localStorage.getItem("projectId"));
      setShowSubmitModal(false);
      Swal.fire("Success", "File submitted successfully!", "success");
    } catch {
      Swal.fire("Error", "Failed to submit file.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleCreateProjectSubmit = useCallback(
    (formData) => {
      createProjectHandler({
        projectName: formData.projectName,
        chartType: formData.chartType,
        description: formData.description,
        forecastDate: dayjs(formData.forecastDate),
        onNew,
        setShowModal,
      });
    },
    [onNew]
  );

  const handleSelectProject = useCallback(
    (proj) => {
      setProjectFromSelection(proj);
      if (onSave) onSave(proj);
    },
    [onSave, setProjectFromSelection]
  );

  const handleDeleteProject = useMemo(
    () => createDeleteHandler({ resetProject }),
    [resetProject]
  );

  // ── Menu config ────────────────────────────────────────────────────────────

  const menuSections = useMemo(
    () =>
      buildMenuSections({
        openNewProject: () => setShowModal(true),
        openProjectList: () => setShowProjectList(true),
        openExport: () => setShowExportConfirm(true),
        openSubmitData: () => setShowSubmitModal(true),
        onView,
      }),
    [onView]
  );

  // ── Shared modal props ─────────────────────────────────────────────────────

  const sharedModalProps = {
    isDarkMode,
    showModal,
    showProjectList,
    showSubmitModal,
    showExportConfirm,
    onCloseCreate: () => setShowModal(false),
    onCloseProjectList: () => setShowProjectList(false),
    onCloseSubmit: () => setShowSubmitModal(false),
    onCloseExport: () => setShowExportConfirm(false),
    onCreateProject: handleCreateProjectSubmit,
    onSelectProject: handleSelectProject,
    onDeleteProject: handleDeleteProject,
    onSubmitFile: handleSubmitFile,
    onConfirmExport: handleExportProject,
    projectName,
    chartType,
    forecastDate,
    isSubmitting,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!menuOpen) {
    return (
      <>
        <MenuToggleBar
          isDarkMode={isDarkMode}
          onOpenMenu={() => setMenuOpen(true)}
          showProjectInfo={showProjectInfo}
          onToggleInfo={() => setShowProjectInfo((v) => !v)}
        />
        {showProjectInfo && (
          <ProjectInfo
            isDarkMode={isDarkMode}
            setShowModal={setShowModal}
            onView={onView}
            menuOpen={false}
          />
        )}
        <SharedModals {...sharedModalProps} />
      </>
    );
  }

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed top-20 left-4 w-72 rounded-xl z-40 transition-all duration-300 backdrop-blur-xl shadow-xl max-h-[calc(100vh-120px)] flex flex-col ${
          isDarkMode
            ? "bg-black/40 border border-white/20"
            : "bg-white/60 border border-white/40"
        }`}
      >
        <MenuHeader
          projectName={projectName}
          isDarkMode={isDarkMode}
          onToggleInfo={() => setShowProjectInfo((v) => !v)}
          onClose={() => setMenuOpen(false)}
        />

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuSections.map((section) => (
            <MenuSection
              key={section.id}
              title={section.title}
              icon={section.icon}
              active={activeMenu === section.id}
              toggle={() => toggleSubmenu(section.id)}
              isDarkMode={isDarkMode}
            >
              {section.items.map((item, idx) => (
                <MenuItem
                  key={idx}
                  onClick={item.onClick}
                  icon={item.icon}
                  label={item.label}
                  isDarkMode={isDarkMode}
                />
              ))}
            </MenuSection>
          ))}
        </div>
      </div>

      {showProjectInfo && (
        <ProjectInfo
          isDarkMode={isDarkMode}
          setShowModal={setShowModal}
          onView={onView}
          menuOpen={true}
        />
      )}

      <SharedModals {...sharedModalProps} />
    </>
  );
};

export default ProjectDashboard;