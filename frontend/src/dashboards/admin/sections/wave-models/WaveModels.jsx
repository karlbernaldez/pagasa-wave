import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
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
  active: { label: 'Active', icon: CheckCircle2 },
  disabled: { label: 'Disabled', icon: Power },
  no_data: { label: 'No data', icon: AlertCircle },
};

function normalizeError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function StatusPill({ state, isDarkMode }) {
  const meta = STATE_META[state] || STATE_META.no_data;
  const Icon = meta.icon;
  const tone =
    state === 'active'
      ? isDarkMode
        ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/20'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : state === 'disabled'
        ? isDarkMode
          ? 'bg-white/5 text-white/45 ring-white/10'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
        : isDarkMode
          ? 'bg-amber-300/10 text-amber-200 ring-amber-300/20'
          : 'bg-amber-50 text-amber-700 ring-amber-200';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1', tone)}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function Metric({ label, value, isDarkMode }) {
  return (
    <div className={cn('rounded-xl border px-3 py-2.5', isDarkMode ? 'border-white/10 bg-white/[0.035]' : 'border-slate-200 bg-white')}>
      <div className={cn('text-[9px] font-black uppercase tracking-[0.12em]', isDarkMode ? 'text-white/35' : 'text-slate-400')}>
        {label}
      </div>
      <div className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-white/85' : 'text-slate-900')}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function ModelCard({ model, isDarkMode, busyKey, onToggle, onDeletePackage, onDeleteModel }) {
  const [expanded, setExpanded] = useState(false);
  const busy = busyKey?.startsWith(`${model.code}:`);

  return (
    <article className={cn('overflow-hidden rounded-2xl border shadow-sm', isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-white')}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-blue-100 bg-blue-50 text-blue-700')}>
              <Waves size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                  {model.label}
                </h3>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider', isDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500')}>
                  {model.code}
                </span>
                <StatusPill state={model.state} isDarkMode={isDarkMode} />
              </div>
              <p className={cn('mt-1 max-w-2xl text-xs leading-relaxed', isDarkMode ? 'text-white/45' : 'text-slate-500')}>
                {model.description || 'Managed WaveLab wave forecast model.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggle(model)}
              className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50', model.enabled ? (isDarkMode ? 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50') : isDarkMode ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/15' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
              {model.enabled ? 'Disable' : 'Enable'}
            </button>
            {!model.builtIn && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteModel(model)}
                className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50', isDarkMode ? 'border-red-300/20 bg-red-300/10 text-red-200 hover:bg-red-300/15' : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100')}
              >
                <Trash2 size={14} />
                Remove model
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Metric label="Packages" value={model.packageCount} isDarkMode={isDarkMode} />
          <Metric label="Latest package" value={model.latestPackage || 'None'} isDarkMode={isDarkMode} />
          <Metric label="Importer" value={model.importerConfigured ? 'Configured' : 'Not configured'} isDarkMode={isDarkMode} />
          <Metric label="Builder" value={model.builderConfigured ? 'Configured' : 'Not configured'} isDarkMode={isDarkMode} />
          <Metric label="Registry" value={model.builtIn ? 'Built-in' : 'Custom'} isDarkMode={isDarkMode} />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={cn('mt-4 inline-flex items-center gap-2 text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-blue-700')}
        >
          <Archive size={14} />
          {expanded ? 'Hide packages' : 'View packages'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className={cn('border-t px-4 py-4 sm:px-5', isDarkMode ? 'border-white/10 bg-black/10' : 'border-slate-100 bg-slate-50/70')}>
          {model.packages.length === 0 ? (
            <div className={cn('rounded-xl border border-dashed px-4 py-8 text-center', isDarkMode ? 'border-white/10 text-white/35' : 'border-slate-300 text-slate-500')}>
              <Database size={22} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">No generated tile packages are connected to this model.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
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
                      <tr key={pkg.packageTag} className={cn('border-b last:border-b-0', isDarkMode ? 'border-white/[0.06] text-white/70' : 'border-slate-100 text-slate-700')}>
                        <td className="px-2 py-3 font-black">{pkg.packageTag}</td>
                        <td className="px-2 py-3">{pkg.styles.join(', ')}</td>
                        <td className="px-2 py-3">Ready</td>
                        <td className="px-2 py-3 text-right">
                          <button
                            type="button"
                            disabled={packageBusy}
                            onClick={() => onDeletePackage(model, pkg)}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-black transition disabled:opacity-50', isDarkMode ? 'bg-red-300/10 text-red-200 hover:bg-red-300/15' : 'bg-red-50 text-red-700 hover:bg-red-100')}
                          >
                            {packageBusy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete package
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to load wave model inventory.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const summary = useMemo(
    () => ({
      active: models.filter((model) => model.state === 'active').length,
      disabled: models.filter((model) => model.state === 'disabled').length,
      noData: models.filter((model) => model.state === 'no_data').length,
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
      setMessage({ type: 'success', text: 'Wave model was added in a disabled state.' });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to add wave model.') });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ServerCog size={20} className={isDarkMode ? 'text-cyan-300' : 'text-blue-700'} />
            <h2 className={cn('text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Wave Model Management
            </h2>
          </div>
          <p className={cn('mt-1 max-w-3xl text-xs leading-relaxed', isDarkMode ? 'text-white/45' : 'text-slate-500')}>
            Monitor model availability and generated tile packages. Model codes map only to WaveLab-managed tile directories; arbitrary server paths are never accepted here.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black', isDarkMode ? 'border-white/10 bg-white/5 text-white/65' : 'border-slate-200 bg-white text-slate-700')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((value) => !value)}
            className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black', isDarkMode ? 'bg-cyan-300 text-slate-950' : 'bg-blue-600 text-white')}
          >
            <Plus size={14} />
            Add wave model
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="Active models" value={summary.active} isDarkMode={isDarkMode} />
        <Metric label="Disabled models" value={summary.disabled} isDarkMode={isDarkMode} />
        <Metric label="Enabled / no data" value={summary.noData} isDarkMode={isDarkMode} />
        <Metric label="Managed packages" value={summary.packages} isDarkMode={isDarkMode} />
      </div>

      {message && (
        <div className={cn('rounded-xl border px-4 py-3 text-xs font-bold', message.type === 'error' ? (isDarkMode ? 'border-red-300/20 bg-red-300/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700') : isDarkMode ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
          {message.text}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className={cn('rounded-2xl border p-4 sm:p-5', isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-white')}>
          <div className="flex items-center gap-2">
            <Plus size={16} />
            <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>Register a wave model</h3>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>Model code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                required
                maxLength={32}
                placeholder="e.g. MRI3"
                className={cn('w-full rounded-lg border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-cyan-300/40' : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400')}
              />
            </label>
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>Display name</span>
              <input
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                required
                maxLength={80}
                placeholder="Model name"
                className={cn('w-full rounded-lg border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-cyan-300/40' : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400')}
              />
            </label>
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-white/40' : 'text-slate-500')}>Description</span>
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={240}
                placeholder="Optional description"
                className={cn('w-full rounded-lg border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-cyan-300/40' : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400')}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busyKey === 'new:create'}
              className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black disabled:opacity-50', isDarkMode ? 'bg-cyan-300 text-slate-950' : 'bg-blue-600 text-white')}
            >
              {busyKey === 'new:create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Register model
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className={cn('rounded-lg px-3 py-2 text-xs font-black', isDarkMode ? 'bg-white/5 text-white/55' : 'bg-slate-100 text-slate-600')}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={cn('flex min-h-48 items-center justify-center rounded-2xl border', isDarkMode ? 'border-white/10 bg-slate-950/45 text-white/45' : 'border-slate-200 bg-white text-slate-500')}>
          <Loader2 size={22} className="mr-2 animate-spin" />
          Loading wave model inventory…
        </div>
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <ModelCard
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

      <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', isDarkMode ? 'border-white/10 bg-white/[0.035] text-white/45' : 'border-slate-200 bg-slate-50 text-slate-500')}>
        <HardDrive size={16} className="mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          Package deletion is intentionally limited to validated model and package identifiers below the WaveLab tile root. Built-in model registry entries cannot be removed; disable them when they should not be used.
        </p>
      </div>
    </section>
  );
}
