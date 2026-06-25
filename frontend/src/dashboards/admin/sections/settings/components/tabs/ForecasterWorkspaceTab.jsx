import { LayoutDashboard, ShieldCheck } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { TextareaField } from '../ui/FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

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

function InfoCard({ title, children, dark }) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm font-semibold leading-6', dark ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100' : 'border-cyan-100 bg-cyan-50/80 text-cyan-800')}>
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

export default function ForecasterWorkspaceTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecaster dashboard behavior" dark={dark}>
        These controls define what forecasters see while preparing chart projects and how much guidance the workspace gives before submission or revision.
      </InfoCard>

      <Accordion icon={LayoutDashboard} title="Workspace Visibility" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <ToggleRow title="Show package progress banner" description="Display the current package status, linked charts, and missing work on the forecaster dashboard." checked={!!settings.showPackageProgressBanner} onChange={set('showPackageProgressBanner')} dark={dark} />
          <ToggleRow title="Show deadline banner" description="Show package deadline, warning, and publish-target reminders while forecasters work." checked={!!settings.showForecasterDeadlineBanner} onChange={set('showForecasterDeadlineBanner')} dark={dark} />
          <ToggleRow title="Show chart readiness checklist" description="Help forecasters see which of the four charts still need work before submission." checked={!!settings.showChartReadinessChecklist} onChange={set('showChartReadinessChecklist')} dark={dark} />
          <ToggleRow title="Hide archived packages" description="Keep archived packages searchable by admins but hidden from day-to-day forecaster views." checked={!!settings.hideArchivedFromForecaster} onChange={set('hideArchivedFromForecaster')} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={ShieldCheck} title="Submission Guardrails" dark={dark}>
        <div className="grid gap-4">
          <ToggleRow title="Require all four charts before submission" description="Prevent incomplete packages from entering admin review." checked={!!settings.requireAllChartsBeforeSubmit} onChange={set('requireAllChartsBeforeSubmit')} dark={dark} />
          <ToggleRow title="Allow resubmit after revision" description="Forecasters can update returned charts and submit the package again." checked={!!settings.allowResubmitAfterRevision} onChange={set('allowResubmitAfterRevision')} dark={dark} />
          <TextareaField label="Deadline Reminder Message" value={settings.deadlineReminderMessage ?? ''} onChange={set('deadlineReminderMessage')} rows={3} dark={dark} />
          <TextareaField label="Revision Instruction Message" value={settings.revisionInstructionMessage ?? ''} onChange={set('revisionInstructionMessage')} rows={3} dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
