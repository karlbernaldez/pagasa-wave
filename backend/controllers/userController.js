import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendUserUpdateEmail } from '#services/email/sendUserUpdateEmail';

const SALT_ROUNDS = 10;
const PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_LIMIT = 5;

const ALLOWED_STATUSES = ['pending', 'active', 'locked', 'suspended', 'inactive'];
const OWNER_FIELDS = [
  'username',
  'firstName',
  'lastName',
  'contact',
  'address',
  'birthday',
  'agency',
  'position',
  'avatarUrl',
];
const ADMIN_FIELDS = [...OWNER_FIELDS, 'email', 'role'];

const LIST_FIELDS =
  'username firstName lastName contact email agency role position status avatarUrl lastLogin activatedAt createdAt';
const DETAIL_FIELDS =
  'username firstName lastName birthday address agency position email pendingEmail pendingEmailVerificationExpires contact role status avatarUrl createdAt lastLogin activatedAt';

const clampInt = (value, min, max, fallback) => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const snapToPageOption = (limit) =>
  PAGE_OPTIONS.includes(limit)
    ? limit
    : PAGE_OPTIONS.reduce((best, cur) =>
        Math.abs(cur - limit) < Math.abs(best - limit) ? cur : best
      );

const generateDefaultPassword = (username) =>
  `${username}@${Math.floor(1000 + Math.random() * 9000)}`;

const formatUser = (u) => ({
  id: u._id.toString(),
  username: u.username,
  firstName: u.firstName,
  lastName: u.lastName,
  contact: u.contact,
  email: u.email,
  agency: u.agency,
  role: u.role,
  position: u.position,
  status: u.status,
  avatarUrl: u.avatarUrl ?? null,
  activatedAt: u.activatedAt,
  lastLogin: u.lastLogin,
  createdAt: u.createdAt,
});

const formatAnalyticsUser = (u) => ({
  id: u._id.toString(),
  role: u.role,
  status: u.status,
});

const buildUserFilter = ({ search, status, role } = {}) => {
  const filter = {};

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ username: regex }, { firstName: regex }, { lastName: regex }, { email: regex }];
  }

  if (status) filter.status = status;
  if (role) filter.role = role;

  return filter;
};

const hasPermission = (req, permission) =>
  (req.authorizedPermissions || []).includes(permission) ||
  (req.permissions || []).includes(permission);

export const getAllUsers = async (req, res) => {
  try {
    const analyticsOnly =
      hasPermission(req, 'analytics_users.view') && !hasPermission(req, 'users.view');

    if (analyticsOnly) {
      const users = await User.find({ deletedAt: null })
        .select('_id role status')
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      return res.status(200).json({
        data: users.map(formatAnalyticsUser),
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1,
      });
    }

    const page = clampInt(req.query.page, 1, Number.MAX_SAFE_INTEGER, 1);
    const limit = snapToPageOption(clampInt(req.query.limit, 5, 50, DEFAULT_LIMIT));
    const filter = buildUserFilter(req.query);

    const total = await User.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const users = await User.find(filter)
      .select(LIST_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      data: users.map(formatUser),
      total,
      page: safePage,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error('[getAllUsers]', err);
    return res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(DETAIL_FIELDS).lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { _id, ...rest } = user;
    return res.status(200).json({ id: _id.toString(), ...rest });
  } catch (err) {
    console.error('[getUserDetails]', err);
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const {
      username,
      firstName,
      lastName,
      birthday,
      address,
      agency,
      position,
      email,
      contact,
      role,
      status,
    } = req.body;

    const missing = [
      'username',
      'firstName',
      'lastName',
      'birthday',
      'address',
      'agency',
      'position',
      'email',
      'contact',
    ].filter((f) => !req.body[f]);

    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const exists = await User.findOne({
      $or: [{ email }, { pendingEmail: email }, { username }],
    }).lean();
    if (exists) {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }

    const safeStatus = ALLOWED_STATUSES.includes(status) ? status : 'active';
    const rawPassword = generateDefaultPassword(username);
    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const isActive = safeStatus === 'active';

    const user = await User.create({
      username,
      firstName,
      lastName,
      birthday,
      address,
      agency,
      position,
      email,
      contact,
      role: role || 'user',
      status: safeStatus,
      password: hashedPassword,
      activatedAt: isActive ? new Date() : null,
      emailVerified: true,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: formatUser(user),
      defaultPassword: rawPassword,
    });
  } catch (err) {
    console.error('[createUserByAdmin]', err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }
    return res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

export const getUserDetailsForOwner = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(DETAIL_FIELDS).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userId = String(user._id);
    const currentUserId = String(req.user?._id || req.user?.id || '');
    const isOwner = userId === currentUserId;

    if (!isOwner && !hasPermission(req, 'users.view')) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const fields = isOwner ? OWNER_FIELDS : ADMIN_FIELDS;
    const result = { id: userId };
    for (const field of fields) result[field] = user[field];

    return res.status(200).json(result);
  } catch (err) {
    console.error('[getUserDetailsForOwner]', err);
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userId = String(user._id);
    const currentUserId = String(req.user?._id || req.user?.id || '');
    const isOwner = userId === currentUserId;
    const allowed = new Set(isOwner ? OWNER_FIELDS : ADMIN_FIELDS);

    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (allowed.has(key)) user[key] = value;
    });

    await user.save();
    await sendUserUpdateEmail(user, { changedByAdmin: !isOwner });

    return res.status(200).json(formatUser(user));
  } catch (err) {
    console.error('[updateUserDetails]', err);
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid user status' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    if (status === 'active' && !user.activatedAt) {
      user.activatedAt = new Date();
      user.activatedBy = req.user?._id || req.user?.id || null;
    }

    await user.save();

    return res.status(200).json({
      message: 'User status updated successfully',
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[updateUserStatus]', err);
    return res.status(500).json({ message: 'Error updating user status', error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.deletedAt = new Date();
    user.status = 'inactive';
    await user.save();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.params.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[changePassword]', err);
    return res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};
