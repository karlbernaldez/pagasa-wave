import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { X, FolderOpen, FileText, BarChart3, Calendar } from 'lucide-react';

// Constants
const CHART_TYPES = [
  { value: 'Wave Analysis', label: 'Wave Analysis' },
  { value: '24', label: '24' },
  { value: '36', label: '36' },
  { value: '48', label: '48' },
];

const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  CMD: 'metaKey',
  CTRL: 'ctrlKey',
};

// Utility function for class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

const CreateProjectModal = ({
  visible,
  onClose,
  onSubmit,
  isDarkMode = false,
}) => {
  const modalRef = useRef(null);
  const projectNameInputRef = useRef(null);

  // Local state for form fields
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState('Wave Analysis');
  const [forecastDate, setForecastDate] = useState(dayjs());

  // Memoized theme classes
  const themeClasses = useMemo(
    () => ({
      backdrop: isDarkMode ? 'bg-black/70' : 'bg-black/50',
      modal: cn(
        'relative w-full max-w-lg rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col',
        isDarkMode
          ? 'bg-[#0b1220]/60 border border-white/10'
          : 'bg-white/70 border border-black/10'
      ),
      border: isDarkMode ? 'border-white/10' : 'border-black/10',
      text: {
        primary: isDarkMode ? 'text-white' : 'text-slate-900',
        secondary: isDarkMode ? 'text-white/50' : 'text-slate-600',
        label: isDarkMode ? 'text-white/60' : 'text-slate-600',
      },
      input: cn(
        'w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2',
        isDarkMode
          ? 'bg-white/10 border border-white/10 text-white placeholder-white/40 focus:ring-cyan-500'
          : 'bg-black/5 border border-black/10 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
      ),
      iconBg: isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20',
      iconColor: isDarkMode ? 'text-cyan-400' : 'text-blue-600',
      closeButton: cn(
        'p-1.5 rounded-lg transition hover:scale-110',
        isDarkMode
          ? 'hover:bg-white/10 text-white/50 hover:text-white'
          : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'
      ),
    }),
    [isDarkMode]
  );

  // Reset form when modal closes
  const resetForm = useCallback(() => {
    setProjectName('');
    setDescription('');
    setChartType('Wave Analysis');
    setForecastDate(dayjs());
  }, []);

  // Validation and submit handler
  const handleSubmit = useCallback(() => {
    const trimmedProjectName = projectName.trim();

    if (!trimmedProjectName) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Project Name is required!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: isDarkMode ? '#374151' : '#fff',
        color: isDarkMode ? '#f3f4f6' : '#111827',
      });
      return;
    }

    // Pass form data to parent's onSubmit
    const formData = {
      projectName: trimmedProjectName,
      description: description.trim(),
      chartType,
      forecastDate: forecastDate.format('YYYY-MM-DD'),
    };

    onSubmit(formData);
    resetForm();
  }, [projectName, description, chartType, forecastDate, isDarkMode, onSubmit, resetForm]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle close with reset
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      if (e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
        e.preventDefault();
        handleClose();
      } else if (
        e.key === KEYBOARD_SHORTCUTS.ENTER &&
        (e[KEYBOARD_SHORTCUTS.CMD] || e[KEYBOARD_SHORTCUTS.CTRL])
      ) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose, handleSubmit]);

  // Auto-focus on project name input when modal opens
  useEffect(() => {
    if (visible && projectNameInputRef.current) {
      // Delay to ensure modal animation completes
      const timeoutId = setTimeout(() => {
        projectNameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [visible]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className={cn('absolute inset-0 backdrop-blur-md', themeClasses.backdrop)} />

      {/* Modal */}
      <div ref={modalRef} className={themeClasses.modal}>
        {/* Header */}
        <header className={cn('flex items-center justify-between px-5 py-4 border-b', themeClasses.border)}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', themeClasses.iconBg)}>
              <FolderOpen size={20} strokeWidth={2.5} className={themeClasses.iconColor} />
            </div>
            <div>
              <h2
                id="modal-title"
                className={cn('text-base font-semibold tracking-wide', themeClasses.text.primary)}
              >
                Create New Project
              </h2>
              <p className={cn('text-xs mt-0.5', themeClasses.text.secondary)}>
                Set up your project with all the details
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className={themeClasses.closeButton}
            aria-label="Close modal"
            type="button"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {/* Project Name */}
          <div>
            <label
              htmlFor="project-name"
              className={cn(
                'flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wide',
                themeClasses.text.label
              )}
            >
              <FolderOpen size={12} strokeWidth={2.5} />
              Project Name
            </label>
            <input
              id="project-name"
              ref={projectNameInputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter a descriptive project name"
              className={themeClasses.input}
              required
              aria-required="true"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className={cn(
                'flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wide',
                themeClasses.text.label
              )}
            >
              <FileText size={12} strokeWidth={2.5} />
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your project goals and objectives"
              rows={3}
              className={cn(themeClasses.input, 'resize-vertical')}
              aria-label="Project description"
            />
          </div>

          {/* Chart Type */}
          <div>
            <label
              htmlFor="chart-type"
              className={cn(
                'flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wide',
                themeClasses.text.label
              )}
            >
              <BarChart3 size={12} strokeWidth={2.5} />
              Chart Type
            </label>
            <select
              id="chart-type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className={cn(themeClasses.input, 'cursor-pointer')}
              style={{
                colorScheme: isDarkMode ? 'dark' : 'light'
              }}
            >
              {CHART_TYPES.map(({ value, label }) => (
                <option 
                  key={value} 
                  value={value}
                  style={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Date */}
          <div>
            <label
              htmlFor="forecast-date"
              className={cn(
                'flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wide',
                themeClasses.text.label
              )}
            >
              <Calendar size={12} strokeWidth={2.5} />
              Forecast Date
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={forecastDate}
                onChange={(newDate) => setForecastDate(newDate || dayjs())}
                slotProps={{
                  textField: {
                    id: 'forecast-date',
                    fullWidth: true,
                    variant: 'standard',
                    InputProps: {
                      disableUnderline: true,
                      sx: {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#f1f5f9' : '#1f2937',
                        height: '42px',
                        paddingLeft: '0.75rem',
                        border: isDarkMode
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.2)',
                        },
                        '&.Mui-focused': {
                          borderColor: isDarkMode ? '#06b6d4' : '#3b82f6',
                          boxShadow: isDarkMode
                            ? '0 0 0 3px rgba(6, 182, 212, 0.1)'
                            : '0 0 0 3px rgba(59, 130, 246, 0.1)',
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>

        {/* Footer */}
        <footer className={cn('flex items-center gap-2 px-5 py-4 border-t', themeClasses.border)}>
          <button
            onClick={handleClose}
            type="button"
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]',
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              Cancel
            </span>
          </button>

          <button
            onClick={handleSubmit}
            type="button"
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]',
              isDarkMode
                ? 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              Create Project
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateProjectModal;