import { Mail, AlertCircle } from 'lucide-react';

export default function LoginField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold text-blue-950">
        {label}
      </label>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-xl border bg-white py-4 pl-12 pr-4 text-blue-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
          }`}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}