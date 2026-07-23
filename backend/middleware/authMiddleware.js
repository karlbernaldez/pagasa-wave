import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const ACCESS_TOKEN_ALGORITHMS = ['HS512'];
const AUTH_USER_FIELDS = '_id role status email username firstName lastName passwordChangedAt deletedAt +sessionVersion';

const tokenWasIssuedBeforePasswordChange = (decoded, passwordChangedAt) => {
  if (!decoded?.iat || !passwordChangedAt) return false;
  return decoded.iat * 1000 < new Date(passwordChangedAt).getTime();
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ACCESS_TOKEN_ALGORITHMS,
  clockTolerance: 5,
});

export const authenticate = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded?.id) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    const user = await User.findOne({
      _id: decoded.id,
      deletedAt: null,
    }).select(AUTH_USER_FIELDS);

    if (!user) {
      return res.status(401).json({ message: 'Authentication session is no longer valid.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active.' });
    }

    if (tokenWasIssuedBeforePasswordChange(decoded, user.passwordChangedAt)) {
      return res.status(401).json({ message: 'Authentication session expired after password change.' });
    }

    if ((decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      return res.status(401).json({ message: 'Authentication session has been revoked.' });
    }

    req.auth = {
      tokenId: decoded.jti ?? null,
      issuedAt: decoded.iat ?? null,
      expiresAt: decoded.exp ?? null,
      sessionVersion: decoded.sessionVersion ?? 0,
    };
    req.user = user;

    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token has expired.' });
    }

    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

export default authenticate;
