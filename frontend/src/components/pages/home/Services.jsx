import React from 'react';
import { Database, BarChart3, FileText, ExternalLink, Zap } from 'lucide-react';

const QuickAccessServices = ({ isDark }) => {
  const services = [
    {
      icon: Database,
      title: "Marine Data Portal",
      description: "Access comprehensive oceanographic datasets, historical records, and real-time measurements from our integrated network.",
      color: "from-blue-500 to-cyan-500",
      features: ["Real-time data", "Historical archives", "API access", "CSV exports"],
      badge: "Public Access",
      badgeColor: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
      link: '/data-portal'
    },
    {
      icon: BarChart3,
      title: "Wave Forecasts",
      description: "7-day wave predictions, tide tables, and marine weather forecasts for all Philippine coastal areas with hourly updates.",
      color: "from-purple-500 to-pink-500",
      features: ["7-day forecasts", "Interactive maps", "Location search", "Mobile alerts"],
      badge: "Free Service",
      badgeColor: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      link: '/forecasts'
    },
    {
      icon: FileText,
      title: "Reports & Publications",
      description: "Technical reports, research papers, monthly bulletins, and annual summaries from DOST-PAGASA and partner agencies.",
      color: "from-amber-500 to-orange-500",
      features: ["Monthly bulletins", "Annual reports", "Research papers", "Technical docs"],
      badge: "Updated Weekly",
      badgeColor: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
      link: '/reports'
    }
  ];

  return (
    <section className={`relative py-20 lg:py-32 overflow-hidden transition-all duration-700 ${
      isDark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className={`absolute inset-0 transition-all duration-700 ${
          isDark
            ? 'bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)]'
        } bg-[size:3rem_3rem]`} />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-blue-500/5' : 'bg-blue-400/8'
        }`} style={{ animation: 'float 10s ease-in-out infinite' }} />
        <div className={`absolute bottom-20 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-purple-500/5' : 'bg-purple-400/8'
        }`} style={{ animation: 'float 12s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDark
              ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
              : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
          }`}>
            <Zap size={16} className="animate-pulse" />
            Quick Access Services
          </div>
          
          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tight transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Essential Marine{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
              isDark
                ? 'from-blue-400 to-cyan-400'
                : 'from-blue-600 to-cyan-600'
            }`}>
              Resources
            </span>
          </h2>
          
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Direct access to data, forecasts, and reports for maritime professionals and coastal communities
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            
            return (
              <div
                key={index}
                className="group"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both` }}
              >
                <div className={`relative h-full p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-2xl'
                    : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                }`}>
                  
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>

                  <div className="relative">
                    {/* Header: Icon + Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3.5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon className="w-full h-full text-white" strokeWidth={2} />
                      </div>
                      
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${service.badgeColor}`}>
                        {service.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-2xl font-bold mb-3 tracking-tight transition-colors duration-300 ${
                      isDark 
                        ? 'text-white group-hover:text-blue-300' 
                        : 'text-slate-900 group-hover:text-blue-700'
                    }`}>
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-base leading-relaxed mb-6 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-[1.02] ${
                            isDark
                              ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color} flex-shrink-0`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] ${
                      isDark
                        ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-900/20'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
                    }`}>
                      Access Portal
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Decorative Corner Dots */}
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-br ${service.color} opacity-50`} />
                  <div className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-gradient-to-br ${service.color} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1);
          }
          33% { 
            transform: translateY(-15px) translateX(10px) scale(1.05);
          }
          66% { 
            transform: translateY(-8px) translateX(-8px) scale(0.95);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default QuickAccessServices;