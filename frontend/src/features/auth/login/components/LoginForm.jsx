import { forwardRef, useImperativeHandle, useRef } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';

import LoginField from './LoginField.jsx';
import PasswordField from './PasswordField.jsx';
import SubmitButton from './SubmitButton.jsx';
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
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <LoginField
        id="login-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        error={emailError}
        onChange={handleEmailChange}
        onBlur={() => handleBlur('email')}
      />

      <PasswordField
        id="login-password"
        value={password}
        error={passwordError}
        showPassword={showPassword}
        onChange={handlePasswordChange}
        onBlur={() => handleBlur('password')}
        onToggleVisibility={togglePasswordVisibility}
      />

      <CaptchaSection ref={captchaRef} onVerify={onCaptchaVerify} />

      <SubmitButton isLoading={isLoading} disabled={isLoading || !captchaVerified} />

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm font-semibold text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => onNavigate('/register')}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-600 bg-white px-4 py-3.5 text-base font-bold text-cyan-700 transition hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-cyan-100"
      >
        <UserPlus size={20} />
        Create Account
      </button>

      <p className="text-center text-sm font-medium text-slate-500">
        By signing in, you agree to our{' '}
        <button type="button" className="font-bold text-cyan-700 underline">
          Terms of Use
        </button>{' '}
        and{' '}
        <button type="button" className="font-bold text-cyan-700 underline">
          Privacy Policy
        </button>
      </p>
    </form>
  );
});

export default LoginForm;