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
        id={name}
        name={name}
        label={label}
        icon={Icon}
        type={isPassword && !showPasswordState ? 'password' : type}
        value={formData[name]}
        placeholder={placeholder}
        error={error}
        required={required}
        onChange={handleInputChange}
        onBlur={handleBlur}
        autoComplete={getAutoComplete(name)}
        className={isPassword ? 'pr-12' : undefined}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPasswordState(!showPasswordState)}
          aria-label={showPasswordState ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-[38px] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
          style={{ color: 'rgba(1, 176, 239, 0.68)' }}
        >
          {showPasswordState ? <EyeOff size={20} /> : <Eye size={20} />}
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
