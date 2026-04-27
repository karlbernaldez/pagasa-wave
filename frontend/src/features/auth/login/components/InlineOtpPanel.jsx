import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

function maskEmail(email = '') {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
}

export default function InlineOtpPanel({
  email,
  error,
  isLoading,
  onVerify,
  onResend,
  onClose,
}) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (!error) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [error]);

  useEffect(() => {
    const otp = digits.join('');

    if (otp.length === OTP_LENGTH && digits.every(Boolean)) {
      handleSubmit(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleSubmit = async (otp) => {
    try {
      await onVerify(otp);
      setSuccess(true);
    } catch {
      // parent owns the error state
    }
  };

  const handleChange = useCallback(
    (index, value) => {
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
        const next = [...digits];

        pasted.forEach((digit, pastedIndex) => {
          if (index + pastedIndex < OTP_LENGTH) {
            next[index + pastedIndex] = digit;
          }
        });

        setDigits(next);
        inputRefs.current[Math.min(index + pasted.length, OTP_LENGTH - 1)]?.focus();
        return;
      }

      if (!/^\d?$/.test(value)) return;

      const next = [...digits];
      next[index] = value;
      setDigits(next);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index, event) => {
      if (event.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }

      if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleResend = async () => {
    setResending(true);

    try {
      await onResend();
      setDigits(Array(OTP_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN_S);
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const filled = digits.filter(Boolean).length;
  const progress = (filled / OTP_LENGTH) * 100;

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-10 w-10" />
        </div>

        <div>
          <h3 className="text-3xl font-extrabold text-blue-950">
            Identity confirmed
          </h3>
          <p className="mt-2 text-base font-medium text-slate-500">
            Redirecting to your workspace...
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-900"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </button>

      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <CheckCircle2 size={15} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 line-through">
            Credentials
          </span>
        </div>

        <div className="h-px w-12 bg-cyan-200" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-2 ring-cyan-200">
            2
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
            Verify OTP
          </span>
        </div>
      </div>

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700">
          <Mail className="h-8 w-8" />
        </div>

        <h3 className="text-3xl font-extrabold text-blue-950">
          Check your inbox
        </h3>

        <p className="mt-2 text-base font-medium text-slate-500">
          We sent a 6-digit code to{' '}
          <span className="font-bold text-cyan-700">{maskEmail(email)}</span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              error
                ? 'bg-red-400'
                : 'bg-gradient-to-r from-cyan-600 to-teal-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          role="group"
          aria-label="One-time password"
          className="flex justify-center gap-2 sm:gap-3"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={digit}
              disabled={isLoading}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onFocus={(event) => event.target.select()}
              className={`h-14 w-11 rounded-xl border text-center text-2xl font-extrabold text-blue-950 outline-none transition sm:h-16 sm:w-12 ${
                error
                  ? 'border-red-300 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100'
                  : digit
                    ? 'border-cyan-500 bg-cyan-50 focus:ring-4 focus:ring-cyan-100'
                    : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'
              }`}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          {filled < OTP_LENGTH
            ? `${OTP_LENGTH - filled} digit${OTP_LENGTH - filled !== 1 ? 's' : ''} remaining`
            : 'Verifying...'}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-cyan-700">
          <Loader2 size={16} className="animate-spin" />
          Authenticating...
        </div>
      )}

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm font-semibold text-slate-500">
            Resend code in{' '}
            <span className="font-bold text-cyan-700">
              0:{String(cooldown).padStart(2, '0')}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RotateCcw size={15} />
                Resend code
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}