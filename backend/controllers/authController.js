import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ACCESS_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;          // 1 hour
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

const ALLOWED_STATUSES = new Set([
  'Pending Approval',
  'Active',
  'Locked',
  'Suspended',
  'Inactive',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // If your frontend is on a different domain, you will need SameSite: 'None' + secure: true
  sameSite: 'Strict',
  path: '/',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieBaseOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieBaseOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', cookieBaseOptions);
};

const buildAuthPayload = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  role: user.role,
});

const createSession = async ({ refreshToken, userId, jti, req }) => {
  const decodedRefresh = jwt.decode(refreshToken);

  if (!decodedRefresh?.exp) {
    throw new Error('Invalid refresh token payload');
  }

  return Session.create({
    user: userId,
    jti,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent') || '',
    ip: req.ip || '',
    expiresAt: new Date(decodedRefresh.exp * 1000),
    revokedAt: null,
  });
};

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const normalizeUsername = (username) => (username || '').trim().toLowerCase();

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// PH phone: supports 09xxxxxxxxx or +639xxxxxxxxx
const isValidPHMobile = (contact) => /^(\+63|0)9\d{9}$/.test(contact);

const statusMessage = (status) => {
  const messages = {
    'Pending Approval': 'Account pending approval.',
    'Locked': 'Account locked. Contact administrator.',
    'Suspended': 'Account suspended. Contact administrator.',
    'Inactive': 'Account inactive.',
  };
  return messages[status] || 'Account not allowed to login.';
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth: Register
// ─────────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      contact,
      password,
      confirmPassword,
      address,
      agency,
      position,
      birthday,
    } = req.body;

    // Required checks
    if (
      !firstName || !lastName || !username || !email || !contact ||
      !password || !confirmPassword || !address || !agency || !position || !birthday
    ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailNorm = normalizeEmail(email);
    const usernameNorm = normalizeUsername(username);

    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    if (!isValidPHMobile(contact.trim())) {
      return res.status(400).json({ message: 'Invalid contact number. Use 09xxxxxxxxx or +639xxxxxxxxx.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Optional: basic password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Uniqueness checks (use normalized values)
    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ username: usernameNorm }).lean(),
      User.findOne({ email: emailNorm }).lean(),
    ]);

    if (existingUsername) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: usernameNorm,
      email: emailNorm,
      contact: contact.trim(),
      password: hashedPassword,
      address: address.trim(),
      agency: agency.trim(),
      position: position.trim(),
      birthday: new Date(birthday),
      status: 'Pending Approval',
      role: 'user',
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: null,
    });

    await user.save();

    return res
      .status(201)
      .json({ message: 'Account created successfully. Awaiting approval.' });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth: Login + Auto-lock
// ─────────────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
    const password = req.body.password || '';

    if (!emailNorm || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Must select password if your schema uses select:false
    const user = await User.findOne({ email: emailNorm }).select('+password');

    // Keep response generic to reduce account enumeration
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If lock expired, auto-unlock (system lock)
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.lockUntil = null;
      user.failedLoginAttempts = 0;

      // Only auto-restore if it was locked due to attempts
      if (user.status === 'Locked') {
        user.status = 'Active';
      }

      await user.save();
    }

    // Hard lock check (still locked)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: 'Account locked. Try again later.',
        lockUntil: user.lockUntil,
      });
    }

    // Status gate (must be Active)
    if (user.status !== 'Active') {
      return res.status(403).json({ message: statusMessage(user.status) });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.status = 'Locked';
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);

        await user.save();

        return res.status(403).json({
          message: 'Account locked due to multiple failed login attempts.',
          lockUntil: user.lockUntil,
        });
      }

      await user.save();

      // Optional: remove attemptsLeft for public apps.
      return res.status(401).json({
        message: 'Invalid email or password.',
        attemptsLeft: MAX_ATTEMPTS - user.failedLoginAttempts,
      });
    }

    // Success: reset security counters and update lastLogin
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const payload = buildAuthPayload(user);
    const accessToken = generateAccessToken(payload);
    const jti = crypto.randomUUID();
    const refreshToken = generateRefreshToken(payload, { jwtid: jti });

    await createSession({ refreshToken, userId: user._id, jti, req });
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        status: user.status,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth: Refresh token rotation
// ─────────────────────────────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token found.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const { id: userId, jti } = decoded || {};

    if (!userId || !jti) {
      return res.status(403).json({ message: 'Invalid refresh token payload.' });
    }

    const session = await Session.findOne({ user: userId, jti, revokedAt: null });

    if (!session) {
      return res.status(403).json({ message: 'Refresh session not found or revoked.' });
    }

    // token binding check
    if (session.tokenHash !== hashToken(refreshToken)) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(403).json({ message: 'Refresh token mismatch. Session revoked.' });
    }

    // Optional: expiry enforcement (Session schema should enforce anyway)
    if (session.expiresAt && session.expiresAt <= new Date()) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(403).json({ message: 'Refresh session expired.' });
    }

    // Load user (status gate optional; usually OK to require Active)
    const user = await User.findById(userId);

    if (!user) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(403).json({ message: 'User not found.' });
    }

    // If you want, block refresh for non-active accounts:
    if (user.status !== 'Active') {
      session.revokedAt = new Date();
      await session.save();
      clearAuthCookies(res);
      return res.status(403).json({ message: statusMessage(user.status) });
    }

    // Rotate: revoke old session and create new one
    session.revokedAt = new Date();
    await session.save();

    const payload = buildAuthPayload(user);
    const newAccessToken = generateAccessToken(payload);
    const newJti = crypto.randomUUID();
    const newRefreshToken = generateRefreshToken(payload, { jwtid: newJti });

    await createSession({ refreshToken: newRefreshToken, userId: user._id, jti: newJti, req });
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ accessToken: newAccessToken });

  } catch (err) {
    console.error('Error refreshing access token:', err);
    return res.status(403).json({ message: 'Failed to refresh token.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth: Logout
// ─────────────────────────────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (decoded?.id && decoded?.jti) {
          await Session.updateOne(
            { user: decoded.id, jti: decoded.jti, revokedAt: null },
            { $set: { revokedAt: new Date() } }
          );
        }
      } catch (error) {
        console.warn('Failed to verify refresh token during logout:', error.message);
      }
    }

    clearAuthCookies(res);

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Failed to log out.' });
  }
};