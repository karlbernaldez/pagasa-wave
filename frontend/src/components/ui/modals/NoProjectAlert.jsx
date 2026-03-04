import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, AlertCircle } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const NoProjectsModal = ({
  visible,
  onCreateProject,
  onClose,
  isDarkMode = false,
  message
}) => {
  if (!visible) return null;

  const navigate = useNavigate();

  // Normalize message
  const msg = message?.toLowerCase?.() || "";

  // Dynamic content mapping
  let title = "Something went wrong";
  let description = message || "An unexpected error occurred.";
  let showCreateButton = false;

  if (msg.includes("no projects")) {
    title = "No Projects Found";
    description =
      "You don't have any projects yet. Create your first project to get started with your analysis.";
    showCreateButton = true;
  }

  if (msg.includes("invalid project")) {
    title = "Invalid Project";
    description =
      "The project you tried to access appears to be invalid or corrupted.";
  }

  if (msg.includes("not found")) {
    title = "Project Not Found";
    description =
      "The requested project does not exist or may have been deleted.";
  }

  if (msg.includes("unauthorized") || msg.includes("token")) {
    title = "Session Expired";
    description =
      "Your session has expired. Please log in again to continue.";
  }

  const handleSelectAnother = () => {
    onClose?.();
    navigate("/studio");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-projects-title"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-md",
          isDarkMode ? "bg-black/70" : "bg-black/50"
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300",
          isDarkMode
            ? "bg-[#0b1220]/60 border border-white/10"
            : "bg-white/70 border border-black/10"
        )}
      >
        <div className="p-6 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={cn(
                "relative p-4 rounded-2xl",
                isDarkMode ? "bg-cyan-500/20" : "bg-blue-500/20"
              )}
            >
              <div className="absolute -top-1 -right-1">
                <div
                  className={cn(
                    "p-1 rounded-full",
                    isDarkMode ? "bg-yellow-500/20" : "bg-yellow-400/30"
                  )}
                >
                  <AlertCircle
                    size={16}
                    strokeWidth={2.5}
                    className={
                      isDarkMode ? "text-yellow-400" : "text-yellow-600"
                    }
                  />
                </div>
              </div>

              <FolderOpen
                size={48}
                strokeWidth={2}
                className={isDarkMode ? "text-cyan-400" : "text-blue-600"}
              />
            </div>
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <h2
              id="no-projects-title"
              className={cn(
                "text-xl font-bold tracking-wide",
                isDarkMode ? "text-white" : "text-slate-900"
              )}
            >
              {title}
            </h2>

            <p
              className={cn(
                "text-sm leading-relaxed",
                isDarkMode ? "text-white/60" : "text-slate-600"
              )}
            >
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {showCreateButton && (
              <button
                onClick={onCreateProject}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]",
                  isDarkMode
                    ? "bg-gradient-to-r from-cyan-500/90 to-blue-500/90 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                )}
              >
                <Plus size={18} strokeWidth={2.5} />
                Create New Project
              </button>
            )}

            <button
              onClick={handleSelectAnother}
              className={cn(
                "w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]",
                isDarkMode
                  ? "bg-white/10 hover:bg-white/20 text-white/80 border border-white/10"
                  : "bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10"
              )}
            >
              Select Another Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoProjectsModal;