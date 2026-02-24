import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';

const ACCESS_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
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
  });
};


export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, contact, password, confirmPassword, address, agency, position, birthday } = req.body;

    // Check if all required fields are present
    if (
      !firstName || !lastName || !username || !email || !contact ||
      !password || !confirmPassword || !address || !agency || !position || !birthday
    ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate email format using a regex
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    // Validate contact number (ensure it’s a Philippine number)
    if (!/^(?:\+63|0)(9\d{9}|2\d{7,8}|[3-9]\d{7})$/.test(contact)) {
      return res.status(400).json({ message: 'Invalid contact number.' });
    }

    // Ensure passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check if the username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Check if the email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      contact,
      password: hashedPassword,
      address,
      agency,
      position,
      birthday,
      status: 'Pending Approval', // Set default status
      role: 'user', // Default role, can be updated later
    });

    // Save the user to the database
    await user.save();

    // Return success message
    return res.status(201).json({ message: 'Account created successfully. Awaiting approval.' });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved yet. Please wait for approval.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    // Update last login timestamp and set status to active
    user.lastLogin = new Date();
    user.status = 'Active';  // Set status to active on successful login
    await user.save();

    const payload = buildAuthPayload(user);
    const accessToken = generateAccessToken(payload);
    const jti = crypto.randomUUID();
    const refreshToken = generateRefreshToken(payload, { jwtid: jti });

    await createSession({ refreshToken, userId: user._id, jti, req });

    setAuthCookies(res, accessToken, refreshToken);

    // Send response with the access token, refresh token, and user details
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // Include role in the response
        lastLogin: user.lastLogin,  // Include lastLogin in the response
        status: user.status,  // Include status in the response
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // If no refresh token is found in the cookies, return an error
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token found.' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id: userId, jti } = decoded;

    if (!userId || !jti) {
      return res.status(403).json({ message: 'Invalid refresh token payload.' });
    }

    const session = await Session.findOne({ user: userId, jti, revokedAt: null });
    if (!session) {
      return res.status(403).json({ message: 'Refresh session not found or revoked.' });
    }

    if (session.tokenHash !== hashToken(refreshToken)) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(403).json({ message: 'Refresh token mismatch. Session revoked.' });
    }

    // Find the user using the decoded token data
    const user = await User.findById(userId);
    if (!user) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(403).json({ message: 'User not found.' });
    }

    // Generate a new access token
    session.revokedAt = new Date();
    await session.save();

    const payload = buildAuthPayload(user);
    const newAccessToken = generateAccessToken(payload);
    const newJti = crypto.randomUUID();
    const newRefreshToken = generateRefreshToken(payload, { jwtid: newJti });

    // Send the new access token in the response body (optional)
    await createSession({ refreshToken: newRefreshToken, userId: user._id, jti: newJti, req });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ accessToken: newAccessToken });

  } catch (err) {
    console.error('Error refreshing access token:', err);
    return res.status(403).json({ message: 'Failed to refresh token.' });
  }
};

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

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Failed to log out.' });
  }
};
