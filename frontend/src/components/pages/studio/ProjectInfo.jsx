import React, { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FolderOpen, Edit2, Calendar, BarChart3, Plus, Eye, Trash2, X, Check } from 'lucide-react';
import { fetchProjectById, updateProjectById, fetchUserProjects, deleteProjectById } from "@/api/projectAPI";

const MySwal = withReactContent(Swal);

const ProjectInfo = ({
  blink, setBlink, projectId, setShowModal, onSave, onView, features,
  isDarkMode, setIsDarkMode, setIsLoading, isLoading, menuOpen
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedChart, setEditedChart] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const menuRef = useRef(null);
  const [forecastDate, setForecastDate] = useState(dayjs());
  const [projectName, setProjectName] = useState('');
  const [chartType, setChartType] = useState('');
  const [description, setDescription] = useState('');

  // Fetch project data
  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem('projectId');

      if (!projectId) {
        Swal.fire({
          icon: 'warning',
          title: 'No Project Selected',
          text: 'Please create or select a valid project before continuing.',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'swal-main-btn',
          },
        });
        setIsLoading(false);
        return;
      }

      try {
        const project = await fetchProjectById(projectId);

        if (!project) {
          Swal.fire({
            icon: 'warning',
            title: 'Project Not Found',
            text: 'The selected project could not be loaded.',
          });
          setIsLoading(false);
          return;
        }

        setProjectName(project.name);
        setChartType(project.chartType);
        setDescription(project.description || '');
        const date = new Date(project.forecastDate);
        const formatted = date.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        setForecastDate(formatted);
      } catch (error) {
        console.error('Error fetching project:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch project data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openEditModal = (e) => {
    if (e) e.stopPropagation();
    setEditedName(projectName);
    setEditedChart(chartType);
    setEditedDate(forecastDate);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const projectId = localStorage.getItem('projectId');

      const projectData = {
        name: editedName,
        chartType: editedChart,
        forecastDate: editedDate,
      };

      const updatedProject = await updateProjectById(projectId, projectData);

      setProjectName(updatedProject.name);
      setChartType(updatedProject.chartType);
      setForecastDate(updatedProject.forecastDate);

      setEditModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'Project updated successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating project',
        text: error.message || 'An unexpected error occurred',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (deleteInput === projectName) {
      try {
        localStorage.removeItem('projectId');
        localStorage.removeItem('projectName');
        localStorage.removeItem('chartType');
        localStorage.removeItem('forecastDate');

        Swal.fire({
          icon: 'success',
          title: 'Project deleted successfully!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        }).then(() => {
          window.location.reload();
        });

        setShowDeleteConfirm(false);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error deleting project',
          text: error.message || 'An unexpected error occurred',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      }
    }
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
      isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-100/50'
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
      }`}>
        <Icon 
          size={14} 
          className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
          strokeWidth={2.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
          isDarkMode ? 'text-slate-500' : 'text-slate-600'
        }`}>
          {label}
        </div>
        <div className={`text-xs font-semibold truncate ${
          isDarkMode ? 'text-slate-200' : 'text-slate-800'
        }`}>
          {value}
        </div>
      </div>
    </div>
  );

  if (!projectName) {
    return (
      <div
        ref={menuRef}
        className={`fixed z-40 w-72 rounded-xl transition-all duration-300 ${
          menuOpen ? 'top-20 left-80' : 'top-32 left-4'
        } ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-xl ${blink && !projectId ? "animate-pulse" : ""}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              isDarkMode ? 'bg-orange-500/20' : 'bg-orange-500/20'
            }`}>
              <FolderOpen 
                size={16} 
                className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
                strokeWidth={2.5}
              />
            </div>
            <div>
              <div className={`text-sm font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                No Project
              </div>
              <div className={`text-[10px] font-medium ${
                isDarkMode ? 'text-white/50' : 'text-slate-600'
              }`}>
                Select or create
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${
            isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'
          }`}>
            <div className={`text-xs font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Please create or select a project to get started
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              <Plus size={12} strokeWidth={3} />
              New
            </button>
            <button
              onClick={onView}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <Eye size={12} strokeWidth={2.5} />
              View
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed z-40 w-72 rounded-xl transition-all duration-300 ${
          menuOpen ? 'top-20 left-80' : 'top-32 left-4'
        } ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-xl`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
            }`}>
              <FolderOpen 
                size={16} 
                className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                strokeWidth={2.5}
              />
            </div>
            <div>
              <div className={`text-sm font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Project Details
              </div>
              <div className={`text-[10px] font-medium ${
                isDarkMode ? 'text-white/50' : 'text-slate-600'
              }`}>
                Active project
              </div>
            </div>
          </div>
          
          <button
            onClick={openEditModal}
            className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
              isDarkMode
                ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit2 size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          <InfoItem
            icon={FolderOpen}
            label="Project Name"
            value={projectName}
          />

          <InfoItem
            icon={BarChart3}
            label="Chart Type"
            value={chartType || 'Not specified'}
          />

          <InfoItem
            icon={Calendar}
            label="Forecast Date"
            value={forecastDate || 'Not set'}
          />
        </div>
      </div>

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${
              isDarkMode
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Edit Project
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className={`p-1.5 rounded-lg transition-all ${
                  isDarkMode
                    ? 'hover:bg-slate-700 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter project name"
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Chart Type
                </label>
                <input
                  type="text"
                  value={editedChart}
                  onChange={(e) => setEditedChart(e.target.value)}
                  placeholder="Enter chart type"
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Forecast Date
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dayjs(new Date(editedDate))}
                    onChange={(newValue) => {
                      if (newValue) {
                        const formatted = new Date(newValue).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        });
                        setEditedDate(formatted);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'standard',
                        InputProps: {
                          disableUnderline: true,
                          sx: {
                            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#f1f5f9' : '#1f2937',
                            height: '42px',
                            paddingLeft: '0.75rem',
                            border: isDarkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: isDarkMode ? '#475569' : '#94a3b8',
                            },
                            '&.Mui-focused': {
                              borderColor: '#06b6d4',
                              boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.1)',
                            },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModalOpen(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                }`}
              >
                <Check size={16} strokeWidth={2.5} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${
              isDarkMode
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 size={20} className="text-red-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Confirm Deletion
                </h3>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className={`mb-4 text-sm ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Type <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>"{projectName}"</strong> to confirm deletion:
            </p>

            <input
              type="text"
              placeholder={`Type "${projectName}" to confirm`}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-sm mb-4 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDarkMode
                  ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={deleteInput !== projectName}
                onClick={handleDelete}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all text-white ${
                  deleteInput === projectName
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 size={16} strokeWidth={2.5} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectInfo;