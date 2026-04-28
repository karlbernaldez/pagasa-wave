import { Eye, EyeOff } from 'lucide-react';
import AuthInput from '@/features/auth/shared/AuthInput.jsx';

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
  required,
}) {
  const isPassword = name === 'password' || name === 'confirmPassword';

  const showPasswordState =
    name === 'password' ? showPassword : showConfirmPassword;

  const setShowPasswordState =
    name === 'password' ? setShowPassword : setShowConfirmPassword;

  const error = touched[name] ? errors[name] : undefined;

  return (
    <div className="relative">
      <AuthInput
        id={`register-${name}`}
        label={label}
        type={isPassword && !showPasswordState ? 'password' : type}
        value={formData[name]}
        placeholder={placeholder}
        error={error}
        required={required}
        onChange={handleInputChange}
        onBlur={handleBlur}
        autoComplete={getAutoComplete(name)}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPasswordState(!showPasswordState)}
          aria-label={showPasswordState ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
        >
          {showPasswordState ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
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
