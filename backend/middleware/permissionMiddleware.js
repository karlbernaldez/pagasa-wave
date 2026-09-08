const getPermissionSet = (req) => new Set(req.permissions || []);

const requireAuthenticatedUser = (req, res) => {
  if (req.user) return true;
  res.status(401).json({ message: 'Authentication required.' });
  return false;
};

const markAuthorizedPermission = (req, permission) => {
  if (!Array.isArray(req.authorizedPermissions)) req.authorizedPermissions = [];
  if (!req.authorizedPermissions.includes(permission)) req.authorizedPermissions.push(permission);
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!requireAuthenticatedUser(req, res)) return;

  if (!getPermissionSet(req).has(permission)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  markAuthorizedPermission(req, permission);
  return next();
};

export const requireAnyPermission = (...requiredPermissions) => (req, res, next) => {
  if (!requireAuthenticatedUser(req, res)) return;

  const permissions = getPermissionSet(req);
  const authorizedPermission = requiredPermissions.find((permission) => permissions.has(permission));
  if (!authorizedPermission) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  markAuthorizedPermission(req, authorizedPermission);
  return next();
};
