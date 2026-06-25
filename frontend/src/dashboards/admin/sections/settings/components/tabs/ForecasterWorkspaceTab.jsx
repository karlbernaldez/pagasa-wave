import { ClipboardList, ShieldCheck } from 'lucide-react';

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

function MessageField({ label, field, settings, set, dark, rows = 3 }) {
  return (
    <TextareaField
      label={label}
      value={settings[field] ?? ''}
      onChange={set(field)}
      rows={rows}
      dark={dark}
    />
  );
}

export default function ForecasterWorkspaceTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecaster workspace messages" dark={dark}>
        Configure the helper messages shown to forecasters while they prepare, submit, revise, or resubmit forecast packages.
      </InfoCard>

      <Accordion icon={ShieldCheck} title="Package Reminder Messages" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <MessageField label="Deadline Reminder Message" field="deadlineReminderMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Deadline Approaching Message" field="deadlineApproachingMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Deadline Passed Message" field="deadlinePassedMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Publish Target Missed Message" field="publishTargetMissedMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="No-Publication Cutoff Message" field="noPublicationCutoffMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Revision Instruction Message" field="revisionInstructionMessage" settings={settings} set={set} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={ClipboardList} title="Workspace Helper Copy" dark={dark}>
        <div className="grid gap-4">
          <MessageField label="Empty Package Message" field="emptyPackageMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Chart Sequence Helper Message" field="chartSequenceHelperMessage" settings={settings} set={set} dark={dark} rows={4} />
        </div>
      </Accordion>
    </div>
  );
}
