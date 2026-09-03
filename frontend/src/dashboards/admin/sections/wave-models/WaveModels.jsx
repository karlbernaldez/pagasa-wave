import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleMinus,
  Eye,
  Info,
  Layers3,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
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
  active: { label: 'Ready', icon: CheckCircle2 },
  no_data: { label: 'No data', icon: AlertTriangle },
  disabled: { label: 'Disabled', icon: CircleMinus },
};

const STATE_ORDER = { active: 0, no_data: 1, disabled: 2 };

function normalizeError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function StatusBadge({ state, isDarkMode }) {
  const meta = STATE_META[state] || STATE_META.no_data;
  const Icon = meta.icon;
  const tone =
    state === 'active'
      ? isDarkMode
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state === 'disabled'
        ? isDarkMode
          ? 'border-white/10 bg-white/5 text-white/55'
          : 'border-slate-200 bg-slate-100 text-slate-600'
        : isDarkMode
          ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black',
        tone
      )}
    >
      <Icon size={13} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, suffix, isDarkMode, tone = 'blue' }) {
  const iconTone =
    tone === 'green'
      ? isDarkMode
        ? 'bg-emerald-400/10 text-emerald-200'
        : 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? isDarkMode
          ? 'bg-amber-300/10 text-amber-200'
          : 'bg-amber-50 text-amber-700'
        : tone === 'muted'
          ? isDarkMode
            ? 'bg-white/5 text-white/45'
            : 'bg-slate-100 text-slate-600'
          : isDarkMode
            ? 'bg-cyan-300/10 text-cyan-200'
            : 'bg-blue-50 text-blue-700';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-sm',
        isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-white/95'
      )}
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconTone)}>
        <Icon size={21} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block text-[10px] font-black uppercase tracking-[0.12em]',
            isDarkMode ? 'text-white/40' : 'text-slate-500'
          )}
        >
          {label}
        </span>
        <span className="mt-1 flex items-baseline gap-2">
          <strong className={cn('text-2xl font-black leading-none', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {value}
          </strong>
          <span className={cn('text-xs font-semibold', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
            {suffix}
          </span>
        </span>
      </span>
    </div>
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
            ? 'text-white/40'
            : 'text-slate-500'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          configured ? 'bg-emerald-500' : isDarkMode ? 'bg-white/30' : 'bg-slate-300'
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
        ? 'border-blue-400/20 bg-blue-500/20 text-blue-100'
        : 'border-blue-100 bg-blue-50 text-blue-700'
      : model.state === 'no_data'
        ? isDarkMode
          ? 'border-amber-300/15 bg-amber-300/10 text-amber-200'
          : 'border-amber-100 bg-amber-50 text-amber-700'
        : isDarkMode
          ? 'border-white/10 bg-white/5 text-white/65'
          : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black',
        tone
      )}
    >
      {initials}
    </span>
  );
}

function PackageList({ model, busyKey, isDarkMode, onDeletePackage }) {
  return (
    <div
      className={cn(
        'border-t px-5 py-4',
        isDarkMode ? 'border-white/10 bg-black/10' : 'border-slate-100 bg-slate-50/70'
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className={cn('text-xs font-black', isDarkMode ? 'text-white/80' : 'text-slate-900')}>
            {model.code} packages
          </div>
          <div className={cn('text-[11px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
            Generated data groups currently managed by WaveLab.
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead>
            <tr className={cn('border-b', isDarkMode ? 'border-white/10 text-white/35' : 'border-slate-200 text-slate-500')}>
              <th className="px-2 py-2 font-black uppercase tracking-wide">Package</th>
              <th className="px-2 py-2 font-black uppercase tracking-wide">Data groups</th>
              <th className="px-2 py-2 font-black uppercase tracking-wide">Status</th>
              <th className="px-2 py-2 text-right font-black uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {model.packages.map((pkg) => {
              const packageBusy = busyKey === `${model.code}:package:${pkg.packageTag}`;
              return (
                <tr
                  key={pkg.packageTag}
                  className={cn('border-b last:border-0', isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}
                >
                  <td className={cn('px-2 py-3 font-black', isDarkMode ? 'text-white/85' : 'text-slate-900')}>
                    {pkg.packageTag}
                  </td>
                  <td className={cn('px-2 py-3', isDarkMode ? 'text-white/55' : 'text-slate-600')}>
                    {pkg.styles.join(', ')}
                  </td>
                  <td className="px-2 py-3">
                    <span className={isDarkMode ? 'text-emerald-200' : 'text-emerald-700'}>Ready</span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      disabled={packageBusy}
                      onClick={() => onDeletePackage(model, pkg)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                        isDarkMode
                          ? 'text-red-200 hover:bg-red-300/10 focus-visible:ring-red-300/40'
                          : 'text-red-700 hover:bg-red-50 focus-visible:ring-red-300'
                      )}
                    >
                      {packageBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
  );
}

function ModelRow({ model, isDarkMode, busyKey, onToggle, onDeletePackage, onDeleteModel }) {
  const [expanded, setExpanded] = useState(false);
  const busy = busyKey?.startsWith(`${model.code}:`);
  const hasPackages = model.packageCount > 0;

  return (
    <>
      <tr className={cn('border-b last:border-0', isDarkMode ? 'border-white/[0.08]' : 'border-slate-200')}>
        <td className="px-4 py-4 align-middle">
          <div className="flex min-w-[220px] items-center gap-3">
            <ModelAvatar model={model} isDarkMode={isDarkMode} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                  {model.label}
                </strong>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide',
                    isDarkMode ? 'bg-white/5 text-white/35' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {model.code}
                </span>
              </div>
              <p className={cn('mt-1 max-w-[220px] text-[11px] leading-relaxed', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                {model.description || 'Managed WaveLab wave forecast model.'}
              </p>
            </div>
          </div>
        </td>

        <td className="px-3 py-4 align-middle">
          <StatusBadge state={model.state} isDarkMode={isDarkMode} />
        </td>

        <td className="px-3 py-4 align-middle">
          {model.latestPackage ? (
            <div>
              <div className={cn('text-xs font-black', isDarkMode ? 'text-white/85' : 'text-slate-900')}>
                {model.latestPackage}
              </div>
              <div className={cn('mt-1 text-[10px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
                Latest available package
              </div>
            </div>
          ) : (
            <div>
              <div className={cn('text-sm font-black', isDarkMode ? 'text-white/60' : 'text-slate-600')}>—</div>
              <div className={cn('mt-1 text-[10px]', isDarkMode ? 'text-white/30' : 'text-slate-400')}>
                {model.state === 'disabled' ? 'No data feed yet' : 'No package yet'}
              </div>
            </div>
          )}
        </td>

        <td className="px-3 py-4 align-middle">
          <div className={cn('text-sm font-black', isDarkMode ? 'text-white/85' : 'text-slate-900')}>
            {model.packageCount}
          </div>
          <div className={cn('mt-1 text-[10px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
            {model.packageCount === 1 ? 'package' : 'packages'}
          </div>
        </td>

        <td className="px-3 py-4 align-middle">
          <ConfigState configured={model.importerConfigured} isDarkMode={isDarkMode} />
        </td>

        <td className="px-3 py-4 align-middle">
          <ConfigState configured={model.builderConfigured} isDarkMode={isDarkMode} />
        </td>

        <td className="px-3 py-4 align-middle">
          <div className={cn('text-xs font-black', isDarkMode ? 'text-white/80' : 'text-slate-800')}>
            {model.builtIn ? 'Built-in' : 'Custom'}
          </div>
          <div className={cn('mt-1 text-[10px]', isDarkMode ? 'text-white/35' : 'text-slate-500')}>WaveLab</div>
        </td>

        <td className="px-4 py-4 align-middle">
          <div className="flex min-w-[180px] items-center justify-end gap-2">
            {hasPackages && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 focus-visible:ring-cyan-300/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-300'
                )}
              >
                <Eye size={14} />
                {expanded ? 'Hide packages' : 'View packages'}
              </button>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => onToggle(model)}
              className={cn(
                'inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                model.enabled
                  ? isDarkMode
                    ? 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 focus-visible:ring-white/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300'
                  : isDarkMode
                    ? 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15 focus-visible:ring-blue-300/40'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-300'
              )}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : model.enabled ? 'Disable' : 'Enable'}
            </button>

            {!model.builtIn ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteModel(model)}
                title="Remove custom model"
                aria-label={`Remove ${model.label}`}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50',
                  isDarkMode
                    ? 'border-red-300/15 text-red-200 hover:bg-red-300/10 focus-visible:ring-red-300/40'
                    : 'border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-300'
                )}
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="More actions will be available for this built-in model later"
                aria-label={`More actions for ${model.label}`}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border opacity-50',
                  isDarkMode ? 'border-white/10 text-white/50' : 'border-slate-200 text-slate-500'
                )}
              >
                <MoreVertical size={15} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && hasPackages && (
        <tr>
          <td colSpan={8} className="p-0">
            <PackageList
              model={model}
              busyKey={busyKey}
              isDarkMode={isDarkMode}
              onDeletePackage={onDeletePackage}
            />
          </td>
        </tr>
      )}
    </>
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
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to load wave model inventory.') });
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
        setMessage({ type: 'error', text: normalizeError(error, 'Unable to load wave model inventory.') });
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
        const stateDelta = (STATE_ORDER[left.state] ?? 9) - (STATE_ORDER[right.state] ?? 9);
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
      disabled: models.filter((model) => model.state === 'disabled').length,
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
    await refreshAfter(() => deleteWaveModel(model.code), `${model.code} was removed from the registry.`);
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
    <section className="space-y-4 pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className={cn('max-w-3xl text-xs leading-relaxed', isDarkMode ? 'text-white/45' : 'text-slate-500')}>
          Monitor model availability, package inventory, and operational status from one managed registry.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 focus-visible:ring-white/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300'
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((value) => !value)}
            aria-expanded={showAdd}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2',
              isDarkMode
                ? 'bg-blue-500 text-white hover:bg-blue-400 focus-visible:ring-blue-300/50'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300'
            )}
          >
            <Plus size={14} />
            Register model
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={Layers3} label="Total models" value={summary.total} suffix="models" isDarkMode={isDarkMode} />
        <SummaryCard icon={CheckCircle2} label="Ready" value={summary.ready} suffix="models" isDarkMode={isDarkMode} tone="green" />
        <SummaryCard icon={AlertTriangle} label="Needs attention" value={summary.attention} suffix="models" isDarkMode={isDarkMode} tone="amber" />
        <SummaryCard icon={CircleMinus} label="Disabled" value={summary.disabled} suffix="models" isDarkMode={isDarkMode} tone="muted" />
        <SummaryCard icon={Box} label="Total packages" value={summary.packages} suffix="packages" isDarkMode={isDarkMode} />
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
            'rounded-2xl border p-4 shadow-sm',
            isDarkMode ? 'border-blue-400/15 bg-slate-950/60' : 'border-blue-200 bg-white'
          )}
        >
          <div className="grid gap-3 lg:grid-cols-[0.7fr_1fr_1.7fr_auto] lg:items-end">
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                Model code
              </span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                required
                maxLength={32}
                placeholder="MRI3"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white focus:border-blue-400/50 focus:ring-blue-400/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                Display name
              </span>
              <input
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                required
                maxLength={80}
                placeholder="Model name"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white focus:border-blue-400/50 focus:ring-blue-400/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>
                Description
              </span>
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={240}
                placeholder="Optional operational description"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white focus:border-blue-400/50 focus:ring-blue-400/20'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-blue-100'
                )}
              />
            </label>
            <button
              type="submit"
              disabled={busyKey === 'new:create'}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-black disabled:opacity-50',
                isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
              )}
            >
              {busyKey === 'new:create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Register
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={cn('flex min-h-56 items-center justify-center rounded-2xl border', isDarkMode ? 'border-white/10 bg-slate-950/45 text-white/45' : 'border-slate-200 bg-white text-slate-500')}>
          <Loader2 size={20} className="mr-2 animate-spin" />
          Loading model registry…
        </div>
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border shadow-sm',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead>
                <tr className={cn('border-b text-[10px] uppercase tracking-[0.1em]', isDarkMode ? 'border-white/10 bg-white/[0.025] text-white/35' : 'border-slate-200 bg-slate-50 text-slate-500')}>
                  <th className="px-4 py-3 font-black">Model</th>
                  <th className="px-3 py-3 font-black">Status</th>
                  <th className="px-3 py-3 font-black">Latest package</th>
                  <th className="px-3 py-3 font-black">Package count</th>
                  <th className="px-3 py-3 font-black">Importer</th>
                  <th className="px-3 py-3 font-black">Builder</th>
                  <th className="px-3 py-3 font-black">Registry</th>
                  <th className="px-4 py-3 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>

          <div className={cn('flex items-start gap-2 border-t px-4 py-3 text-[10px] leading-relaxed', isDarkMode ? 'border-white/10 bg-white/[0.02] text-white/35' : 'border-slate-200 bg-slate-50 text-slate-500')}>
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Package deletion is restricted to validated model/package identifiers inside the WaveLab tile root. Built-in models can be disabled but not removed.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
