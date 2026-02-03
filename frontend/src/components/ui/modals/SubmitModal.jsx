import React, { useState, useRef } from 'react';
import { Upload, X, File, Calendar, Type, FileText, AlertCircle, Loader2 } from 'lucide-react';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SubmitProjectModal = ({
  visible,
  onClose,
  onSubmit,
  projectTitle = 'Sample Title',
  projectType = 'Wave Analysis',
  forecastDate = '',
  isSubmitting = false,
  isDarkMode = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!visible) return null;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    handleFileSelection(files[0]);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    setError('');

    if (!file) return;

    // Validate file type (only ZIP files)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file only.');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError('Please select a ZIP file to submit.');
      return;
    }

    onSubmit(selectedFile);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl transition-all duration-300 animate-scaleIn ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode
                ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
                : 'bg-blue-500/20 ring-1 ring-blue-500/50'
            }`}>
              <Upload 
                size={24} 
                className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                strokeWidth={2}
              />
            </div>
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Submit Project
            </h2>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Project Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText 
                size={18} 
                className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                strokeWidth={2}
              />
              <h3 className={`text-sm font-bold ${
                isDarkMode ? 'text-white/90' : 'text-slate-800'
              }`}>
                Project Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Title Field */}
              <div>
                <label className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
                  isDarkMode ? 'text-white/80' : 'text-slate-700'
                }`}>
                  <Type size={14} />
                  Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  readOnly
                  disabled
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-black/5 border border-black/10 text-slate-600 cursor-not-allowed'
                  } backdrop-blur-sm`}
                />
              </div>

              {/* Type Field */}
              <div>
                <label className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
                  isDarkMode ? 'text-white/80' : 'text-slate-700'
                }`}>
                  <FileText size={14} />
                  Type
                </label>
                <input
                  type="text"
                  value={projectType}
                  readOnly
                  disabled
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-black/5 border border-black/10 text-slate-600 cursor-not-allowed'
                  } backdrop-blur-sm`}
                />
              </div>

              {/* Forecast Date Field */}
              <div>
                <label className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
                  isDarkMode ? 'text-white/80' : 'text-slate-700'
                }`}>
                  <Calendar size={14} />
                  Forecast Date
                </label>
                <input
                  type="text"
                  value={forecastDate}
                  readOnly
                  disabled
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-black/5 border border-black/10 text-slate-600 cursor-not-allowed'
                  } backdrop-blur-sm`}
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Upload 
                size={18} 
                className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                strokeWidth={2}
              />
              <h3 className={`text-sm font-bold ${
                isDarkMode ? 'text-white/90' : 'text-slate-800'
              }`}>
                Upload Project File
              </h3>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? isDarkMode
                    ? 'border-cyan-400/60 bg-cyan-500/10'
                    : 'border-blue-500/60 bg-blue-500/10'
                  : selectedFile
                  ? isDarkMode
                    ? 'border-green-400/40 bg-green-500/5'
                    : 'border-green-500/40 bg-green-500/5'
                  : isDarkMode
                  ? 'border-white/20 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                  : 'border-black/20 bg-white/30 hover:border-blue-500/40 hover:bg-white/50'
              } backdrop-blur-sm`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                selectedFile
                  ? isDarkMode
                    ? 'bg-green-500/20 ring-1 ring-green-400/40'
                    : 'bg-green-500/20 ring-1 ring-green-500/50'
                  : isDarkMode
                  ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
                  : 'bg-blue-500/20 ring-1 ring-blue-500/50'
              }`}>
                {selectedFile ? (
                  <File 
                    size={32} 
                    className={isDarkMode ? 'text-green-400' : 'text-green-600'}
                    strokeWidth={2}
                  />
                ) : (
                  <Upload 
                    size={32} 
                    className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                    strokeWidth={2}
                  />
                )}
              </div>

              {/* Text */}
              <div className={`mb-4 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {selectedFile ? (
                  <>
                    <h4 className="text-base font-semibold mb-1">File Ready for Upload</h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}>
                      Click to change file or drag a new one here
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-base font-semibold mb-1">Drop your ZIP file here</h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}>
                      or click to browse files (ZIP format only, max 50MB)
                    </p>
                  </>
                )}
              </div>

              {/* Browse Button */}
              {!selectedFile && (
                <button
                  type="button"
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-white border border-cyan-400/50 hover:border-cyan-400/70'
                      : 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-900 border border-blue-500/50 hover:border-blue-500/70'
                  } shadow-lg`}
                >
                  Choose File
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* File Info */}
            {selectedFile && (
              <div className={`mt-4 flex items-center gap-4 p-4 rounded-xl ${
                isDarkMode
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white/40 border border-white/30'
              } backdrop-blur-sm`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
                    : 'bg-blue-500/20 ring-1 ring-blue-500/50'
                }`}>
                  <File 
                    size={20} 
                    className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}
                    strokeWidth={2}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className={`text-sm font-semibold truncate ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedFile.name}
                  </h5>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-slate-600'
                  }`}>
                    {formatFileSize(selectedFile.size)} • ZIP Archive
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                      : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                  }`}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`mt-4 flex items-center gap-3 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-500/10 border border-red-400/30 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <AlertCircle size={18} strokeWidth={2} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isDarkMode
                ? 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20'
                : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10 hover:border-black/20'
            } hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              isDarkMode
                ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-white border border-cyan-400/50 hover:border-cyan-400/70'
                : 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-900 border border-blue-500/50 hover:border-blue-500/70'
            } hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${
              isDarkMode ? 'shadow-cyan-500/20' : 'shadow-blue-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.5} />
                Submit Project
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SubmitProjectModal;