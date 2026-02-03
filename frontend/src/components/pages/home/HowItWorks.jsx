import React from 'react';
import { Satellite, Database, Cpu, BarChart3, Bell, CheckCircle, ArrowRight, Waves, Cloud, TrendingUp } from 'lucide-react';

const HowItWorksSection = ({ isDark }) => {
  const steps = [
    {
      number: "01",
      icon: Satellite,
      title: "Data Collection",
      description: "Real-time satellite imagery, ocean buoys, and weather stations gather comprehensive marine data across Philippine waters.",
      features: ["Satellite monitoring", "Ocean buoy networks", "Coastal sensors", "Weather stations"],
      color: "from-blue-500 to-cyan-500",
      glowColor: "blue"
    },
    {
      number: "02",
      icon: Database,
      title: "Data Processing",
      description: "Advanced algorithms process terabytes of oceanographic data, filtering and validating information for accuracy.",
      features: ["Big data processing", "Quality validation", "Historical analysis", "Pattern recognition"],
      color: "from-emerald-500 to-teal-500",
      glowColor: "emerald"
    },
    {
      number: "03",
      icon: Cpu,
      title: "AI Analysis",
      description: "Machine learning models analyze patterns and predict wave behavior with unprecedented accuracy using neural networks.",
      features: ["Neural networks", "Predictive modeling", "Pattern analysis", "Real-time learning"],
      color: "from-purple-500 to-violet-500",
      glowColor: "purple"
    },
    {
      number: "04",
      icon: BarChart3,
      title: "Chart Generation",
      description: "Sophisticated visualization engines create detailed wave charts and forecasts tailored for marine activities.",
      features: ["Dynamic charts", "Multi-layer maps", "Custom overlays", "Export options"],
      color: "from-amber-500 to-orange-500",
      glowColor: "amber"
    },
    {
      number: "05",
      icon: Bell,
      title: "Alert System",
      description: "Intelligent notification system delivers timely warnings and updates directly to users based on their preferences.",
      features: ["Smart alerts", "Custom thresholds", "Multi-channel delivery", "Priority notifications"],
      color: "from-pink-500 to-rose-500",
      glowColor: "pink"
    },
    {
      number: "06",
      icon: CheckCircle,
      title: "Continuous Update",
      description: "System continuously updates forecasts every minute, ensuring you always have the most current marine conditions.",
      features: ["Real-time updates", "Auto-refresh", "Version tracking", "Data validation"],
      color: "from-indigo-500 to-blue-500",
      glowColor: "indigo"
    }
  ];

  const glowClasses = {
    blue: "group-hover:shadow-blue-500/20",
    emerald: "group-hover:shadow-emerald-500/20",
    purple: "group-hover:shadow-purple-500/20",
    amber: "group-hover:shadow-amber-500/20",
    pink: "group-hover:shadow-pink-500/20",
    indigo: "group-hover:shadow-indigo-500/20"
  };

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
        } bg-[size:4rem_4rem]`} />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-10 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-blue-500/5' : 'bg-blue-400/8'
        }`} style={{ animation: 'float1 10s ease-in-out infinite' }} />
        <div className={`absolute bottom-1/4 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl transition-all duration-1000 ${
          isDark ? 'bg-purple-500/5' : 'bg-purple-400/8'
        }`} style={{ animation: 'float2 12s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDark
              ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
              : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
          }`}>
            <Cpu size={18} className="animate-pulse" />
            Our Technology Pipeline
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            How{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDark
                ? 'from-blue-400 via-cyan-400 to-purple-400'
                : 'from-blue-600 via-cyan-600 to-purple-600'
            }`}>
              WaveLab Works
            </span>
          </h2>

          <p className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            From satellite data to your device in seconds. Our advanced system transforms raw oceanographic 
            data into actionable marine intelligence through a seamless six-step process.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className={`hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${
            isDark 
              ? 'bg-gradient-to-b from-blue-500/10 via-cyan-500/10 to-purple-500/10' 
              : 'bg-gradient-to-b from-blue-500/20 via-cyan-500/20 to-purple-500/20'
          }`} />

          <div className="space-y-12 lg:space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
                style={{ animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both` }}
              >
                <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
                  
                  {/* Content Side */}
                  <div className="flex-1 w-full">
                    <div className={`group relative p-8 lg:p-10 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-2xl'
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                    }`}>
                      
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      </div>

                      <div className="relative">
                        {/* Step Number Watermark */}
                        <div className={`text-8xl font-black mb-4 opacity-[0.03] absolute -top-4 ${index % 2 === 0 ? '-right-4' : '-left-4'} transition-all duration-300 group-hover:opacity-[0.06] ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {step.number}
                        </div>

                        {/* Icon & Title */}
                        <div className="flex items-start gap-4 mb-6 relative">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} p-3.5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${glowClasses[step.glowColor]} group-hover:shadow-xl`}>
                            <step.icon className="w-full h-full text-white" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-bold mb-2 ${
                              isDark ? 'text-blue-400' : 'text-blue-700'
                            }`}>
                              Step {step.number}
                            </div>
                            <h3 className={`text-2xl lg:text-3xl font-bold mb-3 tracking-tight transition-colors duration-300 ${
                              isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                            }`}>
                              {step.title}
                            </h3>
                            <p className={`text-base lg:text-lg leading-relaxed ${
                              isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-3">
                          {step.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className={`flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                                isDark
                                  ? 'bg-slate-800/40 hover:bg-slate-800/60'
                                  : 'bg-slate-50/80 hover:bg-slate-100'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color} flex-shrink-0 transition-all duration-300 group-hover:scale-125`} />
                              <span className={`text-sm font-medium transition-all duration-300 ${
                                isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-700'
                              }`}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Icon - Desktop Only */}
                  <div className="hidden lg:flex relative w-20 h-20 flex-shrink-0">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20`} />
                    <div className={`absolute inset-1 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-slate-900' : 'bg-white'
                    } shadow-lg`}>
                      <step.icon className={`w-8 h-8 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} strokeWidth={2.5} />
                    </div>
                    
                    {/* Connection Arrow */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4">
                        <ArrowRight className={`w-6 h-6 rotate-90 ${
                          isDark ? 'text-blue-400/30' : 'text-blue-500/30'
                        }`} style={{ animation: 'bounce 2s infinite' }} />
                      </div>
                    )}
                  </div>

                  {/* Empty Space for Alternating Layout */}
                  <div className="hidden lg:block flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float1 {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1);
          }
          50% { 
            transform: translateY(-20px) translateX(15px) scale(1.05);
          }
        }

        @keyframes float2 {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1);
          }
          50% { 
            transform: translateY(-25px) translateX(-10px) scale(0.95);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
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

export default HowItWorksSection;