import Role from '../models/Role.js';
import User from '../models/User.js';
import {
  DEFAULT_ROLE_DEFINITIONS,
  PERMISSION_CATALOG,
  PERMISSION_KEYS,
  normalizePermissionKeys,
} from '../config/permissionCatalog.js';

const ROLE_KEY_RE = /^[a-z][a-z0-9_-]{1,31}$/;

const normalizeRoleKey = (value) => String(value || '').trim().toLowerCase();

const assertRoleKey = (value) => {
  const key = normalizeRoleKey(value);
  if (!ROLE_KEY_RE.test(key)) {
    const error = new Error(
      'Role key must be 2-32 characters, begin with a letter, and use lowercase letters, numbers, underscores, or hyphens.'
    );
    error.status = 400;
    throw error;
  }
  return key;
};

const serializeRole = async (role) => {
  const memberCount = await User.countDocuments({ role: role.key, deletedAt: null });
  return {
    id: role._id,
    key: role.key,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    system: role.system,
    enabled: role.enabled,
    memberCount,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

export const ensureDefaultRoles = async () => {
  await Promise.all(
    DEFAULT_ROLE_DEFINITIONS.map(({ key, ...defaults }) => {
      const update = {
        $setOnInsert: { key, ...defaults },
      };

      if (key === 'admin') {
        update.$set = {
          permissions: [...PERMISSION_KEYS],
          system: true,
          enabled: true,
        };
      }

      return Role.updateOne({ key }, update, { upsert: true, runValidators: true });
    })
  );
};

export const getPermissionCatalog = () => ({
  catalog: PERMISSION_CATALOG,
  permissions: PERMISSION_KEYS,
});

export const listRoles = async () => {
  await ensureDefaultRoles();
  const roles = await Role.find({}).sort({ system: -1, name: 1 }).lean();
  return Promise.all(roles.map(serializeRole));
};

export const getRoleByKey = async (rawKey, { requireEnabled = false } = {}) => {
  await ensureDefaultRoles();
  const key = assertRoleKey(rawKey);
  const role = await Role.findOne({ key }).lean();
  if (!role) {
    const error = new Error(`User type ${key} was not found.`);
    error.status = 404;
    throw error;
  }
  if (requireEnabled && !role.enabled) {
    const error = new Error(`User type ${key} is disabled.`);
    error.status = 409;
    throw error;
  }
  return role;
};

export const assertRoleAssignable = async (rawKey) => getRoleByKey(rawKey, { requireEnabled: true });

export const resolvePermissionsForRole = async (rawKey) => {
  try {
    const role = await getRoleByKey(rawKey, { requireEnabled: true });
    return role.permissions || [];
  } catch (error) {
    if (error.status === 404 || error.status === 409) return [];
    throw error;
  }
};

export const createRole = async ({ key: rawKey, name, description = '', permissions = [] }) => {
  const key = assertRoleKey(rawKey);
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    const error = new Error('User type name is required.');
    error.status = 400;
    throw error;
  }

  try {
    const role = await Role.create({
      key,
      name: cleanName,
      description: String(description || '').trim(),
      permissions: normalizePermissionKeys(permissions),
      system: false,
      enabled: true,
    });
    return serializeRole(role.toObject());
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = new Error(`User type ${key} already exists.`);
      duplicate.status = 409;
      throw duplicate;
    }
    throw error;
  }
};

export const updateRole = async (rawKey, updates = {}) => {
  const key = assertRoleKey(rawKey);
  const role = await Role.findOne({ key });
  if (!role) {
    const error = new Error(`User type ${key} was not found.`);
    error.status = 404;
    throw error;
  }

  if (updates.key !== undefined && normalizeRoleKey(updates.key) !== key) {
    const error = new Error('User type keys cannot be renamed. Create a new user type instead.');
    error.status = 409;
    throw error;
  }

  if (updates.name !== undefined) {
    const cleanName = String(updates.name || '').trim();
    if (!cleanName) {
      const error = new Error('User type name is required.');
      error.status = 400;
      throw error;
    }
    role.name = cleanName;
  }

  if (updates.description !== undefined) {
    role.description = String(updates.description || '').trim();
  }

  if (updates.permissions !== undefined) {
    if (role.key === 'admin') {
      const error = new Error('Administrator permissions are protected to prevent system lockout.');
      error.status = 409;
      throw error;
    }
    role.permissions = normalizePermissionKeys(updates.permissions);
  }

  if (updates.enabled !== undefined) {
    if (typeof updates.enabled !== 'boolean') {
      const error = new Error('enabled must be a boolean.');
      error.status = 400;
      throw error;
    }
    if (role.key === 'admin' && updates.enabled === false) {
      const error = new Error('Administrator user type cannot be disabled.');
      error.status = 409;
      throw error;
    }
    if (updates.enabled === false) {
      const memberCount = await User.countDocuments({ role: key, deletedAt: null });
      if (memberCount > 0) {
        const error = new Error(
          `User type ${key} cannot be disabled while ${memberCount} user${memberCount === 1 ? '' : 's'} are assigned to it.`
        );
        error.status = 409;
        throw error;
      }
    }
    role.enabled = updates.enabled;
  }

  const permissionsChanged = role.isModified('permissions');
  await role.save();

  if (permissionsChanged) {
    await User.updateMany({ role: key, deletedAt: null }, { $inc: { sessionVersion: 1 } });
  }

  return serializeRole(role.toObject());
};

export const deleteRole = async (rawKey) => {
  const key = assertRoleKey(rawKey);
  const role = await Role.findOne({ key }).lean();
  if (!role) {
    const error = new Error(`User type ${key} was not found.`);
    error.status = 404;
    throw error;
  }
  if (role.system) {
    const error = new Error('Built-in user types cannot be deleted.');
    error.status = 409;
    throw error;
  }

  const memberCount = await User.countDocuments({ role: key, deletedAt: null });
  if (memberCount > 0) {
    const error = new Error(
      `User type ${key} cannot be deleted while ${memberCount} user${memberCount === 1 ? '' : 's'} are assigned to it.`
    );
    error.status = 409;
    throw error;
  }

  await Role.deleteOne({ _id: role._id });
  return { key };
};
