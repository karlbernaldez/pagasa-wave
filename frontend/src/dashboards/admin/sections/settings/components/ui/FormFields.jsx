// ╔══════════════════════════════════════════════════════╗
// ║                  ui/FormFields.jsx                   ║
// ║  Field, TextareaField — shared across all tabs       ║
// ╚══════════════════════════════════════════════════════╝

// ── Shared class helpers ───────────────────────────────
export const inputCls = (dark) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
    dark
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 hover:border-slate-600'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 hover:border-slate-300'
  }`;

export const labelCls = (dark) =>
  `block text-xs font-semibold uppercase tracking-widest mb-2 ${
    dark ? 'text-slate-400' : 'text-slate-500'
  }`;

// ── Text Input ─────────────────────────────────────────
export const Field = ({ label, value, onChange, type = 'text', placeholder = '', dark }) => (
  <div>
    <label className={labelCls(dark)}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls(dark)}
    />
  </div>
);

// ── Textarea ───────────────────────────────────────────
export const TextareaField = ({ label, value, onChange, rows = 3, dark }) => (
  <div>
    <label className={labelCls(dark)}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`${inputCls(dark)} resize-none`}
    />
  </div>
);