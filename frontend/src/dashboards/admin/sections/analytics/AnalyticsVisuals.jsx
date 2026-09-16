import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function ChartTooltip({ active, payload, label, isDarkMode }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/95 text-slate-200'
          : 'border-slate-200 bg-white/95 text-slate-700'
      )}
    >
      {label ? <p className="mb-1 font-black">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="font-semibold">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export function DistributionCard({ title, description, rows = [], isDarkMode }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value) || 0));

  return (
    <section
      className={cn(
        'min-h-[360px] rounded-2xl border p-5',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
        {title}
      </h3>
      <p
        className={cn(
          'mt-1 text-xs font-semibold leading-5',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {description}
      </p>
      <div className="mt-5 space-y-4">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                  {row.label}
                </span>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                  {row.value}
                </span>
              </div>
              <div
                className={cn(
                  'h-2 overflow-hidden rounded-full',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
                aria-label={`${row.label}: ${row.value}`}
              >
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{ width: `${Math.max(5, Math.round(((Number(row.value) || 0) / max) * 100))}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p
            className={cn(
              'py-24 text-center text-xs font-semibold',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            No data in the selected period.
          </p>
        )}
      </div>
    </section>
  );
}

export function TrendCard({
  title,
  description,
  rows = [],
  series = [],
  bucketLabel,
  isDarkMode,
}) {
  const gridColor = isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.14)';
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <section
      className={cn(
        'min-h-[360px] rounded-2xl border p-5',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {title}
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold leading-5',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {description}
          </p>
        </div>
        {bucketLabel ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
              isDarkMode ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-600'
            )}
          >
            {bucketLabel}
          </span>
        ) : null}
      </div>

      {rows.length ? (
        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip isDarkMode={isDarkMode} />} />
              {series.map((item, index) => (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.stroke || ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]}
                  strokeWidth={2.5}
                  dot={rows.length <= 31 ? { r: 2.5 } : false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p
          className={cn(
            'py-28 text-center text-xs font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          No trend data in the selected period.
        </p>
      )}
    </section>
  );
}

export function BarChartCard({ title, description, rows = [], isDarkMode }) {
  const gridColor = isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.14)';
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <section
      className={cn(
        'min-h-[360px] rounded-2xl border p-5',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
        {title}
      </h3>
      <p
        className={cn(
          'mt-1 text-xs font-semibold leading-5',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {description}
      </p>
      {rows.length ? (
        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip isDarkMode={isDarkMode} />} />
              <Bar dataKey="value" name="Count" fill="#06b6d4" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p
          className={cn(
            'py-28 text-center text-xs font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          No data in the selected period.
        </p>
      )}
    </section>
  );
}

export function AnalyticsCarousel({ slides = [], isDarkMode, ariaLabel = 'Analytics charts' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  if (!slides.length) return null;

  const currentIndex = Math.min(index, slides.length - 1);
  const current = slides[currentIndex];
  const showControls = slides.length > 1;
  const goPrevious = () => setIndex((value) => (value - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((value) => (value + 1) % slides.length);

  return (
    <section aria-label={ariaLabel} className="space-y-3">
      {showControls ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-xs font-black uppercase tracking-[0.12em]',
                isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
              )}
            >
              {current.label}
            </p>
            <p className={cn('text-[11px] font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
              Chart {currentIndex + 1} of {slides.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
              aria-label="Previous analytics chart"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
              aria-label="Next analytics chart"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <div>{current.content}</div>

      {showControls ? (
        <div className="flex justify-center gap-2" role="tablist" aria-label="Analytics chart pages">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={cn(
                'h-2 rounded-full transition-all',
                slideIndex === currentIndex
                  ? 'w-6 bg-cyan-500'
                  : isDarkMode
                    ? 'w-2 bg-slate-700 hover:bg-slate-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
              )}
              aria-label={`Show ${slide.label}`}
              aria-selected={slideIndex === currentIndex}
              role="tab"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
