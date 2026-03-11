import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

import { verifyEmail, resendVerificationEmail } from '@/api/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Animated background — matches Login page
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.4,
      dx:    (Math.random() - 0.5) * 0.35,
      dy:    (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Wave logo icon
// ─────────────────────────────────────────────────────────────────────────────
const WaveIcon = ({ size = 28 }) => (
  <svg width={size} height={size * 0.65} viewBox="0 0 28 18" fill="none">
    <path
      d="M1 9 C4 3, 7 3, 10 9 S16 15, 19 9 S25 3, 27 9"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Step tracker
// ─────────────────────────────────────────────────────────────────────────────
const Steps = ({ active }) => {
  const steps = ['Register', 'Verify Email', 'Access WaveLab'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
      {steps.map((label, i) => {
        const done    = i < active;
        const current = i === active;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, transition: 'all 0.5s ease',
                  background: done
                    ? 'linear-gradient(135deg,#38bdf8,#818cf8)'
                    : current ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                  border: current
                    ? '1.5px solid #38bdf8'
                    : done ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.1)',
                  color: done ? '#fff' : current ? '#38bdf8' : 'rgba(255,255,255,0.3)',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  color: current ? '#38bdf8' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: 1, width: 48, margin: '0 8px 20px', transition: 'all 0.5s ease',
                  background: done
                    ? 'linear-gradient(90deg,#38bdf8,#818cf8)'
                    : 'rgba(255,255,255,0.08)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  verifying: {
    icon:     <Loader2 size={44} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />,
    title:    'Verifying your email…',
    subtitle: 'Please hold on while we confirm your address.',
    accent:   '#38bdf8',
  },
  success: {
    icon:     <CheckCircle size={44} color="#34d399" />,
    title:    'Email Verified!',
    subtitle: 'Your WaveLab account is now active and ready to use.',
    accent:   '#34d399',
  },
  expired: {
    icon:     <RefreshCw size={44} color="#fbbf24" />,
    title:    'Link Expired',
    subtitle: 'This verification link has expired. Request a new one below.',
    accent:   '#fbbf24',
  },
  error: {
    icon:     <XCircle size={44} color="#f87171" />,
    title:    'Verification Failed',
    subtitle: "We couldn't verify your email. The link may be invalid or already used.",
    accent:   '#f87171',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');

  const navigate       = useNavigate();
  const location       = useLocation();

  const emailFromState = location.state?.email ?? null;

  const [status,    setStatus]    = useState('verifying');
  const [email,     setEmail]     = useState(emailFromState);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [resendErr, setResendErr] = useState(null);
  const [mounted,   setMounted]   = useState(false);

  // ── Double-request guard ──────────────────────────────────────────────────
  // React StrictMode intentionally mounts twice in dev; this ref ensures the
  // verification fetch only fires once regardless of how many times the effect
  // runs.  We also wire an AbortController so any in-flight request is
  // cancelled if the component genuinely unmounts before it completes.
  const verifyCalledRef = useRef(false);

  useEffect(() => { document.title = 'WaveLab – Verify Email'; }, []);
  useEffect(() => { setMounted(true); }, []);

  // ── Verify token on mount — fires exactly once ────────────────────────────
  useEffect(() => {
    // Already ran (StrictMode second mount or token unchanged re-render)
    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;

    if (!token) {
      setStatus('error');
      return;
    }

    // AbortController lets us cancel the underlying fetch if the component
    // unmounts before the response arrives (e.g. user navigates away quickly)
    const controller = new AbortController();

    verifyEmail(token, controller.signal)
      .then((data) => {
        if (data?.email) setEmail(data.email);
        setStatus('success');
      })
      .catch((err) => {
        // Ignore cancellation — component is gone, no state update needed
        if (err?.name === 'AbortError') return;

        const msg = (err?.message ?? '').toLowerCase();
        setStatus(msg.includes('expired') ? 'expired' : 'error');
      });

    return () => controller.abort();
  }, [token]);

  // ── Resend — guarded against concurrent clicks ────────────────────────────
  const resendInFlightRef = useRef(false);

  const handleResend = async () => {
    // Prevent double-click spam
    if (resendInFlightRef.current) return;

    if (!email) {
      setResendErr('We lost track of your email address. Please go back and register again.');
      return;
    }

    resendInFlightRef.current = true;
    setResending(true);
    setResendErr(null);

    try {
      await resendVerificationEmail(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setResendErr(err?.message ?? 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
      resendInFlightRef.current = false;
    }
  };

  const cfg       = STATUS_CONFIG[status];
  const stepIndex = status === 'success' ? 2 : 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      }}
    >
      <style>{`
        @keyframes spin   { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <AnimatedBackground />

      {/* Ambient glow orbs */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Back button */}
      <button
        onClick={() => navigate('/login')}
        aria-label="Go back to login"
        style={{
          position: 'fixed', top: 32, left: 32, zIndex: 50,
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          width: 48, height: 48, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Main content */}
      <main
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 460,
          animation: mounted ? 'fadeUp 0.6s ease forwards' : 'none',
        }}
      >
        {/* Brand header */}
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 88, height: 88, marginBottom: 18, borderRadius: 22,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              boxShadow: '0 20px 60px rgba(59,130,246,0.25)',
            }}
          >
            <WaveIcon size={40} />
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', margin: '0 0 6px' }}>
            WaveLab
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(147,197,253,0.8)' }}>
            <div style={{ height: 1, width: 28, background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.5))' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>PAGASA</span>
            <div style={{ height: 1, width: 28, background: 'linear-gradient(90deg, rgba(96,165,250,0.5), transparent)' }} />
          </div>

          <p style={{ fontSize: 12, color: 'rgba(147,197,253,0.4)', marginTop: 8 }}>
            Philippine Atmospheric, Geophysical and Astronomical Services Administration
          </p>
        </header>

        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
            borderRadius: 28, border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(56,189,248,0.04) 0%, rgba(129,140,248,0.04) 100%)', borderRadius: 28, pointerEvents: 'none' }} />
          <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.accent}, #818cf8)`, transition: 'background 0.6s ease' }} />

          <div style={{ padding: '40px 40px 36px', position: 'relative' }}>

            {/* Status icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${cfg.accent}22, ${cfg.accent}11)`,
                  border: `1.5px solid ${cfg.accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 48px ${cfg.accent}22`,
                  transition: 'all 0.5s ease',
                }}
              >
                {cfg.icon}
              </div>
            </div>

            {/* Badge */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span
                style={{
                  color: cfg.accent, border: `1px solid ${cfg.accent}33`, background: `${cfg.accent}11`,
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                  borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', transition: 'all 0.4s ease',
                }}
              >
                <ShieldCheck size={12} />
                Email Verification
              </span>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px', letterSpacing: '-0.5px', transition: 'all 0.4s ease' }}>
              {cfg.title}
            </h2>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(148,163,184,0.85)', lineHeight: 1.7, margin: '0 0 28px', transition: 'all 0.4s ease' }}>
              {cfg.subtitle}
            </p>

            {/* Email info box */}
            {status !== 'verifying' && email && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Mail size={16} color="#38bdf8" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {status === 'success' ? 'Verified address' : 'Email address'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, color: '#cbd5e1', fontWeight: 500 }}>
                    {email}
                  </p>
                </div>
              </div>
            )}

            {/* Resend error */}
            {resendErr && (
              <div
                style={{
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                  fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
                }}
              >
                {resendErr}
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {status === 'success' && (
                <button
                  onClick={() => navigate('/studio')}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                    color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
                    cursor: 'pointer', boxShadow: '0 8px 32px rgba(56,189,248,0.25)',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Continue to WaveLab →
                </button>
              )}

              {(status === 'expired' || status === 'error') && (
                <button
                  onClick={handleResend}
                  disabled={resending || resent}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    border: resent ? '1px solid rgba(52,211,153,0.3)' : 'none',
                    background: resent ? 'rgba(52,211,153,0.08)' : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                    color: resent ? '#34d399' : '#fff',
                    fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
                    cursor: resending || resent ? 'default' : 'pointer',
                    opacity: resending ? 0.7 : 1,
                    boxShadow: resent ? 'none' : '0 8px 32px rgba(56,189,248,0.25)',
                    transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {resending ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                  ) : resent ? (
                    <><CheckCircle size={16} /> Email Sent! Check your inbox</>
                  ) : (
                    <><RefreshCw size={16} /> Resend Verification Email</>
                  )}
                </button>
              )}

              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(148,163,184,0.8)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; }}
              >
                ← Back to Login
              </button>
            </div>

            <Steps active={stepIndex} />
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(148,163,184,0.3)', marginTop: 24, lineHeight: 1.6 }}>
          By continuing, you agree to our{' '}
          <button style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(148,163,184,0.5)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Terms of Service
          </button>
          {' '}and{' '}
          <button style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(148,163,184,0.5)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Privacy Policy
          </button>
        </p>
      </main>
    </div>
  );
}