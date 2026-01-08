import React, { useState } from 'react';
import { AlertTriangle, Bell, Radio, Waves, Wind, CloudRain, Zap, Clock, MapPin, ExternalLink, ChevronRight, Info, TrendingUp, Calendar, Eye } from 'lucide-react';

const AlertsNewsSection = ({ isDark }) => {
  const [activeAlertTab, setActiveAlertTab] = useState('active');

  const activeAlerts = [
    {
      id: 1,
      severity: 'critical',
      type: 'Typhoon Warning',
      icon: Wind,
      title: 'Typhoon Pepito approaching Northern Luzon',
      location: 'Philippine Area of Responsibility',
      time: '2 minutes ago',
      details: 'Signal No. 3 raised in Cagayan and Isabela provinces. Expected landfall in 12 hours.',
      waveHeight: '4.5m',
      windSpeed: '120 km/h',
      affectedAreas: ['Cagayan', 'Isabela', 'Aurora']
    },
    {
      id: 2,
      severity: 'warning',
      type: 'High Wave Alert',
      icon: Waves,
      title: 'Dangerous surf conditions in Western Visayas',
      location: 'Panay Gulf, Iloilo',
      time: '15 minutes ago',
      details: '3-4 meter waves expected. Sea travel not advised for small vessels.',
      waveHeight: '3.8m',
      windSpeed: '45 km/h',
      affectedAreas: ['Iloilo', 'Guimaras', 'Negros Occidental']
    },
    {
      id: 3,
      severity: 'advisory',
      type: 'Weather Advisory',
      icon: CloudRain,
      title: 'Moderate to heavy rainfall expected',
      location: 'Metro Manila and nearby provinces',
      time: '1 hour ago',
      details: 'Southwest monsoon enhanced by tropical depression. Possible flooding in low-lying areas.',
      waveHeight: '1.2m',
      windSpeed: '25 km/h',
      affectedAreas: ['Metro Manila', 'Rizal', 'Cavite']
    }
  ];

  const latestNews = [
    {
      id: 1,
      category: 'System Update',
      title: 'WaveLab AI Model Upgrade Improves Forecast Accuracy to 99.2%',
      date: 'January 5, 2026',
      excerpt: 'New machine learning algorithms enhance prediction capabilities for extreme weather events.',
      image: '📊',
      readTime: '3 min read'
    },
    {
      id: 2,
      category: 'Partnership',
      title: 'DOST-PAGASA Expands Buoy Network Coverage',
      date: 'January 3, 2026',
      excerpt: '20 additional ocean buoys deployed across Visayas and Mindanao regions for better monitoring.',
      image: '⚓',
      readTime: '5 min read'
    },
    {
      id: 3,
      category: 'Research',
      title: 'UP MSI Validates Wave Prediction Models',
      date: 'December 28, 2025',
      excerpt: 'Independent study confirms 98.7% accuracy in 7-day wave height forecasts.',
      image: '🔬',
      readTime: '4 min read'
    },
    {
      id: 4,
      category: 'Community',
      title: 'Coastal LGUs Trained on Emergency Alert System',
      date: 'December 20, 2025',
      excerpt: '150+ local officials complete training on rapid response protocols.',
      image: '🏘️',
      readTime: '2 min read'
    }
  ];

  const severityConfig = {
    critical: {
      bg: isDark ? 'bg-red-500/20' : 'bg-red-50',
      border: isDark ? 'border-red-500/50' : 'border-red-300',
      text: isDark ? 'text-red-400' : 'text-red-600',
      badge: isDark ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700',
      icon: 'text-red-500',
      glow: 'shadow-red-500/25',
      pulse: true
    },
    warning: {
      bg: isDark ? 'bg-amber-500/20' : 'bg-amber-50',
      border: isDark ? 'border-amber-500/50' : 'border-amber-300',
      text: isDark ? 'text-amber-400' : 'text-amber-600',
      badge: isDark ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-100 text-amber-700',
      icon: 'text-amber-500',
      glow: 'shadow-amber-500/25',
      pulse: false
    },
    advisory: {
      bg: isDark ? 'bg-blue-500/20' : 'bg-blue-50',
      border: isDark ? 'border-blue-500/50' : 'border-blue-300',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      badge: isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700',
      icon: 'text-blue-500',
      glow: 'shadow-blue-500/25',
      pulse: false
    }
  };

  return (
    <section className={`relative py-16 transition-all duration-700 ${
      isDark ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Active Alerts Banner */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h2 className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Active Alerts & Warnings
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Real-time monitoring • Updated every minute
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeAlerts.length} Active
              </span>
            </div>
          </div>

          {/* Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {activeAlerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = alert.icon;
              
              return (
                <div
                  key={alert.id}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                    config.bg
                  } ${config.border} hover:shadow-xl ${config.glow}`}
                >
                  {/* Severity Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${config.badge}`}>
                      {config.pulse && <Radio className="w-3 h-3 animate-pulse" />}
                      {alert.type}
                    </div>
                    <Clock className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 leading-tight ${config.text}`}>
                        {alert.title}
                      </h3>
                      <div className={`flex items-center gap-2 text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <MapPin className="w-3 h-3" />
                        {alert.location}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <p className={`text-sm mb-4 leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {alert.details}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                      <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Wave Height
                      </div>
                      <div className={`text-lg font-black ${config.text}`}>
                        {alert.waveHeight}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                      <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Wind Speed
                      </div>
                      <div className={`text-lg font-black ${config.text}`}>
                        {alert.windSpeed}
                      </div>
                    </div>
                  </div>

                  {/* Affected Areas */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {alert.affectedAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-white/70 text-slate-700'
                        }`}
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 group-hover:translate-x-1 ${
                    config.bg
                  } ${config.text} border ${config.border}`}>
                    View Full Details
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Time Indicator */}
                  <div className={`absolute top-4 right-4 text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {alert.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* News & Updates Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Latest News & Updates
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Recent developments and announcements
                </p>
              </div>
            </div>

            <button className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 ${
              isDark
                ? 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}>
              View All
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestNews.map((news) => (
              <div
                key={news.id}
                className={`group p-6 rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-slate-900/50'
                    : 'bg-white border-slate-200 hover:shadow-xl hover:shadow-slate-900/10'
                }`}
              >
                <div className="flex gap-4">
                  {/* Image/Icon */}
                  <div className={`w-16 h-16 flex-shrink-0 rounded-xl flex items-center justify-center text-3xl ${
                    isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`}>
                    {news.image}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        isDark
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {news.category}
                      </span>
                      <span className={`text-xs ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        •
                      </span>
                      <span className={`text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {news.readTime}
                      </span>
                    </div>

                    <h3 className={`text-base lg:text-lg font-bold mb-2 leading-tight transition-colors duration-300 ${
                      isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {news.title}
                    </h3>

                    <p className={`text-sm mb-3 line-clamp-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {news.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-xs ${
                        isDark ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {news.date}
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AlertsNewsSection;