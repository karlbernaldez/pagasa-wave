import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MailWarning, RefreshCw, CheckCircle } from 'lucide-react';

import { useFormValidation, useLoginAuth, usePasswordVisibility, useGeolocation } from '@/hooks/useLogin';
import { useAuth } from '@/hooks/useAuth';

import AnimatedBackground from '@/components/login/Background.jsx';
import LoginForm from '@/components/login/LoginForm.jsx';
import OtpModal from '@/components/login/OTPModal.jsx';
import '@/components/login/animations.css';

// ─────────────────────────────────────────────────────────────────────────────
// Unverified email banner
// ─────────────────────────────────────────────────────────────────────────────
const UnverifiedEmailBanner = ({ email, status, error, cooldown, onResend }) => {
  const isCoolingDown = cooldown > 0;
  const isSending = status === 'sending';
  const isDisabled = isSending || isCoolingDown;

  // Derive button appearance from priority: sending → cooldown → error/idle
  const buttonStyle = (() => {
    if (isCoolingDown) return {
      border: '1px solid rgba(99,102,241,0.25)',
      background: 'rgba(99,102,241,0.08)',
      color: '#818cf8',
    };
    if (status === 'error') return {
      border: '1px solid rgba(248,113,113,0.25)',
      background: 'rgba(248,113,113,0.08)',
      color: '#f87171',
    };
    // idle (null) — ready to resend
    return {
      border: '1px solid rgba(245,158,11,0.25)',
      background: 'rgba(245,158,11,0.10)',
      color: '#fcd34d',
    };
  })();

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 px-4 py-4 text-sm"
      style={{ background: 'rgba(245,158,11,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <MailWarning size={18} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-300">Email not verified</p>
          <p className="text-amber-200/60 leading-relaxed">
            {isCoolingDown || status === 'sent'
              ? <>A verification link was sent to{' '}<span className="font-medium text-amber-200/90">{email}</span>. Check your inbox and spam folder.</>
              : <>Verify your email address to activate your account.</>
            }
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onResend}
        disabled={isDisabled}
        className="ml-7 flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed"
        style={{ ...buttonStyle, opacity: isDisabled ? 0.7 : 1 }}
      >
        {isSending && (
          <><RefreshCw size={12} className="animate-spin" /> Sending…</>
        )}
        {!isSending && isCoolingDown && (
          <><RefreshCw size={12} /> Resend in {cooldown}s</>
        )}
        {!isSending && !isCoolingDown && (
          <><RefreshCw size={12} /> {status === 'error' ? 'Try again' : 'Resend verification email'}</>
        )}
      </button>

      {status === 'error' && !isCoolingDown && (
        <p className="ml-7 text-xs text-red-400/80">
          {error ?? 'Failed to resend. Please try again in a moment.'}
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Login page
// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setRole } = useAuth();

  const { position } = useGeolocation();

  const {
    email, password, touched, setTouched,
    emailError, passwordError, hasEmailSuccess,
    handleEmailChange, handlePasswordChange,
    handleBlur, validateEmail, validatePassword,
  } = useFormValidation();

  const {
    error,
    isLoading,
    setError,
    otpAttempts,
    otpLocked,
    requestOtp,
    verifyOtp,
    handleLogin,
    emailUnverified,
    resendStatus,
    resendError,
    cooldown,
    resendVerification,
  } = useLoginAuth(setIsLoggedIn, setRole);

  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();

  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);   // bump to remount & reset the widget
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => { document.title = 'WaveLab - Login'; }, []);

  // ── Resets the captcha widget and clears the stored token ─────────────────
  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1); // forces CaptchaWidget to remount with a clean state
  }, []);

  // ── Step 1: credentials ───────────────────────────────────────────────────
  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await handleLogin(email, password, validateEmail, validatePassword, setTouched, {
        captchaToken,
        coordinates: position,
        onCredentialsValid: () => setOtpOpen(true),
      });
    } catch {
      // Reset captcha on every failed attempt so the used token cannot be
      // replayed and the user must re-verify before trying again.
      resetCaptcha();
    }
  }, [email, password, handleLogin, validateEmail, validatePassword, setTouched, captchaToken, resetCaptcha]);

  // ── Step 2: OTP ───────────────────────────────────────────────────────────
  const handleOtpVerify = useCallback(async (otp) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      await verifyOtp(email, otp);
      setOtpOpen(false);
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Invalid or expired code.';
      setOtpError(message);
      throw err;
    } finally {
      setOtpLoading(false);
    }
  }, [email, verifyOtp]);

  const handleOtpResend = useCallback(async () => {
    setOtpError(null);
    await requestOtp(email);
  }, [email, requestOtp]);

  const handleOtpClose = useCallback(() => {
    setOtpOpen(false);
    setOtpError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <button
        onClick={() => navigate('/')}
        aria-label="Go back to home"
        className="absolute top-8 left-8 z-50 group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl w-12 h-12 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
      </button>

      <main className="relative z-10 w-full max-w-md animate-fade-up">
        <header className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/20 mb-2">
            <img src="/pagasa-logo.png" alt="PAGASA Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white tracking-tight">WaveLab</h1>
            <div className="flex items-center justify-center gap-2 text-blue-300/90" aria-hidden="true">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400/50" />
              <p className="text-sm font-medium tracking-wide uppercase">PAGASA</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400/50" />
            </div>
            <p className="text-blue-200/60 text-sm max-w-sm mx-auto leading-relaxed">
              Philippine Atmospheric, Geophysical and Astronomical Services Administration
            </p>
          </div>
        </header>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative space-y-4">

            {emailUnverified && (
              <UnverifiedEmailBanner
                email={email}
                status={resendStatus}
                error={resendError}
                cooldown={cooldown}
                onResend={() => resendVerification(email)}
              />
            )}

            <LoginForm
              formState={{ email, password, touched, emailError, passwordError, hasEmailSuccess }}
              handlers={{ handleEmailChange, handlePasswordChange, handleBlur }}
              auth={{ error, isLoading }}
              visibility={{ showPassword, togglePasswordVisibility }}
              captchaVerified={!!captchaToken}
              captchaKey={captchaKey}         // ← passed down so LoginForm can key CaptchaWidget
              onCaptchaVerify={setCaptchaToken}
              onSubmit={onSubmit}
              onNavigate={navigate}
            />
          </div>
        </div>

        <p className="text-center text-blue-200/40 text-xs mt-6">
          By continuing, you agree to our{' '}
          <button type="button" className="underline underline-offset-2 hover:text-blue-200/70 transition-colors">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="underline underline-offset-2 hover:text-blue-200/70 transition-colors">Privacy Policy</button>
        </p>
      </main>

      {otpOpen && (
        <OtpModal
          email={email}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onClose={handleOtpClose}
          isLoading={otpLoading}
          error={otpError}
        />
      )}
    </div>
  );
};

export default Login;