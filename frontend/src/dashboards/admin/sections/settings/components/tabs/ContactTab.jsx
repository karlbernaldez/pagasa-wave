import { Globe, Mail, Clock, Users } from 'lucide-react';
import { useState } from 'react';

import IconPicker from '../ui/IconPicker';
import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';
import { SortableDnD } from '../ui/Sortable';

const FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=3";

/* =========================================================
   SANITIZATION + VALIDATION HELPERS
========================================================= */

const clean = (v) =>
  typeof v === 'string'
    ? v.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim()
    : v;

const limit = (v, max) => v?.slice(0, max);

const safeText = (v, max = 300) => limit(clean(v ?? ''), max);

const isEmail = (v) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const isURL = (v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
};


/* =========================================================
   COMPONENT
========================================================= */

const ContactTab = ({ settings = {}, setSettings, dark }) => {

  const s = settings || {};
  const [errors, setErrors] = useState({});


  /* =========================================================
     FIELD SETTER WITH SANITIZATION + VALIDATION
  ========================================================= */

  const setField = (key, max = 300) => (value) => {
    const cleaned = safeText(value, max);

    setSettings(prev => ({ ...prev, [key]: cleaned }));
  };


  /* =========================================================
     ARRAY HELPERS WITH VALIDATION
  ========================================================= */

  const updateArrayItem = (key, id, patch) => {
    const cleanedPatch = Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, safeText(v, 500)])
    );

    setSettings(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).map(it =>
        it.id === id ? { ...it, ...cleanedPatch } : it
      )
    }));
  };

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


  /* =========================================================
     VALIDATION CHECKS
  ========================================================= */

  const validateMember = (member) => {
    const e = {};

    if (member.email && !isEmail(member.email))
      e.email = "Invalid email format";

    if (member.avatar && !isURL(member.avatar))
      e.avatar = "Avatar must be a valid http/https URL";

    return e;
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-4">

      {/* HERO */}
      <Accordion icon={Globe} title="Hero Content" dark={dark} defaultOpen>
        <div className="grid gap-4 md:grid-cols-2">

          <Field label="Badge Text"
            value={s.heroBadgeText ?? ''}
            onChange={setField('heroBadgeText', 80)}
            dark={dark}
          />

          <Field label="Title Prefix"
            value={s.heroTitlePrefix ?? ''}
            onChange={setField('heroTitlePrefix', 120)}
            dark={dark}
          />

          <Field label="Title Highlight"
            value={s.heroTitleHighlight ?? ''}
            onChange={setField('heroTitleHighlight', 120)}
            dark={dark}
          />

          <Field label="Title Suffix"
            value={s.heroTitleSuffix ?? ''}
            onChange={setField('heroTitleSuffix', 120)}
            dark={dark}
          />

          <div className="md:col-span-2">
            <TextareaField label="Hero Description"
              value={s.heroDescription ?? ''}
              onChange={setField('heroDescription', 1000)}
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
          onReorder={(next)=>reorderArray('contactCards', next)}
          className="flex flex-col gap-3"
          renderItem={(card, sortableProps)=>(
            <ArrayRow key={card.id}
              onRemove={()=>removeArrayItem('contactCards', card.id)}
              dark={dark}
              dragHandleProps={sortableProps.dragHandleProps}
            >

              <div className="grid md:grid-cols-2 gap-3">

                <Field label="Title"
                  value={card.title ?? ''}
                  onChange={(v)=>updateArrayItem('contactCards', card.id, { title:v })}
                  dark={dark}
                />

                <Field label="Value"
                  value={card.value ?? ''}
                  onChange={(v)=>updateArrayItem('contactCards', card.id, { value:v })}
                  dark={dark}
                />

                <IconPicker value={card.icon ?? 'mail'}
                  onChange={(v)=>updateArrayItem('contactCards', card.id, { icon:v })}
                  dark={dark}
                />

                <Field label="Gradient color classes"
                  value={card.color ?? ''}
                  onChange={(v)=>updateArrayItem('contactCards', card.id, { color:v })}
                  dark={dark}
                />

              </div>

              <TextareaField label="Description"
                value={card.description ?? ''}
                onChange={(v)=>updateArrayItem('contactCards', card.id, { description:v })}
                rows={2}
                dark={dark}
              />

            </ArrayRow>
          )}
        />

        <AddButton
          onClick={()=>addArrayItem('contactCards',{
            title:'',
            description:'',
            value:'',
            icon:'mail',
            color:'from-blue-500 to-cyan-500'
          })}
          label="Add Contact Card"
          dark={dark}
        />
      </Accordion>


      {/* TEAM */}
      <Accordion icon={Users} title="WaveLab Team" count={s.teamMembers?.length ?? 0} dark={dark}>
        <SortableDnD
          items={s.teamMembers ?? []}
          strategy="list"
          onReorder={(next)=>reorderArray('teamMembers', next)}
          className="flex flex-col gap-3"
          renderItem={(member, sortableProps)=>{

            const memberErrors = validateMember(member);

            return (
              <ArrayRow key={member.id}
                onRemove={()=>removeArrayItem('teamMembers', member.id)}
                dark={dark}
                dragHandleProps={sortableProps.dragHandleProps}
              >

                <div className="grid md:grid-cols-2 gap-3">

                  <Field label="Full Name"
                    value={member.name ?? ''}
                    onChange={(v)=>updateArrayItem('teamMembers', member.id, { name:v })}
                    dark={dark}
                  />

                  <Field label="Role"
                    value={member.role ?? ''}
                    onChange={(v)=>updateArrayItem('teamMembers', member.id, { role:v })}
                    dark={dark}
                  />

                  <Field label="Email"
                    value={member.email ?? ''}
                    onChange={(v)=>updateArrayItem('teamMembers', member.id, { email:v })}
                    dark={dark}
                    error={memberErrors.email}
                  />

                  <Field label="Phone"
                    value={member.phone ?? ''}
                    onChange={(v)=>updateArrayItem('teamMembers', member.id, { phone:v })}
                    dark={dark}
                  />

                </div>

                <Field label="Avatar URL"
                  value={member.avatar ?? ''}
                  onChange={(v)=>updateArrayItem('teamMembers', member.id, { avatar:v })}
                  dark={dark}
                  error={memberErrors.avatar}
                />

                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={isURL(member.avatar) ? member.avatar : FALLBACK_AVATAR}
                    onError={(e)=>{e.currentTarget.src=FALLBACK_AVATAR}}
                    alt={member.name || 'avatar'}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-300/30"
                  />
                  <span className="text-xs opacity-70">Avatar preview</span>
                </div>

              </ArrayRow>
            );
          }}
        />

        <AddButton
          onClick={()=>addArrayItem('teamMembers',{
            name:'', role:'', email:'', phone:'', avatar:''
          })}
          label="Add Team Member"
          dark={dark}
        />
      </Accordion>

    </div>
  );
};

export default ContactTab;