import {
  ACCESS_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_MAX_AGE_MS,
} from '../constants/auth.js';

// ─────────────────────────────────────────────────────────────────────────────
// Base options shared by both cookies
// ─────────────────────────────────────────────────────────────────────────────
const baseOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  // Use 'None' + secure:true if the frontend lives on a different origin
  sameSite: 'Strict',
  path:     '/',
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken',  accessToken,  { ...baseOptions, maxAge: ACCESS_COOKIE_MAX_AGE_MS  });
  res.cookie('refreshToken', refreshToken, { ...baseOptions, maxAge: REFRESH_COOKIE_MAX_AGE_MS });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken',  baseOptions);
  res.clearCookie('refreshToken', baseOptions);
};