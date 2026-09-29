import mongoose from 'mongoose';

const trustedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgentHash: {
      type: String,
      required: true,
    },
    sessionVersion: {
      type: Number,
      required: true,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    revokedReason: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

trustedDeviceSchema.index({ user: 1, revokedAt: 1 });
trustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TrustedDevice ||
  mongoose.model('TrustedDevice', trustedDeviceSchema);
