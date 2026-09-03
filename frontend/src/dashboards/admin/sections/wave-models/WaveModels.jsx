import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Layers3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  ServerCog,
  Trash2,
  Waves,
} from 'lucide-react';

import {
  createWaveModel,
  deleteWaveModel,
  deleteWaveModelPackage,
  fetchWaveModels,
  setWaveModelEnabled,
} from '@/api/waveModels';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STATE_META = {
  active: {
    label: 'Ready',
    description: 'Available to forecasters',
    icon: CheckCircle2,
  },
  no_data: {
    label: 'No data',
    description: 'Enabled, but no package is available',
    icon: AlertTriangle,
  },
  disabled: {
    label: 'Disabled',
    description: 'Hidden from forecasters',
    icon: Power,
  },
};

const STATE_ORDER = {
  active: 0,
  no_data: 1,
  disabled: 2,
};

function normalizeError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function StatusBadge({ state, isDarkMode }) {
  const meta = STATE_META[state] || STATE_META.no_data;
  const Icon = meta.icon;
  const tone =
    state === 'active'
      ? isDarkMode
        ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state === 'disabled'
        ? isDarkMode
          ? 'border-white/10 bg-white/5 text-white/45'
          : 'border-slate-200 bg-slate-100 text-slate-600'
        : isDarkMode
          ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span
      title={meta.description}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
        tone
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function SummaryItem({ icon: Icon, label, value, detail, isDarkMode, attention = false }) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3',
        isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-slate-200/80 bg-white/90'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          attention
            ? isDarkMode
              ? 'bg-amber-300/10 text-amber-200'
              : 'bg-amber-50 text-amber-700'
            : isDarkMode
              ? 'bg-cyan-300/10 text-cyan-200'
              : 'bg-blue-50 text-blue-700'
        )}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block text-[9px] font-black uppercase tracking-[0.12em]',
            isDarkMode ? 'text-white/35' : 'text-slate-400'
          )}
        >
          {label}
        </span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <strong
            className={cn(
              'text-lg font-black leading-none',
              isDarkMode ? 'text-white' : 'text-slate-950'
            )}
          >
            {value}
          </strong>
          <span
            className={cn(
              'truncate text-[10px] font-semibold',
              isDarkMode ? 'text-white/35' : 'text-slate-500'
            )}
          >
            {detail}
          </span>
        </span>
      </span>
    </div>
  );
}

function PipelineStatus({ label, configured, isDarkMode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-1">
      <span className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white/45' : 'text-slate-500')}>
        {label}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] font-black',
          configured
            ? isDarkMode
              ? 'text-emerald-200'
              : 'text-emerald-700'
            : isDarkMode
              ? 'text-white/35'
              : 'text-slate-400'
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            configured ? 'bg-emerald-500' : isDarkMode ? 'bg-white/25' : 'bg-slate-300'
          )}
        />
        {configured ? 'Configured' : 'Not configured'}
      </span>
    </div>
  );
}

function PackageTable({ model, busyKey, isDarkMode, onDeletePackage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead>
          <tr
            className={cn(
              'border-b',
              isDarkMode ? 'border-white/10 text-white/35' : 'border-slate-200 text-slate-500'
            )}
          >
            <th className="px-1 py-2 font-black uppercase tracking-wide">Package</th>
            <th className="px-3 py-2 font-black uppercase tracking-wide">Data groups</th>
            <th className="px-3 py-2 font-black uppercase tracking-wide">Status</th>
            <th className="px-1 py-2 text-right font-black uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody>
          {model.packages.map((pkg) => {
            const packageBusy = busyKey === `${model.code}:package:${pkg.packageTag}`;

            return (
              <tr
                key={pkg.packageTag}
                className={cn(
                  'border-b last:border-b-0',
                  isDarkMode
                    ? 'border-white/[0.06] text-white/70'
                    : 'border-slate-100 text-slate-700'
                )}
              >
                <td className="px-1 py-2.5 font-black">{pkg.packageTag}</td>
                <td className="px-3 py-2.5">{pkg.styles.join(', ')}</td>
                <td className="px-3 py-2.5">
                  <span className={isDarkMode ? 'text-emerald-200' : 'text-emerald-700'}>
                    Ready
                  </span>
                </td>
                <td className="px-1 py-2.5 text-right">
                  <button
                    type="button"
                    disabled={packageBusy}
                    onClick={() => onDeletePackage(model, pkg)}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                      isDarkMode
                        ? 'text-red-200 hover:bg-red-300/10 focus-visible:ring-red-300/40'
                        : 'text-red-700 hover:bg-red-50 focus-visible:ring-red-300'
                    )}
                  >
                    {packageBusy ? (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={13} aria-hidden="true" />
                    )}
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ModelRow({ model, isDarkMode, busyKey, onToggle, onDeletePackage, onDeleteModel }) {
  const [expanded, setExpanded] = useState(false);
  const busy = busyKey?.startsWith(`${model.code}:`);
  const hasPackages = model.packageCount > 0;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/90 bg-white'
      )}
    >
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(280px,1.25fr)_minmax(420px,1.5fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              isDarkMode
                ? 'border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-200'
                : 'border-blue-100 bg-blue-50 text-blue-700'
            )}
          >
            <Waves size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {model.label}
              </h3>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider',
                  isDarkMode ? 'bg-white/5 text-white/35' : 'bg-slate-100 text-slate-500'
                )}
              >
                {model.code}
              </span>
              <StatusBadge state={model.state} isDarkMode={isDarkMode} />
            </div>
            <p
              className={cn(
                'mt-1 line-clamp-2 text-[11px] leading-relaxed',
                isDarkMode ? 'text-white/40' : 'text-slate-500'
              )}
            >
              {model.description || 'Managed WaveLab wave forecast model.'}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'grid overflow-hidden rounded-xl border sm:grid-cols-3',
            isDarkMode ? 'border-white/[0.08] bg-white/[0.025]' : 'border-slate-200 bg-slate-50/70'
          )}
        >
          <div
            className={cn(
              'px-3 py-2.5',
              isDarkMode
                ? 'sm:border-r sm:border-white/[0.08]'
                : 'sm:border-r sm:border-slate-200'
            )}
          >
            <div
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.12em]',
                isDarkMode ? 'text-white/30' : 'text-slate-400'
              )}
            >
              Data
            </div>
            <div className="mt-1 flex items-center gap-2">
              <strong className={cn('text-xs font-black', isDarkMode ? 'text-white/85' : 'text-slate-900')}>
                {model.packageCount} {model.packageCount === 1 ? 'package' : 'packages'}
              </strong>
              {model.latestPackage && (
                <span className={cn('text-[10px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
                  latest {model.latestPackage}
                </span>
              )}
            </div>
          </div>

          <div
            className={cn(
              'px-3 py-2.5',
              isDarkMode
                ? 'sm:border-r sm:border-white/[0.08]'
                : 'sm:border-r sm:border-slate-200'
            )}
          >
            <div
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.12em]',
                isDarkMode ? 'text-white/30' : 'text-slate-400'
              )}
            >
              Pipeline
            </div>
            <PipelineStatus
              label="Importer"
              configured={model.importerConfigured}
              isDarkMode={isDarkMode}
            />
            <PipelineStatus
              label="Builder"
              configured={model.builderConfigured}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="px-3 py-2.5">
            <div
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.12em]',
                isDarkMode ? 'text-white/30' : 'text-slate-400'
              )}
            >
              Registry
            </div>
            <div className={cn('mt-1 text-xs font-black', isDarkMode ? 'text-white/75' : 'text-slate-700')}>
              {model.builtIn ? 'Built-in model' : 'Custom model'}
            </div>
            <div className={cn('mt-1 text-[10px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
              {model.enabled ? 'Enabled for WaveLab' : 'Disabled in WaveLab'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <div className="flex items-center gap-1">
            {hasPackages ? (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2',
                  isDarkMode
                    ? 'text-cyan-200 hover:bg-cyan-300/10 focus-visible:ring-cyan-300/40'
                    : 'text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-300'
                )}
              >
                <Database size={14} aria-hidden="true" />
                Packages
                {expanded ? (
                  <ChevronUp size={14} aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} aria-hidden="true" />
                )}
              </button>
            ) : (
              <span className={cn('px-2 text-[11px] font-semibold', isDarkMode ? 'text-white/25' : 'text-slate-400')}>
                No packages yet
              </span>
            )}

            {!model.builtIn && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteModel(model)}
                aria-label={`Remove ${model.label}`}
                title="Remove custom model"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                  isDarkMode
                    ? 'text-red-200 hover:bg-red-300/10 focus-visible:ring-red-300/40'
                    : 'text-red-600 hover:bg-red-50 focus-visible:ring-red-300'
                )}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => onToggle(model)}
            aria-pressed={model.enabled}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
              model.enabled
                ? isDarkMode
                  ? 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 focus-visible:ring-white/30'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300'
                : isDarkMode
                  ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/15 focus-visible:ring-emerald-300/40'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300'
            )}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Power size={14} aria-hidden="true" />
            )}
            {model.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {expanded && hasPackages && (
        <div
          className={cn(
            'border-t px-4 py-3',
            isDarkMode ? 'border-white/10 bg-black/10' : 'border-slate-100 bg-slate-50/60'
          )}
        >
          <PackageTable
            model={model}
            busyKey={busyKey}
            isDarkMode={isDarkMode}
            onDeletePackage={onDeletePackage}
          />
        </div>
      )}
    </article>
  );
}

export default function WaveModelsSection({ isDarkMode }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', label: '', description: '' });

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWaveModels();
      setModels(result?.models || []);
      setMessage(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: normalizeError(error, 'Unable to load wave model inventory.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchWaveModels()
      .then((result) => {
        if (!active) return;
        setModels(result?.models || []);
        setMessage(null);
      })
      .catch((error) => {
        if (!active) return;
        setMessage({
          type: 'error',
          text: normalizeError(error, 'Unable to load wave model inventory.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const orderedModels = useMemo(
    () =>
      [...models].sort((left, right) => {
        const stateDelta =
          (STATE_ORDER[left.state] ?? 9) - (STATE_ORDER[right.state] ?? 9);
        if (stateDelta !== 0) return stateDelta;
        return left.code.localeCompare(right.code);
      }),
    [models]
  );

  const summary = useMemo(
    () => ({
      total: models.length,
      ready: models.filter((model) => model.state === 'active').length,
      attention: models.filter((model) => model.state === 'no_data').length,
      packages: models.reduce((total, model) => total + model.packageCount, 0),
    }),
    [models]
  );

  const refreshAfter = async (action, successText) => {
    try {
      await action();
      await loadModels();
      setMessage({ type: 'success', text: successText });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Wave model operation failed.') });
    } finally {
      setBusyKey('');
    }
  };

  const handleToggle = async (model) => {
    setBusyKey(`${model.code}:availability`);
    await refreshAfter(
      () => setWaveModelEnabled(model.code, !model.enabled),
      `${model.label} has been ${model.enabled ? 'disabled' : 'enabled'}.`
    );
  };

  const handleDeletePackage = async (model, pkg) => {
    const confirmed = window.confirm(
      `Delete ${model.code} package ${pkg.packageTag}? This permanently removes its managed tile/contour directories and cannot be undone.`
    );
    if (!confirmed) return;

    setBusyKey(`${model.code}:package:${pkg.packageTag}`);
    await refreshAfter(
      () => deleteWaveModelPackage(model.code, pkg.packageTag),
      `${model.code} package ${pkg.packageTag} was deleted.`
    );
  };

  const handleDeleteModel = async (model) => {
    const confirmed = window.confirm(
      `Remove custom model ${model.code}? WaveLab will only allow this after all of its packages have been removed.`
    );
    if (!confirmed) return;

    setBusyKey(`${model.code}:delete`);
    await refreshAfter(
      () => deleteWaveModel(model.code),
      `${model.code} was removed from the registry.`
    );
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setBusyKey('new:create');

    try {
      await createWaveModel(form);
      setForm({ code: '', label: '', description: '' });
      setShowAdd(false);
      await loadModels();
      setMessage({ type: 'success', text: 'Wave model was registered in a disabled state.' });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to add wave model.') });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.14em]',
              isDarkMode ? 'text-cyan-200/60' : 'text-blue-700/70'
            )}
          >
            Operational registry
          </div>
          <p
            className={cn(
              'mt-1 max-w-3xl text-xs leading-relaxed',
              isDarkMode ? 'text-white/40' : 'text-slate-500'
            )}
          >
            Control which wave models are available in WaveLab and inspect their generated tile
            packages.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 focus-visible:ring-white/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300'
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((value) => !value)}
            aria-expanded={showAdd}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2',
              isDarkMode
                ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:ring-cyan-300/50'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300'
            )}
          >
            <Plus size={14} aria-hidden="true" />
            Register model
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryItem
          icon={Waves}
          label="Models"
          value={summary.total}
          detail="registered"
          isDarkMode={isDarkMode}
        />
        <SummaryItem
          icon={CheckCircle2}
          label="Ready"
          value={summary.ready}
          detail="available"
          isDarkMode={isDarkMode}
        />
        <SummaryItem
          icon={AlertTriangle}
          label="Needs attention"
          value={summary.attention}
          detail="no data"
          isDarkMode={isDarkMode}
          attention={summary.attention > 0}
        />
        <SummaryItem
          icon={Layers3}
          label="Packages"
          value={summary.packages}
          detail="managed"
          isDarkMode={isDarkMode}
        />
      </div>

      {message && (
        <div
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-xs font-bold',
            message.type === 'error'
              ? isDarkMode
                ? 'border-red-300/20 bg-red-300/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-700'
              : isDarkMode
                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}
        >
          {message.text}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className={cn(
            'rounded-2xl border p-4',
            isDarkMode ? 'border-cyan-300/15 bg-slate-950/45' : 'border-blue-200 bg-white'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                Register a wave model
              </div>
              <p className={cn('mt-0.5 text-[11px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
                New models start disabled until their operational data pipeline is connected.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-black',
                isDarkMode
                  ? 'text-white/45 hover:bg-white/5'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.7fr_1fr_1.7fr_auto] lg:items-end">
            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Model code
              </span>
              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                required
                maxLength={32}
                placeholder="MRI3"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-cyan-300/40 focus:ring-cyan-300/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>

            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Display name
              </span>
              <input
                value={form.label}
                onChange={(event) =>
                  setForm((current) => ({ ...current, label: event.target.value }))
                }
                required
                maxLength={80}
                placeholder="Model name"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-cyan-300/40 focus:ring-cyan-300/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>

            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Description
              </span>
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                maxLength={240}
                placeholder="Optional operational description"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-cyan-300/40 focus:ring-cyan-300/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>

            <button
              type="submit"
              disabled={busyKey === 'new:create'}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50',
                isDarkMode ? 'bg-cyan-300 text-slate-950' : 'bg-blue-600 text-white'
              )}
            >
              {busyKey === 'new:create' ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={14} aria-hidden="true" />
              )}
              Register
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          className={cn(
            'flex min-h-44 items-center justify-center rounded-2xl border',
            isDarkMode
              ? 'border-white/10 bg-slate-950/40 text-white/45'
              : 'border-slate-200 bg-white text-slate-500'
          )}
        >
          <Loader2 size={20} className="mr-2 animate-spin" aria-hidden="true" />
          Loading model registry…
        </div>
      ) : orderedModels.length === 0 ? (
        <div
          className={cn(
            'rounded-2xl border border-dashed px-6 py-12 text-center',
            isDarkMode ? 'border-white/10 text-white/35' : 'border-slate-300 text-slate-500'
          )}
        >
          <ServerCog size={24} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
          <p className="text-sm font-black">No wave models are registered.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedModels.map((model) => (
            <ModelRow
              key={model.code}
              model={model}
              isDarkMode={isDarkMode}
              busyKey={busyKey}
              onToggle={handleToggle}
              onDeletePackage={handleDeletePackage}
              onDeleteModel={handleDeleteModel}
            />
          ))}
        </div>
      )}

      <p
        className={cn(
          'px-1 text-[10px] leading-relaxed',
          isDarkMode ? 'text-white/25' : 'text-slate-400'
        )}
      >
        Package deletion is restricted to validated model/package identifiers inside the WaveLab tile
        root. Built-in models can be disabled but not removed.
      </p>
    </section>
  );
}
