import React, { useState, useEffect } from 'react';
import { X, ZoomIn, TrendingUp, Activity, Wind, Eye, Gauge, Maximize2 } from 'lucide-react';

const ForecastChartsPage = ({ isDarkMode, activeChartType }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [currentDisplayType, setCurrentDisplayType] = useState(activeChartType);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isDark = isDarkMode;

  const chartTypes = [
    { id: 'wave-wind', name: 'Wave & Wind', icon: Wind, description: 'Combined wave and wind analysis' },
    { id: 'wave-only', name: 'Wave Only', icon: Activity, description: 'Pure wave height analysis' },
    { id: 'visually-impaired', name: 'Accessible', icon: Eye, description: 'High contrast charts for accessibility' }
  ];

  useEffect(() => {
    const activeChart = chartTypes.find(chart => chart.id === activeChartType);
    const chartName = activeChart ? activeChart.name : activeChartType;

    document.title = `WaveLab - Charts: ${chartName}`;
    console.log("Active Chart Type:", activeChartType, "Name:", chartName);
  }, [activeChartType, chartTypes]);

  // 🔹 Handle chart type transitions
  useEffect(() => {
    if (activeChartType !== currentDisplayType) {
      setIsTransitioning(true);
      // Start fade out
      setTimeout(() => {
        setCurrentDisplayType(activeChartType);
        // Start fade in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 150);
      }, 150);
    }
  }, [activeChartType, currentDisplayType]);

  const chartMeta = {
    1: {
      title: 'Current Analysis',
      subtitle: 'Real-time conditions',
      icon: Activity,
      gradient: 'from-cyan-500 to-blue-600',
      glowColor: 'cyan-500'
    },
    2: {
      title: '24h Forecast',
      subtitle: 'Next day predictions',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      glowColor: 'emerald-500'
    },
    3: {
      title: '36h Extended',
      subtitle: 'Extended range model',
      icon: Wind,
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'amber-500'
    },
    4: {
      title: '48h Long-Range',
      subtitle: 'Long-term analysis',
      icon: Gauge,
      gradient: 'from-purple-500 to-violet-600',
      glowColor: 'purple-500'
    }
  };

  const chartData = [
    {
      id: 1,
      labels: [
        { name: 'Height', value: '2.1m', color: 'bg-cyan-500' },
        { name: 'Period', value: '8.5s', color: 'bg-blue-500' },
        { name: 'Direction', value: 'SW', color: 'bg-emerald-500' },
        { name: 'Energy', value: 'High', color: 'bg-amber-500' }
      ]
    },
    {
      id: 2,
      labels: [
        { name: 'Max', value: '2.8m', color: 'bg-emerald-500' },
        { name: 'Min', value: '1.5m', color: 'bg-blue-500' },
        { name: 'Period', value: '7.2s', color: 'bg-cyan-500' },
        { name: 'Dir', value: 'WSW', color: 'bg-amber-500' }
      ]
    },
    {
      id: 3,
      labels: [
        { name: 'Max', value: '3.2m', color: 'bg-amber-500' },
        { name: 'Min', value: '1.8m', color: 'bg-blue-500' },
        { name: 'Period', value: '9.1s', color: 'bg-cyan-500' },
        { name: 'Dir', value: 'W', color: 'bg-emerald-500' }
      ]
    },
    {
      id: 4,
      labels: [
        { name: 'Max', value: '3.5m', color: 'bg-purple-500' },
        { name: 'Min', value: '2.0m', color: 'bg-blue-500' },
        { name: 'Period', value: '10.3s', color: 'bg-cyan-500' },
        { name: 'Dir', value: 'WNW', color: 'bg-red-500' }
      ]
    }
  ];

  const legendData = [
    {
      title: 'Wave Height',
      icon: Activity,
      color: 'text-cyan-400',
      items: [
        { color: 'bg-red-500', text: '>4m Very High' },
        { color: 'bg-orange-500', text: '3-4m High' },
        { color: 'bg-amber-500', text: '2-3m Moderate' },
        { color: 'bg-emerald-500', text: '1-2m Low' },
        { color: 'bg-blue-500', text: '<1m Calm' }
      ]
    },
    {
      title: 'Wind Speed',
      icon: Wind,
      color: 'text-blue-400',
      items: [
        { color: 'bg-red-500', text: '>50km/h Strong' },
        { color: 'bg-amber-500', text: '25-50km/h Moderate' },
        { color: 'bg-emerald-500', text: '10-25km/h Light' },
        { color: 'bg-blue-500', text: '<10km/h Calm' }
      ]
    },
    {
      title: 'Wave Period',
      icon: TrendingUp,
      color: 'text-emerald-400',
      items: [
        { color: 'bg-purple-500', text: '>15s Long Swell' },
        { color: 'bg-blue-500', text: '10-15s Medium' },
        { color: 'bg-cyan-500', text: '5-10s Wind Waves' },
        { color: 'bg-gray-500', text: '<5s Choppy' }
      ]
    },
    {
      title: 'Direction',
      icon: Gauge,
      color: 'text-purple-400',
      items: [
        { color: 'bg-red-500', text: 'N North' },
        { color: 'bg-orange-500', text: 'E East' },
        { color: 'bg-blue-500', text: 'S South' },
        { color: 'bg-emerald-500', text: 'W West' }
      ]
    }
  ];

  // Generate different images based on chart type
  const getImagesForChartType = (type) => {
    // Sample stock/chart-like images from Unsplash (royalty-free)
    const waveWindImages = [
      "/charts/wave-wind/WaveXWind.png",
      "/charts/wave-wind/WaveXWind.png",
      "/charts/wave-wind/WaveXWind.png",
      "/charts/wave-wind/WaveXWind.png"
    ];

    const waveOnlyImages = [
      "/charts/wave/Wave.png",
      "/charts/wave/Wave.png",
      "/charts/wave/Wave.png",
      "/charts/wave/Wave.png"
    ];

    const accessibleImages = [
      "/charts/wind-barbs/barbs.png",
      "/charts/wind-barbs/barbs.png",
      "/charts/wind-barbs/barbs.png",
      "/charts/wind-barbs/barbs.png"
    ];

    switch (type) {
      case "wave-wind":
        return waveWindImages;
      case "wave-only":
        return waveOnlyImages;
      case "visually-impaired":
        return accessibleImages;
      default:
        return waveWindImages;
    }
  };

  const selectedImages = getImagesForChartType(currentDisplayType);
  const currentChartType = chartTypes.find(type => type.id === currentDisplayType) || chartTypes[0];

  const handleImageClick = (image, title) => {
    setPreviewImage({ src: image, title });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <div className={`min-h-screen transition-all duration-700 ${isDark
        ? 'bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950'
        : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'
        }`}>

        {/* Main Content */}
        <div className="pt-4 pb-16 mt-24">
          <div className="max-w-7.3xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Responsive Layout */}
            <div className="flex flex-col xl:flex-row gap-6">

              {/* Charts Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {chartData.map((chart, index) => {
                    const meta = chartMeta[chart.id];
                    const image = selectedImages[index];

                    return (
                      <div
                        key={chart.id}
                        className={`group relative rounded-2xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] overflow-hidden ${isDark
                          ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60"
                          : "bg-white/60 border-white/50 hover:bg-white/80"
                          } min-h-[420px]`}
                      >

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} p-2 shadow-md transition-transform duration-300 group-hover:scale-110`}>
                              <meta.icon className="w-full h-full text-white" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {meta.title}
                              </h3>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {meta.subtitle}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleImageClick(image, meta.title)}
                            className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                              }`}
                          >
                            <Maximize2 size={16} />
                          </button>
                        </div>

                        {/* Chart Image */}
                        <div
                          className={`relative mx-4 mb-4 h-40 sm:h-44 lg:h-48 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isDark
                            ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/50'
                            : 'bg-gradient-to-br from-slate-50 to-slate-100'
                            }`}
                          onClick={() => handleImageClick(image, meta.title)}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={`${meta.title} - ${currentChartType.name}`}
                              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                              style={{
                                filter: isTransitioning ? 'blur(2px) brightness(0.7)' : 'blur(0px) brightness(1)',
                                transition: 'all 0.3s ease'
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className={`transition-all duration-500 ${isTransitioning ? 'scale-75 opacity-50' : 'scale-100 opacity-100'}`}>
                                <currentChartType.icon className={`w-10 h-10 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                <span className={`text-sm font-medium text-center px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {currentChartType.description}
                                </span>
                                <div className="mt-3 text-xs text-center opacity-75">
                                  Chart Type: {currentChartType.name}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white bg-black/50 px-3 py-2 rounded-full text-sm">
                              <ZoomIn size={14} />
                              Click to enlarge
                            </div>
                          </div>
                        </div>

                        {/* Data Labels */}
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-2 gap-2">
                            {chart.labels.map((label, labelIndex) => (
                              <div
                                key={labelIndex}
                                className={`flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 ${isDark ? 'bg-slate-900/30 hover:bg-slate-900/50' : 'bg-slate-50 hover:bg-slate-100'
                                  }`}
                              >
                                <div className={`w-3 h-3 rounded-full ${label.color} shadow-sm`} />
                                <span className={`text-xs font-medium flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {label.name}
                                </span>
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {label.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend Sidebar */}
              <div className={`xl:w-80 rounded-2xl backdrop-blur-xl border ${isDark
                ? 'bg-slate-800/40 border-slate-700/50'
                : 'bg-white/60 border-white/50'
                }`}>

                <div className="p-4 border-b border-white/10">
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Reference Guide
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Chart symbols & color meanings
                  </p>
                </div>

                <div className="p-4 space-y-4 max-h-96 xl:max-h-none overflow-y-auto">
                  {legendData.map((category, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-slate-900/30 hover:bg-slate-900/50' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/10">
                        <category.icon className={`w-5 h-5 ${category.color}`} />
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {category.title}
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-3 group">
                            <div className={`w-3 h-3 rounded ${item.color} shadow-sm transition-transform duration-200 group-hover:scale-110`} />
                            <span className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                              }`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Click outside handler removed since dropdown is handled by header */}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-6xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 bg-slate-50 border-b">
              <h3 className="text-xl font-bold text-slate-900">
                {previewImage.title}
              </h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors duration-200"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>
            <div className="relative">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForecastChartsPage;