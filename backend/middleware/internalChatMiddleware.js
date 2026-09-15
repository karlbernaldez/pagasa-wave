export const requireInternalChatAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!(req.permissions || []).includes('chat.use_internal')) {
    return res.status(403).json({ message: 'Internal chat access denied' });
  }

  next();
};
