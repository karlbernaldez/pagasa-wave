// models/Project.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Audit Log Subdocument
 * Tracks every workflow action.
 */
const AuditLogSchema = new Schema({
  action: {
    type: String,
    enum: [
      'created',
      'edited',
      'renamed',
      'submitted',
      'moved_to_review',
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
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Version Snapshot Subdocument
 * Stores immutable historical versions.
 */
const VersionSchema = new Schema({
  versionNumber: {
    type: Number,
    required: true
  },
  snapshot: {
    type: Schema.Types.Mixed, // Stores frozen chart data / annotations
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ProjectSchema = new Schema({

  /* ===============================
     Basic Information
  =============================== */

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: ''
  },

  chartType: {
    type: String,
    enum: [
      'analysis',
      'forecast_24h',
      'forecast_36h',
      'forecast_48h'
    ],
    required: true
  },

  forecastDate: {
    type: Date,
    required: true
  },

  /* ===============================
     Workflow State Machine
  =============================== */

  status: {
    type: String,
    enum: [
      'Draft',
      'Submitted',
      'Under Review',
      'Approved',
      'Published',
      'Rejected',
      'Archived'
    ],
    default: 'Draft'
  },

  version: {
    type: Number,
    default: 1
  },

  /* ===============================
     Ownership & Review Metadata
  =============================== */

  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  submittedAt: Date,

  reviewedAt: Date,

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewComment: String,

  publishedAt: Date,

  /* ===============================
     Version History & Audit
  =============================== */

  versions: [VersionSchema],

  auditLogs: [AuditLogSchema]

}, {
  timestamps: true // auto adds createdAt + updatedAt
});


/**
 * Compound Unique Index
 * Prevent duplicate project names per owner.
 */
ProjectSchema.index({ name: 1, owner: 1 }, { unique: true });


export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);