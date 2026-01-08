import React, { useState } from 'react';
import { ArrowRight, Waves, Navigation, Wind, TrendingUp, MapPin, Eye, Anchor, Ship, BarChart3, Compass } from 'lucide-react';

const WaveHeroSection = ({ isDark }) => {

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-700 ${isDark
      ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950'
      : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'
      }`}>

      {/* Animated Wave Background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={isDark ? 'stop-blue-400' : 'stop-blue-500'} />
              <stop offset="100%" className={isDark ? 'stop-cyan-400' : 'stop-cyan-500'} />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={isDark ? 'stop-purple-400' : 'stop-purple-500'} />
              <stop offset="100%" className={isDark ? 'stop-blue-400' : 'stop-blue-500'} />
            </linearGradient>
          </defs>
          <path
            d="M0,200 Q300,150 600,180 T1200,160 L1200,600 L0,600 Z"
            fill="url(#wave1)"
            className="animate-pulse"
            style={{ animation: 'wave1 8s ease-in-out infinite' }}
          />
          <path
            d="M0,250 Q200,200 400,220 T800,200 T1200,190 L1200,600 L0,600 Z"
            fill="url(#wave2)"
            style={{ animation: 'wave2 10s ease-in-out infinite reverse' }}
          />
        </svg>
      </div>

      {/* Particle Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-cyan-400/30' : 'bg-blue-400/30'
              }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-20 transition-colors duration-700 ${isDark ? 'text-blue-400/30' : 'text-blue-500/30'
          }`} style={{ animation: 'float1 8s ease-in-out infinite' }}>
          <Anchor size={60} strokeWidth={1.5} />
        </div>

        <div className={`absolute top-40 right-24 transition-colors duration-700 ${isDark ? 'text-cyan-400/30' : 'text-cyan-500/30'
          }`} style={{ animation: 'float2 10s ease-in-out infinite' }}>
          <Ship size={70} strokeWidth={1.5} />
        </div>

        <div className={`absolute bottom-40 left-32 transition-colors duration-700 ${isDark ? 'text-purple-400/30' : 'text-purple-500/30'
          }`} style={{ animation: 'float3 9s ease-in-out infinite' }}>
          <Navigation size={50} strokeWidth={1.5} />
        </div>

        <div className={`absolute bottom-32 right-20 transition-colors duration-700 ${isDark ? 'text-indigo-400/30' : 'text-indigo-500/30'
          }`} style={{ animation: 'float4 11s ease-in-out infinite' }}>
          <Compass size={65} strokeWidth={1.5} />
        </div>

        <div className={`absolute top-1/2 left-1/4 transition-colors duration-700 ${isDark ? 'text-teal-400/20' : 'text-teal-500/20'
          }`} style={{ animation: 'float5 12s ease-in-out infinite' }}>
          <Wind size={55} strokeWidth={1.5} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-sm transition-all duration-500 hover:scale-105 ${isDark
              ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-400/25'
              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-lg hover:shadow-blue-500/25'
              }`}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live Wave Data
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                }`}>
                Accurate{' '}
                <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${isDark
                  ? 'from-blue-400 via-cyan-400 to-purple-400'
                  : 'from-blue-500 via-cyan-500 to-purple-500'
                  }`}>
                  Wave Charts
                </span>{' '}
                & Forecasting
              </h1>

              <p className={`text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-2xl transition-colors duration-700 ${isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                Professional wave height analysis, detailed marine forecasting charts,
                and comprehensive oceanographic data for coastal planning and marine activities.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
                View Wave Charts
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <button className={`group flex items-center justify-center gap-3 font-semibold px-8 py-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-slate-500'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                }`}>
                <BarChart3 size={20} />
                View Analytics
              </button>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-3 gap-8 pt-8 border-t transition-colors duration-700 ${isDark ? 'border-slate-700/50' : 'border-slate-200'
              }`}>
              <div className="text-center lg:text-left">
                <div className={`text-3xl sm:text-4xl font-black transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                  24/7
                </div>
                <div className={`text-sm font-medium transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                  Wave Monitoring
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className={`text-3xl sm:text-4xl font-black transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                  99%+
                </div>
                <div className={`text-sm font-medium transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                  Chart Accuracy
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className={`text-3xl sm:text-4xl font-black transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                  500+
                </div>
                <div className={`text-sm font-medium transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                  Coastal Locations
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Wave Forecast Card */}
          <div className="flex justify-center lg:justify-end">
            <div className={`group relative w-full max-w-md p-8 rounded-3xl backdrop-blur-xl border transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${isDark
              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-900/50'
              : 'bg-white/70 border-white/50 hover:bg-white/90 hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-900/10'
              }`}>

              {/* Card Header */}
              <div className="text-center mb-6">
                <div className={`flex items-center justify-center gap-2 mb-2 transition-colors duration-700 ${isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  <MapPin size={18} />
                  <span className="font-semibold">Manila Bay, Philippines</span>
                </div>
                <div className={`text-sm transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  Wave Forecast • {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>

              {/* Wave Height Display */}
              <div className="text-center mb-8">
                <div className="relative">
                  <div className={`text-6xl font-black mb-2 transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    2.8m
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Waves className={`w-12 h-12 transition-colors duration-700 ${isDark ? 'text-blue-400' : 'text-blue-500'
                      }`} style={{ animation: 'bounce 2s infinite' }} />
                  </div>
                </div>
                <div className={`text-lg font-medium transition-colors duration-700 ${isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                  Moderate Wave Conditions
                </div>
              </div>

              {/* Wave Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`text-center p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700/70' : 'bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${isDark ? 'text-emerald-400' : 'text-emerald-500'
                    }`} />
                  <div className={`text-sm font-semibold transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    Period
                  </div>
                  <div className={`text-xs transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    12-14 sec
                  </div>
                </div>

                <div className={`text-center p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700/70' : 'bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <Compass className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${isDark ? 'text-purple-400' : 'text-purple-500'
                    }`} />
                  <div className={`text-sm font-semibold transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    Direction
                  </div>
                  <div className={`text-xs transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    SW 225°
                  </div>
                </div>

                <div className={`text-center p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700/70' : 'bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <Wind className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${isDark ? 'text-cyan-400' : 'text-cyan-500'
                    }`} />
                  <div className={`text-sm font-semibold transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    Wind
                  </div>
                  <div className={`text-xs transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    8-12 kts
                  </div>
                </div>

                <div className={`text-center p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700/70' : 'bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <Eye className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${isDark ? 'text-amber-400' : 'text-amber-500'
                    }`} />
                  <div className={`text-sm font-semibold transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    Visibility
                  </div>
                  <div className={`text-xs transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    10+ km
                  </div>
                </div>
              </div>

              {/* Quick Chart Preview */}
              <div className={`p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    7-Day Wave Height Chart
                  </span>
                  <BarChart3 className={`w-4 h-4 transition-colors duration-700 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                </div>

                {/* Mini Wave Chart */}
                <div className="flex items-end justify-between h-16 gap-1">
                  {[2.1, 2.8, 3.2, 2.9, 2.3, 2.6, 3.1, 3.4].map((height, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all duration-500 hover:opacity-80 ${isDark ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-gradient-to-t from-blue-500 to-cyan-500'
                        }`}
                      style={{
                        height: `${(height / 4) * 100}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-between mt-2 text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Today</span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>7 Days</span>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

              {/* Glow Effect on Hover */}
              <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isDark ? 'shadow-2xl shadow-blue-500/20' : 'shadow-2xl shadow-blue-500/10'
                }`} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wave1 {
          0%, 100% { d: path('M0,200 Q300,150 600,180 T1200,160 L1200,600 L0,600 Z'); }
          50% { d: path('M0,180 Q300,130 600,160 T1200,140 L1200,600 L0,600 Z'); }
        }
        
        @keyframes wave2 {
          0%, 100% { d: path('M0,250 Q200,200 400,220 T800,200 T1200,190 L1200,600 L0,600 Z'); }
          50% { d: path('M0,230 Q200,180 400,200 T800,180 T1200,170 L1200,600 L0,600 Z'); }
        }
        
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(7deg); }
        }
        
        @keyframes float4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-5deg); }
        }
      `}</style>
    </section>
  );
};

export default WaveHeroSection;