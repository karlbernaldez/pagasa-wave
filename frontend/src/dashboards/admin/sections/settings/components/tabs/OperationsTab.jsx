import { Archive, CalendarClock, Clock3, PackageCheck, ShieldCheck } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField, inputCls, labelCls } from '../ui/FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ToggleRow({ title, description, checked, onChange, dark }) {
  return (
    <label className={cn(
      'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200',
      checked
        ? dark ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-cyan-200 bg-cyan-50'
        : dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50',
    )}>
      <div className={cn('relative h-6 w-11 rounded-full transition-colors duration-300', checked ? 'bg-cyan-500' : dark ? 'bg-slate-700' : 'bg-slate-300')}>
        <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300', checked ? 'left-6' : 'left-1')} />
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>{title}</p>
        <p className={cn('mt-1 text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
      </div>
    </label>
  );
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
        {suffix && <span className={cn('pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, dark }) {
  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className={inputCls(dark)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({ title, children, dark }) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm font-semibold leading-6', dark ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100' : 'border-cyan-100 bg-cyan-50/80 text-cyan-800')}>
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

export default function OperationsTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecast workflow rules" dark={dark}>
        These settings are admin-facing operational defaults for the forecaster dashboard and package lifecycle. They define when packages are expected, how long charts stay active, and when completed work should move out of day-to-day views.
      </InfoCard>

      <Accordion icon={CalendarClock} title="Daily Forecast Package Schedule" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Daily Package Opens" type="time" value={settings.packageOpenTime ?? ''} onChange={set('packageOpenTime')} dark={dark} />
            <Field label="Submission Deadline" type="time" value={settings.packageSubmissionDeadline ?? ''} onChange={set('packageSubmissionDeadline')} dark={dark} />
            <Field label="Publish Target" type="time" value={settings.packagePublishTarget ?? ''} onChange={set('packagePublishTarget')} dark={dark} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Forecast Package Duration" value={settings.packageDurationHours} onChange={set('packageDurationHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Late Warning Before Deadline" value={settings.deadlineWarningMinutes} onChange={set('deadlineWarningMinutes')} min={0} suffix="min" dark={dark} />
            <SelectField label="Timezone" value={settings.timezone} onChange={set('timezone')} dark={dark} options={[{ value: 'Asia/Manila', label: 'Asia/Manila' }, { value: 'UTC', label: 'UTC' }]} />
          </div>

          <ToggleRow
            title="Show deadline banners in forecaster dashboard"
            description="Forecasters see package deadline, late-warning, and publish-target status while working."
            checked={!!settings.showForecasterDeadlineBanner}
            onChange={set('showForecasterDeadlineBanner')}
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={Clock3} title="Chart / Project Deadlines" dark={dark}>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <NumberField label="Wave Analysis Deadline" value={settings.waveAnalysisDeadlineMinutes} onChange={set('waveAnalysisDeadlineMinutes')} min={0} suffix="min" dark={dark} />
            <NumberField label="24h Forecast Deadline" value={settings.forecast24DeadlineMinutes} onChange={set('forecast24DeadlineMinutes')} min={0} suffix="min" dark={dark} />
            <NumberField label="36h Forecast Deadline" value={settings.forecast36DeadlineMinutes} onChange={set('forecast36DeadlineMinutes')} min={0} suffix="min" dark={dark} />
            <NumberField label="48h Forecast Deadline" value={settings.forecast48DeadlineMinutes} onChange={set('forecast48DeadlineMinutes')} min={0} suffix="min" dark={dark} />
          </div>

          <ToggleRow
            title="Require all four charts before package submission"
            description="Keeps the daily package complete before it can enter admin review."
            checked={!!settings.requireAllChartsBeforeSubmit}
            onChange={set('requireAllChartsBeforeSubmit')}
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={PackageCheck} title="Review and Publication Rules" dark={dark}>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Review SLA" value={settings.reviewSlaHours} onChange={set('reviewSlaHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Publish SLA After Approval" value={settings.publishSlaHours} onChange={set('publishSlaHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Revision Grace Period" value={settings.revisionGraceHours} onChange={set('revisionGraceHours')} min={1} suffix="hrs" dark={dark} />
          </div>

          <ToggleRow
            title="Auto-publish approved daily package"
            description="Allows a package to move to Published after approval when publication checks pass."
            checked={!!settings.autoPublishApprovedPackage}
            onChange={set('autoPublishApprovedPackage')}
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={Archive} title="Archive and Retention" dark={dark}>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Archive Published Packages After" value={settings.archivePublishedAfterDays} onChange={set('archivePublishedAfterDays')} min={1} suffix="days" dark={dark} />
            <NumberField label="Archive Rejected Packages After" value={settings.archiveRejectedAfterDays} onChange={set('archiveRejectedAfterDays')} min={1} suffix="days" dark={dark} />
            <NumberField label="Keep Draft Projects For" value={settings.keepDraftProjectsDays} onChange={set('keepDraftProjectsDays')} min={1} suffix="days" dark={dark} />
          </div>

          <ToggleRow
            title="Hide archived packages from forecaster dashboard"
            description="Archived work remains searchable by admins but does not clutter active forecaster views."
            checked={!!settings.hideArchivedFromForecaster}
            onChange={set('hideArchivedFromForecaster')}
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={ShieldCheck} title="Forecaster Guidance" dark={dark}>
        <div className="grid gap-4">
          <TextareaField label="Deadline Reminder Message" value={settings.deadlineReminderMessage ?? ''} onChange={set('deadlineReminderMessage')} rows={3} dark={dark} />
          <TextareaField label="Revision Instruction Message" value={settings.revisionInstructionMessage ?? ''} onChange={set('revisionInstructionMessage')} rows={3} dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
