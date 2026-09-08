export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const permissions = new Set(req.permissions || []);
  if (!permissions.has(permission)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  return next();
};
