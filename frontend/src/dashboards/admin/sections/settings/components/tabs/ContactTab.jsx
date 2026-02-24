import { Globe, Mail, Clock, Users } from 'lucide-react';

import IconPicker from '../ui/IconPicker';
import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';
import { SortableDnD } from '../ui/Sortable';

const FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=3";

const ContactTab = ({ settings = {}, setSettings, dark }) => {

  const s = settings || {};

  /* =========================================================
     FIELD SETTER (same as General/About)
  ========================================================= */

  const setField = (key) => (value) =>
    setSettings(prev => ({ ...prev, [key]: value }));


  /* =========================================================
     ARRAY HELPERS (IMMUTABLE)
  ========================================================= */

  const updateArrayItem = (key, id, patch) =>
    setSettings(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).map(it => it.id === id ? { ...it, ...patch } : it)
    }));

  const removeArrayItem = (key, id) =>
    setSettings(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).filter(it => it.id !== id)
    }));

  const addArrayItem = (key, item) =>
    setSettings(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: crypto.randomUUID(), ...item }]
    }));

  const reorderArray = (key, next) =>
    setSettings(prev => ({ ...prev, [key]: next }));


  return (
    <div className="flex flex-col gap-4">

      {/* HERO */}
      <Accordion icon={Globe} title="Hero Content" dark={dark} defaultOpen>
        <div className="grid gap-4 md:grid-cols-2">

          <Field label="Badge Text"
            value={s.heroBadgeText ?? ''}
            onChange={setField('heroBadgeText')}
            dark={dark}
          />

          <Field label="Title Prefix"
            value={s.heroTitlePrefix ?? ''}
            onChange={setField('heroTitlePrefix')}
            dark={dark}
          />

          <Field label="Title Highlight"
            value={s.heroTitleHighlight ?? ''}
            onChange={setField('heroTitleHighlight')}
            dark={dark}
          />

          <Field label="Title Suffix"
            value={s.heroTitleSuffix ?? ''}
            onChange={setField('heroTitleSuffix')}
            dark={dark}
          />

          <div className="md:col-span-2">
            <TextareaField label="Hero Description"
              value={s.heroDescription ?? ''}
              onChange={setField('heroDescription')}
              rows={4}
              dark={dark}
            />
          </div>

        </div>
      </Accordion>


      {/* CONTACT CARDS */}
      <Accordion icon={Mail} title="Contact Cards" count={s.contactCards?.length ?? 0} dark={dark}>
        <SortableDnD
          items={s.contactCards ?? []}
          strategy="list"
          onReorder={(next) => reorderArray('contactCards', next)}
          className="flex flex-col gap-3"
          renderItem={(card, sortableProps) => (

            <ArrayRow key={card.id}
              onRemove={() => removeArrayItem('contactCards', card.id)}
              dark={dark}
              dragHandleProps={sortableProps.dragHandleProps}
            >

              <div className="grid md:grid-cols-2 gap-3">

                <Field label="Title"
                  value={card.title ?? ''}
                  onChange={(v) => updateArrayItem('contactCards', card.id, { title: v })}
                  dark={dark}
                />

                <Field label="Value"
                  value={card.value ?? ''}
                  onChange={(v) => updateArrayItem('contactCards', card.id, { value: v })}
                  dark={dark}
                />

                <IconPicker value={card.icon ?? 'mail'}
                  onChange={(v) => updateArrayItem('contactCards', card.id, { icon: v })}
                  dark={dark}
                />

                <Field label="Gradient color classes"
                  value={card.color ?? ''}
                  onChange={(v) => updateArrayItem('contactCards', card.id, { color: v })}
                  dark={dark}
                />

              </div>

              <TextareaField label="Description"
                value={card.description ?? ''}
                onChange={(v) => updateArrayItem('contactCards', card.id, { description: v })}
                rows={2}
                dark={dark}
              />

            </ArrayRow>
          )}
        />

        <AddButton
          onClick={() => addArrayItem('contactCards', {
            title: '',
            description: '',
            value: '',
            icon: 'mail',
            color: 'from-blue-500 to-cyan-500'
          })}
          label="Add Contact Card"
          dark={dark}
        />
      </Accordion>


      {/* RESPONSE TARGETS */}
      <Accordion icon={Clock} title="Response Targets" count={s.responseTargets?.length ?? 0} dark={dark}>
        <SortableDnD
          items={s.responseTargets ?? []}
          strategy="list"
          onReorder={(next) => reorderArray('responseTargets', next)}
          className="flex flex-col gap-3"
          renderItem={(target, sortableProps) => (

            <ArrayRow key={target.id}
              onRemove={() => removeArrayItem('responseTargets', target.id)}
              dark={dark}
              dragHandleProps={sortableProps.dragHandleProps}
            >

              <Field label="Type"
                value={target.type ?? ''}
                onChange={(v) => updateArrayItem('responseTargets', target.id, { type: v })}
                dark={dark}
              />

              <Field label="Time"
                value={target.time ?? ''}
                onChange={(v) => updateArrayItem('responseTargets', target.id, { time: v })}
                dark={dark}
              />

              <IconPicker value={target.icon ?? 'clock'}
                onChange={(v) => updateArrayItem('responseTargets', target.id, { icon: v })}
                dark={dark}
              />

            </ArrayRow>
          )}
        />

        <AddButton
          onClick={() => addArrayItem('responseTargets', { type: '', time: '', icon: 'clock' })}
          label="Add Response Target"
          dark={dark}
        />
      </Accordion>


      {/* TEAM */}
      <Accordion icon={Users} title="WaveLab Team" count={s.teamMembers?.length ?? 0} dark={dark}>
        <SortableDnD
          items={s.teamMembers ?? []}
          strategy="list"
          onReorder={(next) => reorderArray('teamMembers', next)}
          className="flex flex-col gap-3"
          renderItem={(member, sortableProps)=>(

            <ArrayRow key={member.id}
              onRemove={() => removeArrayItem('teamMembers', member.id)}
              dark={dark}
              dragHandleProps={sortableProps.dragHandleProps}
            >

              <div className="grid md:grid-cols-2 gap-3">

                <Field label="Full Name"
                  value={member.name ?? ''}
                  onChange={(v) => updateArrayItem('teamMembers', member.id, { name: v })}
                  dark={dark}
                />

                <Field label="Role"
                  value={member.role ?? ''}
                  onChange={(v) => updateArrayItem('teamMembers', member.id, { role: v })}
                  dark={dark}
                />

                <Field label="Email"
                  value={member.email ?? ''}
                  onChange={(v) => updateArrayItem('teamMembers', member.id, { email: v })}
                  dark={dark}
                />

                <Field label="Phone"
                  value={member.phone ?? ''}
                  onChange={(v) => updateArrayItem('teamMembers', member.id, { phone: v })}
                  dark={dark}
                />

              </div>

              <Field label="Avatar URL"
                value={member.avatar ?? ''}
                onChange={(v) => updateArrayItem('teamMembers', member.id, { avatar: v })}
                dark={dark}
              />

              <div className="flex items-center gap-3 mt-2">
                <img
                  src={member.avatar || FALLBACK_AVATAR}
                  onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR }}
                  alt={member.name || 'avatar'}
                  className="h-12 w-12 rounded-lg object-cover border border-slate-300/30"
                />
                <span className="text-xs opacity-70">Avatar preview</span>
              </div>

            </ArrayRow>
          )}
        />

        <AddButton
          onClick={() => addArrayItem('teamMembers', {
            name: '', role: '', email: '', phone: '', avatar: ''
          })}
          label="Add Team Member"
          dark={dark}
        />
      </Accordion>

    </div>
  );
};

export default ContactTab;