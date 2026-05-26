export const requireInternalChatAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!['admin', 'forecaster'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Internal chat access denied' });
  }

  next();
};
