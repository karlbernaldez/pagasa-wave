import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    /* ─────────────────────────────
       ACCOUNT IDENTITY
    ───────────────────────────── */

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    birthday: {
      type: Date,
      required: true,
      validate: {
        validator: v => v < new Date(),
        message: "Birthday cannot be in the future"
      }
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    agency: {
      type: String,
      required: true,
      trim: true
    },

    position: {
      type: String,
      required: true,
      trim: true
    },

    /* ─────────────────────────────
       CONTACT
    ───────────────────────────── */

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true
    },

    contact: {
      type: String,
      required: true,
      match: /^(\+63|0)9\d{9}$/,
      index: true
    },

    avatarUrl: {
      type: String,
      default: null,
      trim: true
    },

    /* ─────────────────────────────
       AUTHENTICATION
    ───────────────────────────── */

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    passwordChangedAt: {
      type: Date,
      default: null
    },

    /* ─────────────────────────────
       EMAIL VERIFICATION
    ───────────────────────────── */

    emailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: String,

    emailVerificationExpires: Date,

    /* ─────────────────────────────
       PASSWORD RESET
    ───────────────────────────── */

    passwordResetToken: String,

    passwordResetExpires: Date,

    /* ─────────────────────────────
       ROLE & STATUS
    ───────────────────────────── */

    role: {
      type: String,
      enum: ["user", "forecaster","admin"],
      default: "user",
      index: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "locked",
        "suspended",
        "inactive"
      ],
      default: "pending",
      index: true
    },

    activatedAt: {
      type: Date,
      default: null,
      index: true
    },

    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    /* ─────────────────────────────
       LOGIN SECURITY
    ───────────────────────────── */

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0
    },

    lockUntil: {
      type: Date,
      default: null,
      index: true
    },

    lastLogin: {
      type: Date,
      default: null,
      index: true
    },

    lastLoginIP: {
      type: String,
      default: null
    },

    lastLoginUserAgent: {
      type: String,
      default: null
    },

    lastLoginLocation: {
      type: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        accuracyM: { type: Number, default: null },
      },
      default: null,
      select: false,
    },

    /* ─────────────────────────────
       SOFT DELETE
    ───────────────────────────── */

    deletedAt: {
      type: Date,
      default: null,
      index: true
    }

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);





/* ─────────────────────────────
   VIRTUALS
───────────────────────────── */

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});


/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

userSchema.pre("save", function (next) {
  if (this.email) this.email = this.email.toLowerCase().trim();
  if (this.username) this.username = this.username.toLowerCase().trim();
  next();
});


/* ─────────────────────────────
   METHODS
───────────────────────────── */

/**
 * Generate email verification token
 */
userSchema.methods.createEmailVerificationToken = function () {

  const rawToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 1000 * 60 * 60; // 1 hour

  return rawToken;
};



/**
 * Generate password reset token
 */
userSchema.methods.createPasswordResetToken = function () {

  const rawToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 1000 * 60 * 30; // 30 min

  return rawToken;
};



/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function () {

  if (!this.lockUntil) return false;

  return this.lockUntil > Date.now();
};



export default mongoose.model("User", userSchema);