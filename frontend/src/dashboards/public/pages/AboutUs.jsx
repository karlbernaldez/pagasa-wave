// ╔═══════════════════════════════════════════════════════════════════════╗
// ║                        🌪 Component B Project 1                       ║
// ╠═══════════════════════════════════════════════════════════════════════╣
// ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
// ║  📝 Description   : About Us page — fully modularized & settings-ready ║
// ║  📅 Last Updated  : 2025                                              ║
// ╚═══════════════════════════════════════════════════════════════════════╝
import React from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';

// ── Section Components ──────────────────────────────────────────────────────
import HeroSection from '../components/about/HeroSection';
import StatsSection from '../components/about/StatsSection';
import MissionVisionSection from '../components/about/MissionVisionSection';
import ObjectivesSection from '../components/about/ObjectivesSection';
import FocusAreasSection from '../components/about/FocusAreasSection';
import TimelineSection from '../components/about/TimelineSection';
import LeadershipSection from '../components/about/LeadershipSection';
import PartnersSection from '../components/about/PartnersSection';
import FAQSection from '../components/about/FAQSection';
import CTASection from '../components/about/CTASection';

// ── Data Hook ───────────────────────────────────────────────────────────────
import useAboutSettings from '@dashboards/public/hooks/useAboutSettings';

// ── Loading Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ isDarkMode }) => (
  <div className="flex flex-col gap-20 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`h-40 rounded-2xl ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}
      />
    ))}
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const AboutUs = () => {
  document.title = 'About Us | WaveLab';

  const { isDarkMode } = useTheme();
  const { settings, loading } = useAboutSettings();

  return (
    <div
      className={`relative min-h-screen pt-32 pb-20 px-4 md:px-6 overflow-hidden transition-all duration-700 ${isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
        }`}
    >
      {/* ── Animations ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>

      {/* ── Subtle Dot Grid Background ──────────────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className={`absolute inset-0 transition-all duration-700 ${isDarkMode
            ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
            : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
            } bg-[length:30px_30px]`}
        />
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-20">

        {loading ? (
          <Skeleton isDarkMode={isDarkMode} />
        ) : (
          <>
            {/* 1. Hero — Title & Subtitle */}
            <HeroSection
              titlePrefix={settings.titlePrefix}
              titleHighlight={settings.titleHighlight}
              titleSuffix={settings.titleSuffix}
              subtitle={settings.subtitle}
              badgeText={settings.badgeText}
              ctaPrimaryLabel={settings.ctaPrimaryLabel}
              ctaPrimaryLink={settings.ctaPrimaryLink}
              ctaSecondaryLabel={settings.ctaSecondaryLabel}
              ctaSecondaryLink={settings.ctaSecondaryLink}
            />

            {/* 2. Stats */}
            <StatsSection stats={settings.stats} />

            {/* 3. Mission & Vision */}
            <MissionVisionSection highlights={settings.highlights} />

            {/* 4. Program Objectives */}
            <ObjectivesSection
              sectionBadge="MECO-TECO-VOTE III Program"
              sectionTitle="Program Objectives"
              sectionSubtitle="The program integrates advanced developments in typhoon forecast support, wave prediction optimization, and enhanced numerical weather prediction systems."
              programObjectives={settings.programObjectives}
            />

            {/* 5. Focus Areas */}
            <FocusAreasSection
              sectionTitle="Program Focus Areas"
              sectionSubtitle="Key research and development areas driving seamless prediction capabilities."
              pillars={settings.pillars}
            />

            {/* 6. Timeline */}
            <TimelineSection
              sectionTitle="Program Timeline"
              sectionSubtitle={`MECO-TECO-VOTE III Component B journey — ${settings.milestones[0]?.year ?? ''
                } to ${settings.milestones[settings.milestones.length - 1]?.year ?? ''}`}
              milestones={settings.milestones}
            />

            {/* 7. Leadership + Partners — side by side on large screens */}
            <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <LeadershipSection leaders={settings.leaders} />
              <PartnersSection partners={settings.partners} />
            </section>

            {/* 8. FAQ */}
            <FAQSection faqs={settings.faqs || []} />

            {/* 8. Bottom CTA */}
            <CTASection
              ctaTitle={settings.ctaTitle}
              ctaDescription={settings.ctaDescription}
              ctaButtonLabel={settings.ctaButtonLabel}
              ctaButtonLink={settings.ctaButtonLink}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AboutUs;