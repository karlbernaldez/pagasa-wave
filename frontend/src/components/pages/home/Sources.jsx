import React from 'react';
import { Satellite, Radio, Anchor, Database, Shield, Globe2, Network, Cpu, Activity, CheckCircle2, Zap, Award } from 'lucide-react';

const DataSourcesSection = ({ isDark }) => {
  const dataSources = [
    {
      icon: Satellite,
      title: "Satellite Imagery",
      organization: "NOAA & ESA",
      description: "High-resolution satellite data from GOES-16/17 and Sentinel missions providing comprehensive ocean surface monitoring.",
      specs: ["10m resolution", "15-min intervals", "Multi-spectral imaging"],
      color: "from-blue-500 to-cyan-500",
      glowColor: "blue"
    },
    {
      icon: Radio,
      title: "Ocean Buoys",
      organization: "PAGASA Network",
      description: "Real-time measurements from 50+ ocean buoys deployed across Philippine waters by PAGASA.",
      specs: ["Wave height sensors", "Water temperature", "Wind speed/direction"],
      color: "from-cyan-500 to-teal-500",
      glowColor: "cyan"
    },
    {
      icon: Anchor,
      title: "Coastal Stations",
      organization: "DOST-PHIVOLCS",
      description: "Network of coastal monitoring stations providing tidal data and seismic sea wave detection.",
      specs: ["Tide gauges", "Pressure sensors", "Seismic monitoring"],
      color: "from-purple-500 to-blue-500",
      glowColor: "purple"
    },
    {
      icon: Globe2,
      title: "Weather Radar",
      organization: "PAGASA Doppler",
      description: "Advanced S-band Doppler radar systems covering Philippine Area of Responsibility (PAR).",
      specs: ["250km radius", "Real-time tracking", "Storm detection"],
      color: "from-indigo-500 to-purple-500",
      glowColor: "indigo"
    }
  ];

  const techStack = [
    {
      icon: Cpu,
      title: "AI/ML Processing",
      description: "Neural networks trained on 20+ years of oceanographic data",
      badge: "TensorFlow"
    },
    {
      icon: Database,
      title: "Big Data Analytics",
      description: "Processing 5TB+ daily from multiple data streams",
      badge: "PostgreSQL"
    },
    {
      icon: Network,
      title: "Real-Time Pipeline",
      description: "Sub-second data ingestion and processing infrastructure",
      badge: "Apache Kafka"
    },
    {
      icon: Shield,
      title: "Data Validation",
      description: "Multi-layer quality control and anomaly detection",
      badge: "ISO Certified"
    }
  ];

  const certifications = [
    { name: "ISO 9001:2015", subtitle: "Quality Management" },
    { name: "DOST Approved", subtitle: "Technical Standards" },
    { name: "PAGASA Partner", subtitle: "Official Collaborator" },
    { name: "WMO Compliant", subtitle: "Global Standards" }
  ];

  const glowClasses = {
    blue: "group-hover:shadow-blue-500/30",
    cyan: "group-hover:shadow-cyan-500/30",
    purple: "group-hover:shadow-purple-500/30",
    indigo: "group-hover:shadow-indigo-500/30"
  };

  return (
    <section 
      className={`relative py-20 lg:py-28 overflow-hidden transition-colors duration-700 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950'
          : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'
      }`}
      aria-labelledby="data-sources-heading"
    >
      
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <div className={`absolute inset-0 transition-opacity duration-700 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.2),transparent_70%)]'
        }`} />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-blue-500/10' : 'bg-blue-400/15'
        }`} style={{ animation: 'float 10s ease-in-out infinite' }} />
        <div className={`absolute bottom-20 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/15'
        }`} style={{ animation: 'float 12s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDark
              ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
              : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
          }`}>
            <Zap size={16} className="animate-pulse" aria-hidden="true" />
            <span>Powered by Trusted Sources</span>
          </div>

          <h2 
            id="data-sources-heading"
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight transition-colors duration-700 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Data You Can{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDark
                ? 'from-blue-400 via-cyan-400 to-purple-400'
                : 'from-blue-600 via-cyan-600 to-purple-600'
            }`}>
              Trust
            </span>
          </h2>

          <p className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Integrating real-time data from official government agencies and international 
            space organizations to deliver accurate oceanographic insights.
          </p>
        </header>

        {/* Data Sources Grid - All Cards Same Height */}
        <div className="mb-20 lg:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-6 lg:gap-8">
            {dataSources.map((source, index) => (
              <div
                key={index}
                className="group"
                style={{ 
                  animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                }}
              >
                <div className={`relative h-full flex flex-col p-6 lg:p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.01] overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/40 border-slate-700/40 hover:bg-slate-900/60 hover:border-slate-600/60 shadow-lg hover:shadow-xl'
                    : 'bg-white/60 border-slate-200/60 hover:bg-white/90 hover:border-slate-300/80 shadow-lg hover:shadow-xl'
                }`}>
                  
                  {/* Corner Gradient */}
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${source.color} opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]`} aria-hidden="true" />
                  
                  {/* Header: Icon + Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${source.color} p-3.5 shadow-lg transition-all duration-300 group-hover:scale-105 ${glowClasses[source.glowColor]}`}>
                      <source.icon className="w-full h-full text-white" strokeWidth={2} aria-hidden="true" />
                    </div>
                    
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-800/60 text-slate-300 group-hover:bg-slate-800'
                        : 'bg-slate-100/80 text-slate-700 group-hover:bg-slate-200'
                    }`}>
                      <Award size={12} aria-hidden="true" />
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
                  <p className={`text-sm lg:text-base leading-relaxed mb-6 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {source.description}
                  </p>

                  {/* Specifications - Push to bottom */}
                  <div className="mt-auto">
                    <ul className="space-y-2.5" role="list">
                      {source.specs.map((spec, specIndex) => (
                        <li
                          key={specIndex}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${
                            isDark
                              ? 'bg-slate-800/40 hover:bg-slate-800/60'
                              : 'bg-slate-50/60 hover:bg-slate-100/80'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`} aria-hidden="true" />
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
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className={`relative p-8 lg:p-12 rounded-2xl backdrop-blur-sm border mb-20 lg:mb-24 overflow-hidden ${
          isDark
            ? 'bg-slate-900/40 border-slate-700/40 shadow-xl'
            : 'bg-white/60 border-slate-200/60 shadow-xl'
        }`}>
          
          <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl transition-all duration-300 hover:scale-[1.03] ${
                    isDark
                      ? 'bg-slate-800/40 hover:bg-slate-800/60'
                      : 'bg-white/60 hover:bg-white/90'
                  }`}
                  style={{ 
                    animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08 + 0.3}s both`
                  }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 mb-4 transition-all duration-300 group-hover:scale-110 shadow-md`}>
                    <tech.icon className="w-full h-full text-white" strokeWidth={2} aria-hidden="true" />
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
            ? 'bg-gradient-to-r from-blue-900/20 via-cyan-900/10 to-purple-900/20 border-blue-700/30 shadow-xl'
            : 'bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-purple-50/80 border-blue-200/50 shadow-xl'
        }`}>
          
          <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
            <svg className="absolute w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
              <path d="M0,100 Q300,150 600,100 T1200,100 L1200,300 L0,300 Z" fill="url(#waveGradient)" opacity="0.5">
                <animate attributeName="d" dur="10s" repeatCount="indefinite"
                  values="M0,100 Q300,150 600,100 T1200,100 L1200,300 L0,300 Z;
                          M0,100 Q300,50 600,100 T1200,100 L1200,300 L0,300 Z;
                          M0,100 Q300,150 600,100 T1200,100 L1200,300 L0,300 Z" />
              </path>
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? "#3b82f6" : "#60a5fa"} />
                  <stop offset="100%" stopColor={isDark ? "#06b6d4" : "#22d3ee"} />
                </linearGradient>
              </defs>
            </svg>
          </div>

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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800/70'
                      : 'bg-white/70 hover:bg-white'
                  }`}
                  style={{ 
                    animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08 + 0.5}s both`
                  }}
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md ${
                    isDark ? 'shadow-blue-500/20' : 'shadow-blue-500/30'
                  }`}>
                    <Activity className="w-7 h-7 text-white" strokeWidth={2.5} aria-hidden="true" />
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
            transform: translateY(24px);
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