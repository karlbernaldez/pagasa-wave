import { BarChart2, Building2, HelpCircle, Link, Star, Target, User } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';
import { SortableDnD } from '../ui/Sortable';

export default function AboutTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const updateArrayItem = (key, id, patch) =>
    setSettings((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const removeArrayItem = (key, id) =>
    setSettings((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((item) => item.id !== id),
    }));

  const addArrayItem = (key, template) =>
    setSettings((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: crypto.randomUUID(), ...template }],
    }));

  const reorderArray = (key, next) => setSettings((prev) => ({ ...prev, [key]: next }));

  const s = settings || {};

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-xl border p-4 text-sm font-semibold leading-6 ${
          dark
            ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
            : 'border-cyan-100 bg-cyan-50/80 text-cyan-800'
        }`}
      >
        These fields map directly to the current public About page.
      </div>

      <Accordion icon={Star} title="Hero Content" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <Field label="Page Title" value={s.title ?? ''} onChange={set('title')} dark={dark} />
          <TextareaField
            label="Subtitle / Description"
            value={s.subtitle ?? ''}
            onChange={set('subtitle')}
            rows={4}
            dark={dark}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3 rounded-xl border border-slate-500/20 p-4">
              <p className="text-xs font-black uppercase tracking-wide">Contact CTA</p>
              <Field
                label="Label"
                value={s.ctaPrimaryLabel ?? ''}
                onChange={set('ctaPrimaryLabel')}
                dark={dark}
              />
              <Field
                label="Link"
                value={s.ctaPrimaryLink ?? ''}
                onChange={set('ctaPrimaryLink')}
                dark={dark}
              />
            </div>
            <div className="grid gap-3 rounded-xl border border-slate-500/20 p-4">
              <p className="text-xs font-black uppercase tracking-wide">Charts CTA</p>
              <Field
                label="Label"
                value={s.ctaSecondaryLabel ?? ''}
                onChange={set('ctaSecondaryLabel')}
                dark={dark}
              />
              <Field
                label="Link"
                value={s.ctaSecondaryLink ?? ''}
                onChange={set('ctaSecondaryLink')}
                dark={dark}
              />
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion icon={BarChart2} title="Stats" count={(s.stats ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.stats ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('stats', next)}
            className="flex flex-col gap-2"
            renderItem={(stat, sortableProps) => (
              <ArrayRow
                key={stat.id}
                onRemove={() => removeArrayItem('stats', stat.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field
                    label="Value"
                    value={stat.number ?? stat.value ?? ''}
                    onChange={(value) => updateArrayItem('stats', stat.id, { number: value })}
                    dark={dark}
                  />
                  <Field
                    label="Label"
                    value={stat.label ?? ''}
                    onChange={(value) => updateArrayItem('stats', stat.id, { label: value })}
                    dark={dark}
                  />
                  <Field
                    label="Description"
                    value={stat.sublabel ?? stat.description ?? ''}
                    onChange={(value) => updateArrayItem('stats', stat.id, { sublabel: value })}
                    dark={dark}
                  />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('stats', { number: '', label: '', sublabel: '' })}
            label="Add Stat"
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion
        icon={Target}
        title="Program Objectives"
        count={(s.programObjectives ?? []).length}
        dark={dark}
      >
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.programObjectives ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('programObjectives', next)}
            className="flex flex-col gap-2"
            renderItem={(objective, sortableProps) => (
              <ArrayRow
                key={objective.id}
                onRemove={() => removeArrayItem('programObjectives', objective.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3">
                  <Field
                    label="Title"
                    value={objective.title ?? ''}
                    onChange={(value) =>
                      updateArrayItem('programObjectives', objective.id, { title: value })
                    }
                    dark={dark}
                  />
                  <TextareaField
                    label="Description"
                    value={objective.description ?? ''}
                    onChange={(value) =>
                      updateArrayItem('programObjectives', objective.id, { description: value })
                    }
                    rows={3}
                    dark={dark}
                  />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('programObjectives', { title: '', description: '' })}
            label="Add Objective"
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion
        icon={User}
        title="Governance / Leadership"
        count={(s.leaders ?? []).length}
        dark={dark}
      >
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.leaders ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('leaders', next)}
            className="flex flex-col gap-2"
            renderItem={(leader, sortableProps) => (
              <ArrayRow
                key={leader.id}
                onRemove={() => removeArrayItem('leaders', leader.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Name / Area"
                    value={leader.name ?? ''}
                    onChange={(value) => updateArrayItem('leaders', leader.id, { name: value })}
                    dark={dark}
                  />
                  <Field
                    label="Role / Description"
                    value={leader.role ?? ''}
                    onChange={(value) => updateArrayItem('leaders', leader.id, { role: value })}
                    dark={dark}
                  />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('leaders', { name: '', role: '' })}
            label="Add Governance Item"
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion
        icon={Building2}
        title="Partner Agencies"
        count={(s.partners ?? []).length}
        dark={dark}
      >
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.partners ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('partners', next)}
            className="flex flex-col gap-2"
            renderItem={(partner, sortableProps) => (
              <ArrayRow
                key={partner.id}
                onRemove={() => removeArrayItem('partners', partner.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <Field
                  label="Agency Name"
                  value={typeof partner === 'string' ? partner : (partner.name ?? '')}
                  onChange={(value) => updateArrayItem('partners', partner.id, { name: value })}
                  dark={dark}
                />
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('partners', { name: '' })}
            label="Add Partner Agency"
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={HelpCircle} title="FAQ" count={(s.faqs ?? []).length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.faqs ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('faqs', next)}
            className="flex flex-col gap-2"
            renderItem={(faq, sortableProps) => (
              <ArrayRow
                key={faq.id}
                onRemove={() => removeArrayItem('faqs', faq.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3">
                  <Field
                    label="Question"
                    value={faq.question ?? ''}
                    onChange={(value) => updateArrayItem('faqs', faq.id, { question: value })}
                    dark={dark}
                  />
                  <TextareaField
                    label="Answer"
                    value={faq.answer ?? ''}
                    onChange={(value) => updateArrayItem('faqs', faq.id, { answer: value })}
                    rows={3}
                    dark={dark}
                  />
                </div>
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('faqs', { question: '', answer: '' })}
            label="Add FAQ Item"
            dark={dark}
          />
        </div>
      </Accordion>

      <div
        className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
          dark
            ? 'border-white/10 bg-white/[0.03] text-slate-400'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        <Link size={14} className="mt-0.5 shrink-0" />
        Changes are reflected when the public About page next loads.
      </div>
    </div>
  );
}
