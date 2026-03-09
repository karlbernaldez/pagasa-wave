// ─────────────────────────────────────────────────────────────────────────────
// Token / Cookie TTLs
// ─────────────────────────────────────────────────────────────────────────────
export const ACCESS_COOKIE_MAX_AGE_MS  = 60 * 60 * 1000;           // 1 hour
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days

// ─────────────────────────────────────────────────────────────────────────────
// Brute-force protection
// ─────────────────────────────────────────────────────────────────────────────
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS    = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Account status → human-readable messages
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_MESSAGES = Object.freeze({
  pending:   'Account pending approval.',
  locked:    'Account locked. Contact administrator.',
  suspended: 'Account suspended. Contact administrator.',
  inactive:  'Account inactive.',
});