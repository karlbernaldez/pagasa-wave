const getAuthenticatedUserId = (req) => String(req.user?._id ?? req.user?.id ?? '');

export const requireRole = (...allowedRoles) => {
  const roles = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.has(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    return next();
  };
};

export const isAdmin = requireRole('admin');

export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const requestedUserId = String(req.params.userId ?? '');
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (req.user.role !== 'admin' && authenticatedUserId !== requestedUserId) {
    return res.status(403).json({ message: 'You can only access your own account.' });
  }

  return next();
};

export const isOwnerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const requestedUserId = String(req.params.userId ?? '');
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (authenticatedUserId !== requestedUserId) {
    return res.status(403).json({ message: 'You can only access your own account.' });
  }

  return next();
};
