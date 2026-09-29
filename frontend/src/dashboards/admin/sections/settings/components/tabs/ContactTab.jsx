import { Globe, Mail, Users } from 'lucide-react';

import IconPicker from '../ui/IconPicker';
import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';
import { SortableDnD } from '../ui/Sortable';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/100?img=3';

function clean(value) {
  // Contact copy is rendered through React text nodes, which escape markup.
  // Do not attempt HTML sanitization with regex here; normalize only whitespace.
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;
}

function safeText(value, max = 500) {
  return String(clean(value ?? '')).slice(0, max);
}

function isURL(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export default function ContactTab({ settings = {}, setSettings, dark }) {
  const s = settings || {};

  const setField = (key, max = 1000) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: safeText(value, max) }));

  const updateArrayItem = (key, id, patch) =>
    setSettings((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              ...Object.fromEntries(
                Object.entries(patch).map(([field, value]) => [field, safeText(value)])
              ),
            }
          : item
      ),
    }));

  const removeArrayItem = (key, id) =>
    setSettings((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((item) => item.id !== id),
    }));

  const addArrayItem = (key, item) =>
    setSettings((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: crypto.randomUUID(), ...item }],
    }));

  const reorderArray = (key, next) =>
    setSettings((prev) => ({ ...prev, [key]: next }));

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-xl border p-4 text-sm font-semibold leading-6 ${
          dark
            ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
            : 'border-cyan-100 bg-cyan-50/80 text-cyan-800'
        }`}
      >
        These fields map directly to the current public Contact page.
      </div>

      <Accordion icon={Globe} title="Hero Content" dark={dark} defaultOpen>
        <TextareaField
          label="Hero Description"
          value={s.heroDescription ?? ''}
          onChange={setField('heroDescription', 1000)}
          rows={4}
          dark={dark}
        />
      </Accordion>

      <Accordion icon={Mail} title="Contact Cards" count={s.contactCards?.length ?? 0} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.contactCards ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('contactCards', next)}
            className="flex flex-col gap-3"
            renderItem={(card, sortableProps) => (
              <ArrayRow
                key={card.id}
                onRemove={() => removeArrayItem('contactCards', card.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Title" value={card.title ?? ''} onChange={(value) => updateArrayItem('contactCards', card.id, { title: value })} dark={dark} />
                  <Field label="Value" value={card.value ?? ''} onChange={(value) => updateArrayItem('contactCards', card.id, { value })} dark={dark} />
                  <IconPicker value={card.icon ?? 'mail'} onChange={(value) => updateArrayItem('contactCards', card.id, { icon: value })} dark={dark} />
                </div>
                <TextareaField label="Description" value={card.description ?? ''} onChange={(value) => updateArrayItem('contactCards', card.id, { description: value })} rows={2} dark={dark} />
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('contactCards', {
              title: '',
              description: '',
              value: '',
              icon: 'mail',
            })}
            label="Add Contact Card"
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={Users} title="WaveLab Team" count={s.teamMembers?.length ?? 0} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.teamMembers ?? []}
            strategy="list"
            onReorder={(next) => reorderArray('teamMembers', next)}
            className="flex flex-col gap-3"
            renderItem={(member, sortableProps) => (
              <ArrayRow
                key={member.id}
                onRemove={() => removeArrayItem('teamMembers', member.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Full Name" value={member.name ?? ''} onChange={(value) => updateArrayItem('teamMembers', member.id, { name: value })} dark={dark} />
                  <Field label="Role" value={member.role ?? ''} onChange={(value) => updateArrayItem('teamMembers', member.id, { role: value })} dark={dark} />
                  <Field label="Email" value={member.email ?? ''} onChange={(value) => updateArrayItem('teamMembers', member.id, { email: value })} dark={dark} />
                  <Field label="Avatar URL" value={member.avatar ?? ''} onChange={(value) => updateArrayItem('teamMembers', member.id, { avatar: value })} dark={dark} />
                </div>
                {member.avatar && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={isURL(member.avatar) ? member.avatar : FALLBACK_AVATAR}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_AVATAR;
                      }}
                      alt={member.name || 'Team member avatar'}
                      className="h-12 w-12 rounded-lg border border-slate-300/30 object-cover"
                    />
                    {!isURL(member.avatar) && (
                      <span className="text-xs font-semibold text-amber-500">
                        Use an http/https avatar URL.
                      </span>
                    )}
                  </div>
                )}
              </ArrayRow>
            )}
          />
          <AddButton
            onClick={() => addArrayItem('teamMembers', {
              name: '',
              role: '',
              email: '',
              avatar: '',
            })}
            label="Add Team Member"
            dark={dark}
          />
        </div>
      </Accordion>
    </div>
  );
}
