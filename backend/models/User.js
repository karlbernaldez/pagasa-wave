import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    birthday: {
      type: Date,
      required: true,
      validate: {
        validator: (v) => v < new Date(),
        message: 'Birthday cannot be in the future',
      },
    },

    address: { type: String, required: true, trim: true },
    agency: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },

    pendingEmail: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    pendingEmailVerificationToken: { type: String, select: false },
    pendingEmailVerificationExpires: Date,
    pendingEmailRequestedAt: Date,

    contact: {
      type: String,
      required: true,
      match: /^(\+63|0)9\d{9}$/,
      index: true,
    },

    avatarUrl: { type: String, default: null, trim: true },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    passwordChangedAt: { type: Date, default: null },

    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    role: {
      type: String,
      default: 'user',
      lowercase: true,
      trim: true,
      match: /^[a-z][a-z0-9_-]{1,31}$/,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'locked', 'suspended', 'inactive'],
      default: 'pending',
      index: true,
    },

    activatedAt: { type: Date, default: null, index: true },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date, default: null, index: true },
    lastLogin: { type: Date, default: null, index: true },
    lastLoginIP: { type: String, default: null },
    lastLoginUserAgent: { type: String, default: null },

    lastLoginLocation: {
      type: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        accuracyM: { type: Number, default: null },
      },
      default: null,
      select: false,
    },

    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ pendingEmail: 1 }, { unique: true, sparse: true });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const clearPendingEmailChangeOnDocument = (doc) => {
  doc.pendingEmail = undefined;
  doc.pendingEmailVerificationToken = undefined;
  doc.pendingEmailVerificationExpires = undefined;
  doc.pendingEmailRequestedAt = undefined;
};

userSchema.pre('save', async function () {
  if (this.email) this.email = this.email.toLowerCase().trim();
  if (this.pendingEmail) this.pendingEmail = this.pendingEmail.toLowerCase().trim();
  if (this.username) this.username = this.username.toLowerCase().trim();
  if (this.role) this.role = this.role.toLowerCase().trim();

  if (this.isNew) return;

  const passwordChanged = this.isModified('password');
  const authorizationChanged = this.isModified('role') || this.isModified('status');

  if (!passwordChanged && !authorizationChanged) return;

  if (passwordChanged) {
    this.passwordChangedAt = new Date();
    clearPendingEmailChangeOnDocument(this);
  }

  const current = await this.constructor.findById(this._id).select('+sessionVersion').lean();

  this.sessionVersion = (current?.sessionVersion ?? 0) + 1;
});

userSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() || {};
  const usesOperators = Object.keys(update).some((key) => key.startsWith('$'));
  const set = usesOperators ? update.$set || {} : update;

  const passwordChanged = Object.prototype.hasOwnProperty.call(set, 'password');
  const authorizationChanged =
    Object.prototype.hasOwnProperty.call(set, 'role') ||
    Object.prototype.hasOwnProperty.call(set, 'status');

  if (!passwordChanged && !authorizationChanged) return;

  const normalizedUpdate = usesOperators
    ? { ...update, $set: { ...(update.$set || {}) } }
    : { $set: { ...update } };

  if (normalizedUpdate.$set.role) {
    normalizedUpdate.$set.role = String(normalizedUpdate.$set.role).toLowerCase().trim();
  }

  if (passwordChanged) {
    normalizedUpdate.$set.passwordChangedAt = new Date();
    normalizedUpdate.$unset = {
      ...(update.$unset || {}),
      pendingEmail: '',
      pendingEmailVerificationToken: '',
      pendingEmailVerificationExpires: '',
      pendingEmailRequestedAt: '',
    };
  }

  normalizedUpdate.$inc = {
    ...(update.$inc || {}),
    sessionVersion: 1,
  };

  this.setUpdate(normalizedUpdate);
});

userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  this.emailVerificationExpires = Date.now() + 1000 * 60 * 60;
  return rawToken;
};

userSchema.methods.createPendingEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.pendingEmailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.pendingEmailVerificationExpires = Date.now() + 1000 * 60 * 60;
  this.pendingEmailRequestedAt = new Date();

  return rawToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  this.passwordResetExpires = Date.now() + 1000 * 60 * 30;
  return rawToken;
};

userSchema.methods.isLocked = function () {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
};

export default mongoose.model('User', userSchema);
