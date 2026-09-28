import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReviewChecklistDefinitionItemSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    allowNotApplicable: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const ReviewChecklistDefinitionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    items: {
      type: [ReviewChecklistDefinitionItemSchema],
      default: [],
      validate: {
        validator(items) {
          if (!Array.isArray(items) || items.length === 0) return false;
          const activeItems = items.filter((item) => item?.isActive !== false);
          const keys = activeItems.map((item) => item.key);
          return activeItems.length > 0 && new Set(keys).size === keys.length;
        },
        message: 'Checklist definitions require at least one active item with unique keys.',
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

ReviewChecklistDefinitionSchema.index({ version: 1 }, { unique: true });
ReviewChecklistDefinitionSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

export default mongoose.models.ReviewChecklistDefinition ||
  mongoose.model('ReviewChecklistDefinition', ReviewChecklistDefinitionSchema);
