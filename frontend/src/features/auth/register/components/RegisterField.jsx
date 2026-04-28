import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const { colors, shadows } = tokens;

export default function RegisterField({
  icon: Icon,
  type = 'text',
  name,
  placeholder,
  label,
  formData,
  errors,
  touched,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  handleInputChange,
  handleBlur,
  getMaxDate,
  getMinDate,
}) {
  const isPassword = name === 'password' || name === 'confirmPassword';

  const showPasswordState =
    name === 'password' ? showPassword : showConfirmPassword;

  const setShowPasswordState =
    name === 'password' ? setShowPassword : setShowConfirmPassword;

  const hasError = Boolean(errors[name] && touched[name]);
  const hasSuccess = Boolean(!errors[name] && formData[name] && touched[name]);
  const errorId = `${name}-error`;

  const inputStyle = {
    color: colors.text.light.primary,
    background: colors.surface.light.raised,
    borderColor: hasError ? colors.brand.danger : 'rgba(1, 176, 239, 0.30)',
    boxShadow: shadows.sm,
    '--register-field-focus-border': hasError ? colors.brand.danger : colors.brand.primary,
    '--register-field-focus-ring': hasError ? 'rgba(252, 5, 13, 0.18)' : 'rgba(1, 176, 239, 0.20)',
    '--register-field-hover-border': hasError ? 'rgba(252, 5, 13, 0.62)' : 'rgba(1, 176, 239, 0.48)',
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold" style={{ color: colors.brand.secondary }}>
        {label}
      </label>

      <div className="relative">
        <Icon
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
          style={{ color: 'rgba(1, 176, 239, 0.62)' }}
          aria-hidden="true"
        />

        <input
          id={name}
          type={isPassword && !showPasswordState ? 'password' : type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete={getAutoComplete(name)}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          max={name === 'birthday' ? getMaxDate() : undefined}
          min={name === 'birthday' ? getMinDate() : undefined}
          style={inputStyle}
          className="w-full rounded-xl border py-3.5 pl-12 pr-12 outline-none transition placeholder:text-slate-400 hover:border-[color:var(--register-field-hover-border)] focus:border-[color:var(--register-field-focus-border)] focus:ring-4 focus:ring-[color:var(--register-field-focus-ring)]"
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPasswordState(!showPasswordState)}
            aria-label={showPasswordState ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition"
            style={{ color: 'rgba(1, 176, 239, 0.68)' }}
          >
            {showPasswordState ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        ) : hasSuccess ? (
          <Check
            className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: colors.state.success }}
            aria-hidden="true"
          />
        ) : hasError ? (
          <AlertCircle
            className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: colors.brand.danger }}
            aria-hidden="true"
          />
        ) : null}
      </div>

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: colors.brand.danger }}
        >
          <AlertCircle size={14} aria-hidden="true" />
          {errors[name]}
        </p>
      )}
    </div>
  );
}

function getAutoComplete(name) {
  const map = {
    firstName: 'given-name',
    lastName: 'family-name',
    username: 'username',
    email: 'email',
    contact: 'tel',
    address: 'street-address',
    agency: 'organization',
    position: 'organization-title',
    password: 'new-password',
    confirmPassword: 'new-password',
  };

  return map[name];
}
