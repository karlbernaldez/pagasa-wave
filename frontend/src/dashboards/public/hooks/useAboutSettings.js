// ╔══════════════════════════════════════════════════════╗
// ║            hooks/useAboutSettings.js                 ║
// ║  Public About page — reads settings from API.        ║
// ╚══════════════════════════════════════════════════════╝
import { useState, useEffect } from 'react';
import { getSettings } from '@/api/siteSettings';

export const DEFAULT_ABOUT_SETTINGS = {
  title:             'Seamless Prediction for Typhoon & Marine Weather',
  subtitle:          'Part of the DOST MECO-TECO-VOTE III program, WaveLab establishes seamless prediction capability on typhoon, marine meteorology, and short-range climate prediction applications.',
  badgeText:         'About WaveLab',
  ctaPrimaryLabel:   'Connect with WaveLab',
  ctaPrimaryLink:    '/contact',
  ctaSecondaryLabel: 'Explore Live Charts',
  ctaSecondaryLink:  '/charts',
  stats: [
    { number: '36', label: 'Project Duration',    sublabel: 'Months (2024–2026)' },
    { number: '6',  label: 'Core Objectives',     sublabel: 'Research areas' },
    { number: '2',  label: 'Main Partners',        sublabel: 'DOST-PAGASA & CWA Taiwan' },
    { number: '3',  label: 'Project Components',   sublabel: 'Typhoon, Marine, Climate' },
  ],
  highlights: [
    { title: 'Mission', description: "To continue the research collaboration between DOST-PAGASA and Taiwan's CWA." },
    { title: 'Vision',  description: 'Leading to improved decision-making and risk reduction for climate-related disasters.' },
  ],
  programObjectives: [
    { title: 'Upscale Typhoon Forecast Support',     description: 'Enhance typhoon forecast support systems.' },
    { title: 'Optimize Wave Prediction Services',    description: 'Improve the wave prediction operational system.' },
    { title: 'Dual Polarization Quality Control',    description: 'Develop dual polarization quality control techniques.' },
    { title: 'Quantitative Precipitation Estimates', description: 'Develop dual-polarization QPE and QPN.' },
    { title: 'Regional Data Assimilation',           description: 'Enhance the PAGASA Regional Data Assimilation and NWP System.' },
    { title: 'S2S Climate Applications',             description: 'Sub-seasonal to Seasonal applications.' },
  ],
  pillars: [
    { title: 'Typhoon Forecasting', description: 'Advanced forecast support systems with improved reliability.' },
    { title: 'Marine Services',     description: 'Optimized wave prediction operational systems nationwide.' },
    { title: 'Radar Technology',    description: 'Dual polarization quality control and QPE.' },
    { title: 'Climate Prediction',  description: 'Sub-seasonal to seasonal applications for disaster risk reduction.' },
  ],
  milestones: [
    { year: '2024',    title: 'Program Initiation',   description: 'MECO-TECO-VOTE III Component B launched.' },
    { year: '2024–25', title: 'System Development',   description: 'Development of display system and wave model programs.' },
    { year: '2025',    title: 'Implementation Phase', description: 'Integration of radar and wave prediction systems.' },
    { year: '2026',    title: 'Program Completion',   description: 'Full deployment of seamless prediction capabilities.' },
  ],
  leaders: [
    { name: 'Dr. Aira Mendez',    role: 'Coastal Systems Lead',        avatar: 'https://i.pravatar.cc/160?img=32' },
    { name: 'Engr. Luis Herrera', role: 'Forecast Operations Manager', avatar: 'https://i.pravatar.cc/160?img=14' },
    { name: 'Ma. Celeste Ramos',  role: 'Data Partnerships',           avatar: 'https://i.pravatar.cc/160?img=47' },
  ],
  partners:       ['PAGASA', 'DOST', 'Taiwan CWA', 'PHIVOLCS', 'NDRRMC'],
  ctaTitle:       'Collaborate with PAGASA',
  ctaDescription: 'Partner with our meteorological research team on typhoon forecasting and climate prediction applications.',
  ctaButtonLabel: 'Contact the Team',
  ctaButtonLink:  '/contact',
};

const useAboutSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_ABOUT_SETTINGS);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings('about');

        // Merge API data over defaults — missing keys keep default values
        if (data && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        // Non-critical — page still renders with hardcoded defaults
        console.warn('[useAboutSettings] Using defaults:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};

export default useAboutSettings;