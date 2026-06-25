import { PackageCheck, ShieldCheck } from 'lucide-react';

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

export default function AdminReviewTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Admin review workflow" dark={dark}>
        These rules control admin decision timing, publication behavior, revision windows, and what review teams should treat as overdue.
      </InfoCard>

      <Accordion icon={PackageCheck} title="Review and Publication SLA" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Review SLA" value={settings.reviewSlaHours} onChange={set('reviewSlaHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Publish SLA After Approval" value={settings.publishSlaHours} onChange={set('publishSlaHours')} min={1} suffix="hrs" dark={dark} />
            <NumberField label="Revision Grace Period" value={settings.revisionGraceHours} onChange={set('revisionGraceHours')} min={1} suffix="hrs" dark={dark} />
          </div>
          <ToggleRow title="Auto-publish approved daily package" description="Allows a package to move to Published after approval when publication checks pass." checked={!!settings.autoPublishApprovedPackage} onChange={set('autoPublishApprovedPackage')} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={ShieldCheck} title="Review Queue Rules" dark={dark}>
        <div className="grid gap-4">
          <ToggleRow title="Flag overdue reviews" description="Highlight packages that exceed the review SLA in analytics and calendar views." checked={!!settings.flagOverdueReviews} onChange={set('flagOverdueReviews')} dark={dark} />
          <ToggleRow title="Require comment on returned package" description="Admins must provide revision context before returning a package to forecasters." checked={!!settings.requireReturnComment} onChange={set('requireReturnComment')} dark={dark} />
          <ToggleRow title="Require final check before publish" description="Adds a final admin confirmation step before publication." checked={!!settings.requirePublishConfirmation} onChange={set('requirePublishConfirmation')} dark={dark} />
        </div>
      </Accordion>
    </div>
  );
}
