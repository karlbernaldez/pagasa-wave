import mongoose from 'mongoose';

const { Schema } = mongoose;

export const REVIEW_CHECKLIST_ITEM_STATUS = Object.freeze({
  PENDING: 'Pending',
  PASS: 'Pass',
  NEEDS_ATTENTION: 'Needs Attention',
  NOT_APPLICABLE: 'N/A',
});

export const REVIEW_CHECKLIST_INSTANCE_STATUS = Object.freeze({
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  SUPERSEDED: 'Superseded',
});

const ReviewChecklistSnapshotItemSchema = new Schema(
  {
    definitionItemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    itemKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    labelSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionSnapshot: {
      type: String,
      default: '',
    },
    requiredSnapshot: {
      type: Boolean,
      default: true,
    },
    allowNotApplicableSnapshot: {
      type: Boolean,
      default: false,
    },
    sortOrderSnapshot: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_CHECKLIST_ITEM_STATUS),
      default: REVIEW_CHECKLIST_ITEM_STATUS.PENDING,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { _id: true }
);

const ReviewChecklistEventSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    itemKey: {
      type: String,
      trim: true,
      default: '',
    },
    action: {
      type: String,
      enum: ['created', 'item_updated', 'completed', 'superseded'],
      required: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
    comment: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ForecastPackageReviewChecklistSchema = new Schema(
  {
    forecastPackage: {
      type: Schema.Types.ObjectId,
      ref: 'ForecastPackage',
      required: true,
      index: true,
    },
    definition: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewChecklistDefinition',
      required: true,
    },
    definitionVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    definitionNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    reviewAttempt: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_CHECKLIST_INSTANCE_STATUS),
      default: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
      index: true,
    },
    items: {
      type: [ReviewChecklistSnapshotItemSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    events: {
      type: [ReviewChecklistEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ForecastPackageReviewChecklistSchema.index(
  { forecastPackage: 1, reviewAttempt: 1 },
  { unique: true }
);
ForecastPackageReviewChecklistSchema.index(
  { forecastPackage: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE },
  }
);

export default mongoose.models.ForecastPackageReviewChecklist ||
  mongoose.model('ForecastPackageReviewChecklist', ForecastPackageReviewChecklistSchema);
