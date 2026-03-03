import React from 'react';
import { Satellite, Radio, Anchor, Globe2, Cpu, Database, Network, Shield, CheckCircle2, Zap, Award, Activity } from 'lucide-react';

const DataSourcesSection = ({ isDark }) => {
  const dataSources = [
    {
      icon: Satellite,
      title: "Satellite Monitoring",
      organization: "NOAA & ESA",
      description: "Multi-spectral satellite data supports typhoon analysis, cloud diagnostics, and ocean state monitoring.",
      specs: ["Rapid scans", "Cloud classification", "Ocean surface tracking"],
      color: "from-blue-500 to-cyan-500",
      glowColor: "blue"
    },
    {
      icon: Radio,
      title: "Marine Observations",
      organization: "PAGASA Network",
      description: "Wave buoys, coastal stations, and ship reports feed operational wave guidance.",
      specs: ["Wave height", "Sea state", "Wind observations"],
      color: "from-cyan-500 to-teal-500",
      glowColor: "cyan"
    },
    {
      icon: Anchor,
      title: "Coastal & Hydromet Stations",
      organization: "DOST-PHIVOLCS",
      description: "Integrated tide gauges and hydrometeorological sensors support storm surge and rainfall monitoring.",
      specs: ["Tide gauges", "Hydromet sensors", "Real-time telemetry"],
      color: "from-purple-500 to-blue-500",
      glowColor: "purple"
    },
    {
      icon: Globe2,
      title: "Dual-Pol Weather Radar",
      organization: "PAGASA Doppler",
      description: "Dual-polarization radar drives QC, QPE, and QPN rainfall nowcasting products.",
      specs: ["Dual-pol QC", "QPE/QPN outputs", "Storm monitoring"],
      color: "from-indigo-500 to-purple-500",
      glowColor: "indigo"
    }
  ];

  const techStack = [
    {
      icon: Cpu,
      title: "Forecast Support Tools",
      description: "Operational aids for typhoon analysis and decision support",
      badge: "Ops Ready"
    },
    {
      icon: Database,
      title: "Regional Data Assimilation",
      description: "Bias-corrected inputs and new observation integration",
      badge: "NWP"
    },
    {
      icon: Network,
      title: "Nowcasting Pipeline",
      description: "Rapid QPE/QPN generation for rainfall monitoring",
      badge: "Radar"
    },
    {
      icon: Shield,
      title: "S2S Climate Services",
      description: "Sub-seasonal to seasonal applications for sector planning",
      badge: "Climate"
    }
  ];

  const certifications = [
    { name: "ISO 9001:2015", subtitle: "Quality Management" },
    { name: "DOST Approved", subtitle: "Technical Standards" },
    { name: "PAGASA Partner", subtitle: "Official Collaborator" },
    { name: "WMO Compliant", subtitle: "Global Standards" }
  ];

  const glowClasses = {
    blue: "group-hover:shadow-blue-500/20",
    cyan: "group-hover:shadow-cyan-500/20",
    purple: "group-hover:shadow-purple-500/20",
    indigo: "group-hover:shadow-indigo-500/20"
  };

  return (
    <section className={`relative py-20 lg:py-32 overflow-hidden transition-colors duration-700 ${
      isDark
        ? 'bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950'
        : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'
    }`}>
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className={`absolute inset-0 transition-opacity duration-700 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.2),transparent_70%)]'
        }`} />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-blue-500/5' : 'bg-blue-400/10'
        }`} style={{ animation: 'float 10s ease-in-out infinite' }} />
        <div className={`absolute bottom-20 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/10'
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
            Powered by Operational Sources
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Data and Guidance{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDark
                ? 'from-blue-400 via-cyan-400 to-purple-400'
                : 'from-blue-600 via-cyan-600 to-purple-600'
            }`}>
              for PAGASA
            </span>
          </h2>

          <p className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Integrating real-time observations and radar products from official agencies
            to deliver typhoon, marine, and rainfall guidance with dependable clarity.
          </p>
        </div>

        {/* Data Sources Grid */}
        <div className="mb-20 lg:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {dataSources.map((source, index) => (
              <div
                key={index}
                className="group"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
              >
                <div className={`relative h-full flex flex-col p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-2xl'
                    : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                }`}>
                  
                  {/* Corner Gradient */}
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${source.color} opacity-[0.04] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.08]`} />
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>

                  <div className="relative flex-1 flex flex-col">
                    {/* Header: Icon + Badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${source.color} p-3.5 shadow-lg transition-all duration-300 group-hover:scale-110 ${glowClasses[source.glowColor]}`}>
                        <source.icon className="w-full h-full text-white" strokeWidth={2} />
                      </div>
                      
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-800/60 text-slate-300 group-hover:bg-slate-800'
                          : 'bg-slate-100/80 text-slate-700 group-hover:bg-slate-200'
                      }`}>
                        <Award size={12} />
                        {source.organization}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl lg:text-2xl font-bold mb-3 tracking-tight transition-colors duration-200 ${
                      isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                    }`}>
                      {source.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-base leading-relaxed mb-6 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {source.description}
                    </p>

                    {/* Specifications */}
                    <div className="mt-auto">
                      <ul className="space-y-2.5">
                        {source.specs.map((spec, specIndex) => (
                          <li
                            key={specIndex}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                              isDark
                                ? 'bg-slate-800/40 hover:bg-slate-800/60'
                                : 'bg-slate-50/60 hover:bg-slate-100/80'
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                              isDark ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              {spec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className={`relative p-8 lg:p-12 rounded-2xl backdrop-blur-sm border mb-20 lg:mb-24 overflow-hidden ${
          isDark
            ? 'bg-slate-900/50 border-slate-800 shadow-xl'
            : 'bg-white/70 border-slate-200 shadow-xl'
        }`}>
          
          <div className="absolute inset-0 opacity-[0.015]">
            <div className={`absolute inset-0 ${
              isDark
                ? 'bg-[radial-gradient(circle_at_50%_50%,#3b82f6_2px,transparent_2px)]'
                : 'bg-[radial-gradient(circle_at_50%_50%,#60a5fa_2px,transparent_2px)]'
            } bg-[size:2rem_2rem]`} />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-10 lg:mb-12">
              <h3 className={`text-3xl lg:text-4xl font-bold mb-3 tracking-tight transition-colors duration-700 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
                  isDark
                    ? 'from-blue-400 to-cyan-400'
                    : 'from-blue-600 to-cyan-600'
                }`}>
                  Enterprise-Grade
                </span>
                {' '}Infrastructure
              </h3>
              <p className={`text-base lg:text-lg transition-colors duration-700 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Cutting-edge technology powering real-time oceanographic analysis
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl transition-all duration-300 hover:scale-[1.03] ${
                    isDark
                      ? 'bg-slate-800/40 hover:bg-slate-800/60'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.08 + 0.3}s both` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 mb-4 transition-all duration-300 group-hover:scale-110 shadow-md`}>
                    <tech.icon className="w-full h-full text-white" strokeWidth={2} />
                  </div>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 transition-all duration-200 ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tech.badge}
                  </div>

                  <h4 className={`text-base font-bold mb-2 tracking-tight transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {tech.title}
                  </h4>

                  <p className={`text-sm leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {tech.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className={`relative p-8 lg:p-12 rounded-2xl backdrop-blur-sm border overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-blue-900/10 via-cyan-900/5 to-purple-900/10 border-blue-700/30 shadow-xl'
            : 'bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-purple-50/80 border-blue-200/50 shadow-xl'
        }`}>
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h3 className={`text-2xl lg:text-3xl font-bold mb-3 tracking-tight transition-colors duration-700 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Certified Excellence
              </h3>
              <p className={`text-base lg:text-lg transition-colors duration-700 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Meeting the highest international standards for data quality and reliability
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl text-center transition-all duration-300 hover:scale-[1.05] ${
                    isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800/70'
                      : 'bg-white/70 hover:bg-white'
                  }`}
                  style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.08 + 0.5}s both` }}
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md ${
                    isDark ? 'shadow-blue-500/10' : 'shadow-blue-500/20'
                  }`}>
                    <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className={`text-base font-bold mb-1.5 tracking-tight transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {cert.name}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {cert.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1);
          }
          33% { 
            transform: translateY(-15px) translateX(10px) scale(1.02);
          }
          66% { 
            transform: translateY(-8px) translateX(-8px) scale(0.98);
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

export default DataSourcesSection;
