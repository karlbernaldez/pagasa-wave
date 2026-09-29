import { Pencil } from 'lucide-react';

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
          'absolute flex h-7 w-7 items-center justify-center rounded-lg border shadow-lg',
          isDarkMode
            ? 'border-cyan-200/40 bg-slate-950/90 text-cyan-200 shadow-cyan-950/40'
            : 'border-blue-200 bg-white/95 text-blue-700 shadow-slate-900/15'
        )}
        style={{
          left: rawClientX,
          top: rawClientY,
          transform: 'translate(-4px, -24px) rotate(-28deg)',
          transformOrigin: '50% 100%',
        }}
      >
        <Pencil size={16} strokeWidth={2.5} />
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
