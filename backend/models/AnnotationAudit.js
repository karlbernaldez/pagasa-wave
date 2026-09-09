import mongoose from 'mongoose';

const { Schema } = mongoose;

const AnnotationAuditSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      index: true,
    },
    stableId: {
      type: String,
      default: '',
      index: true,
    },
    featureName: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      enum: ['created', 'renamed', 'moved', 'styled', 'deleted'],
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

AnnotationAuditSchema.index({ project: 1, timestamp: -1 });
AnnotationAuditSchema.index({ project: 1, sourceId: 1, timestamp: -1 });

export default mongoose.models.AnnotationAudit ||
  mongoose.model('AnnotationAudit', AnnotationAuditSchema);
