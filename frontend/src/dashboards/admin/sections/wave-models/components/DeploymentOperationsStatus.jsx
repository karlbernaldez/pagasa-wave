import { AlertTriangle, CheckCircle2, CircleHelp, Server, TimerReset } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const RESULT_META = {
  PASS: { label: 'Validated', icon: CheckCircle2 },
  WARN: { label: 'Validated with warnings', icon: AlertTriangle },
  FAIL: { label: 'Validation failed', icon: AlertTriangle },
  UNKNOWN: { label: 'Not validated', icon: CircleHelp },
};

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toneForStatus(status, isDarkMode) {
  if (status === 'PASS' || status === 'active') {
    return isDarkMode
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'WARN') {
    return isDarkMode
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
      : 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return isDarkMode
    ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
    : 'border-rose-200 bg-rose-50 text-rose-700';
}

function StatusPill({ status, label, isDarkMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]',
        toneForStatus(status, isDarkMode)
      )}
    >
      {label || status || 'unknown'}
    </span>
  );
}

function StateGrid({ title, icon: Icon, values = {}, isDarkMode }) {
  const entries = Object.entries(values);
  return (
    <section
      className={cn(
        'rounded-xl border p-3',
        isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/70'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
        <h4 className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
          {title}
        </h4>
      </div>
      <div className="space-y-2">
        {entries.length ? (
          entries.map(([key, state]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-xs">
              <span className={cn('font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                {key.replaceAll('_', ' ')}
              </span>
              <StatusPill status={state} label={state} isDarkMode={isDarkMode} />
            </div>
          ))
        ) : (
          <p className={cn('text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            No status recorded.
          </p>
        )}
      </div>
    </section>
  );
}

export default function DeploymentOperationsStatus({ deployment, isDarkMode }) {
  if (!deployment?.available) {
    return (
      <section
        className={cn(
          'mt-4 rounded-2xl border p-4',
          isDarkMode
            ? 'border-amber-400/20 bg-amber-400/[0.06] text-slate-300'
            : 'border-amber-200 bg-amber-50/70 text-slate-700'
        )}
      >
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="text-sm font-black">Deployment validation report not available</h3>
            <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
              Run the server deployment validator to publish a sanitized operations report. No
              deployment commands are executed from this page.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const result = RESULT_META[deployment.result] || RESULT_META.UNKNOWN;
  const ResultIcon = result.icon;
  const checks = Array.isArray(deployment.checks) ? deployment.checks : [];
  const failedChecks = checks.filter((check) => check.status === 'FAIL');
  const warningChecks = checks.filter((check) => check.status === 'WARN');

  return (
    <section
      className={cn(
        'mt-4 rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/80 shadow-slate-300/30'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl border',
              toneForStatus(deployment.result, isDarkMode)
            )}
          >
            <ResultIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Application & deployment health
            </h3>
            <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
              {deployment.host || 'WaveLab host'} · {deployment.branch || 'unknown branch'} ·{' '}
              {deployment.shortRevision || 'unknown revision'}
            </p>
          </div>
        </div>
        <StatusPill status={deployment.result} label={result.label} isDarkMode={isDarkMode} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className={cn('text-[10px] font-black uppercase tracking-[0.12em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            Environment
          </p>
          <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-slate-100' : 'text-slate-800')}>
            {deployment.backendEnvironment || 'unset'}
          </p>
        </div>
        <div>
          <p className={cn('text-[10px] font-black uppercase tracking-[0.12em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            Validated
          </p>
          <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-slate-100' : 'text-slate-800')}>
            {formatDateTime(deployment.generatedAt)}
          </p>
        </div>
        <div>
          <p className={cn('text-[10px] font-black uppercase tracking-[0.12em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            Backend started
          </p>
          <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-slate-100' : 'text-slate-800')}>
            {deployment.backend?.startedAt || 'Not recorded'}
          </p>
        </div>
        <div>
          <p className={cn('text-[10px] font-black uppercase tracking-[0.12em]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
            Errors since start
          </p>
          <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-slate-100' : 'text-slate-800')}>
            {deployment.backend?.recentErrorCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <StateGrid title="Application services" icon={Server} values={deployment.services} isDarkMode={isDarkMode} />
        <StateGrid title="Scheduled automation" icon={TimerReset} values={deployment.timers} isDarkMode={isDarkMode} />
      </div>

      {failedChecks.length || warningChecks.length ? (
        <div
          className={cn(
            'mt-3 rounded-xl border px-3 py-3 text-xs font-semibold',
            deployment.result === 'FAIL'
              ? toneForStatus('FAIL', isDarkMode)
              : toneForStatus('WARN', isDarkMode)
          )}
        >
          {[...failedChecks, ...warningChecks].map((check) => (
            <div key={check.key} className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span>{check.label}</span>
              <span>{check.detail || check.status}</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className={cn('mt-3 text-right text-[10px] font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
        Report {deployment.reportId || 'unidentified'} · read-only monitoring
      </p>
    </section>
  );
}
