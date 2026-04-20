import { memo, useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MailWarning, RefreshCw } from 'lucide-react';

import {
  useFormValidation,
  useLoginAuth,
  usePasswordVisibility,
  useGeolocation,
} from '@/hooks/useLogin';
import { useAuth } from '@/hooks/useAuth';

import AnimatedBackground from '@/components/login/Background.jsx';
import LoginForm          from '@/components/login/LoginForm.jsx';
import OtpModal           from '@/components/login/OTPModal.jsx';
import '@/components/login/animations.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types / constants
// ─────────────────────────────────────────────────────────────────────────────

/** @enum {string} */
const OTP_ACTION = { OPEN: 'open', CLOSE: 'close', SET_ERROR: 'setError', SET_LOADING: 'setLoading' };

const OTP_INITIAL = { open: false, error: null, loading: false };

function otpReducer(state, action) {
  switch (action.type) {
    case OTP_ACTION.OPEN:         return { open: true,  error: null, loading: false };
    case OTP_ACTION.CLOSE:        return { open: false, error: null, loading: false };
    case OTP_ACTION.SET_ERROR:    return { ...state,    error: action.payload, loading: false };
    case OTP_ACTION.SET_LOADING:  return { ...state,    loading: action.payload };
    default:                      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns button copy and style tokens for the resend button based on current state.
 * Derived values live here, not in JSX, so the render body stays readable.
 */
function getResendButtonProps({ isSending, isCoolingDown, status, cooldown }) {
  if (isSending) {
    return {
      label: 'Sending…',
      icon: <RefreshCw size={12} className="animate-spin" aria-hidden="true" />,
      style: {
        border:     '1px solid rgba(99,102,241,0.25)',
        background: 'rgba(99,102,241,0.08)',
        color:      '#818cf8',
      },
    };
  }
  if (isCoolingDown) {
    return {
      label: `Resend in ${cooldown}s`,
      icon: <RefreshCw size={12} aria-hidden="true" />,
      style: {
        border:     '1px solid rgba(99,102,241,0.25)',
        background: 'rgba(99,102,241,0.08)',
        color:      '#818cf8',
      },
    };
  }
  if (status === 'error') {
    return {
      label: 'Try again',
      icon: <RefreshCw size={12} aria-hidden="true" />,
      style: {
        border:     '1px solid rgba(248,113,113,0.25)',
        background: 'rgba(248,113,113,0.08)',
        color:      '#f87171',
      },
    };
  }
  return {
    label: 'Resend verification email',
    icon: <RefreshCw size={12} aria-hidden="true" />,
    style: {
      border:     '1px solid rgba(245,158,11,0.25)',
      background: 'rgba(245,158,11,0.10)',
      color:      '#fcd34d',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UnverifiedEmailBanner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ email: string, status: string|null, error: string|null, cooldown: number, onResend: () => void }} props
 */
const UnverifiedEmailBanner = memo(function UnverifiedEmailBanner({
  email,
  status,
  error,
  cooldown,
  onResend,
}) {
  const isSending     = status === 'sending';
  const isCoolingDown = cooldown > 0;
  const isDisabled    = isSending || isCoolingDown;
  const hasSent       = isCoolingDown || status === 'sent';

  const { label, icon, style } = getResendButtonProps({ isSending, isCoolingDown, status, cooldown });

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 px-4 py-4 text-sm"
      style={{ background: 'rgba(245,158,11,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <MailWarning size={18} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-300">Email not verified</p>
          <p className="text-amber-200/60 leading-relaxed">
            {hasSent ? (
              <>
                A verification link was sent to{' '}
                <span className="font-medium text-amber-200/90">{email}</span>.
                {' '}Check your inbox and spam folder.
              </>
            ) : (
              'Verify your email address to activate your account.'
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onResend}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className="ml-7 flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold
                   transition-all duration-200 disabled:cursor-not-allowed"
        style={{ ...style, opacity: isDisabled ? 0.65 : 1 }}
      >
        {icon}
        {label}
      </button>

      {status === 'error' && !isCoolingDown && (
        <p role="alert" className="ml-7 text-xs text-red-400/80">
          {error ?? 'Failed to resend. Please try again in a moment.'}
        </p>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator — communicates the 2-step auth flow
// ─────────────────────────────────────────────────────────────────────────────

const StepIndicator = memo(function StepIndicator({ currentStep }) {
  const steps = ['Credentials', 'Verify'];
  return (
    <div className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]}`}>
      {steps.map((label, i) => {
        const step      = i + 1;
        const isActive  = step === currentStep;
        const isDone    = step < currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  transition-all duration-300
                  ${isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : ''}
                  ${isDone   ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40' : ''}
                  ${!isActive && !isDone ? 'bg-white/5 text-white/25 ring-1 ring-white/10' : ''}
                `}
                aria-hidden="true"
              >
                {step}
              </div>
              <span
                className={`text-xs font-medium tracking-wide transition-colors duration-300
                  ${isActive ? 'text-cyan-300' : 'text-white/25'}`}
                aria-hidden="true"
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px transition-colors duration-300
                  ${isDone ? 'bg-cyan-500/40' : 'bg-white/10'}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Login page
// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const navigate         = useNavigate();
  const { setIsLoggedIn, setRole } = useAuth();
  const formId           = useId();
  const mainRef          = useRef(null);

  const { position } = useGeolocation();

  const {
    email, password, touched, setTouched,
    emailError, passwordError, hasEmailSuccess,
    handleEmailChange, handlePasswordChange,
    handleBlur, validateEmail, validatePassword,
  } = useFormValidation();

  const {
    error, isLoading, setError,
    otpAttempts, otpLocked,
    requestOtp, verifyOtp, handleLogin,
    emailUnverified,
    resendStatus, resendError, cooldown,
    resendVerification,
  } = useLoginAuth(setIsLoggedIn, setRole);

  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();

  const [captchaToken, setCaptchaToken] = useState(null);
  const loginFormRef = useRef(null);

  // OTP modal state managed with a reducer so related flags stay in sync
  const [otpState, dispatchOtp] = useReducer(otpReducer, OTP_INITIAL);

  const currentStep = otpState.open ? 2 : 1;

  useEffect(() => {
    document.title = 'WaveLab — Sign in';
  }, []);

  // Focus the main content area on mount for better keyboard/screen-reader flow
  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  // ── Captcha reset ──────────────────────────────────────────────────────────
  // LoginForm owns the CaptchaWidget lifecycle; we call its imperative handle
  // rather than bumping a key from up here.
  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    loginFormRef.current?.resetCaptcha?.();
  }, []);

  // ── Step 1: credential submission ─────────────────────────────────────────
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    try {
      await handleLogin(email, password, validateEmail, validatePassword, setTouched, {
        captchaToken,
        coordinates: position,
        onCredentialsValid: () => dispatchOtp({ type: OTP_ACTION.OPEN }),
      });
    } catch {
      // Invalidate the used captcha token so it cannot be replayed on retry
      resetCaptcha();
    }
  }, [email, password, handleLogin, validateEmail, validatePassword, setTouched, captchaToken, position, resetCaptcha]);

  // ── Step 2: OTP verification ───────────────────────────────────────────────
  const handleOtpVerify = useCallback(async (otp) => {
    dispatchOtp({ type: OTP_ACTION.SET_LOADING, payload: true });
    try {
      await verifyOtp(email, otp);
      dispatchOtp({ type: OTP_ACTION.CLOSE });
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Invalid or expired code.';
      dispatchOtp({ type: OTP_ACTION.SET_ERROR, payload: message });
      throw err; // re-throw so OtpModal can react to the failure
    }
  }, [email, verifyOtp]);

  const handleOtpResend = useCallback(async () => {
    dispatchOtp({ type: OTP_ACTION.SET_ERROR, payload: null });
    await requestOtp(email);
  }, [email, requestOtp]);

  const handleOtpClose = useCallback(() => {
    dispatchOtp({ type: OTP_ACTION.CLOSE });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0e2a50 50%, #0a1628 100%)' }}>

      <AnimatedBackground />

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,200,218,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,218,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* ── Back navigation ─────────────────────────────────────────── */}
      <nav className="absolute top-6 left-6 z-50" aria-label="Page navigation">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5
                     px-4 py-2 text-sm text-white/60 backdrop-blur-sm
                     hover:border-white/20 hover:bg-white/10 hover:text-white
                     transition-all duration-200 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-cyan-500/60"
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Back</span>
        </button>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main
        ref={mainRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md outline-none animate-fade-up"
        id={`${formId}-main`}
      >

        {/* ── Brand header ──────────────────────────────────────────── */}
        <header className="text-center mb-8 space-y-3">
          {/* Logo */}
          <div className="relative inline-flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
              style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl
                         border border-white/10 bg-gradient-to-br from-blue-600/80 to-cyan-600/80
                         shadow-xl shadow-cyan-900/40"
            >
              <img
                src="/pagasa-logo.png"
                alt="PAGASA"
                className="h-13 w-13 object-contain drop-shadow"
                width={52}
                height={52}
              />
            </div>
          </div>

          {/* Wordmark */}
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Wave<span className="text-cyan-400">Lab</span>
            </h1>
            <div className="mt-1.5 flex items-center justify-center gap-2" aria-hidden="true">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400/40" />
              <p className="font-medium tracking-widest text-xs uppercase text-blue-300/70">PAGASA</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400/40" />
            </div>
          </div>
        </header>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(14,165,233,0.07) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        >
          <div className="relative space-y-4">

            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Unverified email banner */}
            {emailUnverified && (
              <UnverifiedEmailBanner
                email={email}
                status={resendStatus}
                error={resendError}
                cooldown={cooldown}
                onResend={() => resendVerification(email)}
              />
            )}

            {/* Login form */}
            <LoginForm
              ref={loginFormRef}
              formId={formId}
              formState={{ email, password, touched, emailError, passwordError, hasEmailSuccess }}
              handlers={{ handleEmailChange, handlePasswordChange, handleBlur }}
              auth={{ error, isLoading }}
              visibility={{ showPassword, togglePasswordVisibility }}
              captchaVerified={!!captchaToken}
              onCaptchaVerify={setCaptchaToken}
              onSubmit={handleSubmit}
              onNavigate={navigate}
            />
          </div>
        </div>

        {/* ── Footer legal ─────────────────────────────────────────────── */}
        <p className="mt-5 text-center text-xs text-blue-200/35">
          By continuing, you agree to our{' '}
          <button
            type="button"
            className="underline underline-offset-2 transition-colors hover:text-blue-200/65
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 rounded"
          >
            Terms of Service
          </button>
          {' '}and{' '}
          <button
            type="button"
            className="underline underline-offset-2 transition-colors hover:text-blue-200/65
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 rounded"
          >
            Privacy Policy
          </button>
        </p>

      </main>

      {/* ── OTP modal (rendered outside main to allow proper focus trap) ── */}
      {otpState.open && (
        <OtpModal
          email={email}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onClose={handleOtpClose}
          isLoading={otpState.loading}
          error={otpState.error}
        />
      )}

    </div>
  );
};

export default Login;