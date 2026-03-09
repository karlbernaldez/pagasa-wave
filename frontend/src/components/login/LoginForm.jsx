import { AlertCircle, Check, Eye, EyeOff, Lock, Loader2, Mail } from 'lucide-react';
import CaptchaWidget from './CaptchaWidget.jsx';

// ─── small shared UI pieces ───────────────────────────────────────────────────

const FieldError = ({ message }) => (
  <p role="alert" className="flex items-center gap-2 text-red-300/90 text-xs ml-1 animate-slide-down">
    <AlertCircle size={12} aria-hidden="true" />
    {message}
  </p>
);

const InputIcon = ({ children }) => (
  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60 group-focus-within:text-blue-300 transition-colors" aria-hidden="true">
    {children}
  </span>
);

// ─── LoginForm ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   formState       — { email, password, emailError, passwordError, hasEmailSuccess }
 *   handlers        — { handleEmailChange, handlePasswordChange, handleBlur }
 *   auth            — { error, isLoading }
 *   visibility      — { showPassword, togglePasswordVisibility }
 *   captchaVerified boolean
 *   onCaptchaVerify (isValid: boolean) => void
 *   onSubmit        (e: FormEvent) => void
 *   onNavigate      (path: string) => void
 */
const LoginForm = ({
  formState,
  handlers,
  auth,
  visibility,
  captchaVerified,
  onCaptchaVerify,
  onSubmit,
  onNavigate,
}) => {
  const { email, password, emailError, passwordError, hasEmailSuccess } = formState;
  const { handleEmailChange, handlePasswordChange, handleBlur }         = handlers;
  const { error, isLoading }                                            = auth;
  const { showPassword, togglePasswordVisibility }                      = visibility;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">

      {/* Global server error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 text-red-200 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm animate-shake"
        >
          <AlertCircle size={18} className="flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Email ────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-blue-200/80 text-sm font-medium ml-1">
          Email Address
        </label>
        <div className="relative group">
          <InputIcon><Mail size={20} /></InputIcon>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`
              w-full pl-12 pr-12 py-3.5
              bg-white/5 backdrop-blur-sm rounded-xl text-white
              border ${emailError
                ? 'border-red-500/50 focus:border-red-500/70'
                : 'border-white/10 focus:border-blue-400/50'}
              placeholder:text-white/30 outline-none
              transition-all duration-200
              focus:bg-white/10 focus:shadow-lg focus:shadow-blue-500/10
              hover:bg-white/[0.07]
            `}
          />
          {hasEmailSuccess && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 animate-scale-in" aria-hidden="true">
              <Check size={20} />
            </span>
          )}
        </div>
        {emailError && <FieldError id="email-error" message={emailError} />}
      </div>

      {/* Password ───────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mx-1">
          <label htmlFor="password" className="text-blue-200/80 text-sm font-medium">
            Password
          </label>
          <button
            type="button"
            className="text-xs text-blue-300/60 hover:text-blue-300 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative group">
          <InputIcon><Lock size={20} /></InputIcon>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
            className={`
              w-full pl-12 pr-12 py-3.5
              bg-white/5 backdrop-blur-sm rounded-xl text-white
              border ${passwordError
                ? 'border-red-500/50 focus:border-red-500/70'
                : 'border-white/10 focus:border-blue-400/50'}
              placeholder:text-white/30 outline-none
              transition-all duration-200
              focus:bg-white/10 focus:shadow-lg focus:shadow-blue-500/10
              hover:bg-white/[0.07]
            `}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-300 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {passwordError && <FieldError id="password-error" message={passwordError} />}
      </div>

      {/* CAPTCHA ─────────────────────────────────────────────────────────── */}
      <CaptchaWidget onVerify={onCaptchaVerify} />

      {/* Submit ──────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading || !captchaVerified}
        className="
          w-full py-3.5 mt-2
          bg-gradient-to-r from-blue-500 to-cyan-500
          text-white font-semibold rounded-xl
          shadow-lg shadow-blue-500/25
          hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
          active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
          transition-all duration-200
          flex items-center justify-center gap-2 relative overflow-hidden group
        "
      >
        <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
        <span className="relative flex items-center gap-2">
          {isLoading
            ? <><Loader2 size={20} className="animate-spin" aria-hidden="true" />Signing In…</>
            : 'Sign In'
          }
        </span>
      </button>

      {/* Divider ─────────────────────────────────────────────────────────── */}
      <div className="relative py-2" role="separator" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 text-blue-200/40">New to WaveLab?</span>
        </div>
      </div>

      {/* Register ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onNavigate('/register')}
        className="
          w-full py-3.5
          bg-white/5 backdrop-blur-sm text-blue-300 font-medium rounded-xl
          border border-white/10
          hover:bg-white/10 hover:border-white/20
          transition-all duration-200
        "
      >
        Create an Account
      </button>
    </form>
  );
};

export default LoginForm;