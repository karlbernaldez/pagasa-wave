import { Eye, EyeOff } from 'lucide-react';

import AuthInput from '@/features/auth/shared/AuthInput.jsx';
import AuthPasswordField from '@/features/auth/shared/AuthPasswordField.jsx';

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

  if (isPassword) {
    return (
      <AuthPasswordField
        id={name}
        name={name}
        label={label}
        value={formData[name]}
        error={hasError ? errors[name] : undefined}
        success={hasSuccess}
        showPassword={showPasswordState}
        autoComplete="new-password"
        onChange={handleInputChange}
        onBlur={handleBlur}
        onToggleVisibility={() => setShowPasswordState(!showPasswordState)}
      />
    );
  }

  return (
    <AuthInput
      id={name}
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      value={formData[name]}
      error={hasError ? errors[name] : undefined}
      success={hasSuccess}
      icon={Icon}
      autoComplete={getAutoComplete(name)}
      max={name === 'birthday' ? getMaxDate?.() : undefined}
      min={name === 'birthday' ? getMinDate?.() : undefined}
      onChange={handleInputChange}
      onBlur={handleBlur}
    />
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
  };

  return map[name];
}
