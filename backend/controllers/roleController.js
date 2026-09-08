import AuditLog from '../models/AuditLog.js';
import {
  createRole,
  deleteRole,
  getPermissionCatalog,
  listRoles,
  updateRole,
} from '../services/roleService.js';

const actorId = (req) => req.user?._id ?? req.user?.id ?? null;

const writeAudit = async (req, action, details) => {
  try {
    await AuditLog.create({
      user: actorId(req),
      action,
      resourceType: 'Role',
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch {
    // Audit logging must not turn an otherwise successful authorization change into a 500 response.
  }
};

export const getRoleCatalog = async (_req, res, next) => {
  try {
    res.status(200).json({ success: true, ...getPermissionCatalog() });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (_req, res, next) => {
  try {
    const roles = await listRoles();
    res.status(200).json({ success: true, roles });
  } catch (error) {
    next(error);
  }
};

export const addRole = async (req, res, next) => {
  try {
    const role = await createRole(req.body || {});
    await writeAudit(req, 'role.create', { key: role.key, permissions: role.permissions });
    res.status(201).json({ success: true, role });
  } catch (error) {
    next(error);
  }
};

export const editRole = async (req, res, next) => {
  try {
    const role = await updateRole(req.params.key, req.body || {});
    await writeAudit(req, 'role.update', {
      key: role.key,
      enabled: role.enabled,
      permissions: role.permissions,
    });
    res.status(200).json({ success: true, role });
  } catch (error) {
    next(error);
  }
};

export const removeRole = async (req, res, next) => {
  try {
    const result = await deleteRole(req.params.key);
    await writeAudit(req, 'role.delete', result);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
