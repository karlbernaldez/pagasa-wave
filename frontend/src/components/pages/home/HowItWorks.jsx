import React from 'react';
import { Satellite, Database, Cpu, BarChart3, Bell, CheckCircle, ArrowRight, Waves, Cloud, TrendingUp } from 'lucide-react';

const HowItWorksSection = ({ isDark }) => {
  const steps = [
    {
      number: "01",
      icon: Satellite,
      title: "Data Collection",
      description: "Real-time satellite imagery, ocean buoys, and weather stations gather comprehensive marine data across the Philippine waters.",
      features: ["Satellite monitoring", "Ocean buoy networks", "Coastal sensors", "Weather stations"],
      color: "from-blue-500 to-cyan-500",
      glowColor: "blue",
      delay: "0ms"
    },
    {
      number: "02",
      icon: Database,
      title: "Data Processing",
      description: "Advanced algorithms process terabytes of oceanographic data, filtering and validating information for accuracy.",
      features: ["Big data processing", "Quality validation", "Historical analysis", "Pattern recognition"],
      color: "from-emerald-500 to-teal-500",
      glowColor: "emerald",
      delay: "150ms"
    },
    {
      number: "03",
      icon: Cpu,
      title: "AI Analysis",
      description: "Machine learning models analyze patterns and predict wave behavior with unprecedented accuracy using neural networks.",
      features: ["Neural networks", "Predictive modeling", "Pattern analysis", "Real-time learning"],
      color: "from-purple-500 to-violet-500",
      glowColor: "purple",
      delay: "300ms"
    },
    {
      number: "04",
      icon: BarChart3,
      title: "Chart Generation",
      description: "Sophisticated visualization engines create detailed wave charts and forecasts tailored for marine activities.",
      features: ["Dynamic charts", "Multi-layer maps", "Custom overlays", "Export options"],
      color: "from-amber-500 to-orange-500",
      glowColor: "amber",
      delay: "450ms"
    },
    {
      number: "05",
      icon: Bell,
      title: "Alert System",
      description: "Intelligent notification system delivers timely warnings and updates directly to users based on their preferences.",
      features: ["Smart alerts", "Custom thresholds", "Multi-channel delivery", "Priority notifications"],
      color: "from-pink-500 to-rose-500",
      glowColor: "pink",
      delay: "600ms"
    },
    {
      number: "06",
      icon: CheckCircle,
      title: "Continuous Update",
      description: "System continuously updates forecasts every minute, ensuring you always have the most current marine conditions.",
      features: ["Real-time updates", "Auto-refresh", "Version tracking", "Data validation"],
      color: "from-indigo-500 to-blue-500",
      glowColor: "indigo",
      delay: "750ms"
    }
  ];

  const glowClasses = {
    blue: "group-hover:shadow-blue-500/30",
    emerald: "group-hover:shadow-emerald-500/30",
    purple: "group-hover:shadow-purple-500/30",
    amber: "group-hover:shadow-amber-500/30",
    pink: "group-hover:shadow-pink-500/30",
    indigo: "group-hover:shadow-indigo-500/30"
  };

  return (
    <section className={`relative py-20 lg:py-28 overflow-hidden transition-all duration-700 ${
      isDark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute inset-0 transition-all duration-700 ${
          isDark
            ? 'bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)]'
        } bg-[size:4rem_4rem]`} />
      </div>

      {/* Floating Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-10 transition-colors duration-700 ${
          isDark ? 'text-blue-400/10' : 'text-blue-500/10'
        }`} style={{ animation: 'float1 8s ease-in-out infinite' }}>
          <Cloud size={80} strokeWidth={1} />
        </div>
        <div className={`absolute top-1/3 right-20 transition-colors duration-700 ${
          isDark ? 'text-cyan-400/10' : 'text-cyan-500/10'
        }`} style={{ animation: 'float2 10s ease-in-out infinite' }}>
          <Waves size={70} strokeWidth={1} />
        </div>
        <div className={`absolute bottom-1/4 left-1/4 transition-colors duration-700 ${
          isDark ? 'text-purple-400/10' : 'text-purple-500/10'
        }`} style={{ animation: 'float3 9s ease-in-out infinite' }}>
          <TrendingUp size={75} strokeWidth={1} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-500 hover:scale-105 ${
            isDark
              ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-400/25'
              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-lg hover:shadow-blue-500/25'
          }`}>
            <Cpu size={18} className="animate-pulse" />
            Our Technology Pipeline
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-8 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            How{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDark
                ? 'from-blue-400 via-cyan-400 to-purple-400'
                : 'from-blue-500 via-cyan-500 to-purple-500'
            }`}>
              WaveLab Works
            </span>
          </h2>

          <p className={`text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            From satellite data to your device in seconds. Our advanced system transforms raw oceanographic
            data into actionable marine intelligence through a seamless six-step process.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className={`hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${
            isDark ? 'bg-gradient-to-b from-blue-500/20 via-cyan-500/20 to-purple-500/20' : 'bg-gradient-to-b from-blue-500/30 via-cyan-500/30 to-purple-500/30'
          }`} />

          <div className="space-y-8 lg:space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${step.delay} both`
                }}
              >
                <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
                  
                  {/* Content Side */}
                  <div className="flex-1 w-full">
                    <div className={`group relative p-8 lg:p-10 rounded-3xl backdrop-blur-xl border transition-all duration-500 hover:scale-105 overflow-hidden ${
                      isDark
                        ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/70 hover:shadow-2xl'
                        : 'bg-white/80 border-white/50 hover:bg-white/95 hover:border-slate-200 hover:shadow-2xl'
                    }`}>
                      
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      </div>

                      <div className="relative">
                        {/* Step Number */}
                        <div className={`text-8xl font-black mb-4 opacity-10 absolute -top-4 ${index % 2 === 0 ? '-right-4' : '-left-4'} transition-all duration-300 group-hover:opacity-20 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {step.number}
                        </div>

                        {/* Icon & Title */}
                        <div className="flex items-start gap-4 mb-6 relative">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} p-3.5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${glowClasses[step.glowColor]} group-hover:shadow-2xl`}>
                            <step.icon className="w-full h-full text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-2xl lg:text-3xl font-bold mb-3 transition-colors duration-300 ${
                              isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
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
                              className={`flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                                isDark
                                  ? 'bg-slate-900/40 hover:bg-slate-900/60'
                                  : 'bg-slate-50/80 hover:bg-slate-100'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color} flex-shrink-0 transition-all duration-300 group-hover:scale-125`} />
                              <span className={`text-sm font-medium transition-all duration-300 group-hover:translate-x-1 ${
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

                  {/* Center Icon (Desktop Only) */}
                  <div className="hidden lg:flex relative w-20 h-20 flex-shrink-0">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} animate-pulse`} />
                    <div className={`absolute inset-1 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-slate-900' : 'bg-white'
                    }`}>
                      <step.icon className={`w-8 h-8 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} strokeWidth={2.5} />
                    </div>
                    
                    {/* Connection Arrow */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4">
                        <ArrowRight className={`w-6 h-6 rotate-90 animate-bounce ${
                          isDark ? 'text-blue-400/50' : 'text-blue-500/50'
                        }`} />
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

        {/* CTA Section */}
        {/* <div className={`mt-20 p-8 lg:p-12 rounded-3xl backdrop-blur-xl border text-center transition-all duration-500 hover:scale-105 ${
          isDark
            ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/30'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'
        }`}>
          <h3 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Ready to Experience the Future of Wave Forecasting?
          </h3>
          <p className={`text-lg mb-8 transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Join thousands of marine professionals who trust WaveLab for accurate wave predictions
          </p>
          <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/25">
            Get Started Now
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div> */}
      </div>

      {/* Animations */}
      <style jsx>{`
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

export default HowItWorksSection;