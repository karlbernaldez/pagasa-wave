import React, { useState } from 'react';
import { Building2, Globe2, GraduationCap, Landmark, Award, Users, MapPin, Handshake, ExternalLink, CheckCircle2 } from 'lucide-react';

const PartnersCollaborationSection = ({ isDark }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Partners', icon: Users },
    { id: 'government', label: 'Government', icon: Landmark },
    { id: 'international', label: 'International', icon: Globe2 },
    { id: 'academic', label: 'Academic', icon: GraduationCap }
  ];

  const partners = [
    {
      category: 'government',
      name: 'Department of Science and Technology',
      acronym: 'DOST',
      role: 'Primary Implementing Agency',
      description: 'Lead agency for science and technology research, development and innovation in the Philippines.',
      collaboration: ['Project funding', 'Technical oversight', 'Research coordination'],
      logo: '🔬',
      color: 'from-blue-500 to-cyan-500',
      featured: true
    },
    {
      category: 'government',
      name: 'Philippine Atmospheric, Geophysical and Astronomical Services Administration',
      acronym: 'PAGASA',
      role: 'Weather & Climate Data Provider',
      description: 'Official source of weather forecasts, typhoon warnings, and climate monitoring for the Philippines.',
      collaboration: ['Real-time weather data', 'Doppler radar access', 'Joint research initiatives'],
      logo: '🌤️',
      color: 'from-emerald-500 to-teal-500',
      featured: true
    },
    {
      category: 'government',
      name: 'Philippine Institute of Volcanology and Seismology',
      acronym: 'PHIVOLCS',
      role: 'Seismic & Tsunami Monitoring',
      description: 'Monitors earthquake and tsunami activities, providing early warning systems for coastal communities.',
      collaboration: ['Coastal monitoring stations', 'Tsunami detection', 'Seismic sea wave data'],
      logo: '🌊',
      color: 'from-purple-500 to-violet-500',
      featured: true
    },
    {
      category: 'government',
      name: 'Philippine Coast Guard',
      acronym: 'PCG',
      role: 'Maritime Safety Partner',
      description: 'Ensures maritime safety and security in Philippine waters with operational support.',
      collaboration: ['Maritime safety protocols', 'Emergency response', 'Data validation'],
      logo: '⚓',
      color: 'from-indigo-500 to-blue-500',
      featured: false
    },
    {
      category: 'international',
      name: 'National Oceanic and Atmospheric Administration',
      acronym: 'NOAA',
      role: 'Satellite Data Provider',
      description: 'US agency providing satellite imagery and oceanographic data for global weather monitoring.',
      collaboration: ['GOES satellite data', 'Ocean observation systems', 'Technical training'],
      logo: '🛰️',
      color: 'from-blue-500 to-indigo-500',
      featured: true
    },
    {
      category: 'international',
      name: 'European Space Agency',
      acronym: 'ESA',
      role: 'Earth Observation Partner',
      description: 'Provides Sentinel satellite data for comprehensive ocean and atmospheric monitoring.',
      collaboration: ['Sentinel missions', 'Remote sensing data', 'Research cooperation'],
      logo: '🌍',
      color: 'from-cyan-500 to-blue-500',
      featured: false
    },
    {
      category: 'academic',
      name: 'University of the Philippines Marine Science Institute',
      acronym: 'UP MSI',
      role: 'Research & Development',
      description: 'Premier marine science research institution conducting oceanographic studies.',
      collaboration: ['Marine research', 'Data validation', 'Student programs'],
      logo: '🔬',
      color: 'from-amber-500 to-orange-500',
      featured: true
    },
    {
      category: 'academic',
      name: 'National Mapping and Resource Information Authority',
      acronym: 'NAMRIA',
      role: 'Geospatial Data Partner',
      description: 'Central mapping agency providing hydrographic and topographic data.',
      collaboration: ['Coastal mapping', 'Bathymetric data', 'GIS integration'],
      logo: '🗺️',
      color: 'from-teal-500 to-cyan-500',
      featured: false
    }
  ];

  const projectInfo = {
    title: 'DOST-MECO-TECO-VOTE III',
    subtitle: 'Component B: Marine & Coastal Forecasting System',
    duration: '2024 - 2026',
    funding: 'Department of Science and Technology',
    objectives: [
      'Develop advanced wave prediction systems for Philippine waters',
      'Enhance maritime safety through real-time data dissemination',
      'Support coastal communities with accurate marine forecasts'
    ]
  };

  const stats = [
    { number: '15+', label: 'Partner Agencies', sublabel: 'Government & International' },
    { number: '150+', label: 'Coastal LGUs', sublabel: 'Using our platform' },
    { number: '50+', label: 'Data Sources', sublabel: 'Integrated systems' },
    { number: '24/7', label: 'Collaboration', sublabel: 'Real-time coordination' }
  ];

  const filteredPartners = activeCategory === 'all' 
    ? partners 
    : partners.filter(p => p.category === activeCategory);

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
            ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
            : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
        } bg-[length:30px_30px]`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
            isDark
              ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
              : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
          }`}>
            <Handshake size={18} className="animate-pulse" />
            Building a Stronger Network Together
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Our{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDark
                ? 'from-blue-400 via-cyan-400 to-emerald-400'
                : 'from-blue-600 via-cyan-600 to-emerald-600'
            }`}>
              Partners & Collaborators
            </span>
          </h2>

          <p className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            WaveLab is powered by a collaborative network of government agencies, international organizations, 
            and academic institutions working together for maritime safety.
          </p>
        </div>

        {/* Project Information Banner */}
        <div className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border mb-16 lg:mb-20 ${
          isDark
            ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-blue-700/30'
            : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border-blue-200/50'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <Award size={14} />
                Government-Funded Project
              </div>
              <h3 className={`text-2xl lg:text-3xl font-black mb-2 tracking-tight transition-colors duration-700 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {projectInfo.title}
              </h3>
              <p className={`text-lg mb-4 transition-colors duration-700 ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {projectInfo.subtitle}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Duration: </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{projectInfo.duration}</span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Funding: </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{projectInfo.funding}</span>
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-slate-800/50' : 'bg-white/70'
            }`}>
              <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Key Objectives
              </h4>
              <ul className="space-y-2">
                {projectInfo.objectives.map((obj, index) => (
                  <li key={index} className={`flex items-start gap-2 text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                  : isDark
                    ? 'bg-slate-900/50 text-slate-300 hover:bg-slate-900 border border-slate-800'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
              }`}
            >
              <category.icon size={18} />
              {category.label}
            </button>
          ))}
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-20">
          {filteredPartners.map((partner, index) => (
            <div
              key={index}
              className="group"
              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
            >
              <div className={`relative h-full p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                partner.featured
                  ? isDark
                    ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                  : isDark
                    ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-xl'
                    : 'bg-white/70 border-slate-200 hover:bg-white/90 hover:border-slate-300 hover:shadow-xl'
              }`}>
                
                {/* Featured Badge */}
                {partner.featured && (
                  <div className="absolute top-6 right-6">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                        : 'bg-amber-100 text-amber-700 border border-amber-300'
                    }`}>
                      Key Partner
                    </div>
                  </div>
                )}

                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${partner.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative">
                  {/* Logo & Header */}
                  <div className="flex items-start gap-5 mb-6">
                    <div className={`text-5xl w-18 h-18 flex items-center justify-center rounded-xl bg-gradient-to-br ${partner.color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 p-3`}>
                      {partner.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold mb-1 ${
                        isDark ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        {partner.acronym}
                      </div>
                      <h3 className={`text-xl lg:text-2xl font-bold mb-2 leading-tight transition-colors duration-300 ${
                        isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                      }`}>
                        {partner.name}
                      </h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        isDark
                          ? 'bg-slate-800/70 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {partner.role}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-base leading-relaxed mb-6 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {partner.description}
                  </p>

                  {/* Collaboration Areas */}
                  <div>
                    <h4 className={`text-sm font-bold mb-3 ${
                      isDark ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      Areas of Collaboration
                    </h4>
                    <div className="space-y-2">
                      {partner.collaboration.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                            isDark
                              ? 'bg-slate-800/40 hover:bg-slate-800/60'
                              : 'bg-slate-50/80 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${partner.color} flex-shrink-0`} />
                          <span className={`text-sm font-medium ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border mb-16 ${
          isDark
            ? 'bg-slate-900/30 border-slate-800'
            : 'bg-white/50 border-slate-200'
        }`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group transition-all duration-500 hover:scale-110 p-6 rounded-xl ${
                  isDark ? 'hover:bg-slate-800/30' : 'hover:bg-white/70'
                }`}
              >
                <div className={`text-4xl lg:text-5xl font-black mb-2 bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110`}>
                  {stat.number}
                </div>
                <div className={`text-lg font-bold mb-1 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {stat.label}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border text-center transition-all duration-300 hover:scale-[1.01] ${
          isDark
            ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-blue-700/30'
            : 'bg-gradient-to-br from-blue-50/80 to-purple-50/60 border-blue-200/50'
        }`}>
          <Building2 className={`w-16 h-16 mx-auto mb-6 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <h3 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Interested in Partnering with Us?
          </h3>
          <p className={`text-lg mb-8 max-w-2xl mx-auto transition-colors duration-700 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            We welcome collaboration opportunities with organizations committed to maritime safety and climate resilience.
          </p>
          <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/25">
            Contact Partnership Office
            <ExternalLink size={20} className="group-hover:translate-x-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>

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
      `}</style>
    </section>
  );
};

export default PartnersCollaborationSection;