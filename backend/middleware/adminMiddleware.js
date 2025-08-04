import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Make sure the User model is correctly imported

// Middleware to verify token and check if user is admin
export const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret here

    // Find user by decoded ID and check their role
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    // Add user to the request object for further use (optional)
    req.user = user;

    // Proceed to the next middleware/handler
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};

export const isOwnerOrAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  const { userId } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by decoded ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin OR if the user is requesting their own data
    if (user.role === 'admin' || decoded.id === userId) {
      req.user = user;
      next();
    } else {
      return res.status(403).json({ message: 'Access denied: You can only access your own data' });
    }

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};

// Alternative: Middleware that ONLY checks if user is accessing their own data (no admin bypass)
export const isOwnerOnly = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { userId } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only allow if the token ID matches the requested user ID
    if (decoded.id !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only access your own data' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};