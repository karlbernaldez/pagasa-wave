import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { divider } from '../utils/theme';

const TIPS = [
  'Use keyboard shortcuts to work faster.',
  'Press Z to undo your last action instantly.',
  'Hold Space and drag to pan across the chart.',
  'Complete charts before their deadline to stay on track.',
  'Click any forecast row to open its workspace directly.',
  'Press Y to redo an action you just undid.',
  'Submit your forecast package before the publication deadline.',
  'Use the Eraser (E) to correct mistakes without switching tools.',
  'Check the Deadline Overview card to track how much time you have left.',
  'Recent Activity shows a live log of everything completed today.',
  'Charts marked In Progress are auto-saved as you work.',
  'You can reopen a completed chart to make corrections before submitting.',
];

const TIP_INTERVAL_MS = 5000;

export default function TipBar({ isDarkMode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [visible, setVisible] = useState(true);

  const goTo = useCallback(
    (nextIndex, dir = 'next') => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setVisible(false);

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setVisible(true);
        setAnimating(false);
      }, 250);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((currentIndex + 1) % TIPS.length, 'next');
  }, [currentIndex, goTo]);

  const prev = useCallback(() => {
    goTo((currentIndex - 1 + TIPS.length) % TIPS.length, 'prev');
  }, [currentIndex, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, TIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div
      className={`
        h-12 flex-shrink-0 flex items-center gap-3 border-t px-4
        ${divider(isDarkMode)}
        ${isDarkMode ? 'bg-[#061529]' : 'bg-white'}
      `}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Icon + label */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <Lightbulb size={13} className="text-yellow-500" />
        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-yellow-500">
          TIP
        </span>
      </div>

      {/* Prev button */}
      <button
        onClick={prev}
        aria-label="Previous tip"
        className={`
          flex-shrink-0 flex h-5 w-5 items-center justify-center rounded
          transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500
          ${isDarkMode ? 'text-[#334d6e] hover:text-slate-400' : 'text-gray-300 hover:text-gray-500'}
        `}
      >
        <ChevronLeft size={13} />
      </button>

      {/* Tip text */}
      <div className="relative flex min-w-0 flex-1 overflow-hidden">
        <span
          className={`
            block truncate text-[11px] transition-all duration-200
            ${visible
              ? 'opacity-100 translate-y-0'
              : direction === 'next'
              ? 'opacity-0 -translate-y-1'
              : 'opacity-0 translate-y-1'}
            ${isDarkMode ? 'text-[#64748b]' : 'text-gray-400'}
          `}
        >
          {TIPS[currentIndex]}
        </span>
      </div>

      {/* Dot indicators */}
      <div className="flex flex-shrink-0 items-center gap-[5px]">
        {TIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > currentIndex ? 'next' : 'prev')}
            aria-label={`Tip ${i + 1}`}
            className={`
              rounded-full transition-all duration-300 focus:outline-none
              ${i === currentIndex
                ? 'w-3 h-[5px] bg-yellow-500'
                : isDarkMode
                ? 'w-[5px] h-[5px] bg-[#1e3a5f] hover:bg-slate-600'
                : 'w-[5px] h-[5px] bg-gray-200 hover:bg-gray-300'}
            `}
          />
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={next}
        aria-label="Next tip"
        className={`
          flex-shrink-0 flex h-5 w-5 items-center justify-center rounded
          transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500
          ${isDarkMode ? 'text-[#334d6e] hover:text-slate-400' : 'text-gray-300 hover:text-gray-500'}
        `}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}