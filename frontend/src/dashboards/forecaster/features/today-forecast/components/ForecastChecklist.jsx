import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Send,
  Waves,
  Wind,
  CloudRain,
  ChevronRight,
} from 'lucide-react';

import {
  card,
  divider,
  iconBox,
  textSecondary,
  textMuted,
} from '../utils/theme';

const ICONS = {
  Waves,
  Wind,
  CloudRain,
};

/**
 * Returns initials from a full name, e.g. "Juan Dela Cruz" → "JD"
 */
function getInitials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic avatar color based on name.
 */
const AVATAR_COLORS = [
  { bg: 'bg-blue-500/20',    text: 'text-blue-300'    },
  { bg: 'bg-violet-500/20',  text: 'text-violet-300'  },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { bg: 'bg-rose-500/20',    text: 'text-rose-300'    },
  { bg: 'bg-amber-500/20',   text: 'text-amber-300'   },
  { bg: 'bg-cyan-500/20',    text: 'text-cyan-300'    },
];

function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------

export default function ForecastChecklist({ charts, isDarkMode, onChartClick, onSubmit, currentUser }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const nextChart   = charts.find((c) => c.status !== 'Completed');
  const allComplete = charts.every((c) => c.status === 'Completed');

  const today = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });

  function handleSubmit() {
    setSubmitted(true);
    onSubmit?.();
  }

  return (
    <div className={`p-6 ${card(isDarkMode)}`}>
      {/* Header */}
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${textMuted(isDarkMode)}`}>
        Forecast Package
      </p>
      <p className="mb-5 text-lg font-bold text-cyan-400">{today}</p>

      {/* Checklist table */}
      <div className={`overflow-hidden rounded-xl border ${divider(isDarkMode)}`}>
        {charts.map((chart) => {
          const Icon      = ICONS[chart.icon] || Waves;
          const completed = chart.status === 'Completed';
          const active    = chart.status === 'In Progress';
          const isHovered = hoveredKey === chart.title;

          const lastUser = chart.lastOpenedBy;
          const initials = lastUser ? getInitials(lastUser.name) : null;
          const color    = lastUser ? avatarColor(lastUser.name) : null;

          const shortName = lastUser
            ? (() => {
                const parts = lastUser.name.trim().split(' ');
                return parts.length > 1
                  ? `${parts[0]} ${parts[parts.length - 1][0]}.`
                  : parts[0];
              })()
            : null;

          return (
            <button
              key={chart.title}
              type="button"
              onClick={() => onChartClick?.(chart)}
              onMouseEnter={() => setHoveredKey(chart.title)}
              onMouseLeave={() => setHoveredKey(null)}
              className={[
                'w-full text-left flex items-center justify-between border-b px-5 py-4 last:border-b-0',
                'transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                divider(isDarkMode),

                active
                  ? isDarkMode
                    ? 'border-l-[3px] border-l-cyan-400 bg-[#071f38] pl-[17px]'
                    : 'border-l-[3px] border-l-cyan-500 bg-cyan-50/40 pl-[17px]'
                  : '',

                completed && !isHovered
                  ? isDarkMode ? 'bg-[#061320]' : 'bg-gray-50/60'
                  : '',

                isHovered
                  ? isDarkMode ? 'bg-[#0a2540]' : 'bg-blue-50/60'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* ── LEFT ── */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 size={22} className="text-emerald-500" />
                  ) : active ? (
                    <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full border-2 border-yellow-400 opacity-60" />
                      <span className="relative flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-yellow-400 bg-yellow-400/10">
                        <span className="h-[7px] w-[7px] rounded-full bg-yellow-400" />
                      </span>
                    </span>
                  ) : (
                    <Circle size={22} className={textMuted(isDarkMode)} />
                  )}
                </div>

                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active
                      ? isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-50'
                      : isHovered
                      ? isDarkMode ? 'bg-blue-500/15' : 'bg-blue-100/60'
                      : iconBox(isDarkMode)
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      completed
                        ? isHovered ? 'text-blue-300' : 'text-blue-400'
                        : active
                        ? 'text-yellow-400'
                        : isHovered
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-500'
                        : 'text-slate-500'
                    }
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className={`text-sm font-semibold leading-snug ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } ${completed && !isHovered ? 'opacity-60' : ''}`}
                  >
                    {chart.title}
                  </h3>
                  <p className={`text-xs ${textSecondary(isDarkMode)}`}>
                    {chart.description}
                  </p>

                  {lastUser && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${color.bg} ${color.text}`}
                      >
                        {initials}
                      </span>
                      <span className={`text-[11px] ${textMuted(isDarkMode)}`}>
                        Last opened by{' '}
                        <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          {shortName}
                        </span>{' '}
                        · {lastUser.openedAt}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT ── */}
              <div className="flex flex-shrink-0 items-center gap-4 ml-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    completed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : active
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-slate-500/15 text-slate-400'
                  }`}
                >
                  {chart.status}
                </span>

                <span
                  className={`w-[72px] text-right text-sm ${
                    active ? 'font-medium text-yellow-400' : textSecondary(isDarkMode)
                  }`}
                >
                  {active ? 'Active' : completed ? chart.time : '–'}
                </span>

                <ChevronRight
                  size={16}
                  className={`transition-colors ${
                    isHovered
                      ? isDarkMode ? 'text-cyan-400' : 'text-cyan-500'
                      : textMuted(isDarkMode)
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA — Submit when all complete, Continue otherwise */}
      {allComplete ? (
        submitted ? (
          /* Post-submit confirmation */
          <div
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold
              ${isDarkMode
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-emerald-50 text-emerald-600'}`}
          >
            <CheckCircle2 size={16} />
            Package submitted for review
          </div>
        ) : (
          /* Submit button */
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              <Send size={15} />
              Submit Forecast Package
            </button>
          </div>
        )
      ) : (
        /* Continue button — shown while charts remain */
        nextChart && (
          <button
            onClick={() => onChartClick?.(nextChart)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
          >
            Continue {nextChart.title}
            <ArrowRight size={16} />
          </button>
        )
      )}
    </div>
  );
}