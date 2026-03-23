import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, X, Navigation, Globe, Tag, Send } from 'lucide-react';

const isValidFloat = (value) => {
  if (typeof value !== 'string') return false;
  if (value.trim() === '') return false;
  return !isNaN(value) && !isNaN(parseFloat(value));
};

const ManualInputModal = ({ isOpen, onClose, onSubmit, isDarkMode = false }) => {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!isValidFloat(lat)) {
      newErrors.lat = 'Valid latitude required';
    } else {
      const latNum = parseFloat(lat);
      if (latNum < -90 || latNum > 90) {
        newErrors.lat = 'Must be between -90 and 90';
      }
    }
    
    if (!isValidFloat(lng)) {
      newErrors.lng = 'Valid longitude required';
    } else {
      const lngNum = parseFloat(lng);
      if (lngNum < -180 || lngNum > 180) {
        newErrors.lng = 'Must be between -180 and 180';
      }
    }
    
    if (!title.trim()) {
      newErrors.title = 'Storm title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      title: title.trim(),
    });

    // Clear inputs after submit
    setLat('');
    setLng('');
    setTitle('');
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full max-w-md rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-black/40 border border-white/20'
                : 'bg-white/60 border border-white/40'
            } backdrop-blur-xl shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Content */}
            <div className="px-6 pt-10 pb-6">
              {/* Icon */}
              <div className={`w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
                  : 'bg-blue-500/20 ring-1 ring-blue-500/50'
              }`}>
                <Navigation 
                  size={28} 
                  className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                  strokeWidth={2}
                />
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold text-center mb-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Enter Storm Marker
              </h3>

              {/* Subtitle */}
              <p className={`text-sm text-center mb-6 ${
                isDarkMode ? 'text-white/60' : 'text-slate-600'
              }`}>
                Manually input coordinates and storm details
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Latitude Input */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Globe size={14} />
                      Latitude
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 14.5995"
                      value={lat}
                      onChange={(e) => {
                        setLat(e.target.value);
                        if (errors.lat) setErrors({ ...errors, lat: null });
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 ${
                        errors.lat
                          ? isDarkMode
                            ? 'bg-red-500/10 border-2 border-red-400/50 text-white placeholder:text-red-300/40'
                            : 'bg-red-50/50 border-2 border-red-400/50 text-slate-900 placeholder:text-red-500/40'
                          : isDarkMode
                          ? 'bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:bg-white/15 text-white placeholder:text-white/40'
                          : 'bg-white/50 border border-white/30 focus:border-blue-500/50 focus:bg-white/70 text-slate-900 placeholder:text-slate-500'
                      } backdrop-blur-sm`}
                    />
                    {errors.lat && (
                      <p className={`text-xs mt-1.5 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {errors.lat}
                      </p>
                    )}
                  </div>
                </div>

                {/* Longitude Input */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Globe size={14} />
                      Longitude
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 121.0244"
                      value={lng}
                      onChange={(e) => {
                        setLng(e.target.value);
                        if (errors.lng) setErrors({ ...errors, lng: null });
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 ${
                        errors.lng
                          ? isDarkMode
                            ? 'bg-red-500/10 border-2 border-red-400/50 text-white placeholder:text-red-300/40'
                            : 'bg-red-50/50 border-2 border-red-400/50 text-slate-900 placeholder:text-red-500/40'
                          : isDarkMode
                          ? 'bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:bg-white/15 text-white placeholder:text-white/40'
                          : 'bg-white/50 border border-white/30 focus:border-blue-500/50 focus:bg-white/70 text-slate-900 placeholder:text-slate-500'
                      } backdrop-blur-sm`}
                    />
                    {errors.lng && (
                      <p className={`text-xs mt-1.5 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {errors.lng}
                      </p>
                    )}
                  </div>
                </div>

                {/* Storm Title Input */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Tag size={14} />
                      Storm Title
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Kristine"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors({ ...errors, title: null });
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 ${
                        errors.title
                          ? isDarkMode
                            ? 'bg-red-500/10 border-2 border-red-400/50 text-white placeholder:text-red-300/40'
                            : 'bg-red-50/50 border-2 border-red-400/50 text-slate-900 placeholder:text-red-500/40'
                          : isDarkMode
                          ? 'bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:bg-white/15 text-white placeholder:text-white/40'
                          : 'bg-white/50 border border-white/30 focus:border-blue-500/50 focus:bg-white/70 text-slate-900 placeholder:text-slate-500'
                      } backdrop-blur-sm`}
                    />
                    {errors.title && (
                      <p className={`text-xs mt-1.5 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {errors.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Button Group */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20'
                        : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10 hover:border-black/20'
                    } hover:-translate-y-0.5 active:translate-y-0`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-white border border-cyan-400/50 hover:border-cyan-400/70'
                        : 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-900 border border-blue-500/50 hover:border-blue-500/70'
                    } hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${
                      isDarkMode ? 'shadow-cyan-500/20' : 'shadow-blue-500/20'
                    }`}
                  >
                    <Send size={18} strokeWidth={2.5} />
                    Submit
                  </button>
                </div>
              </form>

              {/* Hint text */}
              <p className={`text-xs text-center mt-4 ${
                isDarkMode ? 'text-white/40' : 'text-slate-500'
              }`}>
                Press Esc to cancel
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManualInputModal;