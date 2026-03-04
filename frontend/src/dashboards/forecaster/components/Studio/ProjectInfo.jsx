import { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { FolderOpen, Edit2, Calendar, BarChart3, Check, X } from 'lucide-react';
import { fetchProjectById, updateProjectById, deleteProjectById } from "@/api/projectAPI";
import NoProjectsModal from '@/components/ui/modals/NoProjectAlert.jsx';

// In-memory cache
const projectCache = {};

const ProjectInfo = ({ setShowModal, isDarkMode, setIsLoading, menuOpen }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedChart, setEditedChart] = useState('');
  const [editedDate, setEditedDate] = useState(null);
  const [forecastDate, setForecastDate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [chartType, setChartType] = useState('');
  const [noProjectModalVisible, setNoProjectModalVisible] = useState(false);
  const menuRef = useRef(null);

  // Format Date for display
  const formatDateDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch project with caching
  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        setNoProjectModalVisible(true); // show modal if no project
        setIsLoading(false);
        return;
      }

      // In-memory cache
      if (projectCache[projectId]) {
        const cached = projectCache[projectId];
        setProjectName(cached.name);
        setChartType(cached.chartType);
        setForecastDate(cached.forecastDate ? new Date(cached.forecastDate) : null);
        setIsLoading(false);
        return;
      }

      // LocalStorage cache
      const localCache = JSON.parse(localStorage.getItem('cachedProject'));
      if (localCache && localCache.id === projectId) {
        setProjectName(localCache.name);
        setChartType(localCache.chartType);
        setForecastDate(localCache.forecastDate ? new Date(localCache.forecastDate) : null);
        setIsLoading(false);
        return;
      }

      // API fetch
      try {
        const project = await fetchProjectById(projectId);
        if (!project) {
          setNoProjectModalVisible(true); // show modal if project not found
          setIsLoading(false);
          return;
        }

        setProjectName(project.name);
        setChartType(project.chartType);
        setForecastDate(project.forecastDate ? new Date(project.forecastDate) : null);

        // Save caches
        projectCache[projectId] = project;
        localStorage.setItem('cachedProject', JSON.stringify({
          id: projectId,
          name: project.name,
          chartType: project.chartType,
          description: project.description,
          forecastDate: project.forecastDate
        }));
      } catch (error) {
        console.error('Error fetching project:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch project data.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open Edit Modal
  const openEditModal = (e) => {
    if (e) e.stopPropagation();
    setEditedName(projectName);
    setEditedChart(chartType);
    setEditedDate(forecastDate);
    setEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    try {
      const projectId = localStorage.getItem('projectId');
      const projectData = {
        name: editedName,
        chartType: editedChart,
        forecastDate: editedDate ? editedDate.toISOString() : null
      };

      const updatedProject = await updateProjectById(projectId, projectData);

      setProjectName(updatedProject.name);
      setChartType(updatedProject.chartType);
      setForecastDate(updatedProject.forecastDate ? new Date(updatedProject.forecastDate) : null);

      // Update caches
      projectCache[projectId] = updatedProject;
      localStorage.setItem('cachedProject', JSON.stringify({
        id: projectId,
        name: updatedProject.name,
        chartType: updatedProject.chartType,
        description: updatedProject.description,
        forecastDate: updatedProject.forecastDate
      }));

      setEditModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Project updated successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating project',
        text: error.message || 'An unexpected error occurred',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // InfoItem
  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-100/50'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'}`}>
        <Icon size={14} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{label}</div>
        <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{value}</div>
      </div>
    </div>
  );

  // Render ProjectInfo or NoProjectsModal
  return (
    <>
      {projectName ? (
        <div ref={menuRef} className={`fixed z-40 w-72 rounded-xl transition-all duration-300 ${menuOpen ? 'top-20 left-80' : 'top-32 left-4'} ${isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/60 border border-black/40'} backdrop-blur-xl shadow-xl`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'}`}>
                <FolderOpen size={16} className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} strokeWidth={2.5} />
              </div>
              <div>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Project Details</div>
                <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/50' : 'text-slate-600'}`}>Active project</div>
              </div>
            </div>
            <button onClick={openEditModal} className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode ? 'hover:bg-white/10 text-white/60 hover:text-white/90' : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'}`}>
              <Edit2 size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-3 space-y-1.5">
            <InfoItem icon={FolderOpen} label="Project Name" value={projectName} />
            <InfoItem icon={BarChart3} label="Chart Type" value={chartType || 'Not specified'} />
            <InfoItem icon={Calendar} label="Forecast Date" value={formatDateDisplay(forecastDate) || 'Not set'} />
          </div>
        </div>
      ) : (
        <NoProjectsModal
          visible={noProjectModalVisible}
          onCreateProject={() => setShowModal(true)}
          onClose={() => setNoProjectModalVisible(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-md`}
            onClick={() => setEditModalOpen(false)}
          />
          
          <div className={`relative w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-[#0b1220]/60 border border-white/10' : 'bg-white/70 border border-black/10'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'}`}>
                  <Edit2 size={20} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
                </div>
                <div className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Edit Project</div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className={`p-1.5 rounded-lg transition hover:scale-110 ${isDarkMode ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'}`}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-4">
              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>Project Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter project name"
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white placeholder-white/40 focus:ring-cyan-500' : 'bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-blue-500'}`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>Chart Type</label>
                <input
                  type="text"
                  value={editedChart}
                  onChange={(e) => setEditedChart(e.target.value)}
                  placeholder="Enter chart type"
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white placeholder-white/40 focus:ring-cyan-500' : 'bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-blue-500'}`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>Forecast Date</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={editedDate ? dayjs(editedDate) : null}
                    onChange={(newValue) => {
                      if (newValue) setEditedDate(newValue.toDate());
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'standard',
                        InputProps: {
                          disableUnderline: true,
                          sx: {
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#f1f5f9' : '#1f2937',
                            height: '42px',
                            paddingLeft: '0.75rem',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' },
                            '&.Mui-focused': { borderColor: isDarkMode ? '#06b6d4' : '#3b82f6', boxShadow: isDarkMode ? '0 0 0 3px rgba(6, 182, 212, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)' },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center gap-2 px-5 py-4 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <button
                onClick={() => setEditModalOpen(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10' : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30'}`}
              >
                <Check size={16} strokeWidth={2.5} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectInfo;
