import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  Loader2,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { fetchWaveSourceCyclePolicy, setWaveSourceCyclePolicy } from '@/api/waveModels';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const PAGE_SIZE = 10;
const OPERATIONAL_MODELS = new Set(['WW3', 'ECWAM']);

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

function formatPackageDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function Card({ children, isDarkMode, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/75 shadow-slate-300/40',
        className
      )}
    >
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value, helper, isDarkMode }) {
  return (
    <Card isDarkMode={isDarkMode} className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            {label}
          </p>
          <p className={cn('mt-1 text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {value}
          </p>
          {helper && (
            <p className={cn('mt-1 text-[11px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
              {helper}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function OverviewTab({ model, isDarkMode }) {
  const operations = model.operations;
  const builderState = !operations?.supported
    ? 'Not configured'
    : operations.service?.running
      ? 'Running'
      : operations.service?.installed
        ? 'Idle'
        : 'Not installed';
  const timerState = !operations?.supported
    ? 'Not configured'
    : operations.timer?.active
      ? 'Active'
      : operations.timer?.installed
        ? 'Inactive'
        : 'Not installed';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Database}
          label="Packages"
          value={model.packageCount}
          helper={model.latestPackage ? `Latest ${model.latestPackage}` : 'No generated package'}
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={Activity}
          label="Builder"
          value={builderState}
          helper={operations?.service?.result || 'Operational builder state'}
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={Clock3}
          label="Automation"
          value={timerState}
          helper={operations?.timer?.nextRun || 'No next run available'}
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={HardDrive}
          label="Storage"
          value={formatBytes(operations?.diskBytes)}
          helper="Managed model package storage"
          isDarkMode={isDarkMode}
        />
      </div>

      <Card isDarkMode={isDarkMode} className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
              isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
            )}
          >
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Model readiness
            </p>
            <p className={cn('mt-1 text-xs leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
              {model.description || 'Managed WaveLab wave forecast model.'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Availability', model.enabled ? 'Enabled' : 'Disabled'],
                ['Importer', model.importerConfigured ? 'Configured' : 'Not configured'],
                [
                  'Builder / runtime',
                  model.builderConfigured || model.runtimeConfigured ? 'Configured' : 'Not configured',
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={cn(
                    'rounded-xl border px-3 py-3',
                    isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/80'
                  )}
                >
                  <p className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                    {label}
                  </p>
                  <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ConfigurationTab({ model, isDarkMode }) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(OPERATIONAL_MODELS.has(model.code));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const operational = OPERATIONAL_MODELS.has(model.code);

  useEffect(() => {
    if (!operational) return undefined;
    let active = true;
    setLoading(true);
    fetchWaveSourceCyclePolicy(model.code)
      .then((result) => {
        if (active) setPolicy(result?.policy || null);
      })
      .catch((error) => {
        if (!active) return;
        setMessage({
          type: 'error',
          text: error?.response?.data?.message || error?.message || 'Unable to load source-cycle policy.',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [model.code, operational]);

  const handleCycleChange = async (preferredHourUtc) => {
    const previous = policy?.preferredHourUtc;
    if (preferredHourUtc === previous) return;
    const label = `${String(preferredHourUtc).padStart(2, '0')}Z`;
    if (
      !window.confirm(
        `Change ${model.code} preferred source cycle to ${label}? This takes effect immediately for new package selection.`
      )
    )
      return;

    setBusy(true);
    setMessage(null);
    try {
      const result = await setWaveSourceCyclePolicy(model.code, preferredHourUtc);
      setPolicy(result?.policy || null);
      setMessage({ type: 'success', text: `${model.code} preferred source cycle is now ${label}.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || error?.message || 'Unable to update source-cycle policy.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card isDarkMode={isDarkMode} className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
              isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
            )}
          >
            <Settings2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Runtime configuration
            </p>
            <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Configuration is model-specific. Dedicated WW3 and ECWAM operational controls remain separate from managed custom runtime profiles.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white')}>
                <p className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                  Importer
                </p>
                <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  {model.importerConfigured ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className={cn('rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white')}>
                <p className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                  Builder / runtime
                </p>
                <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  {model.builderConfigured || model.runtimeConfigured ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {operational && (
        <Card isDarkMode={isDarkMode} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Preferred source cycle
              </p>
              <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                Select the UTC source cycle used for the Manila package date. Fallback remains disabled.
              </p>
            </div>
            {(loading || busy) && <Loader2 size={16} className="animate-spin text-cyan-500" />}
          </div>

          {message && (
            <div
              className={cn(
                'mt-3 rounded-xl border px-3 py-2 text-xs font-semibold',
                message.type === 'error'
                  ? isDarkMode
                    ? 'border-red-300/20 bg-red-400/10 text-red-200'
                    : 'border-red-200 bg-red-50 text-red-800'
                  : isDarkMode
                    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              {message.text}
            </div>
          )}

          <label className="mt-4 block max-w-sm">
            <span className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Preferred cycle
            </span>
            <select
              value={policy?.preferredHourUtc ?? 18}
              disabled={loading || busy || !policy}
              onChange={(event) => void handleCycleChange(Number(event.target.value))}
              className={cn(
                'mt-1 min-h-10 w-full rounded-xl border px-3 py-2 text-sm font-black outline-none disabled:opacity-60',
                isDarkMode
                  ? 'border-white/10 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            >
              {(policy?.allowedHoursUtc || [0, 6, 12, 18]).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}Z
                </option>
              ))}
            </select>
          </label>
        </Card>
      )}
    </div>
  );
}

function PackagesTab({ model, busyKey, isDarkMode, onDeletePackages }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const packages = model.packages || [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return packages.filter(
      (pkg) =>
        !needle ||
        pkg.packageTag.toLowerCase().includes(needle) ||
        (pkg.styles || []).join(' ').toLowerCase().includes(needle)
    );
  }, [packages, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const deletableVisible = visible.filter((pkg) => pkg.retention?.deletable);
  const selectedSet = new Set(selected);
  const allVisibleSelected =
    deletableVisible.length > 0 && deletableVisible.every((pkg) => selectedSet.has(pkg.packageTag));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    const valid = new Set(packages.filter((pkg) => pkg.retention?.deletable).map((pkg) => pkg.packageTag));
    setSelected((current) => current.filter((tag) => valid.has(tag)));
  }, [packages]);

  const togglePackage = (pkg) => {
    if (!pkg.retention?.deletable) return;
    setSelected((current) =>
      current.includes(pkg.packageTag)
        ? current.filter((tag) => tag !== pkg.packageTag)
        : [...current, pkg.packageTag]
    );
  };

  const toggleVisible = () => {
    const visibleTags = deletableVisible.map((pkg) => pkg.packageTag);
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((tag) => !visibleTags.includes(tag));
      return [...new Set([...current, ...visibleTags])];
    });
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    await onDeletePackages(model, selected);
    setSelected([]);
  };

  return (
    <Card isDarkMode={isDarkMode} className="overflow-hidden">
      <div className={cn('border-b p-4 sm:p-5', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Package inventory
            </p>
            <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Packages are protected until they are older than {model.packageRetentionDays || 10} days. Retention is enforced by the backend.
            </p>
          </div>
          <button
            type="button"
            disabled={!selected.length || busyKey.startsWith(`${model.code}:package:`)}
            onClick={() => void handleBulkDelete()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busyKey.startsWith(`${model.code}:package:`) ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete selected ({selected.length})
          </button>
        </div>
        <div className="relative mt-4 max-w-xl">
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
            placeholder="Search package or data group..."
            className={cn(
              'min-h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500'
                : 'border-slate-200 bg-white text-slate-900'
            )}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={cn('px-5 py-12 text-center text-sm font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
          No packages match this view.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead>
                <tr className={isDarkMode ? 'bg-black/10 text-slate-500' : 'bg-slate-50 text-slate-500'}>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      disabled={deletableVisible.length === 0}
                      aria-label="Select deletable packages on this page"
                    />
                  </th>
                  <th className="px-3 py-3 font-black uppercase tracking-wide">Package</th>
                  <th className="px-3 py-3 font-black uppercase tracking-wide">Package date</th>
                  <th className="px-3 py-3 font-black uppercase tracking-wide">Data groups</th>
                  <th className="px-3 py-3 font-black uppercase tracking-wide">Retention</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((pkg) => {
                  const protectedPackage = !pkg.retention?.deletable;
                  return (
                    <tr key={pkg.packageTag} className={cn('border-t', isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(pkg.packageTag)}
                          onChange={() => togglePackage(pkg)}
                          disabled={protectedPackage}
                          title={pkg.retention?.reason || 'Eligible for deletion'}
                          aria-label={`Select ${pkg.packageTag}`}
                        />
                      </td>
                      <td className={cn('px-3 py-3 font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                        {pkg.packageTag}
                      </td>
                      <td className={cn('px-3 py-3', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        {formatPackageDate(pkg.retention?.packageDate)}
                      </td>
                      <td className={cn('px-3 py-3', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        {(pkg.styles || []).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-3">
                        {pkg.retention?.deletable ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-black text-emerald-500">
                            <CheckCircle2 size={12} /> Eligible
                          </span>
                        ) : (
                          <div>
                            <span className={cn('font-black', isDarkMode ? 'text-amber-200' : 'text-amber-700')}>
                              Protected
                            </span>
                            <p className={cn('mt-1 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                              {pkg.retention?.deleteAfter
                                ? `Until ${formatPackageDate(pkg.retention.deleteAfter)}`
                                : 'Age unavailable'}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn('flex flex-col gap-3 border-t px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between', isDarkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-500')}>
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className={cn('rounded-lg border px-3 py-1.5 font-black disabled:opacity-40', isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700')}
              >
                Previous
              </button>
              <span className="font-black">{currentPage} / {pageCount}</span>
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                className={cn('rounded-lg border px-3 py-1.5 font-black disabled:opacity-40', isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700')}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function ActivityTab({ model, isDarkMode }) {
  const operations = model.operations;
  const events = [
    {
      label: 'Builder service',
      value: operations?.service?.running ? 'Running now' : operations?.service?.result || 'No completed result',
      helper: operations?.service?.lastDurationSeconds != null
        ? `Last duration ${Math.round(operations.service.lastDurationSeconds)} seconds`
        : null,
    },
    {
      label: 'Last package build',
      value: formatIsoDate(operations?.packageBuiltAt),
      helper: operations?.sourceCycle ? `Source cycle ${operations.sourceCycle}` : null,
    },
    {
      label: 'Automation schedule',
      value: operations?.timer?.active ? 'Timer active' : 'Timer inactive',
      helper: operations?.timer?.nextRun || 'No next run reported',
    },
    {
      label: 'Last operational error',
      value: operations?.lastError || 'No current operational error',
      helper: null,
    },
  ];

  return (
    <Card isDarkMode={isDarkMode} className="p-5">
      <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
        Runtime activity
      </p>
      <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
        Current operational signals reported by the model service. This is not a replacement for the audit log.
      </p>
      <div className="mt-4 divide-y divide-white/10">
        {events.map((event) => (
          <div key={event.label} className="py-4 first:pt-0 last:pb-0">
            <p className={cn('text-[10px] font-black uppercase tracking-wide', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
              {event.label}
            </p>
            <p className={cn('mt-1 text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
              {event.value}
            </p>
            {event.helper && (
              <p className={cn('mt-1 text-[11px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                {event.helper}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function WaveModelDetail({
  model,
  busyKey,
  isDarkMode,
  onBack,
  onToggle,
  onRunBuilder,
  onDeletePackages,
  onDeleteModel,
}) {
  const [tab, setTab] = useState('overview');
  const operations = model.operations;
  const builderBusy = busyKey === `${model.code}:builder`;
  const modelBusy = busyKey.startsWith(`${model.code}:`) && !busyKey.includes(':package:');

  const tabs = [
    ['overview', 'Overview'],
    ['configuration', 'Configuration'],
    ['packages', `Packages (${model.packageCount})`],
    ['activity', 'Activity'],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
            aria-label="Back to model registry"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn('text-xl font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {model.label}
              </h2>
              <span className={cn('rounded-md px-2 py-1 text-[10px] font-black', isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500')}>
                {model.code}
              </span>
            </div>
            <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Dedicated model management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {operations?.supported && (
            <button
              type="button"
              disabled={!operations.manualRun?.available || builderBusy}
              onClick={() => onRunBuilder(model)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {builderBusy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Run Builder
            </button>
          )}
          <button
            type="button"
            disabled={modelBusy}
            onClick={() => onToggle(model)}
            className={cn(
              'inline-flex min-h-10 items-center rounded-xl border px-4 py-2 text-sm font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            {model.enabled ? 'Disable Model' : 'Enable Model'}
          </button>
          {!model.builtIn && (
            <button
              type="button"
              disabled={modelBusy}
              onClick={() => onDeleteModel(model)}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-50',
                isDarkMode ? 'text-red-200 hover:bg-red-400/10' : 'text-red-700 hover:bg-red-50'
              )}
            >
              <Trash2 size={14} /> Remove Model
            </button>
          )}
        </div>
      </div>

      <div className={cn('flex overflow-x-auto rounded-xl border p-1', isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white/80')}>
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-black transition-colors',
              tab === value
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

      {tab === 'overview' && <OverviewTab model={model} isDarkMode={isDarkMode} />}
      {tab === 'configuration' && <ConfigurationTab model={model} isDarkMode={isDarkMode} />}
      {tab === 'packages' && (
        <PackagesTab
          model={model}
          busyKey={busyKey}
          isDarkMode={isDarkMode}
          onDeletePackages={onDeletePackages}
        />
      )}
      {tab === 'activity' && <ActivityTab model={model} isDarkMode={isDarkMode} />}
    </div>
  );
}
