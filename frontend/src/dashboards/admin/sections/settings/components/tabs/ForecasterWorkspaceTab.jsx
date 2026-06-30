import { ClipboardList, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function InfoCard({ title, children, dark }) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm font-semibold leading-6', dark ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100' : 'border-cyan-100 bg-cyan-50/80 text-cyan-800')}>
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

function TextField({ label, field, settings, set, dark, type = 'text', placeholder = '' }) {
  return (
    <Field
      label={label}
      value={settings[field] ?? ''}
      onChange={set(field)}
      type={type}
      placeholder={placeholder}
      dark={dark}
    />
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
      <InfoCard title="Forecaster workspace settings" dark={dark}>
        Configure forecaster-facing labels, helper messages, collaboration prompts, and workspace defaults. Fixed workflow rules, like the four required charts and revision resubmission, stay in code rather than settings.
      </InfoCard>

      <Accordion icon={LayoutDashboard} title="Workspace Defaults" dark={dark} defaultOpen>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField label="Workspace Welcome Title" field="workspaceWelcomeTitle" settings={settings} set={set} dark={dark} />
          <TextField label="Default Map View" field="defaultMapView" settings={settings} set={set} dark={dark} />
          <TextField label="Autosave Interval Seconds" field="autosaveIntervalSeconds" settings={settings} set={set} dark={dark} type="number" />
          <MessageField label="Workspace Welcome Description" field="workspaceWelcomeDescription" settings={settings} set={set} dark={dark} rows={4} />
        </div>
      </Accordion>

      <Accordion icon={Users} title="Collaboration & QA Guidance" dark={dark}>
        <div className="grid gap-4">
          <MessageField label="Collaboration Presence Message" field="collaborationPresenceMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="QA Checklist Reminder" field="qaChecklistReminder" settings={settings} set={set} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={ShieldCheck} title="Package Reminder Messages" dark={dark}>
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
