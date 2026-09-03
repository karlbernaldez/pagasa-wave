import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleMinus,
  Clock3,
  Database,
  HardDrive,
  Layers3,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  TimerReset,
  Trash2,
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

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STAT_TONES = {
  cyan: { light: 'bg-cyan-50/80 text-cyan-700', dark: 'bg-cyan-400/10 text-cyan-200' },
  emerald: {
    light: 'bg-emerald-50/80 text-emerald-700',
    dark: 'bg-emerald-400/10 text-emerald-200',
  },
  amber: { light: 'bg-amber-50/80 text-amber-700', dark: 'bg-amber-400/10 text-amber-200' },
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

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Unavailable';
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatIsoDate(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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
        <div>
          <p className={cn('text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            {label}
          </p>
          <p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {value}
          </p>
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon size={21} />
        </span>
      </div>
      <p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
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
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black', tone)}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function ConfigState({ configured, isDarkMode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold', configured ? isDarkMode ? 'text-emerald-200' : 'text-emerald-700' : isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', configured ? 'bg-emerald-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300')} />
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

  return <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xs font-black', tone)}>{initials}</span>;
}

function OperationalState({ model, isDarkMode }) {
  const operations = model.operations;
  if (!operations?.supported) {
    return (
      <div>
        <p className={cn('text-xs font-black', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>Not configured</p>
        <p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-600' : 'text-slate-400')}>No automation</p>
      </div>
    );
  }

  const running = operations.service?.running;
  const timerActive = operations.timer?.active;
  const hasError = Boolean(operations.lastError);
  const label = hasError ? 'Attention' : running ? 'Building' : timerActive ? 'Scheduled' : 'Timer off';
  const dot = hasError ? 'bg-red-500' : running ? 'animate-pulse bg-cyan-400' : timerActive ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div>
      <p className={cn('inline-flex items-center gap-1.5 text-xs font-black', hasError ? 'text-red-300' : running ? 'text-cyan-200' : timerActive ? 'text-emerald-200' : 'text-amber-200')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
        {label}
      </p>
      <p className={cn('mt-1 max-w-[180px] truncate text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
        {running ? 'Builder service is running' : timerActive ? operations.timer?.nextRun || 'Next run scheduled' : operations.lastError || 'Automation is not active'}
      </p>
    </div>
  );
}

function OperationMetric({ icon: Icon, label, value, helper, isDarkMode, tone = 'cyan' }) {
  const iconTone = tone === 'emerald' ? isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700' : isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700';
  return (
    <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/80')}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', iconTone)}><Icon size={17} /></span>
        <div className="min-w-0">
          <p className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{label}</p>
          <p className={cn('mt-1 truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>{value}</p>
          {helper && <p className={cn('mt-1 truncate text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function PackageInventory({ model, busyKey, isDarkMode, onDeletePackage }) {
  if (!model.packages?.length) {
    return (
      <div className={cn('rounded-xl border border-dashed px-4 py-6 text-center', isDarkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500')}>
        <Database size={20} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs font-black">No generated packages yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead><tr className={isDarkMode ? 'bg-black/10 text-slate-500' : 'bg-white text-slate-500'}><th className="px-3 py-2 font-black uppercase tracking-wide">Package</th><th className="px-3 py-2 font-black uppercase tracking-wide">Data groups</th><th className="px-3 py-2 font-black uppercase tracking-wide">Status</th><th className="px-3 py-2 text-right font-black uppercase tracking-wide">Action</th></tr></thead>
        <tbody>
          {model.packages.map((pkg) => {
            const packageBusy = busyKey === `${model.code}:package:${pkg.packageTag}`;
            return (
              <tr key={pkg.packageTag} className={cn('border-t', isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                <td className={cn('px-3 py-2.5 font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>{pkg.packageTag}</td>
                <td className={cn('px-3 py-2.5', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{pkg.styles.join(', ')}</td>
                <td className="px-3 py-2.5 text-emerald-500">Ready</td>
                <td className="px-3 py-2.5 text-right">
                  <button type="button" disabled={packageBusy} onClick={() => onDeletePackage(model, pkg)} className={cn('inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black transition-colors disabled:opacity-50', isDarkMode ? 'text-red-200 hover:bg-red-400/10' : 'text-red-700 hover:bg-red-50')}>
                    {packageBusy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
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

function ModelDetails({ model, busyKey, isDarkMode, onToggle, onRunBuilder, onDeletePackage, onDeleteModel }) {
  const operations = model.operations;
  const operational = operations?.supported;
  const builderBusy = busyKey === `${model.code}:builder`;
  const otherBusy = busyKey?.startsWith(`${model.code}:`) && !builderBusy;

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className={cn('border-t px-5 py-5', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-100 bg-slate-50/70')}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div><p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{model.label} operations</p><p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>Builder health, schedule, source cycle, storage, and package controls.</p></div>
            <div className="flex flex-wrap gap-2">
              {operational && <button type="button" disabled={!operations.manualRun?.available || builderBusy} title={operations.manualRun?.reason || 'Request a supervised builder run'} onClick={() => onRunBuilder(model)} className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40">{builderBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}Run Builder</button>}
              <button type="button" disabled={otherBusy} onClick={() => onToggle(model)} className={cn('inline-flex min-h-9 items-center justify-center rounded-xl border px-3 py-2 text-xs font-black transition-colors disabled:opacity-50', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>{otherBusy ? <Loader2 size={13} className="animate-spin" /> : model.enabled ? 'Disable Model' : 'Enable Model'}</button>
              {!model.builtIn && <button type="button" disabled={otherBusy} onClick={() => onDeleteModel(model)} className={cn('inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-colors disabled:opacity-50', isDarkMode ? 'text-red-200 hover:bg-red-400/10' : 'text-red-700 hover:bg-red-50')}><Trash2 size={13} />Remove Model</button>}
            </div>
          </div>

          {operational ? (
            <>
              {operations.lastError && <div className={cn('mt-4 rounded-xl border px-4 py-3 text-xs font-semibold', isDarkMode ? 'border-red-300/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}>{operations.lastError}</div>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <OperationMetric icon={Activity} label="Builder service" value={operations.service?.running ? 'Running' : operations.service?.installed ? 'Idle' : 'Not installed'} helper={operations.service?.lastDurationSeconds != null ? `Last duration ${formatDuration(operations.service.lastDurationSeconds)}` : operations.service?.result || 'No completed run yet'} isDarkMode={isDarkMode} tone={operations.service?.running ? 'cyan' : 'emerald'} />
                <OperationMetric icon={TimerReset} label="Automation timer" value={operations.timer?.active ? 'Active' : operations.timer?.installed ? 'Inactive' : 'Not installed'} helper={operations.timer?.active ? operations.timer?.nextRun || 'Next run scheduled' : 'No next run'} isDarkMode={isDarkMode} tone={operations.timer?.active ? 'emerald' : 'amber'} />
                <OperationMetric icon={Clock3} label="Source cycle" value={operations.sourceCycle || 'Unavailable'} helper={operations.packageBuiltAt ? `Built ${formatIsoDate(operations.packageBuiltAt)}` : 'No package metadata'} isDarkMode={isDarkMode} />
                <OperationMetric icon={HardDrive} label="Model storage" value={formatBytes(operations.diskBytes)} helper={`${model.packageCount} managed ${model.packageCount === 1 ? 'package' : 'packages'}`} isDarkMode={isDarkMode} />
              </div>
            </>
          ) : (
            <div className={cn('mt-4 rounded-xl border border-dashed px-4 py-5', isDarkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500')}><p className="text-xs font-black">Operational automation is not configured for this model.</p><p className="mt-1 text-[11px]">Connect an importer and builder before service health, schedules, and supervised runs become available.</p></div>
          )}

          <div className="mt-5"><div className="mb-3 flex items-center gap-2"><Database size={15} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} /><div><p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Package inventory</p><p className={cn('mt-0.5 text-[11px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>Generated data groups managed by WaveLab.</p></div></div><PackageInventory model={model} busyKey={busyKey} isDarkMode={isDarkMode} onDeletePackage={onDeletePackage} /></div>
        </div>
      </td>
    </tr>
  );
}

function ModelRow({ model, isDarkMode, expanded, busyKey, onExpand, onToggle, onRunBuilder, onDeletePackage, onDeleteModel }) {
  return (
    <>
      <tr className={cn('border-t first:border-t-0', isDarkMode ? 'border-white/[0.08]' : 'border-slate-100')}>
        <td className="px-3 py-3.5 align-middle"><div className="flex min-w-[250px] items-center gap-3"><ModelAvatar model={model} isDarkMode={isDarkMode} /><div className="min-w-0"><div className="flex items-center gap-2"><strong className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{model.label}</strong><span className={cn('rounded px-1.5 py-0.5 text-[9px] font-black', isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500')}>{model.code}</span></div><p className={cn('mt-1 max-w-[250px] text-[11px] leading-relaxed', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{model.description || 'Managed WaveLab wave forecast model.'}</p></div></div></td>
        <td className="px-3 py-3.5 align-middle"><StatusBadge state={model.state} isDarkMode={isDarkMode} /></td>
        <td className="px-3 py-3.5 align-middle">{model.latestPackage ? <div><p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>{model.latestPackage}</p><p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{model.operations?.sourceCycle ? `Cycle ${model.operations.sourceCycle}` : 'Latest package'}</p></div> : <div><p className={cn('text-sm font-black', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>—</p><p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-600' : 'text-slate-400')}>{model.state === 'disabled' ? 'No data feed yet' : 'No package yet'}</p></div>}</td>
        <td className="px-3 py-3.5 align-middle"><div className="space-y-1"><ConfigState configured={model.importerConfigured} isDarkMode={isDarkMode} /><div /><ConfigState configured={model.builderConfigured} isDarkMode={isDarkMode} /></div></td>
        <td className="px-3 py-3.5 align-middle"><OperationalState model={model} isDarkMode={isDarkMode} /></td>
        <td className="px-3 py-3.5 align-middle"><p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-800')}>{formatBytes(model.operations?.diskBytes)}</p><p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{model.packageCount} {model.packageCount === 1 ? 'package' : 'packages'}</p></td>
        <td className="px-3 py-3.5 text-right align-middle"><button type="button" onClick={() => onExpand(model.code)} aria-expanded={expanded} className={cn('inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black transition-colors', isDarkMode ? 'bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100')}>Manage{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button></td>
      </tr>
      {expanded && <ModelDetails model={model} busyKey={busyKey} isDarkMode={isDarkMode} onToggle={onToggle} onRunBuilder={onRunBuilder} onDeletePackage={onDeletePackage} onDeleteModel={onDeleteModel} />}
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
  const [expandedCode, setExpandedCode] = useState(null);
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
    fetchWaveModels().then((result) => { if (!active) return; setModels(result?.models || []); setMessage(null); }).catch((error) => { if (!active) return; setMessage({ type: 'error', text: normalizeError(error, 'Unable to load wave model inventory.') }); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => ({
    total: models.length,
    ready: models.filter((model) => model.state === 'active').length,
    attention: models.filter((model) => model.state === 'no_data' || Boolean(model.operations?.lastError)).length,
    running: models.filter((model) => model.operations?.service?.running).length,
  }), [models]);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...models].filter((model) => statusFilter === 'all' || model.state === statusFilter).filter((model) => !normalizedQuery || [model.code, model.label, model.description].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)).sort((left, right) => {
      const stateDelta = (STATE_ORDER[left.state] ?? 9) - (STATE_ORDER[right.state] ?? 9);
      return stateDelta || left.code.localeCompare(right.code);
    });
  }, [models, query, statusFilter]);

  const resultText = loading ? 'Loading model registry' : query.trim() || statusFilter !== 'all' ? `${filteredModels.length} matching model${filteredModels.length === 1 ? '' : 's'}` : `${models.length} model${models.length === 1 ? '' : 's'} registered`;

  const refreshAfter = async (action, successText) => {
    try { await action(); await loadModels(); setMessage({ type: 'success', text: successText }); }
    catch (error) { setMessage({ type: 'error', text: normalizeError(error, 'Wave model operation failed.') }); }
    finally { setBusyKey(''); }
  };

  const handleToggle = async (model) => {
    setBusyKey(`${model.code}:availability`);
    await refreshAfter(() => setWaveModelEnabled(model.code, !model.enabled), `${model.label} has been ${model.enabled ? 'disabled' : 'enabled'}.`);
  };

  const handleRunBuilder = async (model) => {
    if (!window.confirm(`Request a supervised ${model.code} builder run now? The existing systemd builder lock and validation rules still apply.`)) return;
    setBusyKey(`${model.code}:builder`);
    await refreshAfter(() => runWaveModelBuilder(model.code), `${model.code} builder run was requested. Refresh in a few seconds to see the running state.`);
  };

  const handleDeletePackage = async (model, pkg) => {
    if (!window.confirm(`Delete ${model.code} package ${pkg.packageTag}? This permanently removes its managed tile/contour directories and cannot be undone.`)) return;
    setBusyKey(`${model.code}:package:${pkg.packageTag}`);
    await refreshAfter(() => deleteWaveModelPackage(model.code, pkg.packageTag), `${model.code} package ${pkg.packageTag} was deleted.`);
  };

  const handleDeleteModel = async (model) => {
    if (!window.confirm(`Remove custom model ${model.code}? WaveLab will only allow this after all of its packages have been removed.`)) return;
    setBusyKey(`${model.code}:delete`);
    await refreshAfter(() => deleteWaveModel(model.code), `${model.code} was removed from the registry.`);
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setBusyKey('new:create');
    try { await createWaveModel(form); setForm({ code: '', label: '', description: '' }); setShowAdd(false); await loadModels(); setMessage({ type: 'success', text: 'Wave model was registered in a disabled state.' }); }
    catch (error) { setMessage({ type: 'error', text: normalizeError(error, 'Unable to add wave model.') }); }
    finally { setBusyKey(''); }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>Model operations</p><p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{resultText}</p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => void loadModels()} disabled={loading} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors disabled:opacity-60', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white')}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button>
          <button type="button" onClick={() => setShowAdd((value) => !value)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500"><Plus size={15} />Register Model</button>
        </div>
      </section>

      {message && <section role="status" className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl', message.type === 'error' ? isDarkMode ? 'border-red-300/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50/80 text-red-800' : isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50/80 text-emerald-800')}>{message.text}</section>}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Layers3} label="Total Models" value={stats.total} helper="Registered model sources" color="cyan" isDarkMode={isDarkMode} />
        <StatCard icon={CheckCircle2} label="Ready" value={stats.ready} helper="Available to forecasters" color="emerald" isDarkMode={isDarkMode} />
        <StatCard icon={AlertTriangle} label="Needs Attention" value={stats.attention} helper="Data or service issue" color="amber" isDarkMode={isDarkMode} />
        <StatCard icon={Activity} label="Builders Running" value={stats.running} helper="Active operational jobs" color="cyan" isDarkMode={isDarkMode} />
      </section>

      {showAdd && <section className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}><form onSubmit={handleAdd} className="grid gap-3 lg:grid-cols-[0.7fr_1fr_1.7fr_auto] lg:items-end"><label className="space-y-1"><span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Model code</span><input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} required maxLength={32} placeholder="MRI3" className={cn('min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900')} /></label><label className="space-y-1"><span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Display name</span><input value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} required maxLength={80} placeholder="Model name" className={cn('min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900')} /></label><label className="space-y-1"><span className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Description</span><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={240} placeholder="Optional operational description" className={cn('min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-900')} /></label><button type="submit" disabled={busyKey === 'new:create'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{busyKey === 'new:create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Register</button></form></section>}

      <section className={cn('overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
        <div className={cn('border-b px-4 py-4 sm:px-5', isDarkMode ? 'border-white/10' : 'border-white/70')}><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative flex-1"><Search size={15} className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-slate-500' : 'text-slate-400')} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by model name, code, or description..." className={cn('min-h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none', isDarkMode ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500' : 'border-slate-200 bg-white/80 text-slate-900')} /></div><div className={cn('flex flex-wrap gap-1 rounded-xl border p-1', isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white/80')}>{[['all', 'All'], ['active', 'Ready'], ['no_data', 'Needs attention'], ['disabled', 'Disabled']].map(([value, label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-black', statusFilter === value ? isDarkMode ? 'bg-cyan-400/15 text-cyan-200' : 'bg-cyan-50 text-cyan-700' : isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100')}>{label}</button>)}</div></div></div>
        <div className="px-4 py-4 sm:px-5">
          {loading ? <div className={cn('flex min-h-56 items-center justify-center text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}><Loader2 size={18} className="mr-2 animate-spin" />Loading model operations…</div> : filteredModels.length === 0 ? <div className={cn('flex min-h-56 flex-col items-center justify-center text-center', isDarkMode ? 'text-slate-500' : 'text-slate-500')}><Waves size={24} className="mb-2 opacity-50" /><p className="text-sm font-black">No wave models match this view.</p><p className="mt-1 text-xs">Try another search term or status filter.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1220px] text-left"><thead><tr className={cn('text-[10px] uppercase tracking-[0.1em]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}><th className="px-3 py-2.5 font-black">Model</th><th className="px-3 py-2.5 font-black">Status</th><th className="px-3 py-2.5 font-black">Latest Package</th><th className="px-3 py-2.5 font-black">Pipeline</th><th className="px-3 py-2.5 font-black">Automation</th><th className="px-3 py-2.5 font-black">Storage</th><th className="px-3 py-2.5 text-right font-black">Actions</th></tr></thead><tbody>{filteredModels.map((model) => <ModelRow key={model.code} model={model} isDarkMode={isDarkMode} expanded={expandedCode === model.code} busyKey={busyKey} onExpand={(code) => setExpandedCode((current) => current === code ? null : code)} onToggle={handleToggle} onRunBuilder={handleRunBuilder} onDeletePackage={handleDeletePackage} onDeleteModel={handleDeleteModel} />)}</tbody></table></div>}
          <div className={cn('mt-4 border-t pt-3 text-[10px] leading-relaxed', isDarkMode ? 'border-white/[0.08] text-slate-600' : 'border-slate-100 text-slate-400')}>Manual builder requests use controlled systemd path triggers. Package deletion remains restricted to validated model/package identifiers inside the WaveLab tile root.</div>
        </div>
      </section>
    </div>
  );
}
