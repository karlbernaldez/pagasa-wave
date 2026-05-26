export const allowChatAccess = (req, res, next) => {
  const allowedRoles = new Set(['admin', 'forecaster']);

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!allowedRoles.has(req.user.role)) {
    return res.status(403).json({ message: 'Chat access denied' });
  }

  next();
};
