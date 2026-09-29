// ╔══════════════════════════════════════════════════════╗
// ║                  ui/FormFields.jsx                   ║
// ║  Field, TextareaField — shared across all tabs       ║
// ╚══════════════════════════════════════════════════════╝

import { inputCls, labelCls } from './formFieldStyles';

// ── Text Input ─────────────────────────────────────────
export const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  dark,
  ...inputProps
}) => (
  <div>
    <label className={labelCls(dark)}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls(dark)}
      {...inputProps}
    />
  </div>
);

// ── Textarea ───────────────────────────────────────────
export const TextareaField = ({ label, value, onChange, rows = 3, dark, ...textareaProps }) => (
  <div>
    <label className={labelCls(dark)}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`${inputCls(dark)} resize-none`}
      {...textareaProps}
    />
  </div>
);
