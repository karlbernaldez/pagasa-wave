import React from 'react';

// ─── Inject styles once ──────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .eb-root {
    min-height: 100vh;
    background: #080c14;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* ── Ambient blobs ── */
  .eb-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    animation: eb-drift 8s ease-in-out infinite alternate;
  }
  .eb-blob-1 {
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(245,130,32,0.12) 0%, transparent 70%);
    top: -160px; right: -100px;
  }
  .eb-blob-2 {
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%);
    bottom: -100px; left: -80px;
    animation-delay: -4s;
  }
  @keyframes eb-drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(30px, 20px) scale(1.05); }
  }

  /* ── Grid texture overlay ── */
  .eb-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* ── Card ── */
  .eb-card {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 24px;
    padding: 48px 44px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 32px 80px rgba(0,0,0,0.55),
      0 0 120px rgba(245,130,32,0.05);
    animation: eb-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes eb-enter {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Icon area ── */
  .eb-icon-wrap {
    width: 72px; height: 72px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(245,130,32,0.18), rgba(245,130,32,0.06));
    border: 1px solid rgba(245,130,32,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 28px;
    position: relative;
  }
  .eb-icon-wrap::before {
    content: '';
    position: absolute; inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(245,130,32,0.35), transparent 60%);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    padding: 1px;
  }
  .eb-icon {
    font-size: 32px;
    line-height: 1;
    animation: eb-icon-pulse 3s ease-in-out infinite;
  }
  @keyframes eb-icon-pulse {
    0%,100% { filter: drop-shadow(0 0 6px rgba(245,130,32,0.4)); }
    50%      { filter: drop-shadow(0 0 16px rgba(245,130,32,0.75)); }
  }

  /* ── Eyebrow label ── */
  .eb-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #f58220;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .eb-eyebrow::before {
    content: '';
    display: inline-block;
    width: 18px; height: 1px;
    background: #f58220;
    opacity: 0.7;
  }

  /* ── Heading ── */
  .eb-heading {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #f1f4f9;
    line-height: 1.2;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
  }

  /* ── Body text ── */
  .eb-body {
    font-size: 14px;
    font-weight: 300;
    color: rgba(255,255,255,0.45);
    line-height: 1.7;
    margin: 0 0 32px;
  }

  /* ── Divider ── */
  .eb-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
    margin-bottom: 28px;
  }

  /* ── Details / error code ── */
  .eb-details {
    margin-bottom: 32px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
  }
  .eb-details summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    list-style: none;
    user-select: none;
    transition: color 0.2s, background 0.2s;
  }
  .eb-details summary::-webkit-details-marker { display: none; }
  .eb-details summary:hover {
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.03);
  }
  .eb-details summary .eb-chevron {
    width: 14px; height: 14px;
    transition: transform 0.25s;
  }
  .eb-details[open] summary .eb-chevron {
    transform: rotate(180deg);
  }
  .eb-error-pre {
    font-family: 'DM Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: rgba(245, 130, 32, 0.75);
    background: rgba(0,0,0,0.35);
    padding: 14px 16px;
    margin: 0;
    overflow-x: auto;
    max-height: 120px;
    line-height: 1.6;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  /* ── Status pills ── */
  .eb-status-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .eb-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid;
  }
  .eb-pill-warn {
    background: rgba(245,130,32,0.08);
    border-color: rgba(245,130,32,0.2);
    color: rgba(245,130,32,0.9);
  }
  .eb-pill-info {
    background: rgba(99,102,241,0.08);
    border-color: rgba(99,102,241,0.2);
    color: rgba(160,163,255,0.9);
  }
  .eb-pill-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: eb-blink 1.8s ease-in-out infinite;
  }
  @keyframes eb-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.25; }
  }

  /* ── Buttons ── */
  .eb-btn-primary {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 14px 20px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
    background: linear-gradient(135deg, #f58220, #e05f00);
    color: #fff;
    box-shadow: 0 4px 24px rgba(245,130,32,0.28), 0 1px 0 rgba(255,255,255,0.12) inset;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    margin-bottom: 10px;
  }
  .eb-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(245,130,32,0.38), 0 1px 0 rgba(255,255,255,0.12) inset;
    filter: brightness(1.08);
  }
  .eb-btn-primary:active { transform: translateY(0) scale(0.98); }

  .eb-btn-secondary {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 13px 20px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.03);
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .eb-btn-secondary:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.18);
  }

  /* ── Footer ── */
  .eb-footer {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .eb-footer-text {
    font-size: 11px;
    color: rgba(255,255,255,0.2);
  }
  .eb-footer-badge {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .eb-footer-badge span {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
    animation: eb-blink 2.5s ease-in-out infinite;
  }
`;

function injectStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('eb-styles')) {
    const tag = document.createElement('style');
    tag.id = 'eb-styles';
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }
}

// ─── SVG icons (inline, no deps) ─────────────────────────────────────────────
const ChevronDown = () => (
  <svg className="eb-chevron" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 5l4 4 4-4" />
  </svg>
);

const ReloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 8A5.5 5.5 0 1 1 10 3.07" />
    <path d="M10 1v3h3" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

// ─── Fallback UI ──────────────────────────────────────────────────────────────
const ErrorBoundaryFallback = ({ error, errorInfo, timestamp, onReload }) => {
  injectStyles();

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred.';
  const componentStack = errorInfo?.componentStack?.trim();

  return (
    <div className="eb-root">
      {/* Ambient blobs */}
      <div className="eb-blob eb-blob-1" />
      <div className="eb-blob eb-blob-2" />
      <div className="eb-grid" />

      <div className="eb-card" role="alert" aria-live="assertive">

        {/* Icon */}
        <div className="eb-icon-wrap" aria-hidden="true">
          <span className="eb-icon">⛈</span>
        </div>

        {/* Eyebrow */}
        <p className="eb-eyebrow">Runtime Exception</p>

        {/* Heading */}
        <h1 className="eb-heading">Something went<br />off the forecast.</h1>

        {/* Body */}
        <p className="eb-body">
          An unexpected error interrupted the weather system. 
          Your data is safe — this only affects the interface.
        </p>

        <div className="eb-divider" />

        {/* Status pills */}
        <div className="eb-status-row" aria-label="Error status">
          <span className="eb-pill eb-pill-warn">
            <span className="eb-pill-dot" />
            UI Exception
          </span>
          {formattedTime && (
            <span className="eb-pill eb-pill-info">
              {formattedTime}
            </span>
          )}
          <span className="eb-pill eb-pill-info">
            PAGASA Forecasting
          </span>
        </div>

        {/* Error details */}
        <details className="eb-details">
          <summary>
            <span>Technical details</span>
            <ChevronDown />
          </summary>
          <pre className="eb-error-pre">
{`Error: ${errorMessage}${componentStack ? `\n\nComponent Stack:${componentStack}` : ''}`}
          </pre>
        </details>

        {/* Actions */}
        <button className="eb-btn-primary" onClick={onReload}>
          <ReloadIcon />
          Restart Weather System
        </button>

        <button className="eb-btn-secondary" onClick={() => window.history.back()}>
          <ArrowLeft />
          Go Back
        </button>

        {/* Footer */}
        <div className="eb-footer">
          <span className="eb-footer-text">
            Contact PAGASA support if this persists
          </span>
          <span className="eb-footer-badge">
            <span />
            Live
          </span>
        </div>

      </div>
    </div>
  );
};

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      timestamp: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, timestamp: new Date().toISOString() };
  }

  componentDidCatch(error, errorInfo) {
    console.group('⛈ PAGASA Weather — Caught Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, timestamp: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          timestamp={this.state.timestamp}
          onReload={this.handleReload}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;