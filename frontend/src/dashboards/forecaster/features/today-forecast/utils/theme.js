// ─── Color tokens ────────────────────────────────────────────────────────────
export const bg         = (dark) => dark ? 'bg-[#020c1b]'  : 'bg-[#f3f6fa]';
export const card       = (dark) => dark ? 'bg-[#061529] border border-[#0d2348] rounded-xl' : 'bg-white border border-gray-200 rounded-xl';
export const cardInner  = (dark) => dark ? 'bg-[#0a1e38]'  : 'bg-gray-50';

// ─── Text ─────────────────────────────────────────────────────────────────────
export const textPrimary   = (dark) => dark ? 'text-[#f1f5f9]' : 'text-gray-900';
export const textSecondary = (dark) => dark ? 'text-[#64748b]'  : 'text-gray-500';
export const textMuted     = (dark) => dark ? 'text-[#475569]'  : 'text-gray-400';

// ─── Structural ───────────────────────────────────────────────────────────────
export const divider   = (dark) => dark ? 'border-[#0d2348]' : 'border-gray-200';
export const iconBox   = (dark) => dark ? 'bg-[#0d2348]'     : 'bg-blue-50';
export const rowHover  = (dark) => dark ? 'hover:bg-white/[0.025]' : 'hover:bg-gray-50';
export const trackBg   = (dark) => dark ? 'bg-[#0d2348]'     : 'bg-gray-200';

// ─── Typography ───────────────────────────────────────────────────────────────
export const heading = (dark) =>
  `text-[10px] font-bold tracking-[0.1em] uppercase ${textMuted(dark)}`;