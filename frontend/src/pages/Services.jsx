//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   :  Weather forecasting platform                     ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-05-29                                        ║
//  ║  🧭 Version       : v1.0.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useEffect } from 'react';
import { Cloud, Waves, Radar, Network, CheckCircle2, ArrowRight, Zap, ShieldCheck, Sparkles } from 'lucide-react';

const Services = ({ isDarkMode }) => {
  useEffect(() => {
    document.title = 'WaveLab | Services';
  }, []);

  const services = [
    {
      title: 'Typhoon Forecast Support',
      description:
        'Operational analysis and forecast aids that improve reliability and speed for tropical cyclone decision-making.',
      highlights: ['Forecast aids', 'Operational dashboards', 'Scenario review', 'Regional coordination'],
      icon: Cloud,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Objective 01',
    },
    {
      title: 'Wave Prediction Operations',
      description:
        'Optimized wave prediction guidance for marine meteorological services and coastal response planning.',
      highlights: ['Operational wave models', 'Marine outlooks', 'Coastal guidance', 'Service delivery'],
      icon: Waves,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Objective 02',
    },
    {
      title: 'Radar Rainfall Products',
      description:
        'Dual-pol radar quality control plus QPE/QPN products for heavy rainfall monitoring and nowcasting.',
      highlights: ['Dual-pol QC', 'QPE/QPN outputs', 'Rapid refresh', 'Heavy rainfall focus'],
      icon: Radar,
      color: 'from-purple-500 to-violet-500',
      badge: 'Objectives 03-04',
    },
    {
      title: 'Data Assimilation & NWP',
      description:
        'Regional data assimilation that integrates new observations and improves model guidance.',
      highlights: ['New observations', 'Bias correction', 'Regional NWP', 'Model integration'],
      icon: Network,
      color: 'from-amber-500 to-orange-500',
      badge: 'Objective 05',
    },
    {
      title: 'S2S Climate Services',
      description:
        'Sub-seasonal to seasonal applications that inform agriculture, water resources, energy, and DRR planning.',
      highlights: ['S2S outlooks', 'Sector guidance', 'Risk planning', 'Climate services'],
      icon: ShieldCheck,
      color: 'from-indigo-500 to-blue-500',
      badge: 'Objective 06',
    },
  ];

  const deliverySteps = [
    {
      title: 'Monitor & Ingest',
      description: 'Collect real-time satellite, radar, marine, and in-situ observations for operations.',
    },
    {
      title: 'Process & Validate',
      description: 'Apply QC and assimilation workflows to ensure consistent, reliable guidance.',
    },
    {
      title: 'Deliver & Coordinate',
      description: 'Publish operational products and coordinate with PAGASA centers and stakeholders.',
    },
  ];

  const serviceMetrics = [
    { label: 'Operational Outputs', value: '24/7', note: 'Continuous delivery' },
    { label: 'Service Lines', value: '05', note: 'Project-aligned' },
    { label: 'Objectives Covered', value: '06', note: 'Component B' },
    { label: 'Update Cycle', value: 'Hourly', note: 'Forecast refresh' },
  ];

  const serviceNotes = [
    {
      title: 'WaveLab Program Coverage',
      description: 'PAGASA operations centers, regional forecast hubs, and partner agencies.',
    },
    {
      title: 'Primary Users',
      description: 'Operational meteorologists, marine safety teams, and DRR planners.',
    },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <section className={`${isDarkMode ? 'bg-slate-950' : 'bg-white'} border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Sparkles size={14} className="animate-pulse" />
              WaveLab Services • Component B Project 1
            </div>
            <div className={`text-xs uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              WaveLab Program
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                WaveLab Service Portfolio for Operational Readiness
              </h1>
              <p className={`text-base sm:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                WaveLab services translate DOST-MECO-TECO-VOTE III Component B objectives into field-ready program
                outputs for typhoon, marine, radar rainfall, data assimilation, and S2S climate applications.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all">
                  Request Service Briefing
                  <ArrowRight size={16} />
                </button>
                <button className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold border ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-100'} transition-all`}>
                  View Operational Outputs
                </button>
              </div>
            </div>
            <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Service Status</p>
                  <h2 className="text-lg font-semibold">WaveLab Readiness</h2>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <Zap size={18} />
                </div>
              </div>
              <div className="space-y-3">
                {serviceMetrics.map((metric) => (
                  <div key={metric.label} className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-white'}`}>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</p>
                      <p className="text-sm font-semibold">{metric.note}</p>
                    </div>
                    <p className="text-lg font-black">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {serviceNotes.map((note) => (
                  <div key={note.title} className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-800/70' : 'bg-white'}`}>
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{note.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-20 lg:py-28 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5 ${isDarkMode ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Zap size={16} className="animate-pulse" />
              Service Portfolio
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              Program-Aligned Service Lines
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Each service line maps directly to Component B Project 1 deliverables within the WaveLab program context.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className={`relative p-8 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/80' : 'bg-white border-slate-200 hover:shadow-xl'}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3 shadow-lg`}>
                      <Icon className="w-full h-full text-white" strokeWidth={2} />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className={`text-base mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {service.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-3">
                    {service.highlights.map((item) => (
                      <li
                        key={item}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${isDarkMode ? 'bg-slate-800/60 text-slate-200' : 'bg-slate-50 text-slate-700'}`}
                      >
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`py-20 lg:py-28 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl border p-10 lg:p-12 ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">Operational Delivery Workflow</h3>
                <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  A consistent workflow ensures every service line is validated, coordinated, and delivered for
                  mission-critical decisions.
                </p>
              </div>
              <div className="space-y-4">
                {deliverySteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={`flex gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-white'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'} font-bold`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold mb-1">{step.title}</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-20 lg:py-28 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl border p-10 lg:p-12 text-center ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-blue-700/30' : 'bg-white border-slate-200'}`}>
            <h3 className="text-3xl font-bold mb-4">Ready to Enable the Services?</h3>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Coordinate with the PAGASA operations team to activate, validate, and roll out Project 1 services
              across regional centers and partner agencies.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all">
              Contact Service Desk
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
