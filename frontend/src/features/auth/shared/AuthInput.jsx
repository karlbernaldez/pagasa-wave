import { AlertCircle } from 'lucide-react';

export default function AuthInput({
  id,
  label,
  hint,
  error,
  success,
  required,
  disabled,
  className = '',
  ...props
}) {
  const errorId = `${id}-error`;
  const message = error || success;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-blue-900">
          {label} {required && '*'}
        </label>
      )}

      <input
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        aria-required={required}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-blue-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-300'} ${className}`}
        {...props}
      />

      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}

      {message && (
        <p
          id={error ? errorId : undefined}
          role={error ? 'alert' : undefined}
          className={`flex items-center gap-2 text-sm ${error ? 'text-red-600' : 'text-green-600'}`}
        >
          {error && <AlertCircle size={14} />}
          {message}
        </p>
      )}
    </div>
  );
}
