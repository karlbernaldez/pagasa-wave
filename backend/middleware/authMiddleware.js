import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Assuming you have a User model to store refresh tokens
import { generateAccessToken } from '../utils/jwtUtils.js'; // Helper to generate new access tokens

// Middleware to protect routes
const protect = async (req, res, next) => {
  const token = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Try to verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    return next();
  } catch (err) {
    console.log(err)
    // If token is expired, attempt to refresh it using the refresh token
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        // Verify the refresh token
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Find the user based on the refresh token
        const user = await User.findById(decodedRefreshToken.id);

        if (!user || user.refreshToken !== refreshToken) {
          return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({ id: user._id, email: user.email });

        // Attach new access token to response headers (or body if preferred)
        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        req.user = { id: user._id, email: user.email }; // Attach user info to request

        // Proceed with the next middleware or route handler
        return next();
      } catch (refreshErr) {
        console.error('[ERROR] Refresh token error:', refreshErr);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }
    } else {
      // If error isn't token expiration, return the default error
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  }
}; 

export default protect;
