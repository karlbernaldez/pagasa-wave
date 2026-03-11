import crypto from 'crypto';

import { STATUS_MESSAGES }                                from '#controllers/auth/constants/auth';
import { setAuthCookies }                                 from '#controllers/auth/utils/cookies';
import { buildAuthPayload, createSession }                from '#controllers/auth/utils/session';
import { generateAccessToken, generateRefreshToken }      from '#controllers/auth/utils/jwtUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Status gate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the appropriate error message when an account is not active,
 * or null if the account is allowed to proceed.
 */
export const getStatusError = (status) =>
  status !== 'active'
    ? (STATUS_MESSAGES[status] ?? 'Account not allowed to login.')
    : null;

// ─────────────────────────────────────────────────────────────────────────────
// Token issuance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a fresh access + refresh token pair, persists the session,
 * and writes both tokens to httpOnly cookies.
 *
 * @returns {{ accessToken: string, refreshToken: string, jti: string }}
 */
export const issueTokens = async (user, req, res) => {
  const payload      = buildAuthPayload(user);
  const accessToken  = generateAccessToken(payload);
  const jti          = crypto.randomUUID();
  const refreshToken = generateRefreshToken(payload, { jwtid: jti });

  await createSession({ refreshToken, userId: user._id, jti, req });
  setAuthCookies(res, accessToken, refreshToken);

  return { accessToken, refreshToken, jti };
};