import { forwardRef, useImperativeHandle, useRef } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';
import { tokens } from '@/styles/tokens';

import AuthButton from '@/features/auth/shared/AuthButton.jsx';
import AuthInput from '@/features/auth/shared/AuthInput.jsx';
import AuthPasswordField from '@/features/auth/shared/AuthPasswordField.jsx';
import AuthFooter from '@/features/auth/shared/AuthFooter.jsx';

import CaptchaSection from './CaptchaSection.jsx';

const { colors } = tokens;

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
          className="flex items-center gap-3 rounded-xl border p-4 text-sm font-medium"
          style={{
            color: colors.brand.danger,
            background: 'rgba(252, 5, 13, 0.08)',
            borderColor: 'rgba(252, 5, 13, 0.28)',
          }}
        >
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

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

      <AuthPasswordField
        id="login-password"
        name="password"
        label="Password"
        value={password}
        error={passwordError}
        showPassword={showPassword}
        onChange={handlePasswordChange}
        onBlur={() => handleBlur('password')}
        onToggleVisibility={togglePasswordVisibility}
      />

      <CaptchaSection ref={captchaRef} onVerify={onCaptchaVerify} />

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

      <div className="flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1" style={{ background: 'rgba(1, 176, 239, 0.22)' }} />
        <span className="text-sm font-semibold" style={{ color: colors.text.light.muted }}>
          or
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(1, 176, 239, 0.22)' }} />
      </div>

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

      <AuthFooter
        termsPrefix="By signing in, you agree to our"
      />
    </form>
  );
});

export default LoginForm;
