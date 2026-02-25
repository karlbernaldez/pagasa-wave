import React from 'react';
import { STATUS_CONFIG, STATUS_LABELS } from '../constants';

/**
 * Animated status badge
 * status: backend machine value ('active','pending',...)
 */
export function StatusBadge({ status = 'pending', isDarkMode, size = 'md' }) {

  const machine = status?.toLowerCase?.() || 'pending';

  const cfg =
    STATUS_CONFIG[machine] ??
    STATUS_CONFIG['suspended']; // safe fallback

  const label =
    STATUS_LABELS?.[machine] ??
    machine.charAt(0).toUpperCase() + machine.slice(1);

  const badgeClass = isDarkMode ? cfg.badge : cfg.badgeLight;
  const textSize = 'text-xs';
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${textSize} ${px} ${badgeClass}`}
    >
      {/* Pulsing dot only when active */}
      <span className="relative flex h-1.5 w-1.5">
        {machine === 'active' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`}
        />
      </span>

      {label}
    </span>
  );
}