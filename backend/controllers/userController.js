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

export const getAllUsers = async (req, res) => {
  try {
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
      activatedBy: isActive ? req.user?._id : null,
    });

    const { password: _, ...safeUser } = user.toObject();

    return res.status(201).json({
      message: 'User created successfully',
      user: safeUser,
      defaultPassword: rawPassword,
    });
  } catch (err) {
    console.error('[createUserByAdmin]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error creating user' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    const actor = req.user;

    if (!actor) return res.status(401).json({ message: 'Unauthorized' });

    const isOwner = actor._id.toString() === userId;
    const isAdmin = actor.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(userId).select('+password +sessionVersion');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verifiedPasswordHash = user.password;
    const match = await bcrypt.compare(currentPassword, verifiedPasswordHash);
    if (!match) return res.status(400).json({ message: 'Incorrect current password.' });

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await User.findOneAndUpdate(
      {
        _id: userId,
        password: verifiedPasswordHash,
        deletedAt: null,
      },
      {
        $set: { password: hashedPassword },
        $unset: {
          pendingEmail: '',
          pendingEmailVerificationToken: '',
          pendingEmailVerificationExpires: '',
          pendingEmailRequestedAt: '',
        },
      },
      { new: true }
    ).select('+sessionVersion');

    if (!updated) {
      return res.status(409).json({
        message: 'Password changed concurrently. Please retry with the current password.',
      });
    }

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[changePassword]', err);
    return res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const actor = req.user;

    if (!actor) return res.status(401).json({ message: 'Unauthorized' });

    const isOwner = actor._id.toString() === userId;
    const isAdmin = actor.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowedFields = isAdmin && !isOwner ? ADMIN_FIELDS : OWNER_FIELDS;
    const updates = Object.fromEntries(
      allowedFields.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]])
    );

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No permitted fields provided' });
    }

    if (updates.username !== undefined) {
      updates.username = String(updates.username).trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(updates.username)) {
        return res.status(400).json({
          message:
            'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens',
        });
      }
    }

    if (updates.email !== undefined) {
      updates.email = String(updates.email).trim().toLowerCase();
    }

    if (updates.avatarUrl !== undefined && updates.avatarUrl !== null) {
      const avatarUrl = String(updates.avatarUrl).trim();
      const isSupportedAvatar = /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(
        avatarUrl
      );
      if (!isSupportedAvatar || avatarUrl.length > 1000000) {
        return res.status(400).json({
          message: 'Avatar must be a supported image URL or an image smaller than 750 KB',
        });
      }
      updates.avatarUrl = avatarUrl;
    }

    if (updates.email || updates.username) {
      const conflict = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(updates.email ? [{ email: updates.email }, { pendingEmail: updates.email }] : []),
          ...(updates.username ? [{ username: updates.username }] : []),
        ],
      }).lean();

      if (conflict) {
        return res.status(409).json({ message: 'Email or username already in use' });
      }
    }

    let currentEmail = null;
    let emailChanged = false;

    if (updates.email !== undefined) {
      const currentUser = await User.findById(userId).select('email').lean();
      if (!currentUser) return res.status(404).json({ message: 'User not found' });

      currentEmail = currentUser.email;
      emailChanged = updates.email !== currentEmail;
    }

    if (updates.role !== undefined || emailChanged) {
      const updateDocument = { $set: { ...updates } };
      const filter = { _id: userId, deletedAt: null };

      if (emailChanged) {
        filter.email = currentEmail;
        updateDocument.$set.emailVerified = false;
        updateDocument.$unset = {
          emailVerificationToken: '',
          emailVerificationExpires: '',
          pendingEmail: '',
          pendingEmailVerificationToken: '',
          pendingEmailVerificationExpires: '',
          pendingEmailRequestedAt: '',
          passwordResetToken: '',
          passwordResetExpires: '',
        };
        updateDocument.$inc = { sessionVersion: 1 };
      }

      const user = await User.findOneAndUpdate(filter, updateDocument, {
        new: true,
        runValidators: true,
      }).select('+sessionVersion');

      if (!user) {
        if (emailChanged) {
          return res.status(409).json({
            message: 'Email changed concurrently. Reload the account and try again.',
          });
        }
        return res.status(404).json({ message: 'User not found' });
      }

      const safeUser = user.toObject();
      delete safeUser.password;
      delete safeUser.sessionVersion;

      return res.status(200).json(safeUser);
    }

    const user = await User.findById(userId).select('+sessionVersion');
    if (!user) return res.status(404).json({ message: 'User not found' });

    for (const [field, value] of Object.entries(updates)) {
      user.set(field, value);
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.sessionVersion;

    return res.status(200).json(safeUser);
  } catch (err) {
    console.error('[updateUserDetails]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const currentUser = await User.findById(userId).select('status activatedAt').lean();
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const previousStatus = currentUser.status;
    const update = { status };

    if (status === 'active' && !currentUser.activatedAt) {
      update.activatedAt = new Date();
      update.activatedBy = req.user._id;
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $set: update },
      { new: true, runValidators: true }
    ).select('+sessionVersion');

    if (!user) return res.status(404).json({ message: 'User not found' });

    sendUserUpdateEmail(user.email, user.firstName, [
      { field: 'Status', from: previousStatus, to: status },
    ]).catch((err) => console.warn('[updateUserStatus] Email notification failed:', err.message));

    return res.status(200).json({ message: 'Status updated successfully', user });
  } catch (err) {
    console.error('[updateUserStatus]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error updating status' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};
