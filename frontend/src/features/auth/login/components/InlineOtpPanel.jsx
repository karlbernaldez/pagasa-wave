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

  const handleSubmit = async (otp) => {
    try {
      await onVerify(otp);
      setSuccess(true);
    } catch {}
  };

  const handleChange = useCallback((index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

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

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(1,176,239,0.12)', color: colors.brand.primary }}
        >
          <ShieldCheck className="h-10 w-10" />
        </div>

        <h3 style={{ color: colors.brand.secondary }} className="text-3xl font-extrabold">
          Identity confirmed
        </h3>
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
        <ArrowLeft size={16} /> Back
      </button>

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

        <p style={{ color: colors.text.light.muted }}>
          Code sent to <span style={{ color: colors.brand.primary }}>{maskEmail(email)}</span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border p-4 text-sm"
          style={{
            color: colors.brand.danger,
            background: 'rgba(252,5,13,0.08)',
            borderColor: 'rgba(252,5,13,0.28)',
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            className="h-14 w-11 rounded-xl border text-center text-xl font-bold"
            style={{
              borderColor: error ? colors.brand.danger : 'rgba(1,176,239,0.4)',
              background: colors.surface.light.raised,
              color: colors.brand.secondary,
            }}
          />
        ))}
      </div>

      <div className="text-center">
        {cooldown > 0 ? (
          <p style={{ color: colors.text.light.muted }}>Resend in {cooldown}s</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="rounded-full px-4 py-2 font-bold"
            style={{ background: colors.brand.primary, color: '#fff' }}
          >
            {resending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Resend
          </button>
        )}
      </div>
    </div>
  );
}
