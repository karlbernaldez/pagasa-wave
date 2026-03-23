// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────
export const normalizeEmail    = (v = '') => v.trim().toLowerCase();
export const normalizeUsername = (v = '') => v.trim().toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// Format validators
// ─────────────────────────────────────────────────────────────────────────────
export const isValidEmail = (email) =>
  /^\S+@\S+\.\S+$/.test(email);

/** Accepts 09xxxxxxxxx or +639xxxxxxxxx */
export const isValidPHMobile = (contact) =>
  /^(\+63|0)9\d{9}$/.test(contact);

// ─────────────────────────────────────────────────────────────────────────────
// Registration payload validator
// Returns { ok: true } or { ok: false, message: string }
// ─────────────────────────────────────────────────────────────────────────────
export const validateRegistrationPayload = ({
  firstName, lastName, username, email, contact,
  password, confirmPassword, address, agency, position, birthday,
}) => {
  const required = {
    firstName, lastName, username, email, contact,
    password, confirmPassword, address, agency, position, birthday,
  };

  const missing = Object.values(required).some((v) => !v);
  if (missing) return fail('All fields are required.');

  if (!isValidEmail(normalizeEmail(email)))
    return fail('Invalid email address.');

  if (!isValidPHMobile(contact.trim()))
    return fail('Invalid contact number. Use 09xxxxxxxxx or +639xxxxxxxxx.');

  if (password !== confirmPassword)
    return fail('Passwords do not match.');

  if (password.length < 8)
    return fail('Password must be at least 8 characters.');

  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────────────────────
const fail = (message) => ({ ok: false, message });