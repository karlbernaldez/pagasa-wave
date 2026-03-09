import { useCallback, useEffect, useState } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { ArrowLeft }                         from 'lucide-react';

// hooks
import { useFormValidation, useLoginAuth, usePasswordVisibility, useGeolocation } from '@/hooks/useLogin';
import { useAuth } from '@/hooks/useAuth';

// components
import AnimatedBackground from '@/components/login/Background.jsx';
import LoginForm          from '@/components/login/LoginForm.jsx';
import OtpModal           from '@/components/login/OTPModal.jsx';
import '@/components/login/animations.css';

// ─────────────────────────────────────────────────────────────────────────────
// Login page
//
// Two-step flow:
//   Step 1 — LoginForm : email + password + captcha → backend verifies creds + sends OTP
//   Step 2 — OtpModal  : 6-digit email code
// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const navigate          = useNavigate();
  const { setIsLoggedIn, setRole  } = useAuth();

  useGeolocation();

  const {
    email, password, touched, setTouched,
    emailError, passwordError, hasEmailSuccess,
    handleEmailChange, handlePasswordChange,
    handleBlur, validateEmail, validatePassword,
  } = useFormValidation();

  const { error, isLoading, handleLogin, requestOtp, verifyOtp } = useLoginAuth(setIsLoggedIn, setRole);
  const { showPassword, togglePasswordVisibility }               = usePasswordVisibility();

  const [captchaToken, setCaptchaToken] = useState(null);
  const [otpOpen,      setOtpOpen]      = useState(false);
  const [otpError,     setOtpError]     = useState(null);
  const [otpLoading,   setOtpLoading]   = useState(false);

  useEffect(() => { document.title = 'WaveLab - Login'; }, []);

  // ── Step 1: backend verifies creds AND sends OTP in one request ───────────
  const onSubmit = useCallback(async (e) => {
    e.preventDefault();

    await handleLogin(email, password, validateEmail, validatePassword, setTouched, {
      captchaToken,
      onCredentialsValid: () => {
        // Backend already sent the OTP inside loginUser — just open the modal
        setOtpOpen(true);
      },
    });
  }, [email, password, handleLogin, validateEmail, validatePassword, setTouched, captchaToken]);

  // ── Step 2: verify OTP → complete login ───────────────────────────────────
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

  // ── Resend: explicitly hits /otp/send ─────────────────────────────────────
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
          <div className="relative">
            <LoginForm
              formState={{ email, password, touched, emailError, passwordError, hasEmailSuccess }}
              handlers={{ handleEmailChange, handlePasswordChange, handleBlur }}
              auth={{ error, isLoading }}
              visibility={{ showPassword, togglePasswordVisibility }}
              captchaVerified={!!captchaToken}
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