import React from 'react';
import { Database, BarChart3, FileText, Download, ExternalLink, Waves, Calendar, MapPin, TrendingUp, Clock, Search, Filter } from 'lucide-react';

const QuickAccessServices = ({ isDark }) => {
  const services = [
    {
      icon: Database,
      title: 'Marine Data Portal',
      description: 'Access comprehensive oceanographic datasets, historical records, and real-time measurements.',
      color: 'from-blue-500 to-cyan-500',
      features: ['Real-time data', 'Historical archives', 'API access', 'CSV exports'],
      badge: 'Public Access',
      badgeColor: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
      link: '/data-portal'
    },
    {
      icon: BarChart3,
      title: 'Wave Forecasts',
      description: '7-day wave predictions, tide tables, and marine weather forecasts for all Philippine coastal areas.',
      color: 'from-purple-500 to-pink-500',
      features: ['7-day forecasts', 'Interactive maps', 'Location search', 'Mobile alerts'],
      badge: 'Free Service',
      badgeColor: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      link: '/forecasts'
    },
    {
      icon: FileText,
      title: 'Reports & Publications',
      description: 'Technical reports, research papers, monthly bulletins, and annual summaries from DOST-PAGASA.',
      color: 'from-amber-500 to-orange-500',
      features: ['Monthly bulletins', 'Annual reports', 'Research papers', 'Technical docs'],
      badge: 'Updated Weekly',
      badgeColor: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
      link: '/reports'
    }
  ];

  const quickLinks = [
    {
      icon: Waves,
      title: 'Current Wave Conditions',
      subtitle: 'Live data from 50+ stations',
      action: 'View Now',
      color: 'blue'
    },
    {
      icon: Calendar,
      title: 'Tide Tables',
      subtitle: 'All Philippine ports',
      action: 'Check Tides',
      color: 'cyan'
    },
    {
      icon: MapPin,
      title: 'Station Locations',
      subtitle: 'Interactive network map',
      action: 'View Map',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Historical Trends',
      subtitle: '20+ years of data',
      action: 'Explore',
      color: 'emerald'
    }
  ];

  const colorClasses = {
    blue: {
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      hover: isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-100'
    },
    cyan: {
      bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
      text: isDark ? 'text-cyan-400' : 'text-cyan-600',
      hover: isDark ? 'hover:bg-cyan-500/20' : 'hover:bg-cyan-100'
    },
    purple: {
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
      text: isDark ? 'text-purple-400' : 'text-purple-600',
      hover: isDark ? 'hover:bg-purple-500/20' : 'hover:bg-purple-100'
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-400' : 'text-emerald-600',
      hover: isDark ? 'hover:bg-emerald-500/20' : 'hover:bg-emerald-100'
    }
  };

  return (
    <section className={`relative py-16 overflow-hidden transition-all duration-700 ${
      isDark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute inset-0 transition-all duration-700 ${
          isDark
            ? 'bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)]'
        } bg-[size:3rem_3rem]`} style={{ animation: 'drift 25s ease-in-out infinite' }} />
      </div>

      {/* Floating Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 transition-colors duration-700 ${
          isDark ? 'text-blue-400/10' : 'text-blue-500/10'
        }`} style={{ animation: 'float1 8s ease-in-out infinite' }}>
          <Database size={70} strokeWidth={1} />
        </div>
        <div className={`absolute top-32 right-20 transition-colors duration-700 ${
          isDark ? 'text-cyan-400/10' : 'text-cyan-500/10'
        }`} style={{ animation: 'float2 10s ease-in-out infinite' }}>
          <BarChart3 size={65} strokeWidth={1} />
        </div>
        <div className={`absolute bottom-20 left-1/4 transition-colors duration-700 ${
          isDark ? 'text-purple-400/10' : 'text-purple-500/10'
        }`} style={{ animation: 'float3 9s ease-in-out infinite' }}>
          <FileText size={75} strokeWidth={1} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
            isDark
              ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20'
              : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            <Clock size={16} />
            Quick Access Services
          </div>
          
          <h2 className={`text-3xl lg:text-4xl font-black mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Essential Marine{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
              isDark
                ? 'from-blue-400 to-cyan-400'
                : 'from-blue-500 to-cyan-500'
            }`}>
              Resources
            </span>
          </h2>
          
          <p className={`text-lg max-w-3xl mx-auto transition-colors duration-700 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Direct access to data, forecasts, and reports for maritime professionals and coastal communities
          </p>
        </div>

        {/* Main Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            
            return (
              <div
                key={index}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-2xl'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xl'
                }`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${service.badgeColor}`}>
                    {service.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3.5 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                }`}>
                  {service.title}
                </h3>

                <p className={`text-sm mb-6 leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {service.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                        isDark
                          ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isDark
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}>
                  Access Portal
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Links Grid */}
        {/* <div className={`p-8 rounded-2xl border ${
          isDark
            ? 'bg-slate-900/30 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Popular Resources
            </h3>
            <div className="flex gap-2">
              <button className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-white text-slate-600 hover:text-slate-900'
              }`}>
                <Search size={18} />
              </button>
              <button className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-white text-slate-600 hover:text-slate-900'
              }`}>
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              const colors = colorClasses[link.color];
              
              return (
                <button
                  key={index}
                  className={`group p-5 rounded-xl text-left transition-all duration-300 hover:scale-105 ${
                    colors.bg
                  } ${colors.hover}`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${colors.text}`} />
                  <h4 className={`text-base font-bold mb-1 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {link.title}
                  </h4>
                  <p className={`text-xs mb-3 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {link.subtitle}
                  </p>
                  <div className={`flex items-center gap-2 text-sm font-semibold ${colors.text}`}>
                    {link.action}
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </div> */}

        {/* Download Section */}
        {/* <div className={`mt-8 p-6 rounded-2xl border ${
          isDark
            ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/30'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <Download className={`w-6 h-6 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h4 className={`text-lg font-bold mb-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Bulk Data Downloads
                </h4>
                <p className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Download complete datasets for research and analysis
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}>
                CSV Format
              </button>
              <button className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}>
                JSON Format
              </button>
              <button className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}>
                API Docs
              </button>
            </div>
          </div>
        </div> */}
        
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(1deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(7deg); }
        }
      `}</style>
    </section>
  );
};

export default QuickAccessServices;