import { AlertCircle } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const { colors, shadows } = tokens;

export default function AuthInput({
  id,
  label,
  hint,
  error,
  success,
  required,
  disabled,
  icon: Icon,
  className = '',
  style,
  ...props
}) {
  const errorId = `${id}-error`;
  const message = error || success;
  const hasIcon = Boolean(Icon);

  const inputStyle = {
    color: colors.text.light.primary,
    background: colors.surface.light.raised,
    borderColor: error ? 'rgba(252, 5, 13, 0.45)' : 'rgba(1, 176, 239, 0.30)',
    '--auth-input-focus-border': error ? colors.brand.danger : colors.brand.primary,
    '--auth-input-focus-ring': error ? 'rgba(252, 5, 13, 0.18)' : 'rgba(1, 176, 239, 0.20)',
    '--auth-input-hover-border': error ? 'rgba(252, 5, 13, 0.62)' : 'rgba(1, 176, 239, 0.48)',
    boxShadow: shadows.sm,
    ...style,
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold"
          style={{ color: colors.brand.secondary }}
        >
          {label} {required && '*'}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: 'rgba(1, 176, 239, 0.62)' }}
            aria-hidden="true"
          />
        )}

        <input
          id={id}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          aria-required={required}
          style={inputStyle}
          className={`w-full rounded-xl border py-3 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-[color:var(--auth-input-hover-border)] focus:border-[color:var(--auth-input-focus-border)] focus:ring-4 focus:ring-[color:var(--auth-input-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 ${hasIcon ? 'pl-12 pr-4' : 'px-4'} ${className}`}
          {...props}
        />
      </div>

      {hint && !error && (
        <p className="text-xs" style={{ color: colors.text.light.muted }}>
          {hint}
        </p>
      )}

      {message && (
        <p
          id={error ? errorId : undefined}
          role={error ? 'alert' : undefined}
          className="flex items-center gap-2 text-sm"
          style={{ color: error ? colors.brand.danger : colors.state.success }}
        >
          {error && <AlertCircle size={14} aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  );
}
