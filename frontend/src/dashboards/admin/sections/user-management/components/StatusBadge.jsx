import React, { memo, useMemo } from 'react';
import { STATUS_CONFIG, STATUS_LABELS } from '../constants';

/**
 * StatusBadge
 * status: backend machine value ('active','pending','suspended',...)
 * size: 'sm' | 'md' | 'lg'
 */
function StatusBadgeComponent({
  status = 'pending',
  isDarkMode = true,
  size = 'md',
}) {

  // normalize safely
  const machine = useMemo(() => {
    if (!status) return 'pending';
    return String(status).toLowerCase().trim();
  }, [status]);

  // resolve config safely
  const cfg = useMemo(() => {
    return STATUS_CONFIG[machine] ?? STATUS_CONFIG.pending ?? STATUS_CONFIG.suspended;
  }, [machine]);

  // resolve label
  const label = useMemo(() => {
    if (STATUS_LABELS?.[machine]) return STATUS_LABELS[machine];
    return machine.charAt(0).toUpperCase() + machine.slice(1);
  }, [machine]);

  // size classes
  const sizeClass = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'text-[11px] px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      default:
        return 'text-xs px-2.5 py-1';
    }
  }, [size]);

  const badgeClass = isDarkMode ? cfg.badge : cfg.badgeLight;

  return (
    <span
      role="status"
      aria-label={`User status: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${badgeClass}`}
    >
      {/* dot */}
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

export const StatusBadge = memo(StatusBadgeComponent);