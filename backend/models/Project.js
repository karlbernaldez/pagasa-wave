// models/Project.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  action: {
    type: String,
    enum: [
      'created',
      'edited',
      'renamed',
      'submitted',
      'review_started',
      'moved_to_review',
      'comment_added',
      'revision_requested',
      'approved',
      'rejected',
      'published',
      'archived'
    ],
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousStatus: String,
  newStatus: String,
  comment: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const VersionSchema = new Schema({
  versionNumber: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  features: { type: [Schema.Types.Mixed], default: [] },
  featureCollection: { type: Schema.Types.Mixed, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  reason: { type: String, default: 'snapshot' }
}, { _id: false });

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  forecastProjectId: {
    type: Schema.Types.ObjectId,
    index: true,
    default: null
  },
  forecastProjectName: {
    type: String,
    trim: true,
    default: ''
  },
  chartType: {
    type: String,
    enum: ['analysis','forecast_24h','forecast_36h','forecast_48h'],
    required: true
  },
  forecastDate: { type: Date, required: true },

  status: {
    type: String,
    enum: [
      'Draft',
      'Submitted',
      'Under Review',
      'Revision Requested',
      'Approved',
      'Published',
      'Rejected',
      'Archived'
    ],
    default: 'Draft'
  },

  version: { type: Number, default: 1 },

  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  submittedAt: Date,
  reviewedAt: Date,
  reviewStartedAt: Date,
  reviewStartedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewComment: String,
  publishedAt: Date,

  lastOpenedAt: { type: Date, default: null },
  lastOpenedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  openCount: { type: Number, default: 0 },

  versions: [VersionSchema],
  auditLogs: [AuditLogSchema]

}, { timestamps: true });

ProjectSchema.index({ name: 1, owner: 1 }, { unique: true });

// NEW PERFORMANCE INDEXES
ProjectSchema.index({ owner: 1, updatedAt: -1 });
ProjectSchema.index({ owner: 1, status: 1, updatedAt: -1 });
ProjectSchema.index({ owner: 1, chartType: 1, updatedAt: -1 });
ProjectSchema.index({ owner: 1, forecastProjectId: 1, updatedAt: -1 });
ProjectSchema.index({ owner: 1, forecastDate: -1 });
ProjectSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
