// ╔══════════════════════════════════════════════════════╗
// ║                    FAQSection                        ║
// ║  Props:                                              ║
// ║    sectionTitle — heading                            ║
// ║    sectionSubtitle — subtitle under heading          ║
// ║    faqs — array of { question, answer }              ║
// ╚══════════════════════════════════════════════════════╝
import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const FAQSection = ({
  sectionTitle = 'Frequently Asked Questions',
  sectionSubtitle = 'Everything you need to know about WaveLab and the DOST-MECO-TECO-VOTE III program.',
  faqs = [],
}) => {
  const { isDarkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  if (!faqs.length) return null;

  const toggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <section
      className={`rounded-2xl border p-8 lg:p-10 shadow-xl backdrop-blur-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg flex-shrink-0">
          <HelpCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2
            className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {sectionSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── FAQ Items ── */}
      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`group rounded-xl border overflow-hidden transition-all duration-300 ${
                isOpen
                  ? isDarkMode
                    ? 'border-blue-500/40 bg-slate-800/80 shadow-lg shadow-blue-900/20'
                    : 'border-blue-200 bg-white shadow-md shadow-blue-100/60'
                  : isDarkMode
                    ? 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                    : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
              }`}
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.07}s both` }}
            >
              {/* Question button */}
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                {/* Number badge + question */}
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p
                    className={`text-sm font-bold leading-snug transition-colors duration-300 ${
                      isOpen
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        : isDarkMode
                          ? 'text-white group-hover:text-blue-300'
                          : 'text-slate-900 group-hover:text-blue-700'
                    }`}
                  >
                    {faq.question}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  } ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                />
              </button>

              {/* Answer — animated expand */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div
                  className={`px-6 pb-5 ml-11 text-sm leading-relaxed ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >

                  <div
                    className={`h-px mb-4 ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-100'}`}
                  />
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;