import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const { colors } = tokens;

export default function PasswordField({
  id,
  value,
  error,
  showPassword,
  onChange,
  onBlur,
  onToggleVisibility,
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-bold"
        style={{ color: colors.brand.secondary }}
      >
        Password
      </label>

      <div className="relative">
        <Lock
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
          style={{ color: 'rgba(1,176,239,0.6)' }}
        />

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          style={{
            color: colors.text.light.primary,
            background: colors.surface.light.raised,
            borderColor: error ? colors.brand.danger : 'rgba(1,176,239,0.3)',
          }}
          className="w-full rounded-xl border py-4 pl-12 pr-12 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(1,176,239,0.6)' }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-2 text-sm" style={{ color: colors.brand.danger }}>
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
