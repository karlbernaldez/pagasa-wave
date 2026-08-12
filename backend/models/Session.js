import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    revokedAt: { type: Date, default: null, index: true },
    revokedReason: { type: String, default: null },
    familyCompromisedAt: { type: Date, default: null, index: true },
    replacedByJti: { type: String, default: null },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, familyId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
