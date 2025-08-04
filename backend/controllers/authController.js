import bcrypt from 'bcryptjs';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';

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

    // Create payload including the user role
    const payload = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role, // Assuming `role` is a field in the User model
    };

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    console.log('Refresh Token:', refreshToken);

    // Save the refresh token to the user model
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HttpOnly cookie
    res.setHeader('Set-Cookie', cookie.serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // Set to true in production
      maxAge: 60 * 60 * 24 * 7,  // 7 days
      path: '/',
      sameSite: 'None',  // Required for cross-origin requests
    }));

    // Send response with the access token, refresh token, and user details
    res.status(200).json({
      accessToken,
      refreshToken,
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
  const refreshToken = req.cookies.refreshToken; // Get refresh token from cookies

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token found.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken({ id: user._id, email: user.email });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Error refreshing access token:', err);
    return res.status(403).json({ message: 'Failed to refresh token.' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Failed to log out.' });
  }
};

