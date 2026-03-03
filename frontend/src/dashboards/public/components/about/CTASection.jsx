// ╔══════════════════════════════════════════════════════╗
// ║                    CTASection                        ║
// ║  Props: ctaTitle, ctaDescription,                    ║
// ║         ctaButtonLabel, ctaButtonLink                ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const CTASection = ({
  ctaTitle = 'Collaborate with PAGASA',
  ctaDescription = '',
  ctaButtonLabel = 'Contact the Team',
  ctaButtonLink = '/contact',
}) => {
  const { isDarkMode } = useTheme();

  return (
    <section
      className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border text-center transition-all duration-300 hover:scale-[1.01] ${
        isDarkMode
          ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-blue-700/30'
          : 'bg-gradient-to-br from-blue-50/80 to-purple-50/60 border-blue-200/50'
      }`}
    >
      <Sparkles
        className={`w-16 h-16 mx-auto mb-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
      />
      <h3
        className={`text-3xl lg:text-4xl font-black mb-4 transition-colors duration-700 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}
      >
        {ctaTitle}
      </h3>
      {ctaDescription && (
        <p
          className={`text-lg mb-8 max-w-2xl mx-auto transition-colors duration-700 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {ctaDescription}
        </p>
      )}
      <a
        href={ctaButtonLink}
        className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/25"
      >
        {ctaButtonLabel}
        <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-300" />
      </a>
    </section>
  );
};

export default CTASection;