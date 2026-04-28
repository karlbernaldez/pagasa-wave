import { AlertCircle } from 'lucide-react';

export default function AuthInput({
  id,
  label,
  error,
  className = '',
  ...props
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-blue-900">
          {label}
        </label>
      )}

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-blue-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-300'} ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
