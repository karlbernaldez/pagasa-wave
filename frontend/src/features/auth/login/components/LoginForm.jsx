import { forwardRef, useImperativeHandle, useRef } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';

import AuthButton from '@/features/auth/shared/AuthButton.jsx';
import AuthInput from '@/features/auth/shared/AuthInput.jsx';

import PasswordField from './PasswordField.jsx';
import CaptchaSection from './CaptchaSection.jsx';

const LoginForm = forwardRef(function LoginForm(
  {
    formState,
    auth,
    visibility,
    captchaVerified,
    onCaptchaVerify,
    onSubmit,
    onNavigate,
  },
  ref
) {
  const captchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    resetCaptcha() {
      captchaRef.current?.reset?.();
    },
  }));

  const {
    email,
    password,
    emailError,
    passwordError,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
  } = formState;

  const { error, isLoading } = auth;
  const { showPassword, togglePasswordVisibility } = visibility;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Global error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <AuthInput
        id="login-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        error={emailError}
        required
        onChange={handleEmailChange}
        onBlur={() => handleBlur('email')}
      />

      {/* Password */}
      <PasswordField
        id="login-password"
        label="Password"
        value={password}
        error={passwordError}
        showPassword={showPassword}
        onChange={handlePasswordChange}
        onBlur={() => handleBlur('password')}
        onToggleVisibility={togglePasswordVisibility}
      />

      {/* CAPTCHA (unchanged logic) */}
      <CaptchaSection ref={captchaRef} onVerify={onCaptchaVerify} />

      {/* Submit */}
      <AuthButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading || !captchaVerified}
        className="w-full"
      >
        Sign In
      </AuthButton>

      {/* Divider */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm font-semibold text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Register CTA */}
      <AuthButton
        type="button"
        variant="secondary"
        size="lg"
        icon={UserPlus}
        onClick={() => onNavigate('/register')}
        className="w-full"
      >
        Create Account
      </AuthButton>

      {/* Terms */}
      <p className="text-center text-sm font-medium text-slate-500">
        By signing in, you agree to our{' '}
        <button type="button" className="font-bold text-blue-800 underline">
          Terms of Use
        </button>{' '}
        and{' '}
        <button type="button" className="font-bold text-blue-800 underline">
          Privacy Policy
        </button>
      </p>
    </form>
  );
});

export default LoginForm;