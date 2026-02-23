// ╔══════════════════════════════════════════════════════╗
// ║                    defaults.js                       ║
// ║  Default fallback values for all settings tabs       ║
// ╚══════════════════════════════════════════════════════╝

export const DEFAULT_GENERAL = {
  publicDashboardTitle: 'PAGASA Wave Intelligence Dashboard',
  publicDescription: 'Near-real-time marine conditions, forecasts, and advisories.',
  contactEmail: 'alerts@pagasa.gov.ph',
  defaultRegion: 'Pacific Area of Responsibility',
  maintenanceMode: false,
  maintenanceMessage: 'System is under scheduled maintenance. Please check back shortly.',
  logoPreview: '/pagasa-logo.png',
};

export const DEFAULT_ABOUT = {
  // Hero
  title: 'Seamless Prediction for Typhoon & Marine Weather',
  subtitle:
    'Part of the DOST MECO-TECO-VOTE III program, WaveLab establishes seamless prediction capability on typhoon, marine meteorology, and short-range climate prediction applications.',
  badgeText: 'About WaveLab',
  ctaPrimaryLabel: 'Connect with WaveLab',
  ctaPrimaryLink: '/contact',
  ctaSecondaryLabel: 'Explore Live Charts',
  ctaSecondaryLink: '/charts',

  // Stats
  stats: [
    { number: '36', label: 'Project Duration',    sublabel: 'Months (2024–2026)' },
    { number: '6',  label: 'Core Objectives',     sublabel: 'Research areas' },
    { number: '2',  label: 'Main Partners',        sublabel: 'DOST-PAGASA & CWA Taiwan' },
    { number: '3',  label: 'Project Components',   sublabel: 'Typhoon, Marine, Climate' },
  ],

  // Mission & Vision
  highlights: [
    { title: 'Mission', description: "To continue the research collaboration between DOST-PAGASA and Taiwan's Central Weather Administration to enhance prediction capabilities." },
    { title: 'Vision',  description: 'Leading to improved decision-making and risk reduction applications for climate-related disasters.' },
  ],

  // Program Objectives
  programObjectives: [
    { title: 'Upscale Typhoon Forecast Support',    description: 'Enhance typhoon forecast support systems for efficient operations.' },
    { title: 'Optimize Wave Prediction Services',   description: 'Improve the wave prediction operational system.' },
    { title: 'Dual Polarization Quality Control',   description: 'Develop dual polarization quality control techniques.' },
    { title: 'Quantitative Precipitation Estimates',description: 'Develop dual-polarization QPE and QPN for heavy rainfall monitoring.' },
    { title: 'Regional Data Assimilation',          description: 'Enhance the PAGASA Regional Data Assimilation and NWP System.' },
    { title: 'S2S Climate Applications',            description: 'Sub-seasonal to Seasonal applications for agriculture and water resources.' },
  ],

  // Focus Areas / Pillars
  pillars: [
    { title: 'Typhoon Forecasting', description: 'Advanced forecast support systems with improved reliability.' },
    { title: 'Marine Services',     description: 'Optimized wave prediction operational systems nationwide.' },
    { title: 'Radar Technology',    description: 'Dual polarization quality control and quantitative precipitation estimates.' },
    { title: 'Climate Prediction',  description: 'Sub-seasonal to seasonal applications for disaster risk reduction.' },
  ],

  // Timeline
  milestones: [
    { year: '2024',    title: 'Program Initiation',   description: 'MECO-TECO-VOTE III Component B officially launched.' },
    { year: '2024–25', title: 'System Development',   description: 'Development of display system and wave model programs.' },
    { year: '2025',    title: 'Implementation Phase', description: 'Integration of dual polarization radar and wave prediction systems.' },
    { year: '2026',    title: 'Program Completion',   description: 'Full deployment of seamless prediction capabilities.' },
  ],

  // Leadership
  leaders: [
    { name: 'Dr. Aira Mendez',    role: 'Coastal Systems Lead',        avatar: 'https://i.pravatar.cc/160?img=32' },
    { name: 'Engr. Luis Herrera', role: 'Forecast Operations Manager', avatar: 'https://i.pravatar.cc/160?img=14' },
    { name: 'Ma. Celeste Ramos',  role: 'Data Partnerships',           avatar: 'https://i.pravatar.cc/160?img=47' },
  ],

  // Partners
  partners: ['PAGASA', 'DOST', 'Taiwan CWA', 'PHIVOLCS', 'NDRRMC'],

  // Bottom CTA
  ctaTitle: 'Collaborate with PAGASA',
  ctaDescription: 'Partner with our meteorological research team on typhoon forecasting and climate prediction applications.',
  ctaButtonLabel: 'Contact the Team',
  ctaButtonLink: '/contact',
};