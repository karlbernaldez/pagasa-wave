import React, { useState } from 'react';
import { Cloud, Zap, Shield, Smartphone, Globe, Bell, BarChart3, MapPin, Calendar, Thermometer, Wind, Eye, ArrowUpRight, Sun, Moon } from 'lucide-react';


const FeaturesSection = ({ isDark }) => {

  const features = [
    {
      icon: <Zap />,
      title: "Real-Time Updates",
      description: "Get instant weather updates with our advanced monitoring systems that track changes every minute.",
      variant: "from-blue-500 to-cyan-500",
      glowColor: "blue",
      items: [
        "Live weather data streams",
        "Minute-by-minute updates",
        "Smart push notifications",
        "Intelligent alert system"
      ]
    },
    {
      icon: <BarChart3 />,
      title: "Advanced Analytics",
      description: "Comprehensive weather analysis with AI-powered forecasting and detailed meteorological insights.",
      variant: "from-emerald-500 to-teal-500",
      glowColor: "emerald",
      items: [
        "15-day extended forecasts",
        "Historical weather patterns",
        "Climate trend analysis",
        "Predictive weather modeling"
      ]
    },
    {
      icon: <MapPin />,
      title: "Hyper-Local Precision",
      description: "Pinpoint accuracy for your exact location with neighborhood-level weather precision.",
      variant: "from-amber-500 to-orange-500",
      glowColor: "amber",
      items: [
        "GPS-powered location tracking",
        "Multiple saved locations",
        "Micro-climate analysis",
        "Hyperlocal weather alerts"
      ]
    },
    {
      icon: <Shield />,
      title: "Severe Weather Protection",
      description: "Advanced warning systems that keep you safe with early detection of dangerous conditions.",
      variant: "from-purple-500 to-violet-500",
      glowColor: "purple",
      items: [
        "Early storm detection",
        "Emergency alert system",
        "Safety recommendations",
        "Evacuation route guidance"
      ]
    },
    {
      icon: <Smartphone />,
      title: "Cross-Platform Experience",
      description: "Seamlessly access weather data across all your devices with our responsive design.",
      variant: "from-pink-500 to-rose-500",
      glowColor: "pink",
      items: [
        "Native mobile apps",
        "Progressive web app",
        "Smart watch integration",
        "Voice assistant support"
      ]
    },
    {
      icon: <Globe />,
      title: "Global Weather Network",
      description: "Comprehensive coverage powered by thousands of weather stations and satellite data worldwide.",
      variant: "from-indigo-500 to-blue-600",
      glowColor: "indigo",
      items: [
        "Worldwide coverage",
        "Satellite integration",
        "Doppler radar network",
        "Ocean buoy data"
      ]
    }
  ];

  const stats = [
    { number: "99.9%", label: "Forecast Accuracy", sublabel: "Verified daily" },
    { number: "24/7", label: "Live Monitoring", sublabel: "Never offline" },
    { number: "50M+", label: "Global Users", sublabel: "Trust our data" },
    { number: "10K+", label: "Data Sources", sublabel: "Worldwide network" }
  ];

  const glowClasses = {
    blue: "group-hover:shadow-blue-500/25",
    emerald: "group-hover:shadow-emerald-500/25",
    amber: "group-hover:shadow-amber-500/25",
    purple: "group-hover:shadow-purple-500/25",
    pink: "group-hover:shadow-pink-500/25",
    indigo: "group-hover:shadow-indigo-500/25"
  };

  return (
    <section className={`relative min-h-screen py-20 lg:py-28 overflow-hidden transition-all duration-700 ${isDark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className={`absolute inset-0 transition-all duration-700 ${isDark
            ? 'bg-[radial-gradient(circle_at_1px_1px,_theme(colors.blue.400)_1px,_transparent_0)]'
            : 'bg-[radial-gradient(circle_at_1px_1px,_theme(colors.blue.500)_1px,_transparent_0)]'
          } bg-[length:50px_50px]`}
          style={{
            animation: 'drift 25s ease-in-out infinite'
          }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 transition-colors duration-700 ${isDark ? 'text-blue-400/20' : 'text-blue-500/20'
          }`}
          style={{
            animation: 'float1 6s ease-in-out infinite'
          }}>
          <Cloud size={60} />
        </div>
        <div className={`absolute top-32 right-16 transition-colors duration-700 ${isDark ? 'text-cyan-400/20' : 'text-cyan-500/20'
          }`}
          style={{
            animation: 'float2 8s ease-in-out infinite'
          }}>
          <Thermometer size={50} />
        </div>
        <div className={`absolute bottom-40 left-20 transition-colors duration-700 ${isDark ? 'text-purple-400/20' : 'text-purple-500/20'
          }`}
          style={{
            animation: 'float3 7s ease-in-out infinite'
          }}>
          <Wind size={55} />
        </div>
        <div className={`absolute bottom-20 right-10 transition-colors duration-700 ${isDark ? 'text-pink-400/20' : 'text-pink-500/20'
          }`}
          style={{
            animation: 'float4 9s ease-in-out infinite'
          }}>
          <Eye size={45} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-500 hover:scale-105 ${isDark
              ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-400/25'
              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-lg hover:shadow-blue-500/25'
            }`}>
            <Zap size={18} className="animate-pulse" />
            Advanced Weather Intelligence
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-8 transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'
            }`}>
            Next-Generation{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${isDark
                ? 'from-blue-400 via-cyan-400 to-purple-400'
                : 'from-blue-500 via-cyan-500 to-purple-500'
              }`}>
              Weather Platform
            </span>
          </h2>

          <p className={`text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto transition-colors duration-700 ${isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Experience revolutionary weather forecasting powered by AI, real-time satellite data,
            and the world's most advanced meteorological network. Built for accuracy, designed for everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative p-8 lg:p-10 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer backdrop-blur-sm border overflow-hidden ${isDark
                  ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-900/20'
                  : 'bg-white/70 border-white/50 hover:bg-white/90 hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-900/10'
                }`}
              style={{
                animationDelay: `${index * 150}ms`
              }}
            >

              {/* Animated Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.variant} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>

              {/* Icon */}
              <div className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${feature.variant} p-4 lg:p-5 mb-6 lg:mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${glowClasses[feature.glowColor]} group-hover:shadow-2xl`}>
                <div className="w-full h-full text-white flex items-center justify-center">
                  {React.cloneElement(feature.icon, { size: window.innerWidth < 1024 ? 28 : 32 })}
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className={`text-xl lg:text-2xl font-bold mb-4 transition-colors duration-300 ${isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                  {feature.title}
                </h3>

                <p className={`text-base lg:text-lg leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                  {feature.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {feature.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`flex items-center gap-3 text-sm lg:text-base transition-all duration-300 ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-600'
                        }`}
                      style={{ animationDelay: `${(itemIndex + 1) * 100}ms` }}
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.variant} flex-shrink-0 transition-all duration-300 group-hover:scale-125`} />
                      <span className="transition-all duration-300 group-hover:translate-x-1">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className={`relative p-8 lg:p-12 rounded-3xl backdrop-blur-sm border ${isDark
            ? 'bg-slate-800/30 border-slate-700/30'
            : 'bg-white/50 border-white/30'
          }`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group transition-all duration-500 hover:scale-110 p-6 rounded-2xl ${isDark
                    ? 'hover:bg-slate-700/30'
                    : 'hover:bg-white/70'
                  }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                  {stat.number}
                </div>
                <div className={`text-lg lg:text-xl font-bold mb-2 transition-colors duration-300 ${isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                  {stat.label}
                </div>
                <div className={`text-sm lg:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(1deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;