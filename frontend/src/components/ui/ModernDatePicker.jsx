import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ModernDatePicker = ({
    value,
    onChange,
    onBlur,
    placeholder = "Select date of birth",
    label = "Date of Birth",
    error,
    touched,
    hasSuccess,
    getMaxDate,
    getMinDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const pickerRef = useRef(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onBlur) onBlur();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onBlur]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        onChange({ target: { name: 'birthday', value: formatDate(date) } });
        setIsOpen(false);
        if (onBlur) onBlur();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleYearChange = (increment) => {
        setCurrentMonth(new Date(currentMonth.getFullYear() + increment, currentMonth.getMonth()));
    };

    const isDateSelected = (date) => {
        if (!selectedDate || !date) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const clearDate = () => {
        setSelectedDate(null);
        onChange({ target: { name: 'birthday', value: '' } });
    };

    const days = getDaysInMonth(currentMonth);
    const hasError = error && touched;

    return (
        <div className="space-y-2" ref={pickerRef}>
            {label && (
                <label className="text-blue-200/80 text-sm font-medium ml-1">
                    {label}
                </label>
            )}
            
            {/* Input Field */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60 group-focus-within:text-blue-300 transition-colors">
                    <Calendar size={20} />
                </div>
                
                <input
                    type="text"
                    readOnly
                    value={selectedDate ? formatDisplayDate(selectedDate) : ''}
                    onClick={() => setIsOpen(!isOpen)}
                    placeholder={placeholder}
                    className={`
                        w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-sm rounded-xl text-white
                        border ${hasError ? 'border-red-500/50' : 'border-white/10 focus:border-blue-400/50'}
                        placeholder:text-white/30 outline-none cursor-pointer
                        transition-all duration-200
                        hover:bg-white/[0.07]
                        ${isOpen ? 'bg-white/10 border-blue-400/50 shadow-lg shadow-blue-500/10' : ''}
                    `}
                />
                
                {selectedDate && !isOpen && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            clearDate();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-red-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}

                {!selectedDate && hasSuccess && !isOpen && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 animate-scale-in">
                        <Calendar size={20} />
                    </div>
                )}
            </div>

            {hasError && (
                <div className="flex items-center gap-2 text-red-300/90 text-xs ml-1 animate-slide-down">
                    <span>{error}</span>
                </div>
            )}

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4 animate-scale-in-dropdown">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleYearChange(-1)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-300/70 hover:text-blue-300"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-300/70 hover:text-blue-300"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>

                        <div className="text-white font-semibold text-base">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-300/70 hover:text-blue-300"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleYearChange(1)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-300/70 hover:text-blue-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-medium text-blue-300/60 py-2"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!date}
                                onClick={() => date && handleDateSelect(date)}
                                className={`
                                    aspect-square rounded-lg text-sm font-medium
                                    transition-all duration-200
                                    ${!date ? 'invisible' : ''}
                                    ${isDateSelected(date)
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                                        : isToday(date)
                                        ? 'bg-white/10 text-white border border-blue-400/50'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }
                                    ${date ? 'cursor-pointer' : ''}
                                `}
                            >
                                {date?.getDate()}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={clearDate}
                            className="text-xs text-blue-300/70 hover:text-blue-300 font-medium transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDateSelect(new Date())}
                            className="text-xs text-blue-300/70 hover:text-blue-300 font-medium transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scale-in-dropdown {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .animate-scale-in-dropdown {
                    animation: scale-in-dropdown 0.2s ease-out;
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-50%);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(-50%);
                    }
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ModernDatePicker;