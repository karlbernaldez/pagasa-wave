import mongoose from 'mongoose';

const runtimeProfileSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['managed_timestamp'],
      required: true,
    },
    cycleDayOffset: {
      type: Number,
      min: -2,
      max: 1,
      required: true,
    },
    cycleHourUtc: {
      type: Number,
      min: 0,
      max: 23,
      required: true,
    },
    forecastCadenceHours: {
      type: Number,
      min: 1,
      max: 24,
      required: true,
    },
    maxForecastHour: {
      type: Number,
      min: 0,
      max: 240,
      required: true,
    },
    rasterScheme: {
      type: String,
      enum: ['xyz', 'tms'],
      default: 'xyz',
    },
    bounds: {
      type: [Number],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 4,
        message: 'Wave model bounds must contain west, south, east, and north values.',
      },
      default: () => [100, -5, 180, 50],
    },
    contoursEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

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
    runtimeProfile: {
      type: runtimeProfileSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

waveModelSchema.index({ enabled: 1, code: 1 });

export default mongoose.model('WaveModel', waveModelSchema);
