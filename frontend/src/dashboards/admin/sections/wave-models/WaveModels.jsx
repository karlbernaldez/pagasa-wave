import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Waves,
} from 'lucide-react';

import {
  createWaveModel,
  deleteWaveModel,
  deleteWaveModelPackage,
  fetchWaveModels,
  runWaveModelBuilder,
  setWaveModelEnabled,
} from '@/api/waveModels';
import WaveModelDetail from './WaveModelDetail';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const STATE_ORDER = { active: 0, no_data: 1, disabled: 2 };

function normalizeError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unavailable';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unitIndex]}`;
}

function StatusBadge({ state, isDarkMode }) {
  const config = {
    active: {
      label: 'Ready',
      className: isDarkMode
        ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    no_data: {
      label: 'Needs attention',
      className: isDarkMode
        ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
        : 'border-amber-200 bg-amber-50 text-amber-700',
    },
    disabled: {
      label: 'Disabled',
      className: isDarkMode
        ? 'border-white/10 bg-white/5 text-slate-300'
        : 'border-slate-200 bg-slate-100 text-slate-600',
    },
  }[state] || {
    label: 'Unknown',
    className: isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, helper, isDarkMode }) {
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
        <div>
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
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
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={18} />
        </span>
      </div>
      <p
        className={cn(
          'mt-2 text-xs font-semibold',
          isDarkMode ? 'text-slate-500' : 'text-slate-500'
        )}
      >
        {helper}
      </p>
    </div>
  );
}

function ModelAvatar({ model, isDarkMode }) {
  return (
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[11px] font-black',
        isDarkMode
          ? 'border-cyan-300/15 bg-cyan-400/10 text-cyan-100'
          : 'border-cyan-100 bg-cyan-50 text-cyan-700'
      )}
    >
      {model.code.slice(0, 3)}
    </span>
  );
}

function ModelRegistryTable({ models, isDarkMode, onManage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr
            className={cn(
              'text-[10px] uppercase tracking-[0.1em]',
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            <th className="px-3 py-2.5 font-black">Model</th>
            <th className="px-3 py-2.5 font-black">Status</th>
            <th className="px-3 py-2.5 font-black">Latest Package</th>
            <th className="px-3 py-2.5 font-black">Packages</th>
            <th className="px-3 py-2.5 font-black">Storage</th>
            <th className="px-3 py-2.5 text-right font-black">Action</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr
              key={model.code}
              className={cn('border-t', isDarkMode ? 'border-white/[0.08]' : 'border-slate-100')}
            >
              <td className="px-3 py-3.5">
                <div className="flex min-w-[270px] items-center gap-3">
                  <ModelAvatar model={model} isDarkMode={isDarkMode} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong
                        className={cn(
                          'text-sm font-black',
                          isDarkMode ? 'text-white' : 'text-slate-950'
                        )}
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
                        'mt-1 max-w-[320px] truncate text-[11px]',
                        isDarkMode ? 'text-slate-500' : 'text-slate-500'
                      )}
                    >
                      {model.description || 'Managed WaveLab wave forecast model.'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge state={model.state} isDarkMode={isDarkMode} />
              </td>
              <td className="px-3 py-3.5">
                <p
                  className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}
                >
                  {model.latestPackage || '—'}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[10px]',
                    isDarkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  {model.operations?.sourceCycle
                    ? `Cycle ${model.operations.sourceCycle}`
                    : 'Current inventory'}
                </p>
              </td>
              <td className="px-3 py-3.5">
                <p
                  className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}
                >
                  {model.packageCount}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[10px]',
                    isDarkMode ? 'text-slate-500' : 'text-slate-500'
                  )}
                >
                  managed packages
                </p>
              </td>
              <td className="px-3 py-3.5">
                <p
                  className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}
                >
                  {formatBytes(model.operations?.diskBytes)}
                </p>
              </td>
              <td className="px-3 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => onManage(model.code)}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-black transition-colors',
                    isDarkMode
                      ? 'bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
                      : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                  )}
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  const [selectedCode, setSelectedCode] = useState(null);
  const [form, setForm] = useState({ code: '', label: '', description: '' });

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWaveModels();
      setModels(result?.models || []);
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

  const selectedModel = useMemo(
    () => models.find((model) => model.code === selectedCode) || null,
    [models, selectedCode]
  );

  const stats = useMemo(
    () => ({
      total: models.length,
      ready: models.filter((model) => model.state === 'active').length,
      attention: models.filter(
        (model) => model.state === 'no_data' || Boolean(model.operations?.lastError)
      ).length,
      running: models.filter((model) => model.operations?.service?.running).length,
    }),
    [models]
  );

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...models]
      .filter((model) => statusFilter === 'all' || model.state === statusFilter)
      .filter(
        (model) =>
          !normalizedQuery ||
          [model.code, model.label, model.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
      )
      .sort((left, right) => {
        const stateDelta = (STATE_ORDER[left.state] ?? 9) - (STATE_ORDER[right.state] ?? 9);
        return stateDelta || left.code.localeCompare(right.code);
      });
  }, [models, query, statusFilter]);

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

  const handleRunBuilder = async (model) => {
    if (
      !window.confirm(
        `Request a supervised ${model.code} builder run now? Existing systemd locking and validation rules still apply.`
      )
    )
      return;
    setBusyKey(`${model.code}:builder`);
    await refreshAfter(
      () => runWaveModelBuilder(model.code),
      `${model.code} builder run was requested.`
    );
  };

  const handleDeletePackages = async (model, packageTags) => {
    if (!packageTags.length) return;
    if (
      !window.confirm(
        `Permanently delete ${packageTags.length} eligible ${model.code} package${packageTags.length === 1 ? '' : 's'}? Only packages older than ${model.packageRetentionDays || 10} days are selectable, and the backend will verify retention again before each deletion.`
      )
    )
      return;

    let deletedCount = 0;
    setMessage(null);
    try {
      for (const packageTag of packageTags) {
        setBusyKey(`${model.code}:package:${packageTag}`);
        await deleteWaveModelPackage(model.code, packageTag);
        deletedCount += 1;
      }
      await loadModels();
      setMessage({
        type: 'success',
        text: `${deletedCount} ${model.code} package${deletedCount === 1 ? '' : 's'} deleted.`,
      });
    } catch (error) {
      await loadModels();
      setMessage({
        type: 'error',
        text: `${deletedCount ? `${deletedCount} package${deletedCount === 1 ? '' : 's'} deleted before the operation stopped. ` : ''}${normalizeError(error, 'Package deletion failed.')}`,
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteModel = async (model) => {
    if (
      !window.confirm(
        `Remove custom model ${model.code}? WaveLab only allows this after all model packages have been removed.`
      )
    )
      return;
    setBusyKey(`${model.code}:delete`);
    try {
      await deleteWaveModel(model.code);
      setSelectedCode(null);
      await loadModels();
      setMessage({ type: 'success', text: `${model.code} was removed from the registry.` });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to remove wave model.') });
    } finally {
      setBusyKey('');
    }
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

  if (selectedModel) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
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
        <WaveModelDetail
          model={selectedModel}
          busyKey={busyKey}
          isDarkMode={isDarkMode}
          onBack={() => setSelectedCode(null)}
          onToggle={handleToggle}
          onRunBuilder={handleRunBuilder}
          onDeletePackages={handleDeletePackages}
          onDeleteModel={handleDeleteModel}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
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
            {loading
              ? 'Loading model registry'
              : `${models.length} model${models.length === 1 ? '' : 's'} registered`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-colors disabled:opacity-60',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((value) => !value)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-cyan-500"
          >
            <Plus size={15} /> Register Model
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Total Models"
          value={stats.total}
          helper="Registered model sources"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={CheckCircle2}
          label="Ready"
          value={stats.ready}
          helper="Available to forecasters"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={stats.attention}
          helper="Data or service issue"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Activity}
          label="Builders Running"
          value={stats.running}
          helper="Active operational jobs"
          isDarkMode={isDarkMode}
        />
      </section>

      {showAdd && (
        <section
          className={cn(
            'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/70'
          )}
        >
          <form
            onSubmit={handleAdd}
            className="grid gap-3 lg:grid-cols-[0.7fr_1fr_1.7fr_auto] lg:items-end"
          >
            {[
              ['code', 'Model code', 'MRI3'],
              ['label', 'Model name', 'MRI III'],
              ['description', 'Description', 'Managed wave model description'],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="space-y-1">
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wide',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  {label}
                </span>
                <input
                  value={form[field]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]:
                        field === 'code' ? event.target.value.toUpperCase() : event.target.value,
                    }))
                  }
                  required={field !== 'description'}
                  maxLength={field === 'code' ? 32 : field === 'label' ? 80 : 300}
                  placeholder={placeholder}
                  className={cn(
                    'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none',
                    isDarkMode
                      ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500'
                      : 'border-slate-200 bg-white text-slate-900'
                  )}
                />
              </label>
            ))}
            <button
              type="submit"
              disabled={busyKey === 'new:create'}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            >
              {busyKey === 'new:create' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}{' '}
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
                  'min-h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500'
                    : 'border-slate-200 bg-white/80 text-slate-900'
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
                    'rounded-lg px-3 py-1.5 text-xs font-black',
                    statusFilter === value
                      ? isDarkMode
                        ? 'bg-cyan-400/15 text-cyan-200'
                        : 'bg-cyan-50 text-cyan-700'
                      : isDarkMode
                        ? 'text-slate-400 hover:bg-white/5'
                        : 'text-slate-500 hover:bg-slate-100'
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
              <Loader2 size={18} className="mr-2 animate-spin" /> Loading model registry…
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
            <ModelRegistryTable
              models={filteredModels}
              isDarkMode={isDarkMode}
              onManage={setSelectedCode}
            />
          )}
        </div>
      </section>
    </div>
  );
}
