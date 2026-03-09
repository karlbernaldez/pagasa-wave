import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCcw, X, ArrowRight } from 'lucide-react';

// ─── constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH        = 6;
const RESEND_COOLDOWN_S = 60;

// ─── helpers ──────────────────────────────────────────────────────────────────

const maskEmail = (addr = '') => {
  const [user, domain] = addr.split('@');
  if (!user || !domain) return addr;
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
};

// ─── StepIndicator (OTP state) ────────────────────────────────────────────────

const StepIndicatorOtp = () => (
  <div className="flex items-center gap-2 mb-6">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center">
        <CheckCircle2 size={12} className="text-emerald-400" />
      </div>
      <span className="font-mono-ibm text-[11px] text-white/30 tracking-wide line-through">Credentials</span>
    </div>
    <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/30 to-cyan-400/30" />
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-cyan-400/15 border border-cyan-400/40 flex items-center justify-center">
        <span className="font-mono-ibm text-[10px] text-cyan-300 font-medium">2</span>
      </div>
      <span className="font-mono-ibm text-[11px] text-cyan-300/80 tracking-wide">OTP Verify</span>
    </div>
  </div>
);

// ─── OtpModal ─────────────────────────────────────────────────────────────────

const OtpModal = ({ email, onVerify, onResend, onClose, isLoading, error }) => {
  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [cooldown,  setCooldown]  = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const inputRefs = useRef([]);

  // Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Auto-focus first on open
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // Auto-submit when complete
  useEffect(() => {
    if (digits.every((d) => d !== '')) handleSubmit(digits.join(''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // Reset inputs when a new error arrives
  useEffect(() => {
    if (!error) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [error]);

  // Escape to close
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleSubmit = async (otp) => {
    try {
      await onVerify(otp);
      setSuccess(true);
    } catch { /* parent handles error; inputs reset via the error effect */ }
  };

  const handleChange = useCallback((index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...digits];
      pasted.forEach((ch, i) => { if (index + i < OTP_LENGTH) next[index + i] = ch; });
      setDigits(next);
      inputRefs.current[Math.min(index + pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft'  && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_S);
    } finally { setResending(false); }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="OTP verification"
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Accent border */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-400/20 via-white/5 to-transparent pointer-events-none" />

        <div className="relative bg-[#060f1e]/95 rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>

          {/* Step indicator */}
          <StepIndicatorOtp />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              success
                ? 'bg-emerald-500/10 border-emerald-400/25'
                : 'bg-cyan-500/10 border-cyan-400/25'
            }`}>
              {success
                ? <CheckCircle2 size={26} className="text-emerald-400" />
                : <Mail size={26} className="text-cyan-400" />
              }
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="font-syne font-semibold text-lg text-white mb-1">
              {success ? 'Verified' : 'Check your email'}
            </h2>
            <p className="font-mono-ibm text-[11px] text-white/35 leading-relaxed">
              {success
                ? 'Redirecting you now…'
                : <>Code sent to <span className="text-cyan-300/60">{maskEmail(email)}</span></>
              }
            </p>
          </div>

          {!success && (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 text-red-300/80 text-xs bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5 animate-shake font-mono-ibm">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex justify-center gap-2 mb-6" role="group" aria-label="One-time password">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={isLoading}
                    aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                    className={`
                      w-10 h-12 text-center font-mono-ibm text-lg font-medium text-white
                      bg-white/4 border rounded-xl outline-none caret-transparent
                      ${digit ? 'border-cyan-400/50 bg-cyan-400/8 animate-otp-pop' : 'border-white/10'}
                      ${error  ? 'border-red-500/30' : ''}
                      focus:border-cyan-400/60 focus:bg-cyan-400/10
                      focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
                      disabled:opacity-40 transition-all duration-150
                    `}
                  />
                ))}
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 font-mono-ibm text-cyan-300/50 text-[11px] mb-4">
                  <Loader2 size={13} className="animate-spin" />
                  Verifying…
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="font-mono-ibm text-[11px] text-white/25">
                    Resend in{' '}
                    <span className="text-cyan-300/50 tabular-nums">
                      0:{String(cooldown).padStart(2, '0')}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-1.5 mx-auto font-mono-ibm text-[11px] text-cyan-400/60 hover:text-cyan-400/90 transition-colors disabled:opacity-40"
                  >
                    {resending
                      ? <><Loader2 size={11} className="animate-spin" />Sending…</>
                      : <><RotateCcw size={11} />Resend code</>
                    }
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpModal;