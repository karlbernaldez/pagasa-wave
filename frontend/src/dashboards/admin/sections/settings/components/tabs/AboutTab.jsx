import {
  Star, BarChart2, Eye, Target, Layers,
  Clock, User, Link, Hash, AlignLeft, Zap
} from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';
import { SortableDnD } from '../ui/Sortable';

/* ─── tiny local helpers ──────────────────────────────────── */

const SectionLabel = ({ children, dark }) => (
  <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5 ${dark ? 'text-slate-400' : 'text-slate-500'
    }`}>
    <span className={`inline-block w-4 h-px ${dark ? 'bg-slate-600' : 'bg-slate-300'}`} />
    {children}
    <span className={`flex-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
  </p>
);

const InfoPanel = ({ dark, children }) => (
  <div className={`rounded-2xl border p-4 transition-colors ${dark
      ? 'border-slate-700/60 bg-slate-800/40 backdrop-blur-sm'
      : 'border-slate-200 bg-slate-50/80'
    }`}>
    {children}
  </div>
);

const AvatarPreview = ({ src, alt, dark }) =>
  src ? (
    <div className={`flex items-center gap-3 mt-2 py-2 px-3 rounded-xl border ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'
      }`}>
      <img
        src={src}
        alt={alt}
        className="h-9 w-9 rounded-lg object-cover ring-2 ring-offset-1 ring-slate-400/20"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div>
        <p className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Preview
        </p>
        <p className={`text-[10px] truncate max-w-[180px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          {src}
        </p>
      </div>
    </div>
  ) : null;

/* ─── main component ──────────────────────────────────────── */

const AboutTab = ({ settings = {}, setSettings, dark }) => {

  const set = (field) => (val) =>
    setSettings(prev => ({ ...prev, [field]: val }));

  const updateArrayItem = (key, id, patch) =>
    setSettings(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).map(item =>
        item.id === id ? { ...item, ...patch } : item
      )
    }));

  const removeArrayItem = (key, id) =>
    setSettings(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).filter(item => item.id !== id)
    }));

  const addArrayItem = (key, template) =>
    setSettings(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: crypto.randomUUID(), ...template }]
    }));

  const reorderArray = (key, next) =>
    setSettings(prev => ({ ...prev, [key]: next }));

  const s = settings || {};

  return (
    <div className="flex flex-col gap-3">

      {/* ── 1. TITLE & SUBTITLE ── */}
      <Accordion icon={Star} title="Title & Subtitle" dark={dark} defaultOpen>
        <div className="flex flex-col gap-5">

          {/* Hero text fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field
              label="Badge Text"
              value={s.badgeText ?? ''}
              onChange={set('badgeText')}
              dark={dark}
            />

            {/* Title split — mirrors ContactTab pattern */}
            <div className="sm:col-span-2">
              <InfoPanel dark={dark}>
                <SectionLabel dark={dark}>Page Title</SectionLabel>

                {/* Live preview */}
                {(s.titlePrefix || s.titleHighlight || s.titleSuffix) && (
                  <p className={`text-sm font-semibold mb-3 leading-snug ${dark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                    {s.titlePrefix && (
                      <span>{s.titlePrefix} </span>
                    )}
                    {s.titleHighlight && (
                      <span className={`px-1 rounded ${dark
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-100 text-blue-700'
                        }`}>
                        {s.titleHighlight}
                      </span>
                    )}
                    {s.titleSuffix && (
                      <span> {s.titleSuffix}</span>
                    )}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field
                    label="Title Prefix"
                    value={s.titlePrefix ?? ''}
                    onChange={set('titlePrefix')}
                    dark={dark}
                  />
                  <Field
                    label="Title Highlight"
                    value={s.titleHighlight ?? ''}
                    onChange={set('titleHighlight')}
                    dark={dark}
                  />
                  <Field
                    label="Title Suffix"
                    value={s.titleSuffix ?? ''}
                    onChange={set('titleSuffix')}
                    dark={dark}
                  />
                </div>
              </InfoPanel>
            </div>

            <div className="sm:col-span-2">
              <TextareaField
                label="Subtitle / Description"
                value={s.subtitle ?? ''}
                onChange={set('subtitle')}
                rows={3}
                dark={dark}
              />
            </div>

          </div>

          {/* CTA block */}
          <InfoPanel dark={dark}>
            <SectionLabel dark={dark}>Call-to-Action Buttons</SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">

              {/* Primary */}
              <div className={`rounded-xl p-3 border ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-white'
                }`}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-blue-400' : 'text-blue-600'
                  }`}>Primary</p>
                <div className="flex flex-col gap-2">
                  <Field label="Label" value={s.ctaPrimaryLabel ?? ''} onChange={set('ctaPrimaryLabel')} dark={dark} />
                  <Field label="Link" value={s.ctaPrimaryLink ?? ''} onChange={set('ctaPrimaryLink')} dark={dark} />
                </div>
              </div>

              {/* Secondary */}
              <div className={`rounded-xl p-3 border ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-white'
                }`}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'
                  }`}>Secondary</p>
                <div className="flex flex-col gap-2">
                  <Field label="Label" value={s.ctaSecondaryLabel ?? ''} onChange={set('ctaSecondaryLabel')} dark={dark} />
                  <Field label="Link" value={s.ctaSecondaryLink ?? ''} onChange={set('ctaSecondaryLink')} dark={dark} />
                </div>
              </div>

            </div>
          </InfoPanel>

        </div>
      </Accordion>


      {/* ── 2. STATS ── */}
      <Accordion icon={BarChart2} title="Stats" count={(s.stats ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.stats ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('stats', next)}
            className="flex flex-col gap-2"
            renderItem={(stat, sortableProps) => (
              <ArrayRow key={stat.id} onRemove={() => removeArrayItem('stats', stat.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Number" value={stat.number ?? ''} onChange={(v) => updateArrayItem('stats', stat.id, { number: v })} dark={dark} />
                  <Field label="Label" value={stat.label ?? ''} onChange={(v) => updateArrayItem('stats', stat.id, { label: v })} dark={dark} />
                  <Field label="Sublabel" value={stat.sublabel ?? ''} onChange={(v) => updateArrayItem('stats', stat.id, { sublabel: v })} dark={dark} />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('stats', { number: '', label: '', sublabel: '' })} label="Add Stat" dark={dark} />
        </div>
      </Accordion>


      {/* ── 3. MISSION & VISION ── */}
      <Accordion icon={Eye} title="Mission & Vision" count={(s.highlights ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.highlights ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('highlights', next)}
            className="flex flex-col gap-2"
            renderItem={(h, sortableProps) => (
              <ArrayRow key={h.id} onRemove={() => removeArrayItem('highlights', h.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">
                  <Field label="Title" value={h.title ?? ''} onChange={(v) => updateArrayItem('highlights', h.id, { title: v })} dark={dark} />
                  <TextareaField label="Description" value={h.description ?? ''} onChange={(v) => updateArrayItem('highlights', h.id, { description: v })} rows={3} dark={dark} />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('highlights', { title: '', description: '' })} label="Add Highlight" dark={dark} />
        </div>
      </Accordion>


      {/* ── 4. PROGRAM OBJECTIVES ── */}
      <Accordion icon={Target} title="Program Objectives" count={(s.programObjectives ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.programObjectives ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('programObjectives', next)}
            className="flex flex-col gap-2"
            renderItem={(obj, sortableProps) => (
              <ArrayRow key={obj.id} onRemove={() => removeArrayItem('programObjectives', obj.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">
                  <Field label="Title" value={obj.title ?? ''} onChange={(v) => updateArrayItem('programObjectives', obj.id, { title: v })} dark={dark} />
                  <TextareaField label="Description" value={obj.description ?? ''} onChange={(v) => updateArrayItem('programObjectives', obj.id, { description: v })} rows={2} dark={dark} />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('programObjectives', { title: '', description: '' })} label="Add Objective" dark={dark} />
        </div>
      </Accordion>


      {/* ── 5. FOCUS AREAS ── */}
      <Accordion icon={Layers} title="Focus Areas" count={(s.pillars ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.pillars ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('pillars', next)}
            className="flex flex-col gap-2"
            renderItem={(pillar, sortableProps) => (
              <ArrayRow key={pillar.id} onRemove={() => removeArrayItem('pillars', pillar.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">
                  <Field label="Title" value={pillar.title ?? ''} onChange={(v) => updateArrayItem('pillars', pillar.id, { title: v })} dark={dark} />
                  <TextareaField label="Description" value={pillar.description ?? ''} onChange={(v) => updateArrayItem('pillars', pillar.id, { description: v })} rows={2} dark={dark} />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('pillars', { title: '', description: '' })} label="Add Focus Area" dark={dark} />
        </div>
      </Accordion>


      {/* ── 6. TIMELINE ── */}
      <Accordion icon={Clock} title="Timeline" count={(s.milestones ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.milestones ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('milestones', next)}
            className="flex flex-col gap-2"
            renderItem={(ms, sortableProps) => (
              <ArrayRow key={ms.id} onRemove={() => removeArrayItem('milestones', ms.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">

                  {/* Year + title in a 1:2 split, collapses to stacked on mobile */}
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                    <Field
                      label="Year / Period"
                      value={ms.year ?? ''}
                      onChange={(v) => updateArrayItem('milestones', ms.id, { year: v })}
                      dark={dark}
                    />
                    <div className="xs:col-span-2">
                      <Field
                        label="Milestone Title"
                        value={ms.title ?? ''}
                        onChange={(v) => updateArrayItem('milestones', ms.id, { title: v })}
                        dark={dark}
                      />
                    </div>
                  </div>

                  <TextareaField
                    label="Description"
                    value={ms.description ?? ''}
                    onChange={(v) => updateArrayItem('milestones', ms.id, { description: v })}
                    rows={2}
                    dark={dark}
                  />

                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('milestones', { year: '', title: '', description: '' })} label="Add Milestone" dark={dark} />
        </div>
      </Accordion>


      {/* ── 7. LEADERSHIP ── */}
      <Accordion icon={User} title="Leadership" count={(s.leaders ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.leaders ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('leaders', next)}
            className="flex flex-col gap-2"
            renderItem={(leader, sortableProps) => (
              <ArrayRow key={leader.id} onRemove={() => removeArrayItem('leaders', leader.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Full Name" value={leader.name ?? ''} onChange={(v) => updateArrayItem('leaders', leader.id, { name: v })} dark={dark} />
                    <Field label="Role / Title" value={leader.role ?? ''} onChange={(v) => updateArrayItem('leaders', leader.id, { role: v })} dark={dark} />
                    <Field label="Avatar URL" value={leader.avatar ?? ''} onChange={(v) => updateArrayItem('leaders', leader.id, { avatar: v })} dark={dark} />
                  </div>

                  <AvatarPreview src={leader.avatar} alt={leader.name} dark={dark} />

                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('leaders', { name: '', role: '', avatar: '' })} label="Add Leader" dark={dark} />
        </div>
      </Accordion>


      {/* ── 8. PARTNER AGENCIES ── */}
      <Accordion icon={Layers} title="Partner Agencies" count={(s.partners ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.partners ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('partners', next)}
            className="flex flex-col gap-2"
            renderItem={(partner, sortableProps) => (
              <ArrayRow key={partner.id} onRemove={() => removeArrayItem('partners', partner.id)} dark={dark} dragHandleProps={sortableProps.dragHandleProps}>
                <div className="flex flex-col gap-3">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Agency Name" value={partner.name ?? ''} onChange={(v) => updateArrayItem('partners', partner.id, { name: v })} dark={dark} />
                    <Field label="Logo URL" value={partner.logo ?? ''} onChange={(v) => updateArrayItem('partners', partner.id, { logo: v })} dark={dark} />
                    <Field label="Website" value={partner.link ?? ''} onChange={(v) => updateArrayItem('partners', partner.id, { link: v })} dark={dark} />
                  </div>

                  {/* logo preview — wider variant for logos */}
                  {partner.logo && (
                    <div className={`flex items-center gap-3 mt-1 py-2 px-3 rounded-xl border ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'
                      }`}>
                      <div className={`flex items-center justify-center h-9 w-16 rounded-lg border overflow-hidden ${dark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                        }`}>
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="h-8 w-auto max-w-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Logo Preview
                        </p>
                        {partner.link && (
                          <a
                            href={partner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] underline underline-offset-2 truncate max-w-[180px] inline-block ${dark ? 'text-blue-400' : 'text-blue-500'
                              }`}
                          >
                            {partner.link}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </ArrayRow>
            )}
          />
          <AddButton onClick={() => addArrayItem('partners', { name: '', logo: '', link: '' })} label="Add Partner Agency" dark={dark} />
        </div>
      </Accordion>


      {/* ── 9. BOTTOM CTA ── */}
      <Accordion icon={Link} title="Bottom Call-to-Action" dark={dark}>
        <div className="flex flex-col gap-4">

          <Field label="CTA Title" value={s.ctaTitle ?? ''} onChange={set('ctaTitle')} dark={dark} />

          <TextareaField
            label="CTA Description"
            value={s.ctaDescription ?? ''}
            onChange={set('ctaDescription')}
            rows={3}
            dark={dark}
          />

          <InfoPanel dark={dark}>
            <SectionLabel dark={dark}>Button</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Label" value={s.ctaButtonLabel ?? ''} onChange={set('ctaButtonLabel')} dark={dark} />
              <Field label="Link" value={s.ctaButtonLink ?? ''} onChange={set('ctaButtonLink')} dark={dark} />
            </div>
          </InfoPanel>

        </div>
      </Accordion>

    </div>
  );
};

export default AboutTab;