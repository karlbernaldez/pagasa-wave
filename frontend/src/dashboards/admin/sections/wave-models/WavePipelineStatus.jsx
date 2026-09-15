import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ServerCog,
  Waves,
} from 'lucide-react';

import { fetchWavePipelineStatus } from '@/api/wavePipelineStatus';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STATE_META = {
  READY: {
    label: 'Ready',
    icon: CheckCircle2,
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  },
  WAITING_FOR_SOURCE: {
    label: 'Waiting for source',
    icon: Clock3,
    light: 'border-amber-200 bg-amber-50 text-amber-700',
    dark: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  },
  READY_TO_BUILD: {
    label: 'Source ready',
    icon: CheckCircle2,
    light: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    dark: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  },
  NORMALIZING: { label: 'Normalizing', icon: Loader2 },
  BUILDING: { label: 'Building', icon: Loader2 },
  VALIDATING: { label: 'Validating', icon: Loader2 },
  PUBLISHING: { label: 'Publishing', icon: Loader2 },
  FAILED: {
    label: 'Failed',
    icon: AlertTriangle,
    light: 'border-rose-200 bg-rose-50 text-rose-700',
    dark: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  },
  UNKNOWN: { label: 'Unknown', icon: Activity },
};

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function StatusBadge({ state, isDarkMode }) {
  const meta = STATE_META[state] || STATE_META.UNKNOWN;
  const Icon = meta.icon;
  const tone =
    meta[isDarkMode ? 'dark' : 'light'] ||
    (isDarkMode
      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
      : 'border-cyan-200 bg-cyan-50 text-cyan-700');
  const isBusy = ['NORMALIZING', 'BUILDING', 'VALIDATING', 'PUBLISHING'].includes(state);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        tone
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', isBusy && 'animate-spin')} />
      {meta.label}
    </span>
  );
}

function Detail({ label, value, mono = false, isDarkMode }) {
  return (
    <div>
      <p
        className={cn(
          'text-[10px] font-black uppercase tracking-[0.14em]',
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-sm font-semibold',
          mono && 'font-mono text-[13px]',
          isDarkMode ? 'text-slate-100' : 'text-slate-800'
        )}
      >
        {value ?? 'Unavailable'}
      </p>
    </div>
  );
}

function ModelCard({ model, isDarkMode }) {
  const frameCount = Number.isFinite(model.frameCount) ? model.frameCount : 0;
  const expected = Number.isFinite(model.expectedFrameCount) ? model.expectedFrameCount : 0;
  const progress = expected > 0 ? Math.min(100, Math.round((frameCount / expected) * 100)) : 0;

  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
              isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
            )}
          >
            <Waves className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3
              className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}
            >
              {model.modelLabel || model.model || 'Wave model'}
            </h3>
            <p
              className={cn(
                'mt-1 text-xs font-semibold leading-relaxed',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {model.message || 'Wave pipeline status'}
            </p>
          </div>
        </div>
        <StatusBadge state={model.state} isDarkMode={isDarkMode} />
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Package date" value={model.packageDate} isDarkMode={isDarkMode} />
        <Detail
          label="Required cycle"
          value={model.requiredSourceCycle}
          mono
          isDarkMode={isDarkMode}
        />
        <Detail
          label="Source cycle"
          value={model.sourceCycle || 'Waiting'}
          mono
          isDarkMode={isDarkMode}
        />
        <Detail
          label="Input mode"
          value={model.inputMode || 'Not recorded'}
          isDarkMode={isDarkMode}
        />
      </div>

      <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Forecast frames</span>
          <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>
            {expected > 0 ? `${frameCount} / ${expected}` : `${frameCount} / unknown`}
          </span>
        </div>
        <div
          className={cn(
            'h-2 overflow-hidden rounded-full',
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          )}
        >
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Detail label="Published" value={model.published ? 'Yes' : 'No'} isDarkMode={isDarkMode} />
        <Detail
          label="Last check"
          value={formatDateTime(model.lastCheckAt)}
          isDarkMode={isDarkMode}
        />
        <Detail
          label="Completed"
          value={formatDateTime(model.completedAt)}
          isDarkMode={isDarkMode}
        />
      </div>

      {model.error ? (
        <div
          className={cn(
            'mt-4 rounded-xl border px-3 py-2 text-xs font-semibold',
            isDarkMode
              ? 'border-rose-400/20 bg-rose-400/10 text-rose-100'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          {model.error}
        </div>
      ) : null}
    </article>
  );
}

export default function WavePipelineStatus({ isDarkMode }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setPayload(await fetchWavePipelineStatus());
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to load wave pipeline status.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => load(), 0);
    const refreshTimer = window.setInterval(() => load({ silent: true }), 30_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, [load]);

  const models = useMemo(() => payload?.models || [], [payload]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 sm:pt-6">
      <section
        className={cn(
          'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-cyan-300/15 bg-cyan-400/[0.06] shadow-black/20'
            : 'border-cyan-100 bg-cyan-50/70 shadow-slate-300/30'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-white text-cyan-700'
              )}
            >
              <ServerCog className="h-5 w-5" />
            </span>
            <div>
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Operational pipeline status
              </p>
              <p
                className={cn(
                  'mt-1 max-w-4xl text-xs font-semibold leading-relaxed',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Monitor source readiness, normalized processing, validation, and publication for all
                configured operational wave models. This page is observational; operational policy is
                configured under Wave Models.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => load({ silent: true })}
            disabled={refreshing}
            className={cn(
              'inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-colors disabled:opacity-60',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div
          className={cn(
            'mt-4 rounded-xl border px-3 py-2 text-xs font-semibold',
            isDarkMode
              ? 'border-rose-400/20 bg-rose-400/10 text-rose-100'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div
          className={cn(
            'mt-4 grid min-h-48 place-items-center rounded-2xl border',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 text-slate-400'
              : 'border-white/70 bg-white/70 text-slate-500'
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading pipeline status…
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {models.length ? (
            models.map((model) => (
              <ModelCard key={model.modelId || model.model} model={model} isDarkMode={isDarkMode} />
            ))
          ) : (
            <div
              className={cn(
                'col-span-full rounded-2xl border px-4 py-10 text-center text-sm font-semibold',
                isDarkMode
                  ? 'border-white/10 bg-slate-950/50 text-slate-500'
                  : 'border-white/70 bg-white/70 text-slate-500'
              )}
            >
              No enabled operational wave models are currently available.
            </div>
          )}
        </div>
      )}

      {payload?.generatedAt ? (
        <p
          className={cn(
            'mt-3 text-right text-[11px]',
            isDarkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          Updated {formatDateTime(payload.generatedAt)} · refreshes every 30 seconds
        </p>
      ) : null}
    </div>
  );
}
