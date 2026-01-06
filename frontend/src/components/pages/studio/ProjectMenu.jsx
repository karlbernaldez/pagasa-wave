import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs from "dayjs";
import { fetchProjectById, fetchUserProjects, deleteProjectById } from "@/api/projectAPI";
import { ChevronDown, Plus, FolderOpen, Settings, Download, LogOut, HelpCircle, Edit3, Eye, Map, Menu, Upload, Layers, Database, Wrench, Info, Undo2, Redo2, ZoomIn, ZoomOut, Grid, FileText, BookOpen } from "lucide-react";
import ProjectModal from "@/components/ui/modals/ProjectModal";
import SubmitModal from "@/components/ui/modals/SubmitModal";
import ProjectListModal from "@/components/ui/modals/ProjectListModal";
import ExportConfirmModal from "@/components/ui/modals/ExportModal";
import ProjectInfoModal from "./ProjectInfo";
import { logout, handleCreateProject as createProjectHandler, handleDeleteProject, downloadCachedSnapshotZip } from "./utils/ProjectUtils";

const MySwal = withReactContent(Swal);

const ProjectDashboard = ({ onNew, onSave, onView, map, features, isDarkMode, setIsDarkMode, setCapturedImages }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [forecastDate, setForecastDate] = useState(dayjs());
  const [projectName, setProjectName] = useState("Untitled Project");
  const [chartType, setChartType] = useState("Wave Analysis");
  const [description, setDescription] = useState("");

  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem("projectId");
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        const project = await fetchProjectById(projectId);
        if (project) {
          setProjectName(project.name);
          setChartType(project.chartType);
          setDescription(project.description || "");
          const date = new Date(project.forecastDate);
          const formatted = date.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          setForecastDate(dayjs(formatted));
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch project data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSubmenu = (menu) =>
    setActiveMenu(activeMenu === menu ? null : menu);

  const handleExportProject = async () => {
    if (!map) return;
    try {
      setIsExporting(true);
      await downloadCachedSnapshotZip(
        setIsDarkMode,
        features,
        map,
        setCapturedImages
      );
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Export complete",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Export failed",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenProjectList = async () => {
    try {
      const userProjects = await fetchUserProjects();
      setProjects(userProjects);
      setShowProjectList(true);
    } catch {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to load projects",
        showConfirmButton: false,
        timer: 2500,
      });
    }
  };

  const handleSubmitFile = async (file) => {
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
  };

  const themeClasses = isDarkMode
    ? "bg-gray-900/70 text-gray-100 border-gray-700"
    : "bg-white/70 text-gray-900 border-gray-300 backdrop-saturate-150";

  const hoverClasses = isDarkMode
    ? "hover:bg-gray-700/50 text-gray-100"
    : "hover:bg-white/80 text-gray-900";

  return (
    <>
      <div
        ref={menuRef}
        className={`
        fixed top-18 left-1 z-[9999] w-80 rounded-2xl relative overflow-hidden
        border border-white/10
        ${isDarkMode
            ? "bg-[rgba(20,20,20,0.25)]"
            : "bg-[rgba(255,255,255,0.2)]"}
        backdrop-blur-2xl backdrop-saturate-150
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        transition-all duration-500
        hover:shadow-[0_10px_36px_rgba(0,0,0,0.15)]
        hover:scale-[1.005]
        ${isDarkMode ? "text-gray-100" : "text-gray-800"}
      `}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-500/40 mb-2">
          <h2 className="text-base font-semibold truncate">{projectName}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProjectInfo(!showProjectInfo)}
              className="p-2 rounded-lg hover:bg-white/20 transition"
              title="Show Project Info"
            >
              <Info size={18} />
            </button>

            {/* <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-white/20 transition"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button> */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/20 transition"
              title="Toggle Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Dropdown Menus */}
        {menuOpen && (
          <div className="max-h-[70vh] overflow-y-auto pb-3">
            {/* Project */}
            <MenuSection
              title="Project"
              icon={<FolderOpen size={16} />}
              active={activeMenu === "project"}
              toggle={() => toggleSubmenu("project")}
            >
              <MenuItem onClick={() => setShowModal(true)} icon={<Plus size={14} />} label="New Project" />
              <MenuItem onClick={handleOpenProjectList} icon={<FolderOpen size={14} />} label="Open Project" />
              <MenuItem onClick={() => setShowExportConfirm(true)} icon={<Download size={14} />} label="Export Project" />
              <MenuItem icon={<Settings size={14} />} label="Project Settings" />
            </MenuSection>

            {/* Edit */}
            <MenuSection
              title="Edit"
              icon={<Edit3 size={16} />}
              active={activeMenu === "edit"}
              toggle={() => toggleSubmenu("edit")}
            >
              <MenuItem icon={<Undo2 size={14} />} label="Undo" />
              <MenuItem icon={<Redo2 size={14} />} label="Redo" />
              <MenuItem icon={<Settings size={14} />} label="Preferences" />
            </MenuSection>

            {/* View */}
            <MenuSection
              title="View"
              icon={<Eye size={16} />}
              active={activeMenu === "view"}
              toggle={() => toggleSubmenu("view")}
            >
              <MenuItem icon={<ZoomIn size={14} />} label="Zoom In" />
              <MenuItem icon={<ZoomOut size={14} />} label="Zoom Out" />
              <MenuItem icon={<Eye size={14} />} label="Reset View" />
            </MenuSection>

            {/* Map */}
            <MenuSection
              title="Map"
              icon={<Map size={16} />}
              active={activeMenu === "map"}
              toggle={() => toggleSubmenu("map")}
            >
              <MenuItem icon={<Layers size={14} />} label="Add Marker" />
              <MenuItem icon={<Grid size={14} />} label="Toggle Grid" />
              <MenuItem icon={<Settings size={14} />} label="Map Settings" />
            </MenuSection>

            {/* Tools */}
            <MenuSection
              title="Tools"
              icon={<Wrench size={16} />}
              active={activeMenu === "tools"}
              toggle={() => toggleSubmenu("tools")}
            >
              <MenuItem onClick={() => setShowSubmitModal(true)} icon={<Upload size={14} />} label="Submit Data" />
              <MenuItem onClick={onView} icon={<Map size={14} />} label="View Map" />
              <MenuItem icon={<Database size={14} />} label="Manage Layers" />
            </MenuSection>

            {/* Help */}
            <MenuSection
              title="Help"
              icon={<HelpCircle size={16} />}
              active={activeMenu === "help"}
              toggle={() => toggleSubmenu("help")}
            >
              <MenuItem icon={<FileText size={14} />} label="Documentation" />
              <MenuItem icon={<BookOpen size={14} />} label="Tutorials" />
              <MenuItem icon={<Info size={14} />} label="About" />
            </MenuSection>

            {/* Logout */}
            <div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-500/20"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Info Modal */}
      {showProjectInfo && (
        <ProjectInfoModal
          isDarkMode={isDarkMode}
          projectName={projectName}
          chartType={chartType}
          forecastDate={forecastDate}
          description={description}
          setShowModal={setShowModal}
          onClose={() => setShowProjectInfo(false)}
          onEdit={() => console.log("Edit project clicked")}
        />
      )}

      {/* Modals */}
      <ProjectModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={() =>
          createProjectHandler({
            projectName,
            chartType,
            description,
            forecastDate,
            onNew,
            setShowModal,
          })
        }
        projectName={projectName}
        setProjectName={setProjectName}
        chartType={chartType}
        setChartType={setChartType}
        description={description}
        setDescription={setDescription}
        forecastDate={forecastDate}
        setForecastDate={setForecastDate}
      />

      {showProjectList && (
        <ProjectListModal
          visible={showProjectList}
          projects={projects}
          onClose={() => setShowProjectList(false)}
          onSelect={(proj) => {
            localStorage.setItem("projectId", proj._id);
            localStorage.setItem("projectName", proj.name);
            localStorage.setItem("chartType", proj.chartType);
            setProjectName(proj.name);
            setChartType(proj.chartType);
            setShowProjectList(false);
            if (onSave) onSave(proj);
          }}
          onDelete={async (id) => {
            await handleDeleteProject({
              projectId: id,
              onDelete: (deletedId) => {
                // Remove from list in UI
                setProjects((prev) => prev.filter((p) => p._id !== deletedId));

                // If the deleted project is currently selected, clear it
                const currentId = localStorage.getItem("projectId");
                if (currentId === deletedId) {
                  ["projectId", "projectName", "chartType", "forecastDate"].forEach((key) =>
                    localStorage.removeItem(key)
                  );
                  setProjectName("");
                  setChartType("");
                }
              },
              navigateAfterDelete: false, // don't reload, we already update state
            });
          }}
        />
      )}

      {showSubmitModal && (
        <SubmitModal
          visible={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitFile}
          projectTitle={projectName}
          projectType={chartType}
          forecastDate={forecastDate}
          isSubmitting={isSubmitting}
          isDarkMode={isDarkMode}
        />
      )}

      {showExportConfirm && (
        <ExportConfirmModal
          visible={showExportConfirm}
          onCancel={() => setShowExportConfirm(false)}
          onConfirm={handleExportProject}
        />
      )}
    </>
  );
};

/* ------------------- Helper Components ------------------- */
const MenuSection = ({ title, icon, active, toggle, children }) => (
  <div>
    <button
      onClick={toggle}
      className="w-full flex justify-between items-center px-5 py-3 text-sm font-medium hover:bg-white/10 transition"
    >
      <span className="flex gap-2 items-center">
        {icon} {title}
      </span>
      <ChevronDown
        size={16}
        className={`transition-transform ${active ? "rotate-180" : ""}`}
      />
    </button>
    {active && <div className="ml-8 text-sm border-l border-gray-400/20">{children}</div>}
  </div>
);

const MenuItem = ({ onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="block w-full px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition"
  >
    {icon} {label}
  </button>
);

export default ProjectDashboard;
