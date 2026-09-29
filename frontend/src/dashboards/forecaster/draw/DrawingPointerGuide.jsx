import { PenTool } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function DrawingPointerGuide({
  guide,
  isDarkMode,
}) {
  if (!guide) return null;

  const {
    rawClientX,
    rawClientY,
    adjustedClientX,
    adjustedClientY,
  } = guide;

  const dx = adjustedClientX - rawClientX;
  const dy = adjustedClientY - rawClientY;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const hasOffset = distance > 0.5;

  return (
    <div className="pointer-events-none fixed inset-0 z-[160]" aria-hidden="true">
      {hasOffset && (
        <div
          className={cn(
            'absolute h-0 border-t border-dashed',
            isDarkMode ? 'border-cyan-300/70' : 'border-blue-600/70'
          )}
          style={{
            left: rawClientX,
            top: rawClientY,
            width: distance,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
          }}
        />
      )}

      <div
        className={cn(
          'absolute drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]',
          isDarkMode ? 'text-cyan-100' : 'text-blue-700'
        )}
        style={{
          left: rawClientX,
          top: rawClientY,
          transform: 'translate(-3px, -19px) rotate(-18deg)',
          transformOrigin: '50% 100%',
        }}
      >
        <PenTool size={20} strokeWidth={2.4} />
      </div>

      {hasOffset && (
        <div
          className={cn(
            'absolute h-2.5 w-2.5 rounded-full',
            isDarkMode ? 'bg-white/75' : 'bg-slate-900/65'
          )}
          style={{
            left: rawClientX,
            top: rawClientY,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      <div
        className={cn(
          'absolute h-3.5 w-3.5 rounded-full border-2 shadow-md',
          isDarkMode
            ? 'border-white bg-cyan-400 shadow-cyan-950/50'
            : 'border-white bg-blue-600 shadow-slate-900/20'
        )}
        style={{
          left: adjustedClientX,
          top: adjustedClientY,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
