import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SALT_ROUNDS     = 10;
const PAGE_OPTIONS    = [5, 10, 25, 50];
const DEFAULT_LIMIT   = 10;

const ALLOWED_STATUSES = ['pending', 'active', 'locked', 'suspended', 'inactive'];

// Fields each role is allowed to update
const OWNER_FIELDS = ['firstName', 'lastName', 'contact', 'address', 'birthday', 'email', 'agency', 'position'];
const ADMIN_FIELDS = [...OWNER_FIELDS, 'username', 'role'];

// Fields returned by list / detail queries (no password, no __v)
const LIST_FIELDS   = 'username firstName lastName contact email agency role position status lastLogin activatedAt createdAt';
const DETAIL_FIELDS = 'username firstName lastName birthday address agency position email contact role status createdAt lastLogin';

// ─── Pure helpers (no side-effects, easy to unit-test) ────────────────────────

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

/** Strips sensitive fields and normalises _id → id. */
const formatUser = (u) => ({
  id:          u._id.toString(),
  username:    u.username,
  firstName:   u.firstName,
  lastName:    u.lastName,
  contact:     u.contact,
  email:       u.email,
  agency:      u.agency,
  role:        u.role,
  position:    u.position,
  status:      u.status,
  activatedAt: u.activatedAt,
  lastLogin:   u.lastLogin,
  createdAt:   u.createdAt,
});

/** Builds a Mongoose filter from validated query params. */
const buildUserFilter = ({ search, status, role } = {}) => {
  const filter = {};

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { username:  regex },
      { firstName: regex },
      { lastName:  regex },
      { email:     regex },
    ];
  }

  if (status) filter.status = status;
  if (role)   filter.role   = role;

  return filter;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/users?page=&limit=&search=&status=&role=
 * Returns a paginated, filterable user list.
 */
export const getAllUsers = async (req, res) => {
  try {
    const page   = clampInt(req.query.page, 1, Number.MAX_SAFE_INTEGER, 1);
    const limit  = snapToPageOption(clampInt(req.query.limit, 5, 50, DEFAULT_LIMIT));
    const skip   = (page - 1) * limit;
    const filter = buildUserFilter(req.query);

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select(LIST_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      data:       users.map(formatUser),
      total,
      page:       Math.min(page, totalPages), // guard against out-of-range page
      limit,
      totalPages,
    });
  } catch (err) {
    console.error('[getAllUsers]', err);
    return res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

/**
 * GET /api/users/:userId
 */
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select(DETAIL_FIELDS)
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Normalise _id → id before sending
    const { _id, ...rest } = user;
    return res.status(200).json({ id: _id.toString(), ...rest });
  } catch (err) {
    console.error('[getUserDetails]', err);
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

/**
 * POST /api/users
 * Admin-only user creation with auto-generated default password.
 */
export const createUserByAdmin = async (req, res) => {
  try {
    const {
      username, firstName, lastName, birthday, address,
      agency, position, email, contact, role, status,
    } = req.body;

    // Required field check
    const missing = ['username', 'firstName', 'lastName', 'birthday', 'address',
                     'agency', 'position', 'email', 'contact']
      .filter((f) => !req.body[f]);

    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    // Duplicate check
    const exists = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (exists) {
      return res.status(409).json({ message: 'A user with this email or username already exists' });
    }

    const safeStatus    = ALLOWED_STATUSES.includes(status) ? status : 'active';
    const rawPassword   = generateDefaultPassword(username);
    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const isActive      = safeStatus === 'active';

    const user = await User.create({
      username, firstName, lastName, birthday, address,
      agency, position, email, contact,
      role:     role || 'user',
      status:   safeStatus,
      password: hashedPassword,
      activatedAt: isActive ? new Date()       : null,
      activatedBy: isActive ? req.user?._id    : null,
    });

    const { password: _, ...safeUser } = user.toObject();

    return res.status(201).json({
      message:         'User created successfully',
      user:            safeUser,
      defaultPassword: rawPassword, // returned once — never stored in plain text
    });
  } catch (err) {
    console.error('[createUserByAdmin]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error creating user' });
  }
};

/**
 * PUT /api/users/:userId
 * Owners can update their own profile fields; admins get additional fields.
 */
export const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const actor      = req.user;

    if (!actor) return res.status(401).json({ message: 'Unauthorized' });

    const isOwner = actor._id.toString() === userId;
    const isAdmin = actor.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowedFields = isAdmin ? ADMIN_FIELDS : OWNER_FIELDS;
    const updates = Object.fromEntries(
      allowedFields
        .filter((f) => req.body[f] !== undefined)
        .map((f) => [f, req.body[f]])
    );

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No permitted fields provided' });
    }

    // Duplicate email / username guard
    if (updates.email || updates.username) {
      const conflict = await User.findOne({
        _id:  { $ne: userId },
        $or: [
          ...(updates.email    ? [{ email:    updates.email    }] : []),
          ...(updates.username ? [{ username: updates.username }] : []),
        ],
      }).lean();

      if (conflict) {
        return res.status(409).json({ message: 'Email or username already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new:            true,
      runValidators:  true,
    }).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error('[updateUserDetails]', err);
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

/**
 * PUT /api/users/:userId/status
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { userId }  = req.params;
    const { status }  = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // First-time activation audit
    if (status === 'active' && !user.activatedAt) {
      user.activatedAt = new Date();
      user.activatedBy = req.user._id;
    }

    user.status = status;
    await user.save();

    return res.status(200).json({ message: 'Status updated successfully', user });
  } catch (err) {
    console.error('[updateUserStatus]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error updating status' });
  }
};

/**
 * DELETE /api/users/:userId
 */
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