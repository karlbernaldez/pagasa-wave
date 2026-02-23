// tabs/AboutTab.jsx
import { useEffect, useMemo, useRef } from 'react';
import {
  Star, BarChart2, Eye, Target, Layers,
  Clock, User, Users, Link, Trash2, ImageOff, Upload,
  Undo2, Redo2, GripVertical
} from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';
import { ArrayRow, AddButton } from '../ui/ArrayEditorRow';

import { SortableDnD } from '../ui/Sortable';
import { ensureIdsInSettings } from '../../utils/ensureIds';
import { useUndoRedoState } from '../../hooks/useUndoRedoState';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';

// ─────────────────────────────────────────────────────────────────────────────
// Partner Card (now supports optional drag handle props)
// ─────────────────────────────────────────────────────────────────────────────
const PartnerCard = ({ partner, index, onUpdate, onRemove, dark, dragHandleProps }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate(index, { logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const hasLogo = Boolean(partner.logo);

  return (
    <div className={`group relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200 ${
      dark
        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>

      {/* Drag Handle (optional; only used when passed) */}
      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps}
          className={`absolute top-2 left-2 z-10 p-1 rounded-lg opacity-60 hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing ${
            dark ? 'text-slate-300 hover:bg-slate-700/40' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className={`absolute top-2 right-2 z-10 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 ${
          dark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-400 hover:bg-red-50'
        }`}
        title="Remove partner"
      >
        <Trash2 size={12} />
      </button>

      {/* Live Preview Box */}
      <div className={`relative flex items-center justify-center h-20 rounded-xl border-2 border-dashed overflow-hidden transition-all duration-300 ${
        hasLogo
          ? dark ? 'border-slate-600 bg-slate-900/60' : 'border-slate-300 bg-slate-50'
          : dark ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50/80'
      }`}>
        {hasLogo && (
          <img
            key={partner.logo}
            src={partner.logo}
            alt={partner.name || `Partner ${index + 1}`}
            className="max-h-14 w-full object-contain px-3 transition-all duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = 'block';
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'none';
            }}
          />
        )}
        <div className={`flex-col items-center gap-1.5 text-center ${hasLogo ? 'hidden' : 'flex'}`}>
          <ImageOff size={16} className={dark ? 'text-slate-600' : 'text-slate-300'} />
          <span className={`text-[10px] leading-tight ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            Paste URL or upload
          </span>
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Logo URL
        </label>
        <input
          value={partner.logo?.startsWith('data:') ? '' : (partner.logo ?? '')}
          onChange={(e) => onUpdate(index, { logo: e.target.value })}
          placeholder="https://… or /logos/name.png"
          className={`w-full text-xs px-3 py-2 rounded-lg border outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 ${
            dark
              ? 'bg-slate-900 border-slate-700 text-slate-300 placeholder-slate-600 hover:border-slate-600'
              : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 hover:border-slate-300'
          }`}
        />
      </div>

      {/* Upload */}
      <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Or Upload File
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all duration-200 hover:scale-[1.02] ${
            dark
              ? 'border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 bg-slate-900'
              : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 bg-white'
          }`}
        >
          <Upload size={12} />
          {hasLogo && partner.logo.startsWith('data:') ? 'Replace File' : 'Choose File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="sr-only"
        />
        {hasLogo && partner.logo.startsWith('data:') && (
          <p className={`text-[10px] mt-1.5 text-center ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            ✓ File uploaded
          </p>
        )}
      </div>

      {/* Agency name */}
      <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Agency Name
        </label>
        <input
          value={partner.name ?? ''}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          placeholder="e.g. PAGASA"
          className={`w-full text-xs px-3 py-2 rounded-lg border outline-none transition-all duration-200 font-semibold focus:ring-2 focus:ring-blue-500/30 ${
            dark
              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 hover:border-slate-600'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 hover:border-slate-300'
          }`}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistence stub (replace with your API call)
// ─────────────────────────────────────────────────────────────────────────────
async function persistSettings(nextSettings) {
  return;
}

// ─────────────────────────────────────────────────────────────────────────────
// AboutTab
// ─────────────────────────────────────────────────────────────────────────────
const AboutTab = ({ settings, setSettings, dark }) => {
  const normalizedInitial = useMemo(() => ensureIdsInSettings(settings), [settings]);

  const history = useUndoRedoState(normalizedInitial, {
    maxHistory: 80,
    hotkeys: true,
  });

  useEffect(() => {
    setSettings(history.present);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present]);

  useEffect(() => {
    const normalized = ensureIdsInSettings(settings);

    const hasMissingId =
      (normalized.stats ?? []).some(x => !x.id) ||
      (normalized.highlights ?? []).some(x => !x.id) ||
      (normalized.programObjectives ?? []).some(x => !x.id) ||
      (normalized.pillars ?? []).some(x => !x.id) ||
      (normalized.milestones ?? []).some(x => !x.id) ||
      (normalized.leaders ?? []).some(x => !x.id) ||
      (normalized.partners ?? []).some(x => !x.id);

    if (hasMissingId) history.set(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDebouncedEffect(() => {
    persistSettings(history.present);
  }, [history.present], 700);

  const setField = (field) => (val) =>
    history.set((p) => ({ ...p, [field]: val, __version: Date.now() }));

  const updateArrayItem = (key, id, patch) => {
    history.set((p) => ({
      ...p,
      [key]: (p[key] ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      __version: Date.now(),
    }));
  };

  const removeArrayItem = (key, id) => {
    history.set((p) => ({
      ...p,
      [key]: (p[key] ?? []).filter((it) => it.id !== id),
      __version: Date.now(),
    }));
  };

  const addArrayItem = (key, item) => {
    history.set((p) => ({
      ...p,
      [key]: [...(p[key] ?? []), item],
      __version: Date.now(),
    }));
  };

  const reorderArray = (key, next) => {
    history.set((p) => ({
      ...p,
      [key]: next,
      __version: Date.now(),
    }));
  };

  const s = history.present;

  const OverlayCard = ({ children }) => (
    <div className={`rounded-2xl shadow-2xl ring-2 ${
      dark ? 'ring-blue-500/30 bg-slate-900/80' : 'ring-blue-500/20 bg-white'
    }`}>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Top controls: Undo/Redo */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={history.undo}
          disabled={!history.canUndo}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            dark
              ? 'border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:border-slate-600'
              : 'border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:border-slate-300'
          }`}
          title="Undo (Ctrl/Cmd+Z)"
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          type="button"
          onClick={history.redo}
          disabled={!history.canRedo}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            dark
              ? 'border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:border-slate-600'
              : 'border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:border-slate-300'
          }`}
          title="Redo (Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y)"
        >
          <Redo2 size={14} />
          Redo
        </button>
      </div>

      {/* 1. Title & Subtitle */}
      <Accordion icon={Star} title="Title & Subtitle" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <Field label="Page Title" value={s.title} onChange={setField('title')} placeholder="Seamless Prediction for…" dark={dark} />
          <TextareaField label="Subtitle / Description" value={s.subtitle} onChange={setField('subtitle')} rows={4} dark={dark} />
          <Field label="Badge Text" value={s.badgeText} onChange={setField('badgeText')} placeholder="About WaveLab" dark={dark} />
          <div className={`p-4 rounded-xl border ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Call-to-Action Buttons</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Primary Label" value={s.ctaPrimaryLabel} onChange={setField('ctaPrimaryLabel')} dark={dark} />
              <Field label="Primary Link"  value={s.ctaPrimaryLink}  onChange={setField('ctaPrimaryLink')} placeholder="/contact" dark={dark} />
              <Field label="Secondary Label" value={s.ctaSecondaryLabel} onChange={setField('ctaSecondaryLabel')} dark={dark} />
              <Field label="Secondary Link"  value={s.ctaSecondaryLink}  onChange={setField('ctaSecondaryLink')} placeholder="/charts" dark={dark} />
            </div>
          </div>
        </div>
      </Accordion>

      {/* 2. Stats */}
      <Accordion icon={BarChart2} title="Stats" count={s.stats.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.stats}
            strategy="list"
            onReorder={(next) => reorderArray('stats', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging stat</div>
                  <div className="text-sm font-bold">{item.number || '—'} {item.label || ''}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(stat, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={stat.id}
                  index={s.stats.findIndex(x => x.id === stat.id)}
                  onRemove={() => removeArrayItem('stats', stat.id)}
                  dark={dark}
                >
                  <div className="grid grid-cols-3 gap-3">
                    <Field
                      label="Number"
                      value={stat.number}
                      onChange={(v) => updateArrayItem('stats', stat.id, { number: v })}
                      placeholder="36"
                      dark={dark}
                    />
                    <Field
                      label="Label"
                      value={stat.label}
                      onChange={(v) => updateArrayItem('stats', stat.id, { label: v })}
                      placeholder="Duration"
                      dark={dark}
                    />
                    <Field
                      label="Sublabel"
                      value={stat.sublabel}
                      onChange={(v) => updateArrayItem('stats', stat.id, { sublabel: v })}
                      placeholder="Months"
                      dark={dark}
                    />
                  </div>
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('stats', { id: crypto.randomUUID(), number: '', label: '', sublabel: '' })}
            label="Add Stat"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 3. Mission & Vision */}
      <Accordion icon={Eye} title="Mission & Vision" count={s.highlights.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.highlights}
            strategy="list"
            onReorder={(next) => reorderArray('highlights', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging highlight</div>
                  <div className="text-sm font-bold">{item.title || '—'}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(h, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={h.id}
                  index={s.highlights.findIndex(x => x.id === h.id)}
                  onRemove={() => removeArrayItem('highlights', h.id)}
                  dark={dark}
                >
                  <Field
                    label="Title (e.g. Mission)"
                    value={h.title}
                    onChange={(v) => updateArrayItem('highlights', h.id, { title: v })}
                    dark={dark}
                  />
                  <TextareaField
                    label="Description"
                    value={h.description}
                    onChange={(v) => updateArrayItem('highlights', h.id, { description: v })}
                    rows={3}
                    dark={dark}
                  />
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('highlights', { id: crypto.randomUUID(), title: '', description: '' })}
            label="Add Highlight"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 4. Program Objectives */}
      <Accordion icon={Target} title="Program Objectives" count={s.programObjectives.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.programObjectives}
            strategy="list"
            onReorder={(next) => reorderArray('programObjectives', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging objective</div>
                  <div className="text-sm font-bold">{item.title || '—'}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(obj, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={obj.id}
                  index={s.programObjectives.findIndex(x => x.id === obj.id)}
                  onRemove={() => removeArrayItem('programObjectives', obj.id)}
                  dark={dark}
                >
                  <Field
                    label="Title"
                    value={obj.title}
                    onChange={(v) => updateArrayItem('programObjectives', obj.id, { title: v })}
                    dark={dark}
                  />
                  <TextareaField
                    label="Description"
                    value={obj.description}
                    onChange={(v) => updateArrayItem('programObjectives', obj.id, { description: v })}
                    rows={2}
                    dark={dark}
                  />
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('programObjectives', { id: crypto.randomUUID(), title: '', description: '' })}
            label="Add Objective"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 5. Focus Areas */}
      <Accordion icon={Layers} title="Focus Areas" count={s.pillars.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.pillars}
            strategy="list"
            onReorder={(next) => reorderArray('pillars', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging focus area</div>
                  <div className="text-sm font-bold">{item.title || '—'}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(pillar, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={pillar.id}
                  index={s.pillars.findIndex(x => x.id === pillar.id)}
                  onRemove={() => removeArrayItem('pillars', pillar.id)}
                  dark={dark}
                >
                  <Field
                    label="Title"
                    value={pillar.title}
                    onChange={(v) => updateArrayItem('pillars', pillar.id, { title: v })}
                    dark={dark}
                  />
                  <TextareaField
                    label="Description"
                    value={pillar.description}
                    onChange={(v) => updateArrayItem('pillars', pillar.id, { description: v })}
                    rows={2}
                    dark={dark}
                  />
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('pillars', { id: crypto.randomUUID(), title: '', description: '' })}
            label="Add Focus Area"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 6. Timeline */}
      <Accordion icon={Clock} title="Timeline" count={s.milestones.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.milestones}
            strategy="list"
            onReorder={(next) => reorderArray('milestones', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging milestone</div>
                  <div className="text-sm font-bold">{item.year || '—'} · {item.title || ''}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(ms, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={ms.id}
                  index={s.milestones.findIndex(x => x.id === ms.id)}
                  onRemove={() => removeArrayItem('milestones', ms.id)}
                  dark={dark}
                >
                  <div className="grid grid-cols-3 gap-3">
                    <Field
                      label="Year / Period"
                      value={ms.year}
                      onChange={(v) => updateArrayItem('milestones', ms.id, { year: v })}
                      placeholder="2024"
                      dark={dark}
                    />
                    <div className="col-span-2">
                      <Field
                        label="Milestone Title"
                        value={ms.title}
                        onChange={(v) => updateArrayItem('milestones', ms.id, { title: v })}
                        dark={dark}
                      />
                    </div>
                  </div>
                  <TextareaField
                    label="Description"
                    value={ms.description}
                    onChange={(v) => updateArrayItem('milestones', ms.id, { description: v })}
                    rows={2}
                    dark={dark}
                  />
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('milestones', { id: crypto.randomUUID(), year: '', title: '', description: '' })}
            label="Add Milestone"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 7. Leadership */}
      <Accordion icon={User} title="Leadership" count={s.leaders.length} dark={dark}>
        <div className="flex flex-col gap-3">
          <SortableDnD
            items={s.leaders}
            strategy="list"
            onReorder={(next) => reorderArray('leaders', next)}
            className="flex flex-col gap-3"
            renderOverlay={(item) => (
              <OverlayCard>
                <div className="p-3">
                  <div className="text-xs font-semibold opacity-70">Dragging leader</div>
                  <div className="text-sm font-bold">{item.name || '—'}</div>
                </div>
              </OverlayCard>
            )}
            renderItem={(leader, sortable) => (
              <div {...sortable.dragHandleProps}>
                <ArrayRow
                  key={leader.id}
                  index={s.leaders.findIndex(x => x.id === leader.id)}
                  onRemove={() => removeArrayItem('leaders', leader.id)}
                  dark={dark}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field
                      label="Full Name"
                      value={leader.name}
                      onChange={(v) => updateArrayItem('leaders', leader.id, { name: v })}
                      dark={dark}
                    />
                    <Field
                      label="Role / Title"
                      value={leader.role}
                      onChange={(v) => updateArrayItem('leaders', leader.id, { role: v })}
                      dark={dark}
                    />
                    <Field
                      label="Avatar URL"
                      value={leader.avatar}
                      onChange={(v) => updateArrayItem('leaders', leader.id, { avatar: v })}
                      placeholder="https://…"
                      dark={dark}
                    />
                  </div>

                  {leader.avatar && (
                    <div className="flex items-center gap-3 mt-1">
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-300/30 flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Avatar preview</span>
                    </div>
                  )}
                </ArrayRow>
              </div>
            )}
          />

          <AddButton
            onClick={() => addArrayItem('leaders', { id: crypto.randomUUID(), name: '', role: '', avatar: '' })}
            label="Add Leader"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 8. Partner Agencies (GRID) */}
      <Accordion icon={Users} title="Partner Agencies" count={s.partners.length} dark={dark}>
        <div className="flex flex-col gap-4">
          <SortableDnD
            items={s.partners}
            strategy="grid"
            onReorder={(next) => reorderArray('partners', next)}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            renderOverlay={(partner) => (
              <OverlayCard>
                <div className="w-[260px]">
                  <PartnerCard
                    partner={partner}
                    index={0}
                    onUpdate={() => {}}
                    onRemove={() => {}}
                    dark={dark}
                    dragHandleProps={{}}
                  />
                </div>
              </OverlayCard>
            )}
            renderItem={(partner, sortable) => {
              const index = s.partners.findIndex(p => p.id === partner.id);
              const updatePartner = (i, patch) => updateArrayItem('partners', s.partners[i].id, patch);
              const removePartner = (i) => removeArrayItem('partners', s.partners[i].id);

              return (
                <PartnerCard
                  partner={partner}
                  index={index}
                  onUpdate={updatePartner}
                  onRemove={removePartner}
                  dark={dark}
                  dragHandleProps={sortable.dragHandleProps}
                />
              );
            }}
          />

          <AddButton
            onClick={() => addArrayItem('partners', { id: crypto.randomUUID(), name: '', logo: '' })}
            label="Add Partner"
            dark={dark}
          />
        </div>
      </Accordion>

      {/* 9. Bottom CTA */}
      <Accordion icon={Link} title="Bottom Call-to-Action" dark={dark}>
        <div className="grid gap-4">
          <Field label="CTA Title" value={s.ctaTitle} onChange={setField('ctaTitle')} dark={dark} />
          <TextareaField label="CTA Description" value={s.ctaDescription} onChange={setField('ctaDescription')} rows={3} dark={dark} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Button Label" value={s.ctaButtonLabel} onChange={setField('ctaButtonLabel')} dark={dark} />
            <Field label="Button Link"  value={s.ctaButtonLink}  onChange={setField('ctaButtonLink')} placeholder="/contact" dark={dark} />
          </div>
        </div>
      </Accordion>

    </div>
  );
};

export default AboutTab;