import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  TimerOff,
  TimerReset,
} from 'lucide-react';

import {
  disableWaveModelSchedule,
  enableWaveModelSchedule,
  fetchWaveModels,
  restoreWaveModelSchedule,
  runWaveModelBuilder,
  setWaveModelSchedule,
} from '@/api/waveModels';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const normalizeError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
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
};

const scheduleLabel = (schedule) => {
  if (!schedule) return 'Unavailable';
  if (schedule.mode === 'interval') {
    if (schedule.everyMinutes % 60 === 0) {
      const hours = schedule.everyMinutes / 60;
      return `Every ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `Every ${schedule.everyMinutes} minutes`;
  }
  if (schedule.mode === 'daily') {
    return `${schedule.times?.join(', ') || 'No times'} · ${schedule.timezone || 'No timezone'}`;
  }
  return 'Unavailable';
};

const toForm = (model) => {
  const schedule = model.operations?.schedule?.schedule || { mode: 'interval', everyMinutes: 60 };
  return {
    mode: schedule.mode || 'interval',
    everyMinutes: String(schedule.everyMinutes || 60),
    times: (schedule.times || ['06:00']).join(', '),
    timezone: schedule.timezone || 'Asia/Manila',
  };
};

function Metric({ icon: Icon, label, value, isDarkMode }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/80'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={17} />
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
          <p
            className={cn(
              'mt-1 break-words text-sm font-black',
              isDarkMode ? 'text-white' : 'text-slate-900'
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScheduleEditor({ model, form, setForm, busy, isDarkMode, onSave, onCancel }) {
  return (
    <form
      onSubmit={onSave}
      className={cn(
        'mt-4 rounded-xl border p-4',
        isDarkMode ? 'border-cyan-300/15 bg-cyan-400/[0.04]' : 'border-cyan-100 bg-cyan-50/50'
      )}
    >
      <div className="grid gap-3 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wide">Schedule type</span>
          <select
            value={form.mode}
            onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}
            className={cn(
              'min-h-10 w-full rounded-lg border px-3 text-sm',
              isDarkMode
                ? 'border-white/10 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            )}
          >
            <option value="interval">Interval</option>
            <option value="daily">Daily</option>
          </select>
        </label>

        {form.mode === 'interval' ? (
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-wide">Every minutes</span>
            <input
              type="number"
              min="15"
              max="1440"
              step="1"
              required
              value={form.everyMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, everyMinutes: event.target.value }))
              }
              className={cn(
                'min-h-10 w-full rounded-lg border px-3 text-sm',
                isDarkMode
                  ? 'border-white/10 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            />
            <p className="text-[10px] opacity-60">Allowed range: 15–1440 minutes.</p>
          </label>
        ) : (
          <>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide">Run times</span>
              <input
                required
                value={form.times}
                onChange={(event) =>
                  setForm((current) => ({ ...current, times: event.target.value }))
                }
                placeholder="06:00, 18:00"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 text-sm',
                  isDarkMode
                    ? 'border-white/10 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide">Timezone</span>
              <input
                required
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, timezone: event.target.value }))
                }
                placeholder="Asia/Manila"
                className={cn(
                  'min-h-10 w-full rounded-lg border px-3 text-sm',
                  isDarkMode
                    ? 'border-white/10 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className={cn(
            'rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-50',
            isDarkMode
              ? 'border-white/10 text-slate-300 hover:bg-white/5'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save schedule
        </button>
      </div>
      <p className="mt-3 text-[10px] opacity-60">
        Saving changes the timer schedule only. It does not request an immediate builder run.
      </p>
      <input type="hidden" value={model.code} readOnly />
    </form>
  );
}

function ModelScheduleCard({ model, busyKey, editingCode, setEditingCode, isDarkMode, onAction }) {
  const operations = model.operations;
  const scheduleState = operations?.schedule;
  const [form, setForm] = useState(() => toForm(model));
  const busy = busyKey?.startsWith(`${model.code}:`);
  const editing = editingCode === model.code;
  const timerEnabled = Boolean(operations?.timer?.enabled || operations?.timer?.active);

  const handleSave = async (event) => {
    event.preventDefault();
    const schedule =
      form.mode === 'interval'
        ? { mode: 'interval', everyMinutes: Number(form.everyMinutes) }
        : {
            mode: 'daily',
            times: form.times
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            timezone: form.timezone.trim(),
          };
    await onAction(`${model.code}:schedule`, () => setWaveModelSchedule(model.code, schedule));
    setEditingCode(null);
  };

  const handleEdit = () => {
    if (editing) {
      setEditingCode(null);
      return;
    }
    setForm(toForm(model));
    setEditingCode(model.code);
  };

  return (
    <section
      className={cn(
        'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={cn('text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              {model.label}
            </h2>
            <span className="rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-500">
              {model.code}
            </span>
          </div>
          <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
            Builder scheduling and supervised runtime controls.
          </p>
        </div>
        <span
          className={cn(
            'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black',
            timerEnabled
              ? isDarkMode
                ? 'bg-emerald-400/10 text-emerald-200'
                : 'bg-emerald-50 text-emerald-700'
              : isDarkMode
                ? 'bg-amber-400/10 text-amber-200'
                : 'bg-amber-50 text-amber-700'
          )}
        >
          {timerEnabled ? <TimerReset size={13} /> : <TimerOff size={13} />}
          Scheduled runs {timerEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {!scheduleState?.available && (
        <div
          className={cn(
            'mt-4 rounded-xl border px-4 py-3 text-xs font-semibold',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          Schedule helper is not installed on this server yet. Deploy the operations helper before
          changing schedules.
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={CalendarClock}
          label="Effective schedule"
          value={scheduleLabel(scheduleState?.schedule)}
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={Clock3}
          label="Next run"
          value={timerEnabled ? formatDate(operations?.timer?.nextRun) : 'Scheduling disabled'}
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={Activity}
          label="Builder state"
          value={
            operations?.service?.running ? 'Running' : operations?.lastError ? 'Attention' : 'Idle'
          }
          isDarkMode={isDarkMode}
        />
        <Metric
          icon={Clock3}
          label="Last run"
          value={formatDate(operations?.service?.lastStartedAt || operations?.timer?.lastTrigger)}
          isDarkMode={isDarkMode}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !operations?.manualRun?.available}
          title={operations?.manualRun?.reason || 'Request a supervised builder run'}
          onClick={() =>
            onAction(`${model.code}:builder`, () => runWaveModelBuilder(model.code), true)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busyKey === `${model.code}:builder` ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
          Start now
        </button>
        <button
          type="button"
          disabled={busy || !scheduleState?.available}
          onClick={() =>
            onAction(
              `${model.code}:toggle`,
              () =>
                timerEnabled
                  ? disableWaveModelSchedule(model.code)
                  : enableWaveModelSchedule(model.code),
              timerEnabled
            )
          }
          className={cn(
            'rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40',
            isDarkMode
              ? 'border-white/10 text-slate-300 hover:bg-white/5'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          )}
        >
          {timerEnabled ? 'Disable schedule' : 'Enable schedule'}
        </button>
        <button
          type="button"
          disabled={busy || !scheduleState?.available}
          onClick={handleEdit}
          className={cn(
            'rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40',
            isDarkMode
              ? 'border-white/10 text-slate-300 hover:bg-white/5'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          )}
        >
          Edit schedule
        </button>
        <button
          type="button"
          disabled={busy || !scheduleState?.available || !scheduleState?.managed}
          onClick={() =>
            onAction(`${model.code}:restore`, () => restoreWaveModelSchedule(model.code), true)
          }
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40',
            isDarkMode
              ? 'border-white/10 text-slate-300 hover:bg-white/5'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          )}
        >
          <RotateCcw size={13} />
          Restore default
        </button>
      </div>

      {editing && (
        <ScheduleEditor
          model={model}
          form={form}
          setForm={setForm}
          busy={busy}
          isDarkMode={isDarkMode}
          onSave={handleSave}
          onCancel={() => setEditingCode(null)}
        />
      )}
    </section>
  );
}

export default function WaveModelSchedules({ isDarkMode = true }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [editingCode, setEditingCode] = useState(null);
  const [message, setMessage] = useState(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWaveModels();
      setModels(result?.models || []);
      setMessage(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: normalizeError(error, 'Unable to load model operations.'),
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
          text: normalizeError(error, 'Unable to load model operations.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const operationalModels = useMemo(
    () => models.filter((model) => model.operations?.supported),
    [models]
  );

  const onAction = async (key, action, confirmAction = false) => {
    if (confirmAction && !window.confirm('Apply this operational change?')) return;
    setBusyKey(key);
    try {
      await action();
      await loadModels();
      setMessage({ type: 'success', text: 'Wave model operation completed.' });
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Wave model operation failed.') });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Builder schedules
          </p>
          <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            Manage supervised WW3 and ECWAM automation without shell or systemd access.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadModels()}
          className={cn(
            'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
            isDarkMode
              ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          )}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </section>

      {message && (
        <section
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-semibold',
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
        </section>
      )}

      {loading && operationalModels.length === 0 ? (
        <div className="grid min-h-52 place-items-center">
          <Loader2 className="animate-spin text-cyan-500" />
        </div>
      ) : operationalModels.length === 0 ? (
        <section
          className={cn(
            'rounded-2xl border border-dashed p-8 text-center text-sm',
            isDarkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'
          )}
        >
          No operational wave model builders are configured.
        </section>
      ) : (
        <div className="space-y-4">
          {operationalModels.map((model) => (
            <ModelScheduleCard
              key={model.code}
              model={model}
              busyKey={busyKey}
              editingCode={editingCode}
              setEditingCode={setEditingCode}
              isDarkMode={isDarkMode}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
