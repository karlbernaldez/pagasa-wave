import { AlertTriangle, Archive, CalendarClock, Clock3 } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { TextareaField, inputCls, labelCls } from '../ui/FormFields';
import TimePickerField from '../ui/TimePickerField';
import { getOperationsScheduleValidationError } from '../../utils/operationsScheduleValidation';

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
        <input type="number" min={min} value={value ?? ''} onChange={(event) => onChange(toNumber(event.target.value, min))} className={cn(inputCls(dark), suffix && 'pr-16')} />
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
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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

function ValidationMessage({ children, dark }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-bold leading-6', dark ? 'border-amber-300/25 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800')}>
      <AlertTriangle className="mt-0.5 shrink-0" size={16} />
      <span>{children}</span>
    </div>
  );
}

export default function OperationsTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const scheduleError = getOperationsScheduleValidationError(settings);
  const reasonsText = Array.isArray(settings.noPublicationReasons)
    ? settings.noPublicationReasons.join('\n')
    : '';

  const setReasons = (value) => {
    set('noPublicationReasons')(
      value
        .split('\n')
        .map((reason) => reason.trim())
        .filter(Boolean),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecast package lifecycle" dark={dark}>
        Configure operational timings, deadline windows, exception reasons, and retention periods for daily forecast packages.
      </InfoCard>

      <Accordion icon={CalendarClock} title="Daily Forecast Package Schedule" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <TimePickerField label="Daily Package Opens" value={settings.packageOpenTime ?? ''} onChange={set('packageOpenTime')} dark={dark} helper="When the package becomes active." />
            <TimePickerField label="Submission Deadline" value={settings.packageSubmissionDeadline ?? ''} onChange={set('packageSubmissionDeadline')} dark={dark} helper="Forecaster submission cutoff." />
            <TimePickerField label="Publish Target" value={settings.packagePublishTarget ?? ''} onChange={set('packagePublishTarget')} dark={dark} helper="Must be later than submission." />
            <TimePickerField label="No-Publication Cutoff" value={settings.noPublicationCutoff ?? ''} onChange={set('noPublicationCutoff')} dark={dark} helper="Exception decision deadline." />
          </div>

          {scheduleError && <ValidationMessage dark={dark}>{scheduleError}</ValidationMessage>}

          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Forecast Package Duration" value={settings.packageDurationHours} onChange={set('packageDurationHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Late Warning Before Deadline" value={settings.deadlineWarningMinutes} onChange={set('deadlineWarningMinutes')} min={0} suffix="min" dark={dark} />
            <SelectField label="Timezone" value={settings.timezone} onChange={set('timezone')} dark={dark} options={[{ value: 'Asia/Manila', label: 'Asia/Manila' }, { value: 'UTC', label: 'UTC' }]} />
          </div>
        </div>
      </Accordion>

      <Accordion icon={Clock3} title="Chart / Project Deadlines" dark={dark}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Wave Analysis Deadline" value={settings.waveAnalysisDeadlineMinutes} onChange={set('waveAnalysisDeadlineMinutes')} min={0} suffix="min" dark={dark} />
          <NumberField label="24h Forecast Deadline" value={settings.forecast24DeadlineMinutes} onChange={set('forecast24DeadlineMinutes')} min={0} suffix="min" dark={dark} />
          <NumberField label="36h Forecast Deadline" value={settings.forecast36DeadlineMinutes} onChange={set('forecast36DeadlineMinutes')} min={0} suffix="min" dark={dark} />
          <NumberField label="48h Forecast Deadline" value={settings.forecast48DeadlineMinutes} onChange={set('forecast48DeadlineMinutes')} min={0} suffix="min" dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={AlertTriangle} title="No Publication / Operational Exception" dark={dark}>
        <div className="grid gap-4">
          <TextareaField label="Allowed No-Publication Reasons" value={reasonsText} onChange={setReasons} rows={7} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={Archive} title="Archive and Retention" dark={dark}>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField label="Archive Published Packages After" value={settings.archivePublishedAfterDays} onChange={set('archivePublishedAfterDays')} min={1} suffix="days" dark={dark} />
          <NumberField label="Archive No-Publication Packages After" value={settings.archiveNoPublicationAfterDays} onChange={set('archiveNoPublicationAfterDays')} min={1} suffix="days" dark={dark} />
          <NumberField label="Keep Draft Projects For" value={settings.keepDraftProjectsDays} onChange={set('keepDraftProjectsDays')} min={1} suffix="days" dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
