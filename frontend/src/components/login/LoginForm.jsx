import { forwardRef, useImperativeHandle, useRef } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Lock, Loader2, Mail } from 'lucide-react';
import { tokens } from '@/styles/tokens';
import CaptchaWidget from './CaptchaWidget.jsx';

const { colors, gradients, shadows } = tokens;

// ─── small shared UI pieces ───────────────────────────────────────────────────

const FieldError = ({ id, message }) => (
  <p
    id={id}
    role="alert"
    className="flex items-center gap-2 text-xs ml-1 animate-slide-down"
    style={{ color: 'rgba(252, 5, 13, 0.9)' }}
  >
    <AlertCircle size={12} aria-hidden="true" />
    {message}
  </p>
);

const InputIcon = ({ children }) => (
  <span
    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[color:var(--auth-input-icon-focus)]"
    style={{
      color: 'var(--auth-input-icon)',
      '--auth-input-icon': 'rgba(1, 176, 239, 0.68)',
      '--auth-input-icon-focus': colors.brand.accent,
    }}
    aria-hidden="true"
  >
    {children}
  </span>
);

// ─── LoginForm ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   formId          string  — useId() prefix for stable label associations
 *   formState       — { email, password, emailError, passwordError, hasEmailSuccess }
 *   handlers        — { handleEmailChange, handlePasswordChange, handleBlur }
 *   auth            — { error, isLoading }
 *   visibility      — { showPassword, togglePasswordVisibility }
 *   captchaVerified boolean
 *   onCaptchaVerify (token: string | null) => void
 *   onSubmit        (e: FormEvent) => void
 *   onNavigate      (path: string) => void
 *
 * Ref handle:
 *   resetCaptcha()  — delegate to CaptchaWidget.reset()
 */
const LoginForm = forwardRef(function LoginForm({
  formId,
  formState,
  handlers,
  auth,
  visibility,
  captchaVerified,
  onCaptchaVerify,
  onSubmit,
  onNavigate,
}, ref) {

  const captchaRef = useRef(null);

  // Expose resetCaptcha() to Login so it can invalidate the token after
  // a failed attempt — without knowing anything about how CaptchaWidget works.
  useImperativeHandle(ref, () => ({
    resetCaptcha() {
      captchaRef.current?.reset();
    },
  }), []);

  const { email, password, emailError, passwordError, hasEmailSuccess } = formState;
  const { handleEmailChange, handlePasswordChange, handleBlur }         = handlers;
  const { error, isLoading }                                            = auth;
  const { showPassword, togglePasswordVisibility }                      = visibility;

  const emailId    = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const inputBaseStyle = {
    '--auth-input-border': colors.border.dark.default,
    '--auth-input-border-focus': colors.border.dark.focus,
    '--auth-input-bg': 'rgba(255, 255, 255, 0.06)',
    '--auth-input-bg-focus': 'rgba(1, 176, 239, 0.10)',
    '--auth-input-bg-hover': 'rgba(1, 176, 239, 0.08)',
    '--auth-input-shadow-focus': shadows.focusDark,
    color: colors.text.dark.primary,
  };

  const inputErrorStyle = {
    '--auth-input-border': 'rgba(252, 5, 13, 0.55)',
    '--auth-input-border-focus': colors.brand.danger,
    '--auth-input-shadow-focus': '0 0 0 3px rgba(252, 5, 13, 0.22)',
  };

  const authInputClassName = `
    w-full pl-12 pr-12 py-3.5
    backdrop-blur-sm rounded-xl
    border border-[color:var(--auth-input-border)] focus:border-[color:var(--auth-input-border-focus)]
    bg-[color:var(--auth-input-bg)] focus:bg-[color:var(--auth-input-bg-focus)] hover:bg-[color:var(--auth-input-bg-hover)]
    placeholder:text-white/35 outline-none
    transition-all duration-200
    focus:shadow-[var(--auth-input-shadow-focus)]
  `;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">

      {/* Global server error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 text-sm rounded-xl p-4 backdrop-blur-sm animate-shake"
          style={{
            color: '#FFD7D9',
            background: 'rgba(252, 5, 13, 0.10)',
            border: '1px solid rgba(252, 5, 13, 0.28)',
          }}
        >
          <AlertCircle size={18} className="flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Email ────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label
          htmlFor={emailId}
          className="text-sm font-medium ml-1"
          style={{ color: 'rgba(215, 247, 255, 0.84)' }}
        >
          Email Address
        </label>
        <div className="relative group">
          <InputIcon><Mail size={20} /></InputIcon>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            className={authInputClassName}
            style={emailError ? { ...inputBaseStyle, ...inputErrorStyle } : inputBaseStyle}
          />
          {hasEmailSuccess && (
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in"
              style={{ color: colors.brand.accent }}
              aria-hidden="true"
            >
              <Check size={20} />
            </span>
          )}
        </div>
        {emailError && <FieldError id={`${emailId}-error`} message={emailError} />}
      </div>

      {/* Password ───────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mx-1">
          <label
            htmlFor={passwordId}
            className="text-sm font-medium"
            style={{ color: 'rgba(215, 247, 255, 0.84)' }}
          >
            Password
          </label>
          <button
            type="button"
            className="text-xs font-medium transition-colors hover:text-[color:var(--auth-link-hover)]"
            style={{
              color: 'rgba(1, 176, 239, 0.72)',
              '--auth-link-hover': colors.brand.accent,
            }}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative group">
          <InputIcon><Lock size={20} /></InputIcon>
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? `${passwordId}-error` : undefined}
            className={authInputClassName}
            style={passwordError ? { ...inputBaseStyle, ...inputErrorStyle } : inputBaseStyle}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[color:var(--auth-icon-hover)]"
            style={{
              color: 'rgba(1, 176, 239, 0.72)',
              '--auth-icon-hover': colors.brand.accent,
            }}
          >
            {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        </div>
        {passwordError && <FieldError id={`${passwordId}-error`} message={passwordError} />}
      </div>

      {/* CAPTCHA ─────────────────────────────────────────────────────────── */}
      <CaptchaWidget
        ref={captchaRef}
        onVerify={onCaptchaVerify}
      />

      {/* Submit ──────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading || !captchaVerified}
        aria-disabled={isLoading || !captchaVerified}
        className="
          w-full py-3.5 mt-2
          text-black font-semibold rounded-xl
          shadow-lg
          hover:shadow-xl hover:scale-[1.02]
          active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
          transition-all duration-200
          flex items-center justify-center gap-2 relative overflow-hidden group
        "
        style={{
          background: gradients.primary,
          boxShadow: '0 14px 34px rgba(1, 176, 239, 0.26)',
        }}
      >
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: gradients.primaryHover }}
          aria-hidden="true"
        />
        <span className="relative flex items-center gap-2">
          {isLoading ? (
            <><Loader2 size={20} className="animate-spin" aria-hidden="true" />Signing In…</>
          ) : (
            'Sign In'
          )}
        </span>
      </button>

      {/* Divider ─────────────────────────────────────────────────────────── */}
      <div className="relative py-2" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'rgba(1, 176, 239, 0.20)' }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4" style={{ color: 'rgba(215, 247, 255, 0.50)' }}>New to WaveLab?</span>
        </div>
      </div>

      {/* Register ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onNavigate('/register')}
        className="
          w-full py-3.5
          backdrop-blur-sm font-medium rounded-xl
          border
          hover:scale-[1.01]
          transition-all duration-200
        "
        style={{
          color: colors.brand.accent,
          background: 'rgba(1, 176, 239, 0.08)',
          borderColor: 'rgba(255, 254, 6, 0.24)',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = 'rgba(1, 176, 239, 0.14)';
          event.currentTarget.style.borderColor = 'rgba(255, 254, 6, 0.42)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'rgba(1, 176, 239, 0.08)';
          event.currentTarget.style.borderColor = 'rgba(255, 254, 6, 0.24)';
        }}
      >
        Create an Account
      </button>

    </form>
  );
});

export default LoginForm;
