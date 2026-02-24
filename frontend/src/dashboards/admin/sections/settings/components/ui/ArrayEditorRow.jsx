// ╔══════════════════════════════════════════════════════╗
// ║               ui/ArrayEditorRow.jsx                  ║
// ║  ArrayRow — wrapper card per list item               ║
// ║  AddButton — dashed "add" trigger                    ║
// ║  useArrayField — add / remove / update helper        ║
// ╚══════════════════════════════════════════════════════╝
import { GripVertical, Trash2, Plus } from 'lucide-react';

// ── Row wrapper ────────────────────────────────────────
export const ArrayRow = ({ index, onRemove, dark, children, dragHandleProps }) => (
  <div className={`group relative flex gap-3 items-start p-4 rounded-xl border transition-all duration-200 ${dark
      ? 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
    }`}>
    {/* Drag handle hint */}
    <button
      type="button"
      {...dragHandleProps}
      className={`flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-60 ${dark ? 'text-slate-400' : 'text-slate-400'
        }`}
      aria-label="Drag to reorder"
    >
      <GripVertical size={14} />
    </button>

    <div className="flex-1 min-w-0 grid gap-3">{children}</div>

    <button
      onClick={() => onRemove(index)}
      className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 ${dark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
        }`}
    >
      <Trash2 size={14} />
    </button>
  </div >
);

// ── Add button ─────────────────────────────────────────
export const AddButton = ({ onClick, label, dark }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all duration-200 hover:scale-[1.01] ${dark
      ? 'border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5'
      : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
      }`}
  >
    <Plus size={14} /> {label}
  </button>
);

// ── Hook: array field CRUD ─────────────────────────────
// Usage: const stats = useArrayField(settings.stats, set('stats'))
//        stats.add({ number: '', label: '', sublabel: '' })
//        stats.remove(index)
//        stats.update(index, { number: '42' })
export const useArrayField = (value = [], onChange) => {
  const add = (blank) => onChange([...value, blank]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, patch) => onChange(value.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  return { add, remove, update };
};