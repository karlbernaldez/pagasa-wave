import { ShieldCheck } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { TextareaField } from '../ui/FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

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
      <InfoCard title="Forecaster workspace messages" dark={dark}>
        Configure the helper messages shown to forecasters while they prepare, submit, revise, or resubmit forecast packages.
      </InfoCard>

      <Accordion icon={ShieldCheck} title="Submission Messages" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <TextareaField label="Deadline Reminder Message" value={settings.deadlineReminderMessage ?? ''} onChange={set('deadlineReminderMessage')} rows={3} dark={dark} />
          <TextareaField label="Revision Instruction Message" value={settings.revisionInstructionMessage ?? ''} onChange={set('revisionInstructionMessage')} rows={3} dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
