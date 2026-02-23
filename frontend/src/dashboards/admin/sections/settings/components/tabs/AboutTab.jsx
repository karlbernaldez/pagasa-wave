// ╔══════════════════════════════════════════════════════╗
// ║                  tabs/AboutTab.jsx                   ║
// ║  9 accordion sections matching About page variables  ║
// ║    1. Title & Subtitle                               ║
// ║    2. Stats                                          ║
// ║    3. Mission & Vision                               ║
// ║    4. Program Objectives                             ║
// ║    5. Focus Areas                                    ║
// ║    6. Timeline                                       ║
// ║    7. Leadership                                     ║
// ║    8. Partner Agencies                               ║
// ║    9. Bottom CTA                                     ║
// ╚══════════════════════════════════════════════════════╝
import {
  Star, BarChart2, Eye, Target, Layers,
  Clock, User, Users, Link, Trash2,
} from 'lucide-react';
import Accordion            from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton, useArrayField } from '../ui/ArrayEditorRow';

const AboutTab = ({ settings, setSettings, dark }) => {
  const set = (field) => (val) => setSettings((p) => ({ ...p, [field]: val }));

  // Array field helpers
  const stats      = useArrayField(settings.stats,             set('stats'));
  const highlights = useArrayField(settings.highlights,        set('highlights'));
  const objectives = useArrayField(settings.programObjectives, set('programObjectives'));
  const pillars    = useArrayField(settings.pillars,            set('pillars'));
  const milestones = useArrayField(settings.milestones,        set('milestones'));
  const leaders    = useArrayField(settings.leaders,           set('leaders'));

  // Partners — plain string array
  const addPartner    = ()      => set('partners')([...settings.partners, '']);
  const removePartner = (i)     => set('partners')(settings.partners.filter((_, idx) => idx !== i));
  const updatePartner = (i, v)  => set('partners')(settings.partners.map((p, idx) => idx === i ? v : p));

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Title & Subtitle ────────────────────────── */}
      <Accordion icon={Star} title="Title & Subtitle" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <Field
            label="Page Title"
            value={settings.title}
            onChange={set('title')}
            placeholder="Seamless Prediction for…"
            dark={dark}
          />
          <TextareaField
            label="Subtitle / Description"
            value={settings.subtitle}
            onChange={set('subtitle')}
            rows={4}
            dark={dark}
          />
          <Field
            label="Badge Text"
            value={settings.badgeText}
            onChange={set('badgeText')}
            placeholder="About WaveLab"
            dark={dark}
          />

          {/* CTA Buttons sub-group */}
          <div className={`p-4 rounded-xl border ${
            dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
              dark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Call-to-Action Buttons
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Primary Label" value={settings.ctaPrimaryLabel}   onChange={set('ctaPrimaryLabel')}   dark={dark} />
              <Field label="Primary Link"  value={settings.ctaPrimaryLink}    onChange={set('ctaPrimaryLink')}    placeholder="/contact" dark={dark} />
              <Field label="Secondary Label" value={settings.ctaSecondaryLabel} onChange={set('ctaSecondaryLabel')} dark={dark} />
              <Field label="Secondary Link"  value={settings.ctaSecondaryLink}  onChange={set('ctaSecondaryLink')}  placeholder="/charts" dark={dark} />
            </div>
          </div>
        </div>
      </Accordion>

      {/* ── 2. Stats ───────────────────────────────────── */}
      <Accordion icon={BarChart2} title="Stats" count={settings.stats.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.stats.map((stat, i) => (
            <ArrayRow key={i} index={i} onRemove={stats.remove} dark={dark}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Number"   value={stat.number}   onChange={(v) => stats.update(i, { number: v })}   placeholder="36"       dark={dark} />
                <Field label="Label"    value={stat.label}    onChange={(v) => stats.update(i, { label: v })}    placeholder="Duration" dark={dark} />
                <Field label="Sublabel" value={stat.sublabel} onChange={(v) => stats.update(i, { sublabel: v })} placeholder="Months"   dark={dark} />
              </div>
            </ArrayRow>
          ))}
          <AddButton onClick={() => stats.add({ number: '', label: '', sublabel: '' })} label="Add Stat" dark={dark} />
        </div>
      </Accordion>

      {/* ── 3. Mission & Vision ────────────────────────── */}
      <Accordion icon={Eye} title="Mission & Vision" count={settings.highlights.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.highlights.map((h, i) => (
            <ArrayRow key={i} index={i} onRemove={highlights.remove} dark={dark}>
              <Field        label="Title (e.g. Mission)" value={h.title}       onChange={(v) => highlights.update(i, { title: v })}       dark={dark} />
              <TextareaField label="Description"          value={h.description} onChange={(v) => highlights.update(i, { description: v })} rows={3} dark={dark} />
            </ArrayRow>
          ))}
          <AddButton onClick={() => highlights.add({ title: '', description: '' })} label="Add Highlight" dark={dark} />
        </div>
      </Accordion>

      {/* ── 4. Program Objectives ──────────────────────── */}
      <Accordion icon={Target} title="Program Objectives" count={settings.programObjectives.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.programObjectives.map((obj, i) => (
            <ArrayRow key={i} index={i} onRemove={objectives.remove} dark={dark}>
              <Field        label="Title"       value={obj.title}       onChange={(v) => objectives.update(i, { title: v })}       dark={dark} />
              <TextareaField label="Description" value={obj.description} onChange={(v) => objectives.update(i, { description: v })} rows={2} dark={dark} />
            </ArrayRow>
          ))}
          <AddButton onClick={() => objectives.add({ title: '', description: '' })} label="Add Objective" dark={dark} />
        </div>
      </Accordion>

      {/* ── 5. Focus Areas ─────────────────────────────── */}
      <Accordion icon={Layers} title="Focus Areas" count={settings.pillars.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.pillars.map((pillar, i) => (
            <ArrayRow key={i} index={i} onRemove={pillars.remove} dark={dark}>
              <Field        label="Title"       value={pillar.title}       onChange={(v) => pillars.update(i, { title: v })}       dark={dark} />
              <TextareaField label="Description" value={pillar.description} onChange={(v) => pillars.update(i, { description: v })} rows={2} dark={dark} />
            </ArrayRow>
          ))}
          <AddButton onClick={() => pillars.add({ title: '', description: '' })} label="Add Focus Area" dark={dark} />
        </div>
      </Accordion>

      {/* ── 6. Timeline ────────────────────────────────── */}
      <Accordion icon={Clock} title="Timeline" count={settings.milestones.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.milestones.map((ms, i) => (
            <ArrayRow key={i} index={i} onRemove={milestones.remove} dark={dark}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Year / Period"    value={ms.year}  onChange={(v) => milestones.update(i, { year: v })}  placeholder="2024" dark={dark} />
                <div className="col-span-2">
                  <Field label="Milestone Title" value={ms.title} onChange={(v) => milestones.update(i, { title: v })} dark={dark} />
                </div>
              </div>
              <TextareaField label="Description" value={ms.description} onChange={(v) => milestones.update(i, { description: v })} rows={2} dark={dark} />
            </ArrayRow>
          ))}
          <AddButton onClick={() => milestones.add({ year: '', title: '', description: '' })} label="Add Milestone" dark={dark} />
        </div>
      </Accordion>

      {/* ── 7. Leadership ──────────────────────────────── */}
      <Accordion icon={User} title="Leadership" count={settings.leaders.length} dark={dark}>
        <div className="flex flex-col gap-3">
          {settings.leaders.map((leader, i) => (
            <ArrayRow key={i} index={i} onRemove={leaders.remove} dark={dark}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Full Name"    value={leader.name}   onChange={(v) => leaders.update(i, { name: v })}   dark={dark} />
                <Field label="Role / Title" value={leader.role}   onChange={(v) => leaders.update(i, { role: v })}   dark={dark} />
                <Field label="Avatar URL"   value={leader.avatar} onChange={(v) => leaders.update(i, { avatar: v })} placeholder="https://…" dark={dark} />
              </div>
              {/* Live avatar preview */}
              {leader.avatar && (
                <div className="flex items-center gap-3 mt-1">
                  <img
                    src={leader.avatar}
                    alt={leader.name}
                    className="h-10 w-10 rounded-lg object-cover border border-slate-300/30 flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Avatar preview
                  </span>
                </div>
              )}
            </ArrayRow>
          ))}
          <AddButton onClick={() => leaders.add({ name: '', role: '', avatar: '' })} label="Add Leader" dark={dark} />
        </div>
      </Accordion>

      {/* ── 8. Partner Agencies ────────────────────────── */}
      <Accordion icon={Users} title="Partner Agencies" count={settings.partners.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {settings.partners.map((partner, i) => (
              <div
                key={i}
                className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  dark
                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  value={partner}
                  onChange={(e) => updatePartner(i, e.target.value)}
                  placeholder="Agency name"
                  className={`flex-1 bg-transparent text-sm font-semibold outline-none min-w-0 ${
                    dark ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-300'
                  }`}
                />
                <button
                  onClick={() => removePartner(i)}
                  className={`opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all duration-200 hover:scale-110 ${
                    dark ? 'text-red-400' : 'text-red-400'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <AddButton onClick={addPartner} label="Add Partner Agency" dark={dark} />
        </div>
      </Accordion>

      {/* ── 9. Bottom CTA ──────────────────────────────── */}
      <Accordion icon={Link} title="Bottom Call-to-Action" dark={dark}>
        <div className="grid gap-4">
          <Field label="CTA Title"       value={settings.ctaTitle}       onChange={set('ctaTitle')}       dark={dark} />
          <TextareaField label="CTA Description" value={settings.ctaDescription} onChange={set('ctaDescription')} rows={3} dark={dark} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Button Label" value={settings.ctaButtonLabel} onChange={set('ctaButtonLabel')} dark={dark} />
            <Field label="Button Link"  value={settings.ctaButtonLink}  onChange={set('ctaButtonLink')}  placeholder="/contact" dark={dark} />
          </div>
        </div>
      </Accordion>

    </div>
  );
};

export default AboutTab;