import { Eye, EyeOff, Lock } from 'lucide-react';

import AuthInput from './AuthInput.jsx';
import AuthButton from './AuthButton.jsx';

export default function AuthPasswordField({
  id,
  name,
  label = 'Password',
  value,
  error,
  success,
  showPassword,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  required,
  disabled,
  onChange,
  onBlur,
  onToggleVisibility,
}) {
  return (
    <div className="relative">
      <AuthInput
        id={id}
        name={name}
        label={label}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        error={error}
        success={success}
        required={required}
        disabled={disabled}
        icon={Lock}
        onChange={onChange}
        onBlur={onBlur}
        className="pr-12"
      />

      <AuthButton
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleVisibility}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-8 h-10 w-10"
      >
        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </AuthButton>
    </div>
  );
}
