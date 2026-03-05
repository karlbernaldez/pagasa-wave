import { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { FolderOpen, Edit2, Calendar, BarChart3, Check, X } from 'lucide-react';
import { fetchProjectById, updateProjectById } from "@/api/projectAPI";
import NoProjectsModal from '@/components/ui/modals/NoProjectAlert.jsx';

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

  const formatDateDisplay = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem('projectId');
      if (!projectId) { setNoProjectModalVisible(true); setIsLoading(false); return; }

      if (projectCache[projectId]) {
        const c = projectCache[projectId];
        setProjectName(c.name); setChartType(c.chartType);
        setForecastDate(c.forecastDate ? new Date(c.forecastDate) : null);
        setIsLoading(false); return;
      }

      const localCache = JSON.parse(localStorage.getItem('cachedProject'));
      if (localCache && localCache.id === projectId) {
        setProjectName(localCache.name); setChartType(localCache.chartType);
        setForecastDate(localCache.forecastDate ? new Date(localCache.forecastDate) : null);
        setIsLoading(false); return;
      }

      try {
        const project = await fetchProjectById(projectId);
        if (!project) { setNoProjectModalVisible(true); setIsLoading(false); return; }
        setProjectName(project.name); setChartType(project.chartType);
        setForecastDate(project.forecastDate ? new Date(project.forecastDate) : null);
        projectCache[projectId] = project;
        localStorage.setItem('cachedProject', JSON.stringify({
          id: projectId, name: project.name, chartType: project.chartType,
          description: project.description, forecastDate: project.forecastDate,
        }));
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch project data.' });
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const openEditModal = (e) => {
    if (e) e.stopPropagation();
    setEditedName(projectName); setEditedChart(chartType); setEditedDate(forecastDate);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const projectId = localStorage.getItem('projectId');
      const updated = await updateProjectById(projectId, {
        name: editedName, chartType: editedChart,
        forecastDate: editedDate ? editedDate.toISOString() : null,
      });
      setProjectName(updated.name); setChartType(updated.chartType);
      setForecastDate(updated.forecastDate ? new Date(updated.forecastDate) : null);
      projectCache[projectId] = updated;
      localStorage.setItem('cachedProject', JSON.stringify({
        id: projectId, name: updated.name, chartType: updated.chartType,
        description: updated.description, forecastDate: updated.forecastDate,
      }));
      setEditModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Project updated!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  // ── Info row ────────────────────────────────────────────────────────────────
  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150 ${
      isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-100/40'
    }`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
        isDarkMode ? 'bg-slate-700/40' : 'bg-slate-200/40'
      }`}>
        <Icon size={12} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400/80' : 'text-blue-500/80'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[9px] font-semibold uppercase tracking-wider ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>{label}</div>
        <div className={`text-[11px] font-medium truncate leading-tight ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>{value}</div>
      </div>
    </div>
  );

  return (
    <>
      {projectName ? (
        // ── Same Tier 2 shell as LegendBox ──────────────────────────────────
        <div
          ref={menuRef}
          className={`
            fixed z-30 w-64
            group
            opacity-80 hover:opacity-100
            scale-[0.97] hover:scale-100
            transition-all duration-300 ease-out
            ${menuOpen ? 'top-16 left-80' : 'mt-2 top-24 left-4'}
          `}
        >
          <div className={`
            rounded-xl
            ${isDarkMode
              ? 'bg-black/30 border border-white/10'
              : 'bg-white/50 border border-white/30'
            }
            backdrop-blur-xl
            shadow-md hover:shadow-lg
            transition-shadow duration-300
          `}>

            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${
              isDarkMode ? 'border-slate-700/30' : 'border-slate-200/40'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md ${isDarkMode ? 'bg-cyan-500/15' : 'bg-blue-500/15'}`}>
                  <FolderOpen size={12} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400/80' : 'text-blue-500/80'} />
                </div>
                <div>
                  <div className={`text-[11px] font-medium tracking-wide ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Project Details
                  </div>
                  <div className={`text-[9px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Active project
                  </div>
                </div>
              </div>
              <button
                onClick={openEditModal}
                className={`p-1 rounded-md transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700/30 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100/50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Edit2 size={11} strokeWidth={2.5} />
              </button>
            </div>

            {/* Items */}
            <div className="p-2 space-y-0.5">
              <InfoItem icon={FolderOpen} label="Name"          value={projectName} />
              <InfoItem icon={BarChart3}  label="Chart Type"    value={chartType || 'Not specified'} />
              <InfoItem icon={Calendar}   label="Forecast Date" value={formatDateDisplay(forecastDate) || 'Not set'} />
            </div>

            {/* Footer — mirrors LegendBox footer */}
            <div className={`h-px ${isDarkMode ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
            <div className="px-3 py-1.5">
              <div className={`text-[9px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Active session
              </div>
            </div>
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

      {/* Edit Modal — unchanged */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-md`}
            onClick={() => setEditModalOpen(false)}
          />
          <div className={`relative w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl ${
            isDarkMode ? 'bg-[#0b1220]/60 border border-white/10' : 'bg-white/70 border border-black/10'
          }`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'}`}>
                  <Edit2 size={20} strokeWidth={2.5} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
                </div>
                <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Edit Project</div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className={`p-1.5 rounded-lg transition hover:scale-110 ${isDarkMode ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'}`}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-5 py-6 space-y-4">
              {[
                { label: 'Project Name', value: editedName, onChange: setEditedName, placeholder: 'Enter project name' },
                { label: 'Chart Type',   value: editedChart, onChange: setEditedChart, placeholder: 'Enter chart type' },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{label}</label>
                  <input
                    type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                      isDarkMode ? 'bg-white/10 border border-white/10 text-white placeholder-white/40 focus:ring-cyan-500' : 'bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
                    }`}
                  />
                </div>
              ))}

              <div>
                <label className={`block mb-2 font-semibold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>Forecast Date</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={editedDate ? dayjs(editedDate) : null}
                    onChange={(v) => { if (v) setEditedDate(v.toDate()); }}
                    slotProps={{
                      textField: {
                        fullWidth: true, variant: 'standard',
                        InputProps: {
                          disableUnderline: true,
                          sx: {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: '8px', fontSize: '0.875rem',
                            color: isDarkMode ? '#f1f5f9' : '#1f2937',
                            height: '42px', paddingLeft: '0.75rem',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                            '&.Mui-focused': { borderColor: isDarkMode ? '#06b6d4' : '#3b82f6', boxShadow: isDarkMode ? '0 0 0 3px rgba(6,182,212,0.1)' : '0 0 0 3px rgba(59,130,246,0.1)' },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-5 py-4 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <button onClick={() => setEditModalOpen(false)} className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10' : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10'}`}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30'}`}>
                <Check size={16} strokeWidth={2.5} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectInfo;