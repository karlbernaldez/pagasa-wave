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

export const DEFAULT_OPERATIONS = {
  packageOpenTime: '06:00',
  packageSubmissionDeadline: '10:00',
  packagePublishTarget: '12:00',
  noPublicationCutoff: '18:00',
  packageDurationHours: 24,
  deadlineWarningMinutes: 60,
  timezone: 'Asia/Manila',
  waveAnalysisDeadlineMinutes: 90,
  forecast24DeadlineMinutes: 120,
  forecast36DeadlineMinutes: 150,
  forecast48DeadlineMinutes: 180,
  archivePublishedAfterDays: 14,
  archiveNoPublicationAfterDays: 30,
  keepDraftProjectsDays: 7,
  noPublicationReasons: [
    'Model data unavailable',
    'Server or system outage',
    'No verified chart produced',
    'No forecaster available',
    'Force majeure / emergency operations',
    'Cancelled by admin',
    'Other',
  ],
};

export const DEFAULT_FORECASTER_WORKSPACE = {
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  deadlineApproachingMessage: 'Submission deadline is approaching. Finish the required charts and submit the package as soon as possible.',
  deadlinePassedMessage: 'The submission deadline has passed. Submit late if possible or coordinate with Admin before the no-publication cutoff.',
  publishTargetMissedMessage: 'The publish target has passed. Submit late if possible and coordinate with Admin so the daily record can be resolved.',
  noPublicationCutoffMessage: 'No-publication cutoff has been reached. Complete the package immediately or coordinate with Admin for an operational exception.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
  emptyPackageMessage: 'Create today\'s forecast package to generate the four required charts.',
  chartSequenceHelperMessage: 'Follow the production order: Wave Analysis, 24h, 36h, then 48h. Forecasters can co-edit; readiness waits until active editors release.',
};

export const DEFAULT_ADMIN_REVIEW = {
  reviewSlaHours: 2,
  publishSlaHours: 1,
  revisionGraceHours: 4,
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
    { number: '36', label: 'Project Duration', sublabel: 'Months (2024–2026)' },
    { number: '6', label: 'Core Objectives', sublabel: 'Research areas' },
    { number: '2', label: 'Main Partners', sublabel: 'DOST-PAGASA & CWA Taiwan' },
    { number: '3', label: 'Project Components', sublabel: 'Typhoon, Marine, Climate' },
  ],

  // Mission & Vision
  highlights: [
    { title: 'Mission', description: "To continue the research collaboration between DOST-PAGASA and Taiwan's Central Weather Administration to enhance prediction capabilities." },
    { title: 'Vision', description: 'Leading to improved decision-making and risk reduction applications for climate-related disasters.' },
  ],

  // Program Objectives
  programObjectives: [
    { title: 'Upscale Typhoon Forecast Support', description: 'Enhance typhoon forecast support systems for efficient operations.' },
    { title: 'Optimize Wave Prediction Services', description: 'Improve the wave prediction operational system.' },
    { title: 'Dual Polarization Quality Control', description: 'Develop dual polarization quality control techniques.' },
    { title: 'Quantitative Precipitation Estimates', description: 'Develop dual-polarization QPE and QPN for heavy rainfall monitoring.' },
    { title: 'Regional Data Assimilation', description: 'Enhance the PAGASA Regional Data Assimilation and NWP System.' },
    { title: 'S2S Climate Applications', description: 'Sub-seasonal to Seasonal applications for disaster risk reduction.' },
  ],

  // Focus Areas / Pillars
  pillars: [
    { title: 'Typhoon Forecasting', description: 'Advanced forecast support systems with improved reliability.' },
    { title: 'Marine Services', description: 'Optimized wave prediction operational systems nationwide.' },
    { title: 'Radar Technology', description: 'Dual polarization quality control and quantitative precipitation estimates.' },
    { title: 'Climate Prediction', description: 'Sub-seasonal to seasonal applications for disaster risk reduction.' },
  ],

  // Timeline
  milestones: [
    { year: '2024', title: 'Program Initiation', description: 'MECO-TECO-VOTE III Component B officially launched.' },
    { year: '2024–25', title: 'System Development', description: 'Development of display system and wave model programs.' },
    { year: '2025', title: 'Implementation Phase', description: 'Integration of dual polarization radar and wave prediction systems.' },
    { year: '2026', title: 'Program Completion', description: 'Full deployment of seamless prediction capabilities.' },
  ],

  // Leadership
  leaders: [
    { name: 'Dr. Aira Mendez', role: 'Coastal Systems Lead', avatar: 'https://i.pravatar.cc/160?img=32' },
    { name: 'Engr. Luis Herrera', role: 'Forecast Operations Manager', avatar: 'https://i.pravatar.cc/160?img=14' },
    { name: 'Ma. Celeste Ramos', role: 'Data Partnerships', avatar: 'https://i.pravatar.cc/160?img=47' },
  ],

  // Partners
  partners: [
    { name: 'PAGASA', logo: '/logos/pagasa.png' },
    { name: 'DOST', logo: '/logos/dost.png' },
    { name: 'Taiwan CWA', logo: '/logos/cwa.png' },
    { name: 'PHIVOLCS', logo: '/logos/phivolcs.png' },
    { name: 'NDRRMC', logo: '/logos/ndrrmc.png' },
  ],

  // Bottom CTA
  ctaTitle: 'Collaborate with PAGASA',
  ctaDescription: 'Partner with our meteorological research team on typhoon forecasting and climate prediction applications.',
  ctaButtonLabel: 'Contact the Team',
  ctaButtonLink: '/contact',
};

export const DEFAULT_CONTACT = {
  heroBadgeText: 'Get in Touch with WaveLab',
  heroTitlePrefix: "Let's Build a",
  heroTitleHighlight: 'Safer Coastline',
  heroTitleSuffix: 'Together',
  heroDescription:
    "WaveLab combines coastal intelligence, forecasting, and decision support. Share your needs with us and we'll route you to the right PAGASA team.",
  contactCards: [
    {
      title: 'Email the team',
      description: 'Get in touch with our analysts for tailored guidance.',
      value: 'support@wavelab.ph',
      icon: 'mail',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Call our hotline',
      description: 'We are available 24/7 for urgent coastal advisories.',
      value: '+63 (02) 8123-4567',
      icon: 'phone',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Visit WaveLab HQ',
      description: 'Science Garden Complex, Quezon City, PH',
      value: 'Mon-Fri · 8:00 AM - 6:00 PM',
      icon: 'map-pin',
      color: 'from-purple-500 to-violet-500',
    },
  ],
  assistanceItems: [
    {
      title: 'Data Partnerships',
      description: 'Collaborate on data-sharing initiatives for coastal monitoring.',
      icon: 'globe',
    },
    {
      title: 'Operational Support',
      description: '24/7 alert routing for LGUs, port authorities, and disaster teams.',
      icon: 'shield',
    },
    {
      title: 'Training & Workshops',
      description: 'Hands-on sessions for interpreting wave intelligence dashboards.',
      icon: 'users',
    },
  ],
  responseTargets: [
    { type: 'Critical incidents', time: 'Under 1 hour', icon: 'zap' },
    { type: 'Operational requests', time: 'Within 6 hours', icon: 'clock' },
    { type: 'General inquiries', time: '1-2 business days', icon: 'message-circle' },
  ],
};