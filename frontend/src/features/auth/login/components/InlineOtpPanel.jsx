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
import { tokens } from '@/styles/tokens';

const { colors } = tokens;

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
  const submittedOtpRef = useRef(null);

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
    submittedOtpRef.current = null;
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [error]);

  const submitOtp = useCallback(
    async (otp) => {
      if (isLoading || success || otp.length !== OTP_LENGTH || submittedOtpRef.current === otp) return;

      submittedOtpRef.current = otp;

      try {
        await onVerify(otp);
        setSuccess(true);
      } catch {
        submittedOtpRef.current = null;
      }
    },
    [isLoading, onVerify, success]
  );

  const updateDigitsAndMaybeSubmit = useCallback(
    (nextDigits) => {
      setDigits(nextDigits);

      const otp = nextDigits.join('');
      if (otp.length === OTP_LENGTH && nextDigits.every(Boolean)) {
        submitOtp(otp);
      }
    },
    [submitOtp]
  );

  const handleChange = useCallback(
    (index, value) => {
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
        if (!pasted.length) return;

        const next = [...digits];
        pasted.forEach((digit, pastedIndex) => {
          if (index + pastedIndex < OTP_LENGTH) {
            next[index + pastedIndex] = digit;
          }
        });

        updateDigitsAndMaybeSubmit(next);
        inputRefs.current[Math.min(index + pasted.length, OTP_LENGTH - 1)]?.focus();
        return;
      }

      if (!/^\d?$/.test(value)) return;

      const next = [...digits];
      next[index] = value;
      updateDigitsAndMaybeSubmit(next);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, updateDigitsAndMaybeSubmit]
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
      submittedOtpRef.current = null;
      setDigits(Array(OTP_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN_S);
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const filled = digits.filter(Boolean).length;

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(1,176,239,0.12)', color: colors.brand.primary }}
        >
          <ShieldCheck className="h-10 w-10" />
        </div>

        <div>
          <h3 style={{ color: colors.brand.secondary }} className="text-3xl font-extrabold">
            Identity confirmed
          </h3>
          <p className="mt-2 text-base font-medium" style={{ color: colors.text.light.muted }}>
            Redirecting to your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm font-bold"
        style={{ color: colors.brand.primary }}
      >
        <ArrowLeft size={16} />
        Back to sign in
      </button>

      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full ring-1"
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              color: colors.state.success,
              ringColor: 'rgba(34, 197, 94, 0.24)',
            }}
          >
            <CheckCircle2 size={15} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider line-through" style={{ color: colors.text.light.muted }}>
            Credentials
          </span>
        </div>

        <div className="h-px w-12" style={{ background: 'rgba(1,176,239,0.28)' }} />

        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full ring-2"
            style={{
              background: 'rgba(1,176,239,0.12)',
              color: colors.brand.primary,
              ringColor: 'rgba(1,176,239,0.25)',
            }}
          >
            2
          </div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.brand.primary }}>
            Verify OTP
          </span>
        </div>
      </div>

      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(1,176,239,0.12)', color: colors.brand.primary }}
        >
          <Mail className="h-8 w-8" />
        </div>

        <h3 className="text-3xl font-extrabold" style={{ color: colors.brand.secondary }}>
          Check your inbox
        </h3>

        <p className="mt-2 text-base font-medium" style={{ color: colors.text.light.muted }}>
          We sent a 6-digit code to{' '}
          <span className="font-bold" style={{ color: colors.brand.primary }}>
            {maskEmail(email)}
          </span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold"
          style={{
            color: colors.brand.danger,
            background: 'rgba(252,5,13,0.08)',
            borderColor: 'rgba(252,5,13,0.28)',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(1,176,239,0.14)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(filled / OTP_LENGTH) * 100}%`,
              background: error ? colors.brand.danger : colors.brand.primary,
            }}
          />
        </div>

        <div role="group" aria-label="One-time password" className="flex justify-center gap-2 sm:gap-3">
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
              className="h-14 w-11 rounded-xl border text-center text-2xl font-extrabold outline-none transition focus:ring-4 sm:h-16 sm:w-12"
              style={{
                borderColor: error
                  ? colors.brand.danger
                  : digit
                    ? colors.brand.primary
                    : 'rgba(1,176,239,0.35)',
                background: digit ? 'rgba(1,176,239,0.08)' : colors.surface.light.raised,
                color: error ? colors.brand.danger : colors.brand.secondary,
                '--tw-ring-color': error ? 'rgba(252,5,13,0.18)' : 'rgba(1,176,239,0.20)',
              }}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.light.muted }}>
          {filled < OTP_LENGTH
            ? `${OTP_LENGTH - filled} digit${OTP_LENGTH - filled !== 1 ? 's' : ''} remaining`
            : 'Verifying...'}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold" style={{ color: colors.brand.primary }}>
          <Loader2 size={16} className="animate-spin" />
          Authenticating...
        </div>
      )}

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm font-semibold" style={{ color: colors.text.light.muted }}>
            Resend code in{' '}
            <span className="font-bold" style={{ color: colors.brand.primary }}>
              0:{String(cooldown).padStart(2, '0')}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'rgba(1,176,239,0.10)',
              borderColor: 'rgba(1,176,239,0.28)',
              color: colors.brand.primary,
            }}
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
