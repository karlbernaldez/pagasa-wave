import React, { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  FaChevronDown, FaEdit, FaTrash, FaCalendarAlt, FaChartBar, FaFolder,
  FaBars, FaPlus, FaFileExport, FaSignOutAlt, FaPaperPlane, FaEye
} from 'react-icons/fa';
import {
  fetchProjectById,
  updateProjectById,
  fetchUserProjects,
  deleteProjectById,
} from "../../api/projectAPI";

const MySwal = withReactContent(Swal);

const ProjectInfo = ({
  blink, setBlink, projectId, setShowModal, onSave, onView, features,
  isDarkMode, setIsDarkMode, setIsLoading, isLoading
}) => {
  // Menu state
  const [mainOpen, setMainOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef(null);
  const [forecastDate, setForecastDate] = useState(dayjs());

  // Project info state
  const [projectName, setProjectName] = useState('');
  const [chartType, setChartType] = useState('');
  const [description, setDescription] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedChart, setEditedChart] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMainOpen(false);
        setProjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const project = await fetchProjectById(projectId)

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

  // Menu handlers
  const handleSubmit = async (file) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectFile', file);
      formData.append('projectId', localStorage.getItem('projectId'));

      console.log('Submitting file:', file);
      setShowSubmitModal(false);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handlers
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

  const bgPrimary = isDarkMode ? 'bg-slate-900' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const bgSecondary = isDarkMode ? 'bg-slate-800' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';
  const hoverBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100';
  const accentText = isDarkMode ? 'text-blue-400' : 'text-blue-600';

  const InfoItem = ({ icon, label, value, iconType = 'project' }) => {
    const iconBgColor = {
      project: isDarkMode ? 'bg-green-900/20' : 'bg-green-100',
      chart: isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100',
      date: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100',
    };

    const iconColor = {
      project: isDarkMode ? 'text-green-400' : 'text-green-600',
      chart: isDarkMode ? 'text-purple-400' : 'text-purple-600',
      date: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    };

    return (
      <div className="flex items-start gap-3 mb-6 transition-transform hover:translate-x-1">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor[iconType]}`}>
          <span className={iconColor[iconType]}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
            {label}
          </div>
          <div className={`text-sm font-medium ${textPrimary} break-words leading-relaxed`}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  if (!projectName) {
    return (
      <div
        ref={menuRef}
        className={`
          fixed top-0 left-1 w-80 max-w-96 max-h-96 rounded-2xl p-6 relative overflow-hidden
          border border-white/10
          ${isDarkMode
            ? "bg-[rgba(15,15,15,0.3)]"
            : "bg-[rgba(255,255,255,0.25)]"}
          backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          transition-all duration-500
          hover:scale-[1.005] hover:shadow-[0_10px_36px_rgba(0,0,0,0.15)]
          ${blink && !projectId ? "animate-pulse" : ""}
        `}
      >
        <div className={`flex items-center justify-between pb-4 px-3 mb-5 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${textPrimary}`}>
            <FaFolder /> No Project Selected
          </h3>
        </div>

        <div className={`flex items-start gap-3 mb-6`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
            <FaFolder className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
              Status
            </div>
            <div className={`text-sm font-medium ${textPrimary} break-words`}>
              Please create or select a project to get started
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setShowModal(true)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            <FaPlus /> New Project
          </button>
          <button
            onClick={onView}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-gray-100'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
          >
            <FaEye /> View
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={menuRef}
        className={`
          fixed -top-2 left-1 w-80 max-w-96 max-h-96 rounded-2xl p-6 relative overflow-y-auto scrollbar-hide
          border border-white/10
          ${isDarkMode
            ? "bg-[rgba(20,20,20,0.25)]"
            : "bg-[rgba(255,255,255,0.2)]"}
          backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_6px_30px_rgba(0,0,0,0.1)]
          transition-all duration-500
          hover:scale-[1.005] hover:shadow-[0_8px_36px_rgba(0,0,0,0.15)]
        `}
      >
        <div className={`flex items-center justify-between pb-4 px-3 mb-5 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${textPrimary}`}>
            <FaFolder /> Project Details
          </h3>
          <button
            onClick={openEditModal}
            className={`p-2 rounded-lg transition-all ${isDarkMode
              ? 'text-blue-400 hover:bg-slate-700'
              : 'text-blue-600 hover:bg-gray-100'
              }`}
          >
            <FaEdit size={18} />
          </button>
        </div>

        <InfoItem
          icon={<FaFolder />}
          label="Project Name"
          value={projectName}
          iconType="project"
        />

        <InfoItem
          icon={<FaChartBar />}
          label="Chart Type"
          value={chartType || 'Not specified'}
          iconType="chart"
        />

        <InfoItem
          icon={<FaCalendarAlt />}
          label="Forecast Date"
          value={forecastDate || 'Not set'}
          iconType="date"
        />
      </div>

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${bgPrimary} rounded-2xl p-8 w-full max-w-lg shadow-2xl border ${borderColor}`}
          >
            <h2 className={`text-2xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
              Edit Project Details
            </h2>

            <div className="mb-6">
              <label className={`block mb-2 font-semibold text-sm uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Project Name
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter project name"
                className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-gray-100 focus:border-blue-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
              />
            </div>

            <div className="mb-6">
              <label className={`block mb-2 font-semibold text-sm uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Chart Type
              </label>
              <input
                type="text"
                value={editedChart}
                onChange={(e) => setEditedChart(e.target.value)}
                placeholder="Enter chart type"
                className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-gray-100 focus:border-blue-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
              />
            </div>

            <div className="mb-6">
              <label className={`block mb-2 font-semibold text-sm uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
                          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          color: isDarkMode ? '#f1f5f9' : '#1f2937',
                          height: '48px',
                          paddingLeft: '1rem',
                          border: isDarkMode ? '1px solid #475569' : '1px solid #d1d5db',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: isDarkMode ? '#64748b' : '#e5e7eb',
                          },
                          '&.Mui-focused': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditModalOpen(false)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700`}
              >
                Save Changes
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
            className={`${bgPrimary} rounded-2xl p-8 w-full max-w-lg shadow-2xl border ${borderColor}`}
          >
            <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
              ⚠️ Confirm Deletion
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              This action cannot be undone. To confirm deletion of this project, please type{' '}
              <strong>"{projectName}"</strong> in the field below.
            </p>

            <div className="mb-6">
              <input
                type="text"
                placeholder={`Type "${projectName}" to confirm`}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-gray-100 focus:border-red-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                  }`}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
              >
                Cancel
              </button>
              <button
                disabled={deleteInput !== projectName}
                onClick={handleDelete}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-white flex items-center justify-center gap-2 ${deleteInput === projectName
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                <FaTrash /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectInfo;