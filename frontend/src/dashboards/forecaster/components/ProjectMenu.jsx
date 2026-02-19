import React, { useState, useEffect, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { fetchProjectById, fetchUserProjects, deleteProjectById } from "@/api/projectAPI";
import { ChevronRight, Plus, FolderOpen, Settings, Download, Edit3, Eye, Map, Menu, Upload, Layers, Database, Wrench, Info, Undo2, Redo2, ZoomIn, ZoomOut, Grid, FileText, BookOpen, X } from "lucide-react";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import SubmitModal from "@/components/ui/modals/SubmitModal";
import ProjectListModal from "@/components/ui/modals/ProjectListModal";
import ExportConfirmModal from "@/components/ui/modals/ExportModal";
import ProjectInfo from "./ProjectInfo";
import { handleCreateProject as createProjectHandler, handleDeleteProject, downloadCachedSnapshotZip } from "@dashboards/forecaster/utils/ProjectUtils";

// In-memory cache for projects
const projectCache = {};

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

  // Current project display state (from cached/fetched project)
  const [projectName, setProjectName] = useState("No Project Selected");
  const [chartType, setChartType] = useState("Wave Analysis");
  const [forecastDate, setForecastDate] = useState(dayjs());

  const menuRef = useRef(null);

  // Load project data with caching
  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem("projectId");
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      // Check in-memory cache first
      if (projectCache[projectId]) {
        const cached = projectCache[projectId];
        setProjectName(cached.name);
        setChartType(cached.chartType);
        setForecastDate(dayjs(cached.forecastDate));
        setIsLoading(false);
        return;
      }

      // Check localStorage cache
      const localCache = JSON.parse(localStorage.getItem('cachedProject'));
      if (localCache && localCache.id === projectId) {
        setProjectName(localCache.name);
        setChartType(localCache.chartType);
        setForecastDate(dayjs(localCache.forecastDate));
        setIsLoading(false);
        return;
      }

      // Fetch from API
      try {
        const project = await fetchProjectById(projectId);
        if (project) {
          setProjectName(project.name);
          setChartType(project.chartType);
          setForecastDate(dayjs(project.forecastDate));

          // Save to caches
          projectCache[projectId] = project;
          localStorage.setItem('cachedProject', JSON.stringify({
            id: projectId,
            name: project.name,
            chartType: project.chartType,
            description: project.description,
            forecastDate: project.forecastDate
          }));
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Failed to fetch project data.",
          showConfirmButton: false,
          timer: 2000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle outside click
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

  const toggleSubmenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleExportProject = async () => {
    if (!map) return;

    try {
      setIsExporting(true);
      await downloadCachedSnapshotZip(
        setIsDarkMode,
        features,
        setCapturedImages,
        isDarkMode
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Export complete",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (e) {
      console.error(e);
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

  // Handle create project with new modal structure
  const handleCreateProjectSubmit = (formData) => {
    createProjectHandler({
      projectName: formData.projectName,
      chartType: formData.chartType,
      description: formData.description,
      forecastDate: dayjs(formData.forecastDate),
      onNew,
      setShowModal,
    });
  };

  // Memoize menu sections to prevent re-renders
  const menuSections = useMemo(() => [
    {
      id: "project",
      title: "Project",
      icon: <FolderOpen size={14} strokeWidth={2.5} />,
      items: [
        { onClick: () => setShowModal(true), icon: <Plus size={12} strokeWidth={2.5} />, label: "New Project" },
        { onClick: handleOpenProjectList, icon: <FolderOpen size={12} strokeWidth={2.5} />, label: "Open Project" },
        { onClick: () => setShowExportConfirm(true), icon: <Download size={12} strokeWidth={2.5} />, label: "Export Project" },
        { icon: <Settings size={12} strokeWidth={2.5} />, label: "Settings" }
      ]
    },
    {
      id: "edit",
      title: "Edit",
      icon: <Edit3 size={14} strokeWidth={2.5} />,
      items: [
        { icon: <Undo2 size={12} strokeWidth={2.5} />, label: "Undo" },
        { icon: <Redo2 size={12} strokeWidth={2.5} />, label: "Redo" },
        { icon: <Settings size={12} strokeWidth={2.5} />, label: "Preferences" }
      ]
    },
    {
      id: "view",
      title: "View",
      icon: <Eye size={14} strokeWidth={2.5} />,
      items: [
        { icon: <ZoomIn size={12} strokeWidth={2.5} />, label: "Zoom In" },
        { icon: <ZoomOut size={12} strokeWidth={2.5} />, label: "Zoom Out" },
        { icon: <Eye size={12} strokeWidth={2.5} />, label: "Reset View" }
      ]
    },
    {
      id: "map",
      title: "Map",
      icon: <Map size={14} strokeWidth={2.5} />,
      items: [
        { icon: <Layers size={12} strokeWidth={2.5} />, label: "Add Marker" },
        { icon: <Grid size={12} strokeWidth={2.5} />, label: "Toggle Grid" },
        { icon: <Settings size={12} strokeWidth={2.5} />, label: "Map Settings" }
      ]
    },
    {
      id: "tools",
      title: "Tools",
      icon: <Wrench size={14} strokeWidth={2.5} />,
      items: [
        { onClick: () => setShowSubmitModal(true), icon: <Upload size={12} strokeWidth={2.5} />, label: "Submit Data" },
        { onClick: onView, icon: <Map size={12} strokeWidth={2.5} />, label: "View Map" },
        { icon: <Database size={12} strokeWidth={2.5} />, label: "Manage Layers" }
      ]
    },
    {
      id: "help",
      title: "Help",
      icon: <BookOpen size={14} strokeWidth={2.5} />,
      items: [
        { icon: <FileText size={12} strokeWidth={2.5} />, label: "Documentation" },
        { icon: <BookOpen size={12} strokeWidth={2.5} />, label: "Tutorials" },
        { icon: <Info size={12} strokeWidth={2.5} />, label: "About" }
      ]
    }
  ], [handleOpenProjectList, onView]);

  // Collapsed state - Menu button only
  if (!menuOpen) {
    return (
      <>
        <div className="fixed top-20 left-4 z-40 flex gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${isDarkMode
                ? 'bg-black/40 hover:bg-black/50 border border-white/20'
                : 'bg-white/60 hover:bg-white/70 border border-white/40'
              } backdrop-blur-xl shadow-lg`}
          >
            <Menu
              size={16}
              className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
              strokeWidth={2.5}
            />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'
              }`}>
              Menu
            </span>
          </button>

          <button
            onClick={() => setShowProjectInfo(!showProjectInfo)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${isDarkMode
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
          <ProjectInfo
            isDarkMode={isDarkMode}
            setShowModal={setShowModal}
            setIsLoading={setIsLoading}
            onView={onView}
            menuOpen={false}
          />
        )}

        {/* Updated CreateProjectModal - simplified props */}
        <CreateProjectModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateProjectSubmit}
          isDarkMode={isDarkMode}
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

              // Update cache
              projectCache[proj._id] = proj;
              localStorage.setItem('cachedProject', JSON.stringify({
                id: proj._id,
                name: proj.name,
                chartType: proj.chartType,
                description: proj.description,
                forecastDate: proj.forecastDate
              }));

              if (onSave) onSave(proj);
            }}
            onDelete={async (id) => {
              await handleDeleteProject({
                projectId: id,
                onDelete: (deletedId) => {
                  setProjects((prev) => prev.filter((p) => p._id !== deletedId));
                  const currentId = localStorage.getItem("projectId");
                  if (currentId === deletedId) {
                    ["projectId", "projectName", "chartType", "forecastDate", "cachedProject"].forEach((key) =>
                      localStorage.removeItem(key)
                    );
                    delete projectCache[deletedId];
                    setProjectName("No Project Selected");
                    setChartType("Wave Analysis");
                  }
                },
                navigateAfterDelete: false,
              });
            }}
            isDarkMode={isDarkMode}
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
            isDarkMode={isDarkMode}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed top-20 left-4 w-72 rounded-xl z-40 transition-all duration-300 ${isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
          } backdrop-blur-xl shadow-xl max-h-[calc(100vh-120px)] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'
          }`}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
              }`}>
              <Menu
                size={16}
                className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                {projectName}
              </div>
              <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/50' : 'text-slate-600'
                }`}>
                Project Menu
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowProjectInfo(!showProjectInfo)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
                }`}
              title="Show Project Info"
            >
              <Info size={16} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => setMenuOpen(false)}
              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
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

      {/* Modals */}
      {showProjectInfo && (
        <ProjectInfo
          isDarkMode={isDarkMode}
          setShowModal={setShowModal}
          setIsLoading={setIsLoading}
          onView={onView}
          menuOpen={true}
        />
      )}

      {/* Updated CreateProjectModal - simplified props */}
      <CreateProjectModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProjectSubmit}
        isDarkMode={isDarkMode}
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

            // Update cache
            projectCache[proj._id] = proj;
            localStorage.setItem('cachedProject', JSON.stringify({
              id: proj._id,
              name: proj.name,
              chartType: proj.chartType,
              description: proj.description,
              forecastDate: proj.forecastDate
            }));

            if (onSave) onSave(proj);
          }}
          onDelete={async (id) => {
            await handleDeleteProject({
              projectId: id,
              onDelete: (deletedId) => {
                setProjects((prev) => prev.filter((p) => p._id !== deletedId));
                const currentId = localStorage.getItem("projectId");
                if (currentId === deletedId) {
                  ["projectId", "projectName", "chartType", "forecastDate", "cachedProject"].forEach((key) =>
                    localStorage.removeItem(key)
                  );
                  delete projectCache[deletedId];
                  setProjectName("No Project Selected");
                  setChartType("Wave Analysis");
                }
              },
              navigateAfterDelete: false,
            });
          }}
          isDarkMode={isDarkMode}
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
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

/* ------------------- Helper Components ------------------- */
const MenuSection = React.memo(({ title, icon, active, toggle, children, isDarkMode }) => (
  <div>
    <button
      onClick={toggle}
      className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isDarkMode
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
));

const MenuItem = React.memo(({ onClick, icon, label, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isDarkMode
        ? 'hover:bg-white/10 text-slate-300 hover:text-white'
        : 'hover:bg-black/10 text-slate-700 hover:text-slate-900'
      }`}
  >
    {icon} {label}
  </button>
));

export default ProjectDashboard;