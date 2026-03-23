import { useRef, useCallback } from "react";

export function ThemeToggle({ isDarkMode, onToggle }) {
  const isLockedRef = useRef(false);

  const handleClick = useCallback(() => {
    if (isLockedRef.current) return;

    isLockedRef.current = true;
    onToggle();

    // match your CSS transition duration (~450ms)
    setTimeout(() => {
      isLockedRef.current = false;
    }, 500);
  }, [onToggle]);

  return (
    <>
      <style>{CSS}</style>

      <button
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDarkMode}
        onClick={handleClick}
        className={`theme-toggle ${isDarkMode ? "theme-toggle--dark" : "theme-toggle--light"}`}
      >
        {/* Track (the pill) */}
        <span className="theme-toggle__track" aria-hidden="true">

          {/* Light-mode sun rays */}
          <span className="theme-toggle__rays">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="theme-toggle__ray" style={{ "--i": i }} />
            ))}
          </span>

          {/* Dark-mode stars */}
          <span className="theme-toggle__stars">
            {STARS.map((s, i) => (
              <span key={i} className="theme-toggle__star" style={{ "--x": s.x, "--y": s.y, "--d": s.d, "--s": s.s }} />
            ))}
          </span>

          {/* Sliding thumb */}
          <span className="theme-toggle__thumb">
            <span className="theme-toggle__sun"><SunIcon /></span>
            <span className="theme-toggle__moon"><MoonIcon /></span>
          </span>
        </span>
      </button>
    </>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ── Star positions (deterministic — no layout shift) ─────────────────────────

const STARS = [
  { x: "18%", y: "22%", d: "0s", s: "1.5px" },
  { x: "42%", y: "15%", d: "0.3s", s: "1px" },
  { x: "65%", y: "28%", d: "0.7s", s: "2px" },
  { x: "30%", y: "55%", d: "1.1s", s: "1px" },
  { x: "78%", y: "48%", d: "0.5s", s: "1.5px" },
  { x: "55%", y: "68%", d: "0.9s", s: "1px" },
  { x: "12%", y: "72%", d: "1.4s", s: "2px" },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Base ─────────────────────────────────────────────── */
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  outline-offset: 3px;
  -webkit-tap-highlight-color: transparent;
}

.theme-toggle:focus-visible {
  outline: 2px solid #60a5fa;
}

/* ── Track (pill shell) ───────────────────────────────── */
.theme-toggle__track {
  position: relative;
  display: block;
  width: 64px;
  height: 32px;
  border-radius: 999px;
  overflow: hidden;
  transition: background 0.5s ease, box-shadow 0.4s ease;
}

.theme-toggle--light .theme-toggle__track {
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 40%, #bfdbfe 100%);
  box-shadow:
    0 2px 10px rgba(96, 165, 250, 0.55),
    inset 0 1px 0 rgba(255,255,255,0.4);
}

.theme-toggle--dark .theme-toggle__track {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0c1628 100%);
  box-shadow:
    0 2px 14px rgba(30, 58, 138, 0.7),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

/* ── Sun rays ─────────────────────────────────────────── */
.theme-toggle__rays {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.theme-toggle--dark .theme-toggle__rays { opacity: 0; }

.theme-toggle__ray {
  position: absolute;
  top: 50%;
  left: 13px;
  width: 14px;
  height: 1.5px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.55);
  transform-origin: left center;
  transform: rotate(calc(var(--i) * 45deg)) translateX(7px);
  animation: tt-ray-pulse 2.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.18s);
}

@keyframes tt-ray-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.85; }
}

/* ── Stars ────────────────────────────────────────────── */
.theme-toggle__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.theme-toggle__star {
  position: absolute;
  left: var(--x);
  top:  var(--y);
  width:  var(--s);
  height: var(--s);
  border-radius: 50%;
  background: white;
  opacity: 0;
  transition: opacity 0.4s ease var(--d);
  animation: tt-twinkle 2s ease-in-out infinite;
  animation-delay: var(--d);
}

.theme-toggle--dark .theme-toggle__star { opacity: 0.9; }

@keyframes tt-twinkle {
  0%, 100% { transform: scale(1);   opacity: 0.9; }
  50%       { transform: scale(1.6); opacity: 0.35; }
}

/* ── Thumb (the sliding circle) ───────────────────────── */
.theme-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s ease;
  will-change: transform;
}

.theme-toggle--light .theme-toggle__thumb {
  transform: translateX(0px);
  background: linear-gradient(145deg, #fef9c3, #fde68a);
  box-shadow:
    0 2px 8px rgba(251, 191, 36, 0.65),
    0 1px 3px rgba(0,0,0,0.12),
    inset 0 1px 0 rgba(255,255,255,0.6);
}

.theme-toggle--dark .theme-toggle__thumb {
  transform: translateX(32px);
  background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
  box-shadow:
    0 2px 8px rgba(148, 163, 184, 0.45),
    0 1px 3px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.3);
}

/* ── Sun / Moon icon layers ────────────────────────────── */
.theme-toggle__sun,
.theme-toggle__moon {
  position: absolute;
  inset: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.25s ease, transform 0.35s ease;
}

.theme-toggle__sun svg,
.theme-toggle__moon svg { width: 100%; height: 100%; }

.theme-toggle--light .theme-toggle__sun  { opacity: 1; transform: rotate(0deg)   scale(1);   color: #b45309; }
.theme-toggle--light .theme-toggle__moon { opacity: 0; transform: rotate(-90deg) scale(0.5); color: #64748b; }
.theme-toggle--dark  .theme-toggle__sun  { opacity: 0; transform: rotate(90deg)  scale(0.5); color: #b45309; }
.theme-toggle--dark  .theme-toggle__moon { opacity: 1; transform: rotate(0deg)   scale(1);   color: #475569; }

/* ── Hover / active ─────────────────────────────────────── */
.theme-toggle:hover .theme-toggle__track  { filter: brightness(1.09); }
.theme-toggle:hover .theme-toggle__thumb  { filter: brightness(1.07); }

.theme-toggle:active .theme-toggle__thumb {
  filter: brightness(0.93);
}
.theme-toggle--light:active .theme-toggle__thumb {
  transform: translateX(0px)  scaleX(1.18) scaleY(0.85);
}
.theme-toggle--dark:active .theme-toggle__thumb {
  transform: translateX(32px) scaleX(1.18) scaleY(0.85);
}
`;