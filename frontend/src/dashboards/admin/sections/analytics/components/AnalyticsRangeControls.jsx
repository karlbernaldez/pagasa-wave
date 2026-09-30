import { ANALYTICS_RANGE_PRESETS, buildPresetRange } from '../analyticsDateRange';
import { bucketLabel } from '../analyticsPresentation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnalyticsRangeControls({
  range,
  customRange,
  onApplyRange,
  onCustomChange,
  onApplyCustom,
  isDarkMode,
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-3',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
      aria-label="Analytics date range"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
          {ANALYTICS_RANGE_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onApplyRange({
                  preset: preset.id,
                  days: preset.days,
                  ...buildPresetRange(preset.days),
                })
              }
              aria-pressed={range.preset === preset.id}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-black transition-colors',
                range.preset === preset.id
                  ? 'bg-cyan-600 text-white'
                  : isDarkMode
                    ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {['start', 'end'].map((field) => (
            <label key={field} className="text-xs font-bold">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                {field === 'start' ? 'From' : 'To'}
              </span>
              <input
                type="date"
                value={customRange[field]}
                onChange={(event) => onCustomChange(field, event.target.value)}
                className={cn(
                  'mt-1 block rounded-lg border px-2 py-2 text-xs',
                  isDarkMode
                    ? 'border-white/10 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={onApplyCustom}
            disabled={!customRange.start || !customRange.end}
            className={cn(
              'min-h-9 rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            Custom
          </button>
        </div>
      </div>
      <p
        className={cn(
          'mt-2 text-[11px] font-semibold',
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        )}
      >
        {range.start} to {range.end} · Asia/Manila · {bucketLabel(range.days)}
      </p>
    </section>
  );
}
