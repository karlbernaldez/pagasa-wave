// models/SiteSettings.js
import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // store full frontend payload here
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

SiteSettingsSchema.index({ page: 1 }, { unique: true });

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);