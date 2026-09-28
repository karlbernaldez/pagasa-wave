import { AlertTriangle, CalendarClock } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { inputCls, labelCls } from '../ui/FormFields';
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

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecast package timing" dark={dark}>
        These values drive the live forecaster deadline reminder states. Workflow transitions
        themselves remain explicit and are not automatically changed by a clock.
      </InfoCard>

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
