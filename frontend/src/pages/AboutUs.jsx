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
import React from 'react';
import { Target, ShieldCheck, Waves, Users, Globe2, Sparkles, TrendingUp, Award, ArrowRight, CheckCircle2, Zap, Cloud, Activity } from 'lucide-react';

const highlights = [
  {
    title: 'Mission',
    description:
      'To continue the research collaboration between DOST-PAGASA and Taiwan\'s Central Weather Administration to enhance prediction capabilities for typhoons, marine meteorology, and operational-to-seasonal climate prediction applications for various sectors.',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Vision',
    description:
      'Leading to improved decision-making and risk reduction applications for climate-related disasters through advancing the country\'s prediction system for typhoons, marine weather services, and climate prediction.',
    icon: Globe2,
    color: 'from-emerald-500 to-teal-500',
  },
];

const pillars = [
  {
    title: 'Typhoon Forecasting',
    description: 'Advanced forecast support systems with improved reliability of analysis and forecast aids for efficient operations.',
    icon: Cloud,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Marine Services',
    description: 'Optimized wave prediction operational systems to support routine marine meteorological services nationwide.',
    icon: Waves,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Radar Technology',
    description: 'Dual polarization quality control techniques and quantitative precipitation estimates for heavy rainfall monitoring.',
    icon: Activity,
    color: 'from-purple-500 to-violet-500',
  },
  {
    title: 'Climate Prediction',
    description: 'Sub-seasonal to seasonal applications for agriculture, water resources, energy, and disaster risk reduction.',
    icon: Globe2,
    color: 'from-amber-500 to-orange-500',
  },
];

const programObjectives = [
  {
    title: 'Upscale Typhoon Forecast Support',
    description: 'Enhance typhoon forecast support systems for efficient operations, with a focus on increasing the reliability of available analysis and forecast aids.',
    icon: Cloud,
  },
  {
    title: 'Optimize Wave Prediction Services',
    description: 'Improve the wave prediction operational system to support routine marine meteorological services.',
    icon: Waves,
  },
  {
    title: 'Dual Polarization Quality Control',
    description: 'Develop dual polarization quality control techniques for enhanced radar capabilities.',
    icon: Activity,
  },
  {
    title: 'Quantitative Precipitation Estimates',
    description: 'Develop dual-polarization quantitative precipitation estimates (QPE) and quantitative precipitation nowcasts (QPN) for heavy rainfall monitoring.',
    icon: Zap,
  },
  {
    title: 'Regional Data Assimilation',
    description: 'Enhance the PAGASA Regional Data Assimilation and Numerical Weather Prediction System by assimilating new observation types and developing fine-corrected temperature forecasts.',
    icon: Target,
  },
  {
    title: 'S2S Climate Applications',
    description: 'Sub-seasonal to Seasonal (S2S) applications for agriculture, water resources, energy, and disaster risk reduction.',
    icon: Globe2,
  },
];

const milestones = [
  {
    year: '2024',
    title: 'Program Initiation',
    description: 'MECO-TECO-VOTE III Component B officially launched with DOST-PAGASA and Taiwan CWA collaboration.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    year: '2024-25',
    title: 'System Development',
    description: 'Development of display system and wave model programs for Project 1, with focus on computer software and web applications.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    year: '2025',
    title: 'Implementation Phase',
    description: 'Integration of dual polarization radar, wave prediction systems, and Regional Data Assimilation enhancements.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    year: '2026',
    title: 'Program Completion',
    description: 'Full deployment of seamless prediction capabilities for typhoon, marine weather, and climate applications.',
    color: 'from-amber-500 to-orange-500',
  },
];

const leaders = [
  {
    name: 'Dr. Aira Mendez',
    role: 'Coastal Systems Lead',
    avatar: 'https://i.pravatar.cc/160?img=32',
  },
  {
    name: 'Engr. Luis Herrera',
    role: 'Forecast Operations Manager',
    avatar: 'https://i.pravatar.cc/160?img=14',
  },
  {
    name: 'Ma. Celeste Ramos',
    role: 'Data Partnerships',
    avatar: 'https://i.pravatar.cc/160?img=47',
  },
];

const partners = [
  'PAGASA',
  'DOST',
  'Taiwan CWA',
  'PHIVOLCS',
  'NDRRMC',
];

const stats = [
  { number: '36', label: 'Project Duration', sublabel: 'Months (2024-2026)' },
  { number: '6', label: 'Core Objectives', sublabel: 'Research areas' },
  { number: '2', label: 'Main Partners', sublabel: 'DOST-PAGASA & CWA Taiwan' },
  { number: '3', label: 'Project Components', sublabel: 'Typhoon, Marine, Climate' },
];

const AboutUs = ({ isDarkMode }) => {
  return (
    <div
      className={`relative min-h-screen pt-28 pb-20 px-4 md:px-6 overflow-hidden transition-all duration-700 ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
    >
      <style>
        {`
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
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className={`absolute inset-0 transition-all duration-700 ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
          } bg-[length:30px_30px]`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-20">
        
        {/* Hero Section */}
        <section className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              isDarkMode
                ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
                : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
            }`}
          >
            <Waves className="animate-pulse" size={18} />
            About WaveLab
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Seamless Prediction for{' '}
            <span
              className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
                isDarkMode
                  ? 'from-blue-400 via-cyan-400 to-emerald-400'
                  : 'from-blue-600 via-cyan-600 to-emerald-600'
              }`}
            >
              Typhoon & Marine Weather
            </span>
          </h1>

          <p
            className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10 transition-colors duration-700 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Part of the DOST MECO-TECO-VOTE III program, WaveLab establishes seamless prediction 
            capability on typhoon, marine meteorology, and short-range climate prediction applications 
            to support decision-making and risk reduction along the Philippine coastline.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/contact"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              Connect with WaveLab
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </a>
            <a
              href="/charts"
              className={`inline-flex items-center gap-2.5 rounded-xl border px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  : 'border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400'
              }`}
            >
              Explore Live Charts
            </a>
          </div>
        </section>

        {/* Stats Banner */}
        <section
          className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border ${
            isDarkMode
              ? 'bg-slate-900/30 border-slate-800'
              : 'bg-white/50 border-slate-200'
          }`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group transition-all duration-500 hover:scale-110 p-6 rounded-xl ${
                  isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-white/70'
                }`}
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
              >
                <div className={`text-3xl lg:text-4xl font-black mb-2 bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                  {stat.number}
                </div>
                <div
                  className={`text-base font-bold mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {stat.label}
                </div>
                <div
                  className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid gap-6 md:grid-cols-2">
          {highlights.map(({ title, description, icon: Icon, color }, index) => (
            <div
              key={title}
              className="group"
              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
            >
              <div
                className={`relative h-full p-8 lg:p-10 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                }`}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                />

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-6`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h2
                    className={`text-2xl lg:text-3xl font-black mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                    }`}
                  >
                    {title}
                  </h2>
                  <p
                    className={`text-base md:text-lg leading-relaxed ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Program Objectives */}
        <section className="flex flex-col gap-8">
          <div className="text-center">
            <div
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20'
                  : 'bg-emerald-100/80 text-emerald-700 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={18} />
              MECO-TECO-VOTE III Program
            </div>
            <h2
              className={`text-3xl lg:text-4xl font-black mb-4 tracking-tight transition-colors duration-700 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Program{' '}
              <span
                className={`bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode
                    ? 'from-blue-400 via-cyan-400 to-emerald-400'
                    : 'from-blue-600 via-cyan-600 to-emerald-600'
                }`}
              >
                Objectives
              </span>
            </h2>
            <p
              className={`text-base md:text-lg max-w-4xl mx-auto transition-colors duration-700 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              The program integrates advanced developments in typhoon forecast support, wave prediction optimization, 
              and enhanced numerical weather prediction systems, leading to improved decision-making and risk reduction.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programObjectives.map(({ title, description, icon: Icon }, index) => (
              <div
                key={title}
                className="group"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
              >
                <div
                  className={`relative h-full p-7 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    isDarkMode
                      ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                      : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                  }`}
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                  />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-700'
                        } font-black text-sm`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <h3
                      className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                      }`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Pillars */}
        <section className="flex flex-col gap-8">
          <div className="text-center">
            <h2
              className={`text-3xl lg:text-4xl font-black mb-4 tracking-tight transition-colors duration-700 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Program{' '}
              <span
                className={`bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode
                    ? 'from-blue-400 via-cyan-400 to-emerald-400'
                    : 'from-blue-600 via-cyan-600 to-emerald-600'
                }`}
              >
                Focus Areas
              </span>
            </h2>
            <p
              className={`text-base md:text-lg max-w-3xl mx-auto transition-colors duration-700 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Four key research and development areas driving seamless prediction capabilities.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map(({ title, description, icon: Icon, color }, index) => (
              <div
                key={title}
                className="group"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
              >
                <div
                  className={`relative h-full p-7 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    isDarkMode
                      ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                      : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                  }`}
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                  />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>

                  <div className="relative">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-5`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3
                      className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                      }`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Milestones & Leadership */}
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Milestones */}
          <div
            className={`rounded-2xl border p-8 lg:p-10 shadow-xl backdrop-blur-sm ${
              isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
            }`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2
                  className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Program Timeline
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  MECO-TECO-VOTE III Component B journey from 2024 to 2026
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className="group flex gap-5"
                  style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
                >
                  <div
                    className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${milestone.color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <span className="text-base font-black text-white">{milestone.year}</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                      }`}
                    >
                      {milestone.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership & Partners */}
          <div className="flex flex-col gap-6">
            {/* Leadership */}
            <div
              className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
                isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <h2
                  className={`text-xl font-black transition-colors duration-700 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Leadership
                </h2>
              </div>
              <div className="flex flex-col gap-5">
                {leaders.map((leader, index) => (
                  <div
                    key={leader.name}
                    className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                      isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <img
                      src={leader.avatar}
                      alt={`${leader.name} profile`}
                      className="h-14 w-14 rounded-xl object-cover shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      loading="lazy"
                    />
                    <div>
                      <p
                        className={`text-base font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                        }`}
                      >
                        {leader.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {leader.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Partner Agencies */}
            <div
              className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
                isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2
                  className={`text-xl font-black transition-colors duration-700 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Partner Agencies
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {partners.map((partner) => (
                  <span
                    key={partner}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-200 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600'
                        : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border text-center transition-all duration-300 hover:scale-[1.01] ${
            isDarkMode
              ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-blue-700/30'
              : 'bg-gradient-to-br from-blue-50/80 to-purple-50/60 border-blue-200/50'
          }`}
        >
          <Sparkles className={`w-16 h-16 mx-auto mb-6 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <h3
            className={`text-3xl lg:text-4xl font-black mb-4 transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Collaborate with PAGASA
          </h3>
          <p
            className={`text-lg mb-8 max-w-2xl mx-auto transition-colors duration-700 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Partner with our meteorological research team on typhoon forecasting, marine weather services, 
            and climate prediction applications.
          </p>
          <a
            href="/contact"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/25"
          >
            Contact the Team
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-300" />
          </a>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;