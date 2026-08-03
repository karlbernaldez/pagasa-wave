import { ACCESS_COOKIE_MAX_AGE_MS, REFRESH_COOKIE_MAX_AGE_MS } from '../constants/auth.js';

const secure = process.env.NODE_ENV === 'production' ? true : process.env.COOKIE_SECURE === 'true';

const sameSite = String(process.env.COOKIE_SAME_SITE || 'strict').toLowerCase();

if (!['strict', 'lax', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none.');
}

if (sameSite === 'none' && !secure) {
  throw new Error('COOKIE_SAME_SITE=none requires secure cookies.');
}

const baseOptions = {
  httpOnly: true,
  secure,
  sameSite,
  path: '/',
};

export const setAccessCookie = (res, accessToken) => {
  res.cookie('accessToken', accessToken, { ...baseOptions, maxAge: ACCESS_COOKIE_MAX_AGE_MS });
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  setAccessCookie(res, accessToken);
  res.cookie('refreshToken', refreshToken, { ...baseOptions, maxAge: REFRESH_COOKIE_MAX_AGE_MS });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', baseOptions);
};
