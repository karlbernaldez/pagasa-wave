// ╔══════════════════════════════════════════════════════╗
// ║                    HeroSection                       ║
// ║  Props: title, subtitle, badgeText,                  ║
// ║         ctaPrimaryLabel, ctaPrimaryLink,             ║
// ║         ctaSecondaryLabel, ctaSecondaryLink          ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Waves, ArrowRight } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const HeroSection = ({
  title,
  subtitle,
  badgeText,
  ctaPrimaryLabel,
  ctaPrimaryLink,
  ctaSecondaryLabel,
  ctaSecondaryLink,
}) => {
  const { isDarkMode } = useTheme();

  // Split title at last space before "Typhoon" so the gradient part
  // can be rendered separately. Supports any title via a simple heuristic:
  // the last sentence / phrase after the last comma or "for" keyword gets the gradient.
  const gradientKeyword = 'for';
  const splitIdx = title.toLowerCase().lastIndexOf(` ${gradientKeyword} `);
  const titlePlain  = splitIdx !== -1 ? title.slice(0, splitIdx)  : title;
  const titleAccent = splitIdx !== -1 ? title.slice(splitIdx + 1) : '';

  return (
    <section className="text-center mb-8">
      {/* Badge */}
      <div
        className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
          isDarkMode
            ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
            : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
        }`}
      >
        <Waves className="animate-pulse" size={18} />
        {badgeText}
      </div>

      {/* Title */}
      <h1
        className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mt-8 mb-6 tracking-tight transition-colors duration-700 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}
      >
        {titlePlain}{' '}
        {titleAccent && (
          <span
            className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
              isDarkMode
                ? 'from-blue-400 via-cyan-400 to-emerald-400'
                : 'from-blue-600 via-cyan-600 to-emerald-600'
            }`}
          >
            {titleAccent}
          </span>
        )}
      </h1>

      {/* Subtitle */}
      <p
        className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10 transition-colors duration-700 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {subtitle}
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-4 justify-center">
        <a
          href={ctaPrimaryLink}
          className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
          {ctaPrimaryLabel}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
        </a>
        <a
          href={ctaSecondaryLink}
          className={`inline-flex items-center gap-2.5 rounded-xl border px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              : 'border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400'
          }`}
        >
          {ctaSecondaryLabel}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;