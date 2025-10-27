import React from "react";
import { X, Folder, BarChart2, CalendarDays, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProjectInfoModal = ({
  isDarkMode,
  projectName,
  chartType,
  forecastDate,
  description,
  onEdit,
  onClose,
}) => {
  const baseTheme = isDarkMode
    ? "bg-gray-900/80 text-gray-100 border-gray-700"
    : "bg-white/80 text-gray-900 border-gray-200";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative w-full max-w-lg p-8 rounded-2xl border shadow-2xl backdrop-blur-2xl ${baseTheme} transition-all`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Project Information
          </h2>

          {/* Edit Button */}
          {onEdit && (
            <div className="absolute top-4 left-4">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-600/80 hover:bg-blue-700 text-white transition"
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>
          )}

          {/* Info List */}
          <div className="space-y-5 mt-2">
            {/* Project Name */}
            <div className="flex items-start gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 text-green-400 group-hover:scale-110 transition">
                <Folder size={20} />
              </div>
              <div>
                <p className="text-xs uppercase opacity-70 mb-1">
                  Project Name
                </p>
                <p className="font-medium text-base break-words">
                  {projectName || "Untitled Project"}
                </p>
              </div>
            </div>

            {/* Chart Type */}
            <div className="flex items-start gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
                <BarChart2 size={20} />
              </div>
              <div>
                <p className="text-xs uppercase opacity-70 mb-1">Chart Type</p>
                <p className="font-medium text-base break-words">
                  {chartType || "Not specified"}
                </p>
              </div>
            </div>

            {/* Forecast Date */}
            <div className="flex items-start gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xs uppercase opacity-70 mb-1">
                  Forecast Date
                </p>
                <p className="font-medium text-base break-words">
                  {forecastDate?.format
                    ? forecastDate.format("MMMM D, YYYY")
                    : forecastDate || "Not set"}
                </p>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="flex items-start gap-3 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase opacity-70 mb-1">
                    Description
                  </p>
                  <p className="font-medium text-base leading-relaxed break-words">
                    {description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectInfoModal;
