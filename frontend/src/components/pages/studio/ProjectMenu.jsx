import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs from "dayjs";
import { fetchProjectById, fetchUserProjects, deleteProjectById } from "@/api/projectAPI";
import { ChevronRight, Plus, FolderOpen, Settings, Download, LogOut, HelpCircle, Edit3, Eye, Map, Menu, Upload, Layers, Database, Wrench, Info, Undo2, Redo2, ZoomIn, ZoomOut, Grid, FileText, BookOpen, X } from "lucide-react";
import ProjectModal from "@/components/ui/modals/ProjectModal";
import SubmitModal from "@/components/ui/modals/SubmitModal";
import ProjectListModal from "@/components/ui/modals/ProjectListModal";
import ExportConfirmModal from "@/components/ui/modals/ExportModal";
import ProjectInfoModal from "./ProjectInfo";
import { handleCreateProject as createProjectHandler, handleDeleteProject, downloadCachedSnapshotZip } from "./utils/ProjectUtils";

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

  // Collapsed state - Menu button only
  if (!menuOpen) {
    return (
      <>
        <div className="fixed top-20 left-4 z-40 flex gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-black/40 hover:bg-black/50 border border-white/20'
                : 'bg-white/60 hover:bg-white/70 border border-white/40'
            } backdrop-blur-xl shadow-lg`}
          >
            <Menu 
              size={16} 
              className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
              strokeWidth={2.5}
            />
            <span className={`text-xs font-semibold ${
              isDarkMode ? 'text-white/90' : 'text-slate-800'
            }`}>
              Menu
            </span>
          </button>

          <button
            onClick={() => setShowProjectInfo(!showProjectInfo)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-black/40 hover:bg-black/50 border border-white/20'
                : 'bg-white/60 hover:bg-white/70 border border-white/40'
            } backdrop-blur-xl shadow-lg`}
            title="Project Info"
          >
            <Info 
              size={16} 
              className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Modals */}
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
            menuOpen={false}
          />
        )}
        
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
                  setProjects((prev) => prev.filter((p) => p._id !== deletedId));
                  const currentId = localStorage.getItem("projectId");
                  if (currentId === deletedId) {
                    ["projectId", "projectName", "chartType", "forecastDate"].forEach((key) =>
                      localStorage.removeItem(key)
                    );
                    setProjectName("");
                    setChartType("");
                  }
                },
                navigateAfterDelete: false,
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
  }

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed top-20 left-4 w-72 rounded-xl z-40 transition-all duration-300 ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-xl max-h-[calc(100vh-120px)] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg ${
              isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
            }`}>
              <Menu 
                size={16} 
                className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold truncate ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {projectName}
              </div>
              <div className={`text-[10px] font-medium ${
                isDarkMode ? 'text-white/50' : 'text-slate-600'
              }`}>
                Project Menu
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowProjectInfo(!showProjectInfo)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
              }`}
              title="Show Project Info"
            >
              <Info size={16} strokeWidth={2.5} />
            </button>
            
            <button
              onClick={() => setMenuOpen(false)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Scrollable Menu Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Project Section */}
          <MenuSection
            title="Project"
            icon={<FolderOpen size={14} strokeWidth={2.5} />}
            active={activeMenu === "project"}
            toggle={() => toggleSubmenu("project")}
            isDarkMode={isDarkMode}
          >
            <MenuItem onClick={() => setShowModal(true)} icon={<Plus size={12} strokeWidth={2.5} />} label="New Project" isDarkMode={isDarkMode} />
            <MenuItem onClick={handleOpenProjectList} icon={<FolderOpen size={12} strokeWidth={2.5} />} label="Open Project" isDarkMode={isDarkMode} />
            <MenuItem onClick={() => setShowExportConfirm(true)} icon={<Download size={12} strokeWidth={2.5} />} label="Export Project" isDarkMode={isDarkMode} />
            <MenuItem icon={<Settings size={12} strokeWidth={2.5} />} label="Settings" isDarkMode={isDarkMode} />
          </MenuSection>

          {/* Edit Section */}
          <MenuSection
            title="Edit"
            icon={<Edit3 size={14} strokeWidth={2.5} />}
            active={activeMenu === "edit"}
            toggle={() => toggleSubmenu("edit")}
            isDarkMode={isDarkMode}
          >
            <MenuItem icon={<Undo2 size={12} strokeWidth={2.5} />} label="Undo" isDarkMode={isDarkMode} />
            <MenuItem icon={<Redo2 size={12} strokeWidth={2.5} />} label="Redo" isDarkMode={isDarkMode} />
            <MenuItem icon={<Settings size={12} strokeWidth={2.5} />} label="Preferences" isDarkMode={isDarkMode} />
          </MenuSection>

          {/* View Section */}
          <MenuSection
            title="View"
            icon={<Eye size={14} strokeWidth={2.5} />}
            active={activeMenu === "view"}
            toggle={() => toggleSubmenu("view")}
            isDarkMode={isDarkMode}
          >
            <MenuItem icon={<ZoomIn size={12} strokeWidth={2.5} />} label="Zoom In" isDarkMode={isDarkMode} />
            <MenuItem icon={<ZoomOut size={12} strokeWidth={2.5} />} label="Zoom Out" isDarkMode={isDarkMode} />
            <MenuItem icon={<Eye size={12} strokeWidth={2.5} />} label="Reset View" isDarkMode={isDarkMode} />
          </MenuSection>

          {/* Map Section */}
          <MenuSection
            title="Map"
            icon={<Map size={14} strokeWidth={2.5} />}
            active={activeMenu === "map"}
            toggle={() => toggleSubmenu("map")}
            isDarkMode={isDarkMode}
          >
            <MenuItem icon={<Layers size={12} strokeWidth={2.5} />} label="Add Marker" isDarkMode={isDarkMode} />
            <MenuItem icon={<Grid size={12} strokeWidth={2.5} />} label="Toggle Grid" isDarkMode={isDarkMode} />
            <MenuItem icon={<Settings size={12} strokeWidth={2.5} />} label="Map Settings" isDarkMode={isDarkMode} />
          </MenuSection>

          {/* Tools Section */}
          <MenuSection
            title="Tools"
            icon={<Wrench size={14} strokeWidth={2.5} />}
            active={activeMenu === "tools"}
            toggle={() => toggleSubmenu("tools")}
            isDarkMode={isDarkMode}
          >
            <MenuItem onClick={() => setShowSubmitModal(true)} icon={<Upload size={12} strokeWidth={2.5} />} label="Submit Data" isDarkMode={isDarkMode} />
            <MenuItem onClick={onView} icon={<Map size={12} strokeWidth={2.5} />} label="View Map" isDarkMode={isDarkMode} />
            <MenuItem icon={<Database size={12} strokeWidth={2.5} />} label="Manage Layers" isDarkMode={isDarkMode} />
          </MenuSection>

          {/* Help Section */}
          <MenuSection
            title="Help"
            icon={<HelpCircle size={14} strokeWidth={2.5} />}
            active={activeMenu === "help"}
            toggle={() => toggleSubmenu("help")}
            isDarkMode={isDarkMode}
          >
            <MenuItem icon={<FileText size={12} strokeWidth={2.5} />} label="Documentation" isDarkMode={isDarkMode} />
            <MenuItem icon={<BookOpen size={12} strokeWidth={2.5} />} label="Tutorials" isDarkMode={isDarkMode} />
            <MenuItem icon={<Info size={12} strokeWidth={2.5} />} label="About" isDarkMode={isDarkMode} />
          </MenuSection>
        </div>

      </div>

      {/* Modals */}
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
          menuOpen={true}
        />
      )}
      
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
                setProjects((prev) => prev.filter((p) => p._id !== deletedId));
                const currentId = localStorage.getItem("projectId");
                if (currentId === deletedId) {
                  ["projectId", "projectName", "chartType", "forecastDate"].forEach((key) =>
                    localStorage.removeItem(key)
                  );
                  setProjectName("");
                  setChartType("");
                }
              },
              navigateAfterDelete: false,
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
const MenuSection = ({ title, icon, active, toggle, children, isDarkMode }) => (
  <div>
    <button
      onClick={toggle}
      className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        isDarkMode
          ? 'hover:bg-white/10 text-slate-200'
          : 'hover:bg-black/10 text-slate-800'
      }`}
    >
      <span className="flex gap-2 items-center">
        {icon} {title}
      </span>
      <ChevronRight
        size={12}
        strokeWidth={3}
        className={`transition-transform duration-200 ${active ? "rotate-90" : ""}`}
      />
    </button>
    {active && (
      <div className="ml-4 mt-1 space-y-0.5">
        {children}
      </div>
    )}
  </div>
);

const MenuItem = ({ onClick, icon, label, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
      isDarkMode
        ? 'hover:bg-white/10 text-slate-300 hover:text-white'
        : 'hover:bg-black/10 text-slate-700 hover:text-slate-900'
    }`}
  >
    {icon} {label}
  </button>
);

export default ProjectDashboard;