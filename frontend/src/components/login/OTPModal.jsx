import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, X, ShieldCheck } from 'lucide-react';

// ─── constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

// ─── helpers ──────────────────────────────────────────────────────────────────

const maskEmail = (addr = '') => {
  const [user, domain] = addr.split('@');
  if (!user || !domain) return addr;
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
};

const getFocusableElements = (container) => {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);
};

// ─── Inline styles / keyframes ────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap');

  @keyframes otp-modal-in {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes otp-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes otp-cell-pop {
    0%   { transform: scale(1);    }
    40%  { transform: scale(1.12); }
    70%  { transform: scale(0.96); }
    100% { transform: scale(1);    }
  }
  @keyframes otp-shake {
    0%,100% { transform: translateX(0); }
    15%      { transform: translateX(-6px); }
    30%      { transform: translateX(6px); }
    45%      { transform: translateX(-4px); }
    60%      { transform: translateX(4px); }
    75%      { transform: translateX(-2px); }
    90%      { transform: translateX(2px); }
  }
  @keyframes otp-success-scale {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes otp-scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(400%); opacity: 0; }
  }
  @keyframes otp-ping {
    0%   { transform: scale(1);   opacity: 0.5; }
    100% { transform: scale(2.2); opacity: 0;   }
  }
  @keyframes otp-bar-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes otp-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .otp-modal-panel {
    animation: otp-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .otp-overlay {
    animation: otp-overlay-in 0.2s ease both;
  }
  .otp-cell-filled {
    animation: otp-cell-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .otp-shake {
    animation: otp-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  .otp-success-icon {
    animation: otp-success-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .otp-stagger-1 { animation: otp-fade-up 0.3s 0.05s ease both; }
  .otp-stagger-2 { animation: otp-fade-up 0.3s 0.12s ease both; }
  .otp-stagger-3 { animation: otp-fade-up 0.3s 0.20s ease both; }
  .otp-stagger-4 { animation: otp-fade-up 0.3s 0.28s ease both; }

  .otp-close-button:hover {
    background: rgba(255,255,255,0.08) !important;
    color: rgba(255,255,255,0.7) !important;
  }

  .otp-close-button:focus-visible,
  .otp-resend-button:focus-visible,
  .otp-digit-input:focus-visible {
    outline: 2px solid rgba(56,189,248,0.9) !important;
    outline-offset: 2px;
  }

  .otp-digit-input:hover:not(:disabled):not(.otp-cell-filled) {
    border-color: rgba(255,255,255,0.16) !important;
  }

  .otp-resend-button:hover:not(:disabled) {
    background: rgba(14,165,233,0.12) !important;
    border-color: rgba(14,165,233,0.35) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .otp-modal-panel,
    .otp-overlay,
    .otp-cell-filled,
    .otp-shake,
    .otp-success-icon,
    .otp-stagger-1,
    .otp-stagger-2,
    .otp-stagger-3,
    .otp-stagger-4 {
      animation: none !important;
    }

    .otp-animated-element {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// ─── StepIndicator ────────────────────────────────────────────────────────────

const StepIndicator = () => (
  <div className="flex items-center gap-0 mb-8" aria-hidden="true">
    {/* Step 1 - done */}
    <div className="flex items-center gap-2">
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)',
        border: '1px solid rgba(34,197,94,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CheckCircle2 size={12} color="#4ade80" />
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em',
        textTransform: 'uppercase', textDecoration: 'line-through',
      }}>
        Credentials
      </span>
    </div>

    {/* Connector */}
    <div style={{ flex: 1, margin: '0 10px', height: 1, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        background: 'linear-gradient(90deg, rgba(34,197,94,0.4), rgba(34,211,238,0.4))',
        width: '100%',
      }} />
    </div>

    {/* Step 2 - active */}
    <div className="flex items-center gap-2">
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(34,211,238,0.12)',
        border: '1.5px solid rgba(34,211,238,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
      }}>
        {/* Ping ring */}
        <div className="otp-animated-element" style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: '1px solid rgba(34,211,238,0.25)',
          animation: 'otp-ping 2s ease-out infinite',
        }} />
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#67e8f9', fontWeight: 600,
        }}>2</span>
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'rgba(103,232,249,0.7)', letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Verify OTP
      </span>
    </div>
  </div>
);

// ─── OtpModal ─────────────────────────────────────────────────────────────────

const OtpModal = ({ email, onVerify, onResend, onClose, isLoading, error }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRefs = useRef([]);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Auto-focus first on open and restore focus when closed.
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    inputRefs.current[0]?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, []);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every((d) => d !== '')) handleSubmit(digits.join(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // Reset + shake on error
  useEffect(() => {
    if (!error) return;
    setShakeKey((k) => k + 1);
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [error]);

  // Escape to close + focus trap.
  useEffect(() => {
    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(modalRef.current);
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [onClose]);

  const handleSubmit = async (otp) => {
    try {
      await onVerify(otp);
      setSuccess(true);
    } catch { /* parent handles error state */ }
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
    const next = [...digits]; next[index] = value; setDigits(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  const handleResend = async () => {
    setResending(true);
    try { await onResend(); setCooldown(RESEND_COOLDOWN_S); }
    finally { setResending(false); }
  };

  const filled = digits.filter(Boolean).length;
  const progress = (filled / OTP_LENGTH) * 100;

  return (
    <>
      <style>{STYLES}</style>

      {/* Backdrop */}
      <div
        className="otp-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(2, 8, 20, 0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Panel wrapper */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 51,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <div
          ref={modalRef}
          className="otp-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-title"
          aria-describedby="otp-description"
          style={{
            width: '100%', maxWidth: 400, pointerEvents: 'auto',
            position: 'relative',
          }}
        >

          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: -1, borderRadius: 22,
            background: 'linear-gradient(145deg, rgba(34,211,238,0.18) 0%, rgba(99,102,241,0.1) 50%, transparent 100%)',
            zIndex: 0,
          }} />

          {/* Card */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(160deg, #07111f 0%, #050d1a 60%, #060f1f 100%)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(34,211,238,0.08) inset',
            overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif",
          }}>

            {/* Top scan-line shimmer */}
            {!success && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 2, overflow: 'hidden', zIndex: 10,
              }}>
                <div className="otp-animated-element" style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
                  animation: 'otp-scan 3.5s ease-in-out infinite',
                }} />
              </div>
            )}

            {/* Accent bar */}
            <div style={{
              height: 3,
              background: success
                ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
                : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
            }} />

            {/* Inner padding */}
            <div style={{ padding: '28px 32px 32px' }}>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close verification dialog"
                className="otp-close-button"
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>

              {/* Step indicator */}
              <div className="otp-stagger-1">
                <StepIndicator />
              </div>

              {/* ── SUCCESS STATE ──────────────────────── */}
              {success ? (
                <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                  <div className="otp-success-icon" style={{
                    width: 68, height: 68, borderRadius: 20,
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 32px rgba(34,197,94,0.15)',
                  }}>
                    <ShieldCheck size={30} color="#4ade80" aria-hidden="true" />
                  </div>
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 20, fontWeight: 700,
                    color: '#f0fdf4', margin: '0 0 8px', letterSpacing: '-0.3px',
                  }}>
                    Identity confirmed
                  </p>
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, color: 'rgba(74,222,128,0.5)', letterSpacing: '0.05em',
                  }}>
                    Redirecting to your dashboard…
                  </p>
                  <div style={{
                    marginTop: 24, height: 2, borderRadius: 1,
                    background: 'rgba(34,197,94,0.12)', overflow: 'hidden',
                  }}>
                    <div className="otp-animated-element" style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
                      animation: 'otp-bar-fill 1.8s cubic-bezier(0.4,0,0.2,1) both',
                    }} />
                  </div>
                </div>
              ) : (
                <>
                  {/* ── HEADER ──────────────────────────── */}
                  <div className="otp-stagger-2" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Icon with sonar rings */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: 'rgba(14,165,233,0.08)',
                          border: '1px solid rgba(14,165,233,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                              stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 6l-10 7L2 6"
                              stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>

                      <div style={{ paddingTop: 2 }}>
                        <p
                          id="otp-title"
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 17, fontWeight: 700,
                            color: '#f0f9ff', margin: '0 0 4px', letterSpacing: '-0.2px',
                          }}
                        >
                          Check your inbox
                        </p>
                        <p
                          id="otp-description"
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11, color: 'rgba(148,163,184,0.7)',
                            margin: 0, lineHeight: 1.6,
                          }}
                        >
                          Code sent to{' '}
                          <span style={{ color: 'rgba(125,211,252,0.8)', fontWeight: 500 }}>
                            {maskEmail(email)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── ERROR ───────────────────────────── */}
                  {error && (
                    <div
                      key={shakeKey}
                      id="otp-error"
                      role="alert"
                      aria-live="assertive"
                      className="otp-shake"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', marginBottom: 18, borderRadius: 10,
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderLeft: '3px solid rgba(239,68,68,0.5)',
                      }}
                    >
                      <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0 }} aria-hidden="true" />
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11.5, color: 'rgba(252,165,165,0.85)',
                        letterSpacing: '0.01em',
                      }}>
                        {error}
                      </span>
                    </div>
                  )}

                  {/* ── OTP INPUTS ──────────────────────── */}
                  <div className="otp-stagger-3">
                    {/* Progress track */}
                    <div style={{
                      height: 2, borderRadius: 1, marginBottom: 18,
                      background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 1,
                        width: `${progress}%`,
                        background: error
                          ? 'rgba(239,68,68,0.5)'
                          : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                        transition: 'width 0.15s ease, background 0.3s ease',
                      }} />
                    </div>

                    {/* Digit cells */}
                    <div
                      role="group"
                      aria-label="One-time password"
                      style={{
                        display: 'flex', justifyContent: 'center',
                        gap: 8, marginBottom: 8,
                      }}
                    >
                      {digits.map((digit, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          {/* Separator dot between groups */}
                          {i === 3 && (
                            <div style={{
                              position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                              width: 4, height: 4, borderRadius: '50%',
                              background: 'rgba(148,163,184,0.2)',
                            }} />
                          )}
                          <input
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
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'otp-error' : 'otp-description'}
                            className={`otp-digit-input ${digit ? 'otp-cell-filled' : ''}`}
                            style={{
                              width: 48, height: 58,
                              textAlign: 'center',
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 24, fontWeight: 500,
                              letterSpacing: '-0.5px',
                              color: error ? '#fca5a5' : digit ? '#e0f2fe' : 'rgba(255,255,255,0.5)',
                              background: error
                                ? 'rgba(239,68,68,0.06)'
                                : digit
                                  ? 'rgba(14,165,233,0.09)'
                                  : 'rgba(255,255,255,0.03)',
                              border: `1.5px solid ${
                                error
                                  ? 'rgba(239,68,68,0.3)'
                                  : digit
                                    ? 'rgba(14,165,233,0.4)'
                                    : 'rgba(255,255,255,0.08)'
                              }`,
                              borderBottom: `2px solid ${
                                error
                                  ? 'rgba(239,68,68,0.5)'
                                  : digit
                                    ? 'rgba(56,189,248,0.6)'
                                    : 'rgba(255,255,255,0.12)'
                              }`,
                              borderRadius: 12,
                              outline: 'none',
                              caretColor: 'transparent',
                              transition: 'all 0.15s ease',
                              boxShadow: digit && !error
                                ? '0 0 16px rgba(14,165,233,0.12)'
                                : 'none',
                              opacity: isLoading ? 0.5 : 1,
                              cursor: isLoading ? 'not-allowed' : 'text',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Digit count label */}
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, textAlign: 'center',
                      color: 'rgba(148,163,184,0.3)',
                      letterSpacing: '0.08em', margin: '0 0 20px',
                      textTransform: 'uppercase',
                    }}>
                      {filled < OTP_LENGTH
                        ? `${OTP_LENGTH - filled} digit${OTP_LENGTH - filled !== 1 ? 's' : ''} remaining`
                        : 'Verifying…'}
                    </p>
                  </div>

                  {/* ── LOADING ──────────────────────────── */}
                  {isLoading && (
                    <div
                      role="status"
                      aria-live="polite"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, marginBottom: 16,
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11, color: 'rgba(103,232,249,0.5)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Loader2 size={13} color="rgba(103,232,249,0.5)"
                        className="otp-animated-element" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />
                      Authenticating…
                    </div>
                  )}

                  {/* ── RESEND ───────────────────────────── */}
                  <div className="otp-stagger-4" style={{ textAlign: 'center' }}>
                    {cooldown > 0 ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 100,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {/* Cooldown arc */}
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }} aria-hidden="true">
                          <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                          <circle cx="7" cy="7" r="5.5" fill="none"
                            stroke="rgba(34,211,238,0.35)" strokeWidth="1.5"
                            strokeDasharray={`${2 * Math.PI * 5.5}`}
                            strokeDashoffset={`${2 * Math.PI * 5.5 * (1 - cooldown / RESEND_COOLDOWN_S)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 7 7)"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                          />
                        </svg>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11, color: 'rgba(255,255,255,0.25)',
                          letterSpacing: '0.04em',
                        }}>
                          Resend in{' '}
                          <span style={{
                            color: 'rgba(103,232,249,0.45)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            0:{String(cooldown).padStart(2, '0')}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="otp-resend-button"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          padding: '8px 18px', borderRadius: 100,
                          background: 'rgba(14,165,233,0.07)',
                          border: '1px solid rgba(14,165,233,0.2)',
                          cursor: resending ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11, color: resending ? 'rgba(103,232,249,0.4)' : 'rgba(103,232,249,0.75)',
                          letterSpacing: '0.04em',
                          transition: 'all 0.15s',
                          opacity: resending ? 0.6 : 1,
                        }}
                      >
                        {resending
                          ? <><Loader2 size={11} className="otp-animated-element" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Sending…</>
                          : <><RotateCcw size={11} aria-hidden="true" /> Resend code</>
                        }
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OtpModal;
