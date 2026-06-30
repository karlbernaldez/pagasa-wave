import { PackageCheck } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { inputCls, labelCls } from '../ui/FormFields';

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

function InfoCard({ title, children, dark }) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm font-semibold leading-6', dark ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100' : 'border-cyan-100 bg-cyan-50/80 text-cyan-800')}>
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

export default function AdminReviewTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Admin review timing" dark={dark}>
        Configure review, publication, and revision timing targets. Required review actions remain enforced by the workflow and are not shown as toggles.
      </InfoCard>

      <Accordion icon={PackageCheck} title="Review and Publication SLA" dark={dark} defaultOpen>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField label="Review SLA" value={settings.reviewSlaHours} onChange={set('reviewSlaHours')} min={1} suffix="hrs" dark={dark} />
          <NumberField label="Publish SLA After Approval" value={settings.publishSlaHours} onChange={set('publishSlaHours')} min={1} suffix="hrs" dark={dark} />
          <NumberField label="Revision Grace Period" value={settings.revisionGraceHours} onChange={set('revisionGraceHours')} min={1} suffix="hrs" dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
