import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, FolderOpen, Trash2, Clock, BarChart3 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

const ProjectListModal = ({ visible, onClose, projects, onSelect, onDelete, isDarkMode }) => {
  const [projectToDelete, setProjectToDelete] = useState(null);

  if (!visible) return null;

  const handleSelect = (project) => {
    localStorage.setItem("projectId", project._id);
    localStorage.setItem("projectName", project.name);
    localStorage.setItem("chartType", project.chartType || '12');
    localStorage.setItem("forecastDate", project.forecastDate);

    if (onSelect) onSelect(project);
    onClose();
    window.location.reload();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };
  
  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        await onDelete(projectToDelete._id);
        setProjectToDelete(null);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 ${
          isDarkMode ? 'bg-black/70' : 'bg-black/50'
        } backdrop-blur-md`} />
        
        {/* Modal */}
        <div className={`relative w-full max-w-2xl rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 max-h-[85vh] flex flex-col ${
          isDarkMode
            ? 'bg-[#0b1220]/60 border border-white/10'
            : 'bg-white/70 border border-black/10'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
              }`}>
                <FolderOpen 
                  size={20} 
                  strokeWidth={2.5}
                  className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                />
              </div>
              <div>
                <div className={`text-base font-semibold tracking-wide ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Your Projects
                </div>
                <div className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-white/50' : 'text-slate-600'
                }`}>
                  Select a project to continue working
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition hover:scale-110 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/50 hover:text-white'
                  : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project._id}
                  className={`group relative rounded-xl transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30'
                      : 'bg-black/5 hover:bg-black/10 border border-black/10 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Project Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                    }`}>
                      <FolderOpen 
                        size={18} 
                        className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                        strokeWidth={2.5}
                      />
                    </div>

                    {/* Project Info */}
                    <button
                      onClick={() => handleSelect(project)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`text-sm font-semibold truncate ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {project.name}
                        </h4>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDarkMode 
                            ? 'bg-cyan-500/20 text-cyan-300' 
                            : 'bg-blue-500/20 text-blue-700'
                        }`}>
                          ACTIVE
                        </span>
                      </div>
                      
                      {project.description && (
                        <p className={`text-xs mb-2 line-clamp-2 ${
                          isDarkMode ? 'text-white/60' : 'text-slate-600'
                        }`}>
                          {project.description}
                        </p>
                      )}
                      
                      <div className={`flex items-center gap-3 text-[10px] ${
                        isDarkMode ? 'text-white/40' : 'text-slate-500'
                      }`}>
                        {project.createdAt && (
                          <div className="flex items-center gap-1">
                            <Clock size={10} strokeWidth={2.5} />
                            <span>
                              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        {project.chartType && (
                          <div className="flex items-center gap-1">
                            <BarChart3 size={10} strokeWidth={2.5} />
                            <span>Type {project.chartType}</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all opacity-60 hover:opacity-100 ${
                        isDarkMode
                          ? 'hover:bg-red-500/20 text-red-400'
                          : 'hover:bg-red-500/20 text-red-600'
                      }`}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">📁</div>
                <h3 className={`text-base font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  No Projects Yet
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-slate-600'
                }`}>
                  You haven't created any projects yet.<br />
                  Create your first project to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="Are you sure you want to permanently delete"
        layerName={projectToDelete?.name}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default ProjectListModal;