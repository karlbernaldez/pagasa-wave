import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CirclePlus,
  ClipboardCheck,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';

import {
  createReviewChecklistDefinitionVersion,
  getReviewChecklistDefinition,
} from '@/api/reviewChecklist';

import { Field, TextareaField, inputCls, labelCls } from '../ui/FormFields';
import {
  buildReviewChecklistPayload,
  createNextChecklistDraftItem,
  definitionToDraft,
  normalizeChecklistKey,
  validateReviewChecklistDraft,
} from '../../utils/reviewChecklistDraft';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function Toggle({ checked, onChange, disabled, label, description, dark }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3 py-3',
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
      />
      <span className="min-w-0">
        <span className={cn('block text-sm font-bold', dark ? 'text-white' : 'text-slate-900')}>
          {label}
        </span>
        {description && (
          <span className={cn('mt-1 block text-xs leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

function StatusBanner({ status, dark }) {
  if (!status) return null;

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm font-semibold',
        status.type === 'error'
          ? dark
            ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
            : 'border-rose-200 bg-rose-50 text-rose-700'
          : dark
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      {status.message}
    </div>
  );
}

export default function ReviewChecklistTab({ dark, canManage = false }) {
  const [draft, setDraft] = useState(() => definitionToDraft(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getReviewChecklistDefinition()
      .then((definition) => {
        if (cancelled) return;
        setDraft(definitionToDraft(definition));
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus({ type: 'error', message: error.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const requiredCount = useMemo(
    () => draft.items.filter((item) => item.isActive && item.isRequired).length,
    [draft.items]
  );
  const optionalCount = useMemo(
    () => draft.items.filter((item) => item.isActive && !item.isRequired).length,
    [draft.items]
  );

  const updateItem = (index, patch) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const moveItem = (index, direction) => {
    setDraft((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.items.length) return current;

      const items = [...current.items];
      const [item] = items.splice(index, 1);
      items.splice(targetIndex, 0, item);
      return { ...current, items };
    });
  };

  const addItem = () => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, createNextChecklistDraftItem(current.items)],
    }));
  };

  const removeItem = (index) => {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const save = async () => {
    if (!canManage || saving) return;

    const validationError = validateReviewChecklistDraft(draft);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const definition = await createReviewChecklistDefinitionVersion(
        buildReviewChecklistPayload(draft)
      );
      setDraft(definitionToDraft(definition));
      setStatus({
        type: 'success',
        message: `Review checklist version ${definition?.version || ''} saved and activated.`,
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-[260px] items-center justify-center rounded-2xl border text-sm font-semibold',
          dark
            ? 'border-white/10 bg-white/[0.03] text-slate-400'
            : 'border-slate-200 bg-white text-slate-500'
        )}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading review checklist...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'rounded-2xl border p-5',
          dark ? 'border-cyan-300/20 bg-cyan-400/10' : 'border-cyan-100 bg-cyan-50/80'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className={dark ? 'text-cyan-300' : 'text-cyan-700'} />
              <h3 className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-950')}>
                Forecast Package Review Checklist
              </h3>
            </div>
            <p className={cn('mt-2 max-w-3xl text-sm font-semibold leading-6', dark ? 'text-cyan-100' : 'text-cyan-800')}>
              This checklist is snapshotted when a Forecast Package enters review. Saving changes creates a new version; existing review evidence keeps the version it started with.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className={cn('rounded-full px-3 py-1.5', dark ? 'bg-white/10 text-cyan-100' : 'bg-white text-cyan-800')}>
              Version {draft.version || 'New'}
            </span>
            <span className={cn('rounded-full px-3 py-1.5', dark ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-700')}>
              {requiredCount} required
            </span>
            <span className={cn('rounded-full px-3 py-1.5', dark ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-700')}>
              {optionalCount} optional
            </span>
          </div>
        </div>
      </div>

      <StatusBanner status={status} dark={dark} />

      <section
        className={cn(
          'rounded-2xl border p-5',
          dark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'
        )}
      >
        <Field
          label="Checklist name"
          value={draft.name}
          onChange={(name) => setDraft((current) => ({ ...current, name }))}
          disabled={!canManage || saving}
          dark={dark}
        />
      </section>

      <div className="space-y-3">
        {draft.items.map((item, index) => (
          <section
            key={`${item.key || 'item'}-${index}`}
            className={cn(
              'rounded-2xl border p-5',
              dark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
            )}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={cn('text-xs font-black uppercase tracking-[0.14em]', dark ? 'text-slate-500' : 'text-slate-400')}>
                  Checklist item {index + 1}
                </p>
                <p className={cn('mt-1 text-sm font-black', dark ? 'text-white' : 'text-slate-950')}>
                  {item.label || 'Untitled review item'}
                </p>
              </div>

              {canManage && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0 || saving}
                    aria-label="Move checklist item up"
                    className={cn(
                      'rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-30',
                      dark ? 'border-white/10 text-slate-300 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === draft.items.length - 1 || saving}
                    aria-label="Move checklist item down"
                    className={cn(
                      'rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-30',
                      dark ? 'border-white/10 text-slate-300 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={draft.items.length === 1 || saving}
                    aria-label="Remove checklist item"
                    className={cn(
                      'rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-30',
                      dark ? 'border-rose-400/20 text-rose-300 hover:bg-rose-500/10' : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    )}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Label"
                value={item.label}
                onChange={(label) => updateItem(index, { label })}
                disabled={!canManage || saving}
                dark={dark}
              />
              <div>
                <label className={labelCls(dark)}>Stable key</label>
                <input
                  value={item.key}
                  disabled={!canManage || saving}
                  onChange={(event) =>
                    updateItem(index, { key: normalizeChecklistKey(event.target.value) })
                  }
                  className={inputCls(dark)}
                  placeholder="wave_field_consistency"
                />
              </div>
            </div>

            <div className="mt-4">
              <TextareaField
                label="Reviewer guidance"
                value={item.description}
                onChange={(description) => updateItem(index, { description })}
                rows={2}
                disabled={!canManage || saving}
                dark={dark}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Toggle
                checked={item.isRequired}
                onChange={(isRequired) => updateItem(index, { isRequired })}
                disabled={!canManage || saving}
                label="Required"
                description="Must be resolved before package approval."
                dark={dark}
              />
              <Toggle
                checked={item.allowNotApplicable}
                onChange={(allowNotApplicable) => updateItem(index, { allowNotApplicable })}
                disabled={!canManage || saving}
                label="Allow N/A"
                description="Reviewer may mark the item not applicable."
                dark={dark}
              />
              <Toggle
                checked={item.isActive}
                onChange={(isActive) => updateItem(index, { isActive })}
                disabled={!canManage || saving}
                label="Enabled"
                description="Included in new review checklist snapshots."
                dark={dark}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canManage ? (
          <button
            type="button"
            onClick={addItem}
            disabled={saving}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-black disabled:opacity-40',
              dark
                ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <CirclePlus size={16} />
            Add checklist item
          </button>
        ) : (
          <p className={cn('text-xs font-semibold', dark ? 'text-slate-500' : 'text-slate-500')}>
            View-only access. You can inspect the active checklist, but cannot create a new version.
          </p>
        )}

        {canManage && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-black text-white shadow-sm hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving version...' : 'Save new version'}
          </button>
        )}
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border px-4 py-3 text-xs font-semibold leading-5',
          dark ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        )}
      >
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        Existing Forecast Package reviews are never rewritten when this configuration changes.
      </div>
    </div>
  );
}
