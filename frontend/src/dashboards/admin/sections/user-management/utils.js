// ─── Utility Helpers ────────────────────────────────────────────────────────

/** Returns the full display name for a user object. */
export const fullName = (user) => `${user.firstName} ${user.lastName}`.trim();

/** Returns avatar initials (up to 2 chars) from a user object. */
export const getInitials = (user) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

/** Builds a default blank user form object. */
export const defaultNewUser = () => ({
  firstName: '',
  lastName: '',
  email: '',
  contact: '',
  agency: '',
  position: '',
  role: 'Forecaster',
  status: 'Pending',
  memberSince: new Date().toISOString().slice(0, 10),
});

/** Deterministically picks one of several Tailwind gradient combos based on a string key. */
export const avatarGradient = (name) => {
  const gradients = [
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-indigo-600',
  ];
  const idx = (name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % gradients.length;
  return gradients[idx];
};

/** Clamps text to N characters with ellipsis. */
export const truncate = (str, n = 28) =>
  str && str.length > n ? `${str.slice(0, n)}…` : str;

export const getStatusBadgeClasses = (status, isDarkMode) => {
  if (status === 'Active')
    return isDarkMode
      ? 'bg-emerald-900/40 text-emerald-300'
      : 'bg-emerald-100 text-emerald-700';

  if (status === 'Pending')
    return isDarkMode
      ? 'bg-amber-900/40 text-amber-300'
      : 'bg-amber-100 text-amber-700';

  return isDarkMode
    ? 'bg-red-900/40 text-red-300'
    : 'bg-red-100 text-red-700';
};
