import React from 'react';
import { STATUS_CONFIG } from '../constants';

// ─── StatusBadge ─────────────────────────────────────────────────────────────

/**
 * Renders an animated status dot + pill label.
 * @param {{ status: string, isDarkMode: boolean, size?: 'sm'|'md' }} props
 */
export function StatusBadge({ status, isDarkMode, size = 'md' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Suspended'];
  const badgeClass = isDarkMode ? cfg.badge : cfg.badgeLight;
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${textSize} ${px} ${badgeClass}`}>
      {/* Pulsing dot — only for Active */}
      <span className="relative flex h-1.5 w-1.5">
        {status === 'Active' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>
      {status}
    </span>
  );
}