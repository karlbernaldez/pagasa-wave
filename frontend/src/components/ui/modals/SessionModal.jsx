

const ICONS = {
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
};

// ── Variant config ────────────────────────────────────────────────────────────

const VARIANTS = {
  warning: {
    accent:     'bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400',
    iconWrap:   'bg-orange-500/10 border border-orange-500/20',
    iconStroke: 'stroke-orange-400',
    btn:        'bg-gradient-to-br from-orange-500 to-orange-400 shadow-[0_2px_12px_rgba(249,115,22,0.35)] text-white',
  },
  error: {
    accent:     'bg-gradient-to-r from-red-500 via-red-400 to-rose-400',
    iconWrap:   'bg-red-500/10 border border-red-500/20',
    iconStroke: 'stroke-red-400',
    btn:        'bg-gradient-to-br from-red-500 to-rose-400 shadow-[0_2px_12px_rgba(239,68,68,0.35)] text-white',
  },
  info: {
    accent:     'bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300',
    iconWrap:   'bg-blue-500/10 border border-blue-500/20',
    iconStroke: 'stroke-blue-400',
    btn:        'bg-gradient-to-br from-blue-500 to-blue-400 shadow-[0_2px_12px_rgba(59,130,246,0.35)] text-white',
  },
};

// ── Core ──────────────────────────────────────────────────────────────────────

/**
 * @param {object}  opts
 * @param {'warning'|'error'|'info'} [opts.variant='warning']
 * @param {string}  [opts.title='Session Expired']
 * @param {string}  [opts.message]
 * @param {string}  [opts.confirmLabel='Go to Login']
 * @param {string}  [opts.cancelLabel]                 - Omit to hide cancel button
 * @returns {Promise<boolean>}  true = confirm, false = cancel / backdrop / Escape
 */
export function showSessionModal({
  variant      = 'warning',
  title        = 'Session Expired',
  message      = 'Your session has timed out. Please log in again to continue.',
  confirmLabel = 'Go to Login',
  cancelLabel,
} = {}) {
  const v = VARIANTS[variant] ?? VARIANTS.warning;

  return new Promise((resolve) => {
    // ── Overlay ──────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = [
      'fixed inset-0 z-[99999]',
      'flex items-center justify-center',
      'bg-[rgba(5,8,18,0.72)] backdrop-blur-md',
      'transition-opacity duration-200 opacity-0',
    ].join(' ');

    // ── Card ─────────────────────────────────────────────────────────────────
    const card = document.createElement('div');
    card.className = [
      'relative w-full max-w-sm mx-4',
      'bg-[#0d1117]',
      'border border-white/[0.08]',
      'rounded-2xl overflow-hidden',
      'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.6)]',
      'transition-all duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
      'translate-y-3 scale-[0.97] opacity-0',
    ].join(' ');

    // ── Accent bar ────────────────────────────────────────────────────────────
    const accent = document.createElement('div');
    accent.className = `h-[3px] w-full ${v.accent}`;

    // ── Body ─────────────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'p-7';

    // Icon
    const iconWrap = document.createElement('div');
    iconWrap.className = `inline-flex items-center justify-center w-11 h-11 rounded-full mb-5 ${v.iconWrap}`;
    iconWrap.innerHTML = ICONS[variant] ?? ICONS.warning;
    iconWrap.querySelector('svg').classList.add(v.iconStroke);

    // Title
    const titleEl = document.createElement('p');
    titleEl.className = 'text-slate-100 text-[17px] font-bold tracking-tight mb-2';
    titleEl.textContent = title;

    // Message
    const msgEl = document.createElement('p');
    msgEl.className = 'text-slate-400 text-sm leading-relaxed mb-6';
    msgEl.textContent = message;

    // Footer
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-end gap-2.5';

    // Cancel button (optional)
    if (cancelLabel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.dataset.action = 'cancel';
      cancelBtn.className = [
        'px-5 py-2 rounded-lg text-[13.5px] font-medium',
        'bg-white/[0.06] text-slate-400',
        'border border-white/[0.08]',
        'transition-opacity duration-150 hover:opacity-75 active:scale-[0.97]',
      ].join(' ');
      cancelBtn.textContent = cancelLabel;
      footer.appendChild(cancelBtn);
    }

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.dataset.action = 'confirm';
    confirmBtn.className = [
      'px-5 py-2 rounded-lg text-[13.5px] font-medium',
      'transition-opacity duration-150 hover:opacity-85 active:scale-[0.97]',
      v.btn,
    ].join(' ');
    confirmBtn.textContent = confirmLabel;
    footer.appendChild(confirmBtn);

    // ── Assemble ─────────────────────────────────────────────────────────────
    body.append(iconWrap, titleEl, msgEl, footer);
    card.append(accent, body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // ── Animate in ───────────────────────────────────────────────────────────
    requestAnimationFrame(() => {
      overlay.classList.replace('opacity-0', 'opacity-100');
      card.classList.remove('translate-y-3', 'scale-[0.97]', 'opacity-0');
      card.classList.add('translate-y-0', 'scale-100', 'opacity-100');
    });

    // ── Dismiss ───────────────────────────────────────────────────────────────
    const dismiss = (result) => {
      overlay.classList.replace('opacity-100', 'opacity-0');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      resolve(result);
    };

    // Buttons
    card.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'confirm') dismiss(true);
      if (action === 'cancel')  dismiss(false);
    });

    // Backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss(false);
    });

    // Escape key
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKeyDown);
        dismiss(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
  });
}