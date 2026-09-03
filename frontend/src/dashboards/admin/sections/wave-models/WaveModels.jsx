import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleMinus,
  Database,
  Eye,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
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

const STAT_TONES = {
  cyan: {
    light: 'bg-cyan-50/80 text-cyan-700',
    dark: 'bg-cyan-400/10 text-cyan-200',
  },
  emerald: {
    light: 'bg-emerald-50/80 text-emerald-700',
    dark: 'bg-emerald-400/10 text-emerald-200',
  },
  amber: {
    light: 'bg-amber-50/80 text-amber-700',
    dark: 'bg-amber-400/10 text-amber-200',
  },
  slate: {
    light: 'bg-slate-100 text-slate-600',
    dark: 'bg-white/5 text-slate-300',
  },
};

const STATE_META = {
  active: { label: 'Ready', icon: CheckCircle2 },
  no_data: { label: 'No data', icon: AlertTriangle },
  disabled: { label: 'Disabled', icon: CircleMinus },
};

const STATE_ORDER = { active: 0, no_data: 1, disabled: 2 };

function normalizeError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function StatCard({ icon: Icon, label, value, helper, color, isDarkMode }) {
  const tone =
    STAT_TONES[color]?.[isDarkMode ? 'dark' : 'light'] ??
    STAT_TONES.cyan[isDarkMode ? 'dark' : 'light'];

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-xs font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-black tabular-nums',
              isDarkMode ? 'text-white' : 'text-slate-950'
            )}
          >
            {value}
          </p>
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon size={21} />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 text-sm font-semibold',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {helper}
      </p>
    </div>
  );
}

function StatusBadge({ state, isDarkMode }) {
  const meta = STATE_META[state] || STATE_META.no_data;
  const Icon = meta.icon;
  const tone =
    state === 'active'
      ? isDarkMode
        ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state === 'disabled'
        ? isDarkMode
          ? 'border-white/10 bg-white/5 text-slate-300'
          : 'border-slate-200 bg-slate-100 text-slate-600'
        : isDarkMode
          ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black',
        tone
      )}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function ConfigState({ configured, isDarkMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold',
        configured
          ? isDarkMode
            ? 'text-emerald-200'
            : 'text-emerald-700'
          : isDarkMode
            ? 'text-slate-500'
            : 'text-slate-400'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          configured ? 'bg-emerald-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
        )}
      />
      {configured ? 'Configured' : 'Not configured'}
    </span>
  );
}

function ModelAvatar({ model, isDarkMode }) {
  const initials = model.code === 'ECWAM' ? 'EC' : model.code.slice(0, 3);
  const tone =
    model.state === 'active'
      ? isDarkMode
        ? 'border-cyan-300/15 bg-cyan-400/10 text-cyan-100'
        : 'border-cyan-100 bg-cyan-50 text-cyan-700'
      : model.state === 'no_data'
        ? isDarkMode
          ? 'border-amber-300/15 bg-amber-400/10 text-amber-200'
          : 'border-amber-100 bg-amber-50 text-amber-700'
        : isDarkMode
          ? 'border-white/10 bg-white/5 text-slate-300'
          : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xs font-black',
        tone
      )}
    >
      {initials}
    </span>
  );
}

function PackageRows({ model, busyKey, isDarkMode, onDeletePackage }) {
  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div
          className={cn(
            'border-t px-5 py-4',
            isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-100 bg-slate-50/70'
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <Database size={15} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
            <div>
              <p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {model.code} package inventory
              </p>
              <p
                className={cn(
                  'mt-0.5 text-[11px]',
                  isDarkMode ? 'text-slate-500' : 'text-slate-500'
                )}
              >
                Generated data groups managed by WaveLab.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr
                  className={isDarkMode ? 'bg-black/10 text-slate-500' : 'bg-white text-slate-500'}
                >
                  <th className="px-3 py-2 font-black uppercase tracking-wide">Package</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wide">Data groups</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2 text-right font-black uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {model.packages.map((pkg) => {
                  const packageBusy = busyKey === `${model.code}:package:${pkg.packageTag}`;

                  return (
                    <tr
                      key={pkg.packageTag}
                      className={cn(
                        'border-t',
                        isDarkMode ? 'border-white/[0.06]' : 'border-slate-100'
                      )}
                    >
                      <td
                        className={cn(
                          'px-3 py-2.5 font-black',
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {pkg.packageTag}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5',
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        )}
                      >
                        {pkg.styles.join(', ')}
                      </td>
                      <td className="px-3 py-2.5 text-emerald-500">Ready</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={packageBusy}
                          onClick={() => onDeletePackage(model, pkg)}
                          className={cn(
                            'inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black transition-colors disabled:opacity-50',
                            isDarkMode
                              ? 'text-red-200 hover:bg-red-400/10'
                              : 'text-red-700 hover:bg-red-50'
                          )}
                        >
                          {packageBusy ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
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
        </div>
      </td>
    </tr>
  );
}

function ModelRow({ model, isDarkMode, busyKey, onToggle, onDeletePackage, onDeleteModel }) {
  const [expanded, setExpanded] = useState(false);
  const busy = busyKey?.startsWith(`${model.code}:`);
  const hasPackages = model.packageCount > 0;

  return (
    <>
      <tr
        className={cn(
          'border-t first:border-t-0',
          isDarkMode ? 'border-white/[0.08]' : 'border-slate-100'
        )}
      >
        <td className="px-3 py-3.5 align-middle">
          <div className="flex min-w-[230px] items-center gap-3">
            <ModelAvatar model={model} isDarkMode={isDarkMode} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <strong
                  className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}
                >
                  {model.label}
                </strong>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] font-black',
                    isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {model.code}
                </span>
              </div>
              <p
                className={cn(
                  'mt-1 max-w-[240px] text-[11px] leading-relaxed',
                  isDarkMode ? 'text-slate-500' : 'text-slate-500'
                )}
              >
                {model.description || 'Managed WaveLab wave forecast model.'}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5 align-middle">
          <StatusBadge state={model.state} isDarkMode={isDarkMode} />
        </td>
        <td className="px-3 py-3.5 align-middle">
          {model.latestPackage ? (
            <div>
              <p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                {model.latestPackage}
              </p>
              <p
                className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}
              >
                Latest package
              </p>
            </div>
          ) : (
            <div>
              <p
                className={cn(
                  'text-sm font-black',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                —
              </p>
              <p
                className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-600' : 'text-slate-400')}
              >
                {model.state === 'disabled' ? 'No data feed yet' : 'No package yet'}
              </p>
            </div>
          )}
        </td>
        <td className="px-3 py-3.5 align-middle">
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
            {model.packageCount}
          </p>
          <p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
            {model.packageCount === 1 ? 'package' : 'packages'}
          </p>
        </td>
        <td className="px-3 py-3.5 align-middle">
          <ConfigState configured={model.importerConfigured} isDarkMode={isDarkMode} />
        </td>
        <td className="px-3 py-3.5 align-middle">
          <ConfigState configured={model.builderConfigured} isDarkMode={isDarkMode} />
        </td>
        <td className="px-3 py-3.5 align-middle">
          <p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-800')}>
            {model.builtIn ? 'Built-in' : 'Custom'}
          </p>
          <p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
            WaveLab
          </p>
        </td>
        <td className="px-3 py-3.5 align-middle">
          <div className="flex min-w-[190px] items-center justify-end gap-2">
            {hasPackages && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-black transition-colors',
                  isDarkMode
                    ? 'border-cyan-300/15 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15'
                    : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                )}
              >
                <Eye size={13} />
                {expanded ? 'Hide' : 'Packages'}
              </button>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => onToggle(model)}
              className={cn(
                'inline-flex min-h-9 min-w-[72px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-black transition-colors disabled:opacity-50',
                model.enabled
                  ? isDarkMode
                    ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.09] hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-cyan-600 text-white shadow-md shadow-cyan-600/15 hover:bg-cyan-500'
              )}
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : model.enabled ? (
                'Disable'
              ) : (
                'Enable'
              )}
            </button>

            {!model.builtIn && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteModel(model)}
                aria-label={`Remove ${model.label}`}
                title="Remove custom model"
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-lg transition-colors disabled:opacity-50',
                  isDarkMode ? 'text-red-300 hover:bg-red-400/10' : 'text-red-600 hover:bg-red-50'
                )}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && hasPackages && (
        <PackageRows
          model={model}
          busyKey={busyKey}
          isDarkMode={isDarkMode}
          onDeletePackage={onDeletePackage}
        />
      )}
    </>
  );
}

export default function WaveModelsSection({ isDarkMode = true }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const stats = useMemo(
    () => ({
      total: models.length,
      ready: models.filter((model) => model.state === 'active').length,
      attention: models.filter((model) => model.state === 'no_data').length,
      disabled: models.filter((model) => model.state === 'disabled').length,
    }),
    [models]
  );

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...models]
      .filter((model) => statusFilter === 'all' || model.state === statusFilter)
      .filter((model) => {
        if (!normalizedQuery) return true;
        return [model.code, model.label, model.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        const stateDelta = (STATE_ORDER[left.state] ?? 9) - (STATE_ORDER[right.state] ?? 9);
        if (stateDelta !== 0) return stateDelta;
        return left.code.localeCompare(right.code);
      });
  }, [models, query, statusFilter]);

  const resultText = loading
    ? 'Loading model registry'
    : query.trim() || statusFilter !== 'all'
      ? `${filteredModels.length} matching model${filteredModels.length === 1 ? '' : 's'}`
      : `${models.length} model${models.length === 1 ? '' : 's'} registered`;

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
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Model registry
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {resultText}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950'
            )}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAdd((value) => !value)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500"
          >
            <Plus size={15} />
            Register Model
          </button>
        </div>
      </section>

      {message && (
        <section
          role="status"
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl',
            message.type === 'error'
              ? isDarkMode
                ? 'border-red-300/20 bg-red-400/10 text-red-200'
                : 'border-red-200 bg-red-50/80 text-red-800'
              : isDarkMode
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
          )}
        >
          {message.text}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Total Models"
          value={stats.total}
          helper="Registered model sources"
          color="cyan"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={CheckCircle2}
          label="Ready"
          value={stats.ready}
          helper="Available to forecasters"
          color="emerald"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={stats.attention}
          helper="Enabled without data"
          color="amber"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={CircleMinus}
          label="Disabled"
          value={stats.disabled}
          helper="Hidden from Studio"
          color="slate"
          isDarkMode={isDarkMode}
        />
      </section>

      {showAdd && (
        <section
          className={cn(
            'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 shadow-black/20'
              : 'border-white/70 bg-white/70 shadow-slate-300/40'
          )}
        >
          <form
            onSubmit={handleAdd}
            className="grid gap-3 lg:grid-cols-[0.7fr_1fr_1.7fr_auto] lg:items-end"
          >
            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
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
                  'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:border-cyan-400/40'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-cyan-400'
                )}
              />
            </label>

            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
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
                  'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:border-cyan-400/40'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-cyan-400'
                )}
              />
            </label>

            <label className="space-y-1">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-wide',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
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
                  'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:border-cyan-400/40'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-cyan-400'
                )}
              />
            </label>

            <button
              type="submit"
              disabled={busyKey === 'new:create'}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              {busyKey === 'new:create' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Register
            </button>
          </form>
        </section>
      )}

      <section
        className={cn(
          'overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-white/10 bg-slate-950/50 shadow-black/20'
            : 'border-white/70 bg-white/70 shadow-slate-300/40'
        )}
      >
        <div
          className={cn(
            'border-b px-4 py-4 sm:px-5',
            isDarkMode ? 'border-white/10' : 'border-white/70'
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={15}
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by model name, code, or description..."
                className={cn(
                  'min-h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition-colors',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-cyan-400/30'
                    : 'border-slate-200 bg-white/80 text-slate-900 focus:border-cyan-400'
                )}
              />
            </div>

            <div
              className={cn(
                'flex flex-wrap gap-1 rounded-xl border p-1',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white/80'
              )}
            >
              {[
                ['all', 'All'],
                ['active', 'Ready'],
                ['no_data', 'Needs attention'],
                ['disabled', 'Disabled'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-black transition-colors',
                    statusFilter === value
                      ? isDarkMode
                        ? 'bg-cyan-400/15 text-cyan-200'
                        : 'bg-cyan-50 text-cyan-700'
                      : isDarkMode
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {loading ? (
            <div
              className={cn(
                'flex min-h-56 items-center justify-center text-sm font-semibold',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              <Loader2 size={18} className="mr-2 animate-spin" />
              Loading model registry…
            </div>
          ) : filteredModels.length === 0 ? (
            <div
              className={cn(
                'flex min-h-56 flex-col items-center justify-center text-center',
                isDarkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              <Waves size={24} className="mb-2 opacity-50" />
              <p className="text-sm font-black">No wave models match this view.</p>
              <p className="mt-1 text-xs">Try another search term or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left">
                <thead>
                  <tr
                    className={cn(
                      'text-[10px] uppercase tracking-[0.1em]',
                      isDarkMode ? 'text-slate-500' : 'text-slate-500'
                    )}
                  >
                    <th className="px-3 py-2.5 font-black">Model</th>
                    <th className="px-3 py-2.5 font-black">Status</th>
                    <th className="px-3 py-2.5 font-black">Latest package</th>
                    <th className="px-3 py-2.5 font-black">Packages</th>
                    <th className="px-3 py-2.5 font-black">Importer</th>
                    <th className="px-3 py-2.5 font-black">Builder</th>
                    <th className="px-3 py-2.5 font-black">Registry</th>
                    <th className="px-3 py-2.5 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model) => (
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
                </tbody>
              </table>
            </div>
          )}

          <div
            className={cn(
              'mt-4 border-t pt-3 text-[10px] leading-relaxed',
              isDarkMode ? 'border-white/[0.08] text-slate-600' : 'border-slate-100 text-slate-400'
            )}
          >
            Package deletion is restricted to validated model/package identifiers inside the WaveLab
            tile root. Built-in models can be disabled but not removed.
          </div>
        </div>
      </section>
    </div>
  );
}
