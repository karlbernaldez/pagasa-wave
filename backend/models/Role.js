import mongoose from 'mongoose';

const ROLE_KEY_RE = /^[a-z][a-z0-9_-]{1,31}$/;

const roleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: ROLE_KEY_RE,
      index: true,
      immutable: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    permissions: { type: [String], default: [] },
    system: { type: Boolean, default: false, index: true },
    enabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
