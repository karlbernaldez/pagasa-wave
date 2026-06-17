import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('id role status email username');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export default protect;
