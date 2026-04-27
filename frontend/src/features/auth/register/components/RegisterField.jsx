import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

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

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold text-blue-950">
        {label}
      </label>

      <div className="relative">
        <Icon
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
          className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-12 text-blue-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            hasError
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
          }`}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPasswordState(!showPasswordState)}
            aria-label={showPasswordState ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-900"
          >
            {showPasswordState ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        ) : hasSuccess ? (
          <Check
            className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500"
            aria-hidden="true"
          />
        ) : hasError ? (
          <AlertCircle
            className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-2 text-sm font-medium text-red-600"
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