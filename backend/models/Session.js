import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    jti: { type: String, required: true, unique: true, index: true },

    tokenHash: { type: String, required: true },

    revokedAt: { type: Date, default: null, index: true },

    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);