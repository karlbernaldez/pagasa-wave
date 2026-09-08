const getPermissionSet = (req) => new Set(req.permissions || []);

const requireAuthenticatedUser = (req, res) => {
  if (req.user) return true;
  res.status(401).json({ message: 'Authentication required.' });
  return false;
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!requireAuthenticatedUser(req, res)) return;

  if (!getPermissionSet(req).has(permission)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  return next();
};

export const requireAnyPermission = (...requiredPermissions) => (req, res, next) => {
  if (!requireAuthenticatedUser(req, res)) return;

  const permissions = getPermissionSet(req);
  if (!requiredPermissions.some((permission) => permissions.has(permission))) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  return next();
};
