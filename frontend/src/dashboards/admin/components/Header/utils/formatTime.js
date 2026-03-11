/**
 * Converts an ISO date string into a human-readable relative time label.
 * @param {string | null | undefined} dateStr
 * @returns {string}  e.g. "just now", "5m ago", "3h ago", "2d ago"
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (mins <  1)  return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};