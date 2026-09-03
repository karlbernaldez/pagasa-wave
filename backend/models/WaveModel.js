import mongoose from 'mongoose';

const waveModelSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9_-]{2,32}$/,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    builtIn: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    importerConfigured: {
      type: Boolean,
      default: false,
    },
    builderConfigured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

waveModelSchema.index({ enabled: 1, code: 1 });

export default mongoose.model('WaveModel', waveModelSchema);
