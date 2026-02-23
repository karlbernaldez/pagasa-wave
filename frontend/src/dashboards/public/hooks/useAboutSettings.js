// ╔══════════════════════════════════════════════════════╗
// ║         useAboutSettings — fetches & caches          ║
// ║   about page settings from /api/settings/about       ║
// ╚══════════════════════════════════════════════════════╝
import { useState, useEffect } from 'react';

// ─── Default fallback data ────────────────────────────────────────────────────
// These are used when the API hasn't returned yet or on error.
// Replace / extend these in MongoDB via admin settings.
export const DEFAULT_ABOUT_SETTINGS = {
  // ── Hero ──────────────────────────────────────────────
  title: 'Seamless Prediction for Typhoon & Marine Weather',
  subtitle:
    "Part of the DOST MECO-TECO-VOTE III program, WaveLab establishes seamless prediction capability on typhoon, marine meteorology, and short-range climate prediction applications to support decision-making and risk reduction along the Philippine coastline.",
  badgeText: 'About WaveLab',
  ctaPrimaryLabel: 'Connect with WaveLab',
  ctaPrimaryLink: '/contact',
  ctaSecondaryLabel: 'Explore Live Charts',
  ctaSecondaryLink: '/charts',

  // ── Stats ─────────────────────────────────────────────
  stats: [
    { number: '36', label: 'Project Duration', sublabel: 'Months (2024–2026)' },
    { number: '6',  label: 'Core Objectives',  sublabel: 'Research areas' },
    { number: '2',  label: 'Main Partners',    sublabel: 'DOST-PAGASA & CWA Taiwan' },
    { number: '3',  label: 'Project Components', sublabel: 'Typhoon, Marine, Climate' },
  ],

  // ── Mission & Vision ─────────────────────────────────
  highlights: [
    {
      title: 'Mission',
      description:
        "To continue the research collaboration between DOST-PAGASA and Taiwan's Central Weather Administration to enhance prediction capabilities for typhoons, marine meteorology, and operational-to-seasonal climate prediction applications for various sectors.",
    },
    {
      title: 'Vision',
      description:
        "Leading to improved decision-making and risk reduction applications for climate-related disasters through advancing the country's prediction system for typhoons, marine weather services, and climate prediction.",
    },
  ],

  // ── Program Objectives ───────────────────────────────
  programObjectives: [
    {
      title: 'Upscale Typhoon Forecast Support',
      description:
        'Enhance typhoon forecast support systems for efficient operations, with a focus on increasing the reliability of available analysis and forecast aids.',
    },
    {
      title: 'Optimize Wave Prediction Services',
      description: 'Improve the wave prediction operational system to support routine marine meteorological services.',
    },
    {
      title: 'Dual Polarization Quality Control',
      description: 'Develop dual polarization quality control techniques for enhanced radar capabilities.',
    },
    {
      title: 'Quantitative Precipitation Estimates',
      description:
        'Develop dual-polarization QPE and QPN for heavy rainfall monitoring.',
    },
    {
      title: 'Regional Data Assimilation',
      description:
        'Enhance the PAGASA Regional Data Assimilation and NWP System by assimilating new observation types.',
    },
    {
      title: 'S2S Climate Applications',
      description:
        'Sub-seasonal to Seasonal (S2S) applications for agriculture, water resources, energy, and disaster risk reduction.',
    },
  ],

  // ── Focus Areas / Pillars ────────────────────────────
  pillars: [
    {
      title: 'Typhoon Forecasting',
      description:
        'Advanced forecast support systems with improved reliability of analysis and forecast aids for efficient operations.',
    },
    {
      title: 'Marine Services',
      description: 'Optimized wave prediction operational systems to support routine marine meteorological services nationwide.',
    },
    {
      title: 'Radar Technology',
      description:
        'Dual polarization quality control techniques and quantitative precipitation estimates for heavy rainfall monitoring.',
    },
    {
      title: 'Climate Prediction',
      description:
        'Sub-seasonal to seasonal applications for agriculture, water resources, energy, and disaster risk reduction.',
    },
  ],

  // ── Timeline / Milestones ─────────────────────────────
  milestones: [
    {
      year: '2024',
      title: 'Program Initiation',
      description:
        'MECO-TECO-VOTE III Component B officially launched with DOST-PAGASA and Taiwan CWA collaboration.',
    },
    {
      year: '2024–25',
      title: 'System Development',
      description:
        'Development of display system and wave model programs for Project 1, with focus on computer software and web applications.',
    },
    {
      year: '2025',
      title: 'Implementation Phase',
      description:
        'Integration of dual polarization radar, wave prediction systems, and Regional Data Assimilation enhancements.',
    },
    {
      year: '2026',
      title: 'Program Completion',
      description:
        'Full deployment of seamless prediction capabilities for typhoon, marine weather, and climate applications.',
    },
  ],

  // ── Leadership ────────────────────────────────────────
  leaders: [
    { name: 'Dr. Aira Mendez',      role: 'Coastal Systems Lead',        avatar: 'https://i.pravatar.cc/160?img=32' },
    { name: 'Engr. Luis Herrera',   role: 'Forecast Operations Manager', avatar: 'https://i.pravatar.cc/160?img=14' },
    { name: 'Ma. Celeste Ramos',    role: 'Data Partnerships',           avatar: 'https://i.pravatar.cc/160?img=47' },
  ],

  // ── Partner Agencies ──────────────────────────────────
  partners: ['PAGASA', 'DOST', 'Taiwan CWA', 'PHIVOLCS', 'NDRRMC'],

  // ── Bottom CTA ────────────────────────────────────────
  ctaTitle: 'Collaborate with PAGASA',
  ctaDescription:
    'Partner with our meteorological research team on typhoon forecasting, marine weather services, and climate prediction applications.',
  ctaButtonLabel: 'Contact the Team',
  ctaButtonLink: '/contact',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useAboutSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_ABOUT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/settings/about', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Merge API data over defaults so missing keys still have fallbacks
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[useAboutSettings] Using default settings:', err.message);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    return () => controller.abort();
  }, []);

  return { settings, loading, error };
};

export default useAboutSettings;