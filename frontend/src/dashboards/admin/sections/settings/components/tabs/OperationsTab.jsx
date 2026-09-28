import { AlertTriangle, Archive, CalendarClock, Loader2, Play, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import Accordion from '../ui/Accordion';
import { inputCls, labelCls } from '../ui/FormFields';
import TimePickerField from '../ui/TimePickerField';
import { getOperationsScheduleValidationError } from '../../utils/operationsScheduleValidation';
import { previewArchivePolicy, runArchivePolicy } from '@/api/siteSettings';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function NumberField({ label, value, onChange, min = 0, dark, suffix }) {
  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          value={value ?? ''}
          onChange={(event) => onChange(toNumber(event.target.value, min))}
          className={cn(inputCls(dark), suffix && 'pr-16')}
        />
        {suffix && (
          <span
            className={cn(
              'pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wide',
              dark ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, dark }) {
  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={inputCls(dark)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({ title, children, dark }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm font-semibold leading-6',
        dark
          ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
          : 'border-cyan-100 bg-cyan-50/80 text-cyan-800'
      )}
    >
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

function ValidationMessage({ children, dark }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-bold leading-6',
        dark
          ? 'border-amber-300/25 bg-amber-400/10 text-amber-100'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      )}
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={16} />
      <span>{children}</span>
    </div>
  );
}

export default function OperationsTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) =>
    setSettings((prev) => ({ ...prev, [field]: value }));
  const scheduleError = getOperationsScheduleValidationError(settings);
  const [archivePreview, setArchivePreview] = useState(null);
  const [archiveStatus, setArchiveStatus] = useState(null);
  const [archiveBusy, setArchiveBusy] = useState('');

  const previewArchive = async () => {
    setArchiveBusy('preview');
    setArchiveStatus(null);
    try {
      const result = await previewArchivePolicy();
      setArchivePreview(result);
    } catch (error) {
      setArchiveStatus({ type: 'error', message: error.message });
    } finally {
      setArchiveBusy('');
    }
  };

  const runArchive = async () => {
    setArchiveBusy('run');
    setArchiveStatus(null);
    try {
      const result = await runArchivePolicy();
      setArchiveStatus({
        type: 'success',
        message: `Archived ${result.totalArchived || 0} eligible record group${result.totalArchived === 1 ? '' : 's'}. No retention purge was performed.`,
      });
      const refreshed = await previewArchivePolicy();
      setArchivePreview(refreshed);
    } catch (error) {
      setArchiveStatus({ type: 'error', message: error.message });
    } finally {
      setArchiveBusy('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecast package timing" dark={dark}>
        These values drive the live forecaster deadline reminder states. Workflow transitions
        themselves remain explicit and are not automatically changed by a clock.
      </InfoCard>

      <Accordion icon={Archive} title="Archive & Retention Preparation" dark={dark}>
        <div className="grid gap-4">
          <InfoCard title="Non-destructive archive policy" dark={dark}>
            These controls prepare automatic archiving only. Archived packages, charts, review
            checklists, and audit evidence remain stored. Automatic deletion is intentionally
            disabled.
          </InfoCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={cn('rounded-2xl border p-4', dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50')}>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoArchivePublishedEnabled === true}
                  onChange={(event) => set('autoArchivePublishedEnabled')(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className={cn('block text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>Published packages</span>
                  <span className={cn('mt-1 block text-xs leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>Eligible only after publication and the configured age.</span>
                </span>
              </label>
              <div className="mt-4">
                <NumberField
                  label="Archive after"
                  value={settings.archivePublishedAfterDays}
                  onChange={set('archivePublishedAfterDays')}
                  min={1}
                  suffix="days"
                  dark={dark}
                />
              </div>
            </div>

            <div className={cn('rounded-2xl border p-4', dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50')}>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoArchiveNoPublicationEnabled === true}
                  onChange={(event) => set('autoArchiveNoPublicationEnabled')(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className={cn('block text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>No-publication chart records</span>
                  <span className={cn('mt-1 block text-xs leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>Archives chart records explicitly resolved as No Publication.</span>
                </span>
              </label>
              <div className="mt-4">
                <NumberField
                  label="Archive after"
                  value={settings.archiveNoPublicationAfterDays}
                  onChange={set('archiveNoPublicationAfterDays')}
                  min={1}
                  suffix="days"
                  dark={dark}
                />
              </div>
            </div>

            <div className={cn('rounded-2xl border p-4', dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50')}>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoArchiveAbandonedDraftsEnabled === true}
                  onChange={(event) => set('autoArchiveAbandonedDraftsEnabled')(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className={cn('block text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>Abandoned draft packages</span>
                  <span className={cn('mt-1 block text-xs leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>For future policy execution; never deletes the package.</span>
                </span>
              </label>
              <div className="mt-4">
                <NumberField
                  label="Archive after"
                  value={settings.archiveDraftsAfterDays}
                  onChange={set('archiveDraftsAfterDays')}
                  min={1}
                  suffix="days"
                  dark={dark}
                />
              </div>
            </div>
          </div>

          <div className={cn('rounded-2xl border p-4', dark ? 'border-white/10 bg-slate-950/30' : 'border-slate-200 bg-white')}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>Archive policy check</p>
                <p className={cn('mt-1 text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
                  Preview uses the settings currently saved on the server. Save changes before previewing or running the policy.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={previewArchive}
                  disabled={Boolean(archiveBusy)}
                  className={cn('inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black disabled:opacity-50', dark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
                >
                  {archiveBusy === 'preview' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Preview candidates
                </button>
                <button
                  type="button"
                  onClick={runArchive}
                  disabled={Boolean(archiveBusy) || !archivePreview?.totals?.total}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {archiveBusy === 'run' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Run archive now
                </button>
              </div>
            </div>

            {archivePreview && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Published packages', archivePreview.totals?.publishedPackages || 0],
                  ['No-publication charts', archivePreview.totals?.noPublicationProjects || 0],
                  ['Abandoned drafts', archivePreview.totals?.draftPackages || 0],
                  ['Total eligible', archivePreview.totals?.total || 0],
                ].map(([label, value]) => (
                  <div key={label} className={cn('rounded-xl border px-3 py-3', dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50')}>
                    <p className={cn('text-[10px] font-black uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>{label}</p>
                    <p className={cn('mt-1 text-2xl font-black', dark ? 'text-white' : 'text-slate-950')}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {archiveStatus && (
              <p className={cn('mt-3 rounded-xl border px-3 py-2 text-xs font-semibold', archiveStatus.type === 'error' ? dark ? 'border-rose-400/20 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700' : dark ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
                {archiveStatus.message}
              </p>
            )}
          </div>

          <div className={cn('grid gap-3 rounded-2xl border p-4 md:grid-cols-2', dark ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50')}>
            <div className="flex items-start gap-3">
              <ShieldCheck className={cn('mt-0.5 shrink-0', dark ? 'text-emerald-300' : 'text-emerald-700')} size={17} />
              <div>
                <p className={cn('text-sm font-black', dark ? 'text-emerald-100' : 'text-emerald-900')}>Archived records retained</p>
                <p className={cn('mt-1 text-xs leading-5', dark ? 'text-emerald-200/80' : 'text-emerald-800')}>Retention purge is disabled. Archived database records remain available for authorized history and reporting.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className={cn('mt-0.5 shrink-0', dark ? 'text-emerald-300' : 'text-emerald-700')} size={17} />
              <div>
                <p className={cn('text-sm font-black', dark ? 'text-emerald-100' : 'text-emerald-900')}>Review evidence preserved</p>
                <p className={cn('mt-1 text-xs leading-5', dark ? 'text-emerald-200/80' : 'text-emerald-800')}>Checklist snapshots, audit logs, and publication evidence are not deleted by this policy.</p>
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion
        icon={CalendarClock}
        title="Daily Forecast Package Schedule"
        dark={dark}
        defaultOpen
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <TimePickerField
              label="Submission Deadline"
              value={settings.packageSubmissionDeadline ?? ''}
              onChange={set('packageSubmissionDeadline')}
              dark={dark}
              helper="Forecaster submission cutoff used by live reminders."
            />
            <TimePickerField
              label="Publish Target"
              value={settings.packagePublishTarget ?? ''}
              onChange={set('packagePublishTarget')}
              dark={dark}
              helper="Operational publication target shown after the submission deadline."
            />
            <TimePickerField
              label="No-Publication Cutoff"
              value={settings.noPublicationCutoff ?? ''}
              onChange={set('noPublicationCutoff')}
              dark={dark}
              helper="Escalation cutoff used by the forecaster reminder state."
            />
          </div>

          {scheduleError && <ValidationMessage dark={dark}>{scheduleError}</ValidationMessage>}

          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label="Late Warning Before Deadline"
              value={settings.deadlineWarningMinutes}
              onChange={set('deadlineWarningMinutes')}
              min={0}
              suffix="min"
              dark={dark}
            />
            <SelectField
              label="Timezone"
              value={settings.timezone}
              onChange={set('timezone')}
              dark={dark}
              options={[
                { value: 'Asia/Manila', label: 'Asia/Manila' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
          </div>
        </div>
      </Accordion>
    </div>
  );
}
