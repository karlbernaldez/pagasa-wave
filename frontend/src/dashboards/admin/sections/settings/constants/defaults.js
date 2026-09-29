// ╔══════════════════════════════════════════════════════╗
// ║                    defaults.js                       ║
// ║  Default fallback values for all settings tabs       ║
// ╚══════════════════════════════════════════════════════╝

import { DEFAULT_STUDIO_MAP_VIEW } from '@/config/mapViewDefaults';

export const DEFAULT_GENERAL = {
  logoPreview: '/pagasa-logo.png',
  showPublicStaffInfo: true,
  publicChartPdfNote:
    'This chart set is supplementary guidance for marine weather awareness and should be used together with official DOST-PAGASA bulletins, warnings, and advisories.',
  mapBoundsPreset: 'tcad',
  mapBoundsCustomName: '',
  mapBoundsCustom: {
    westLng: 93,
    southLat: 0,
    eastLng: 153.8595159535438,
    northLat: 25,
  },
  selectedCustomMapBoundsId: '',
  savedCustomMapBounds: [],
  publishedDomainBoundary: {
    enabled: false,
    name: 'Published chart domain',
    showLine: true,
    showFill: false,
    clipAnnotations: false,
    lineColor: '#0f172a',
    lineWidth: 2,
    lineOpacity: 0.9,
    fillColor: '#38bdf8',
    fillOpacity: 0.08,
    geojson: {
      type: 'FeatureCollection',
      features: [],
    },
  },
};

export const DEFAULT_MAP_VIEW = {
  center: { ...DEFAULT_STUDIO_MAP_VIEW.center },
  zoom: { ...DEFAULT_STUDIO_MAP_VIEW.zoom },
  maxBounds: { ...DEFAULT_STUDIO_MAP_VIEW.maxBounds },
  fitBounds: { ...DEFAULT_STUDIO_MAP_VIEW.fitBounds },
  padding: { ...DEFAULT_STUDIO_MAP_VIEW.padding },
  fitBoundsMaxZoom: DEFAULT_STUDIO_MAP_VIEW.fitBoundsMaxZoom,
};

export const DEFAULT_OPERATIONS = {
  packageSubmissionDeadline: '10:00',
  packagePublishTarget: '12:00',
  noPublicationCutoff: '18:00',
  deadlineWarningMinutes: 60,
  timezone: 'Asia/Manila',
  packageNameTemplate: 'Marine Forecast {date}',
  analysisChartNameTemplate: '{package} - Wave Analysis',
  forecast24ChartNameTemplate: '{package} - 24h Wave Forecast',
  forecast36ChartNameTemplate: '{package} - 36h Wave Forecast',
  forecast48ChartNameTemplate: '{package} - 48h Wave Forecast',
  autoArchivePublishedEnabled: false,
  archivePublishedAfterDays: 30,
  autoArchiveNoPublicationEnabled: false,
  archiveNoPublicationAfterDays: 30,
  autoArchiveAbandonedDraftsEnabled: false,
  archiveDraftsAfterDays: 30,
  retainArchivedRecordsIndefinitely: true,
  preserveReviewEvidence: true,
};

export const DEFAULT_FORECASTER_WORKSPACE = {
  workspaceWelcomeTitle: 'Daily Forecast Package',
  workspaceWelcomeDescription: 'Prepare the required wave charts, coordinate with active editors, and submit the package for admin review.',
  collaborationPresenceMessage: 'Another forecaster is editing this chart. Coordinate before overwriting shared work.',
  qaChecklistReminder: 'Before submitting, verify chart time labels, layer visibility, annotations, and package metadata.',
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  deadlineApproachingMessage: 'Submission deadline is approaching. Finish the required charts and submit the package as soon as possible.',
  deadlinePassedMessage: 'The submission deadline has passed. Submit late if possible or coordinate with Admin before the no-publication cutoff.',
  publishTargetMissedMessage: 'The publish target has passed. Submit late if possible and coordinate with Admin so the daily record can be resolved.',
  noPublicationCutoffMessage: 'No-publication cutoff has been reached. Complete the package immediately or coordinate with Admin for an operational exception.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
  emptyPackageMessage: 'Create today\'s forecast package to generate the four required charts.',
  chartSequenceHelperMessage: 'Follow the production order: Wave Analysis, 24h, 36h, then 48h. Forecasters can co-edit; readiness waits until active editors release.',
  drawingPointerOffsetX: 0,
  drawingPointerOffsetY: 0,
  drawingSmoothingPercent: 50,
  drawingPostProcessEnabled: false,
  drawingPostProcessSmoothingPercent: 50,
};

export const DEFAULT_ABOUT = {
  title: 'About WaveLab',
  subtitle:
    'WaveLab helps DOST-PAGASA teams prepare, review, and publish wave forecast charts through a clear operational workflow and public chart archive.',
  ctaPrimaryLabel: 'Contact Team',
  ctaPrimaryLink: '/contact',
  ctaSecondaryLabel: 'View Published Charts',
  ctaSecondaryLink: '/charts',
  stats: [
    { number: '4', label: 'Daily Chart Types', sublabel: 'Analysis through 48-hour outlook' },
    { number: '1', label: 'Review Workflow', sublabel: 'Preparation, review, approval, publication' },
    { number: '2', label: 'Program Partners', sublabel: 'DOST-PAGASA and CWA Taiwan' },
  ],
  programObjectives: [
    {
      title: 'Operational wave forecasting',
      description: 'Support reliable preparation, review, and publication of wave forecast products.',
    },
    {
      title: 'Forecast collaboration',
      description: 'Improve coordination between forecasters and operational reviewers.',
    },
  ],
  leaders: [
    { name: 'Forecast operations', role: 'Chart preparation and technical review' },
    { name: 'Public portal', role: 'Published chart access and communication' },
  ],
  partners: [
    { name: 'DOST-PAGASA' },
    { name: 'Central Weather Administration Taiwan' },
  ],
  faqs: [],
};

export const DEFAULT_CONTACT = {
  heroDescription:
    "WaveLab combines coastal intelligence, forecasting, and decision support. Share your needs with us and we'll route you to the right PAGASA team.",
  contactCards: [
    {
      title: 'Email the team',
      description: 'Get in touch with our analysts for tailored guidance.',
      value: 'support@wavelab.ph',
      icon: 'mail',
    },
    {
      title: 'Call our hotline',
      description: 'We are available 24/7 for urgent coastal advisories.',
      value: '+63 (02) 8123-4567',
      icon: 'phone',
    },
    {
      title: 'Visit WaveLab HQ',
      description: 'Science Garden Complex, Quezon City, PH',
      value: 'Mon-Fri · 8:00 AM - 6:00 PM',
      icon: 'map-pin',
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