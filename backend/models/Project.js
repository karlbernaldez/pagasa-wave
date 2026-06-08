import mongoose from 'mongoose';

import { PROJECT_STATUS } from '../constants/projectWorkflowConstants.js';
import { AUDIT_ACTIONS } from '../constants/projectAuditConstants.js';
import { VERSION_REASONS } from '../constants/projectVersionConstants.js';

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    previousStatus: {
      type: String,
      enum: PROJECT_STATUS,
      default: null
    },
    newStatus: {
      type: String,
      enum: PROJECT_STATUS,
      required: true
    },
    comment: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const VersionSchema = new Schema(
  {
    versionNumber: { type: Number, required: true },
    reason: {
      type: String,
      enum: VERSION_REASONS,
      default: 'submit'
    },
    featureCollection: Schema.Types.Mixed,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Project (forecast project / parent) ─────────────────────────────────────

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    forecastDate: {
      type: Date,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Workflow ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: PROJECT_STATUS,
      default: 'draft',
      required: true
    },
    version: {
      type: Number,
      default: 1,
    },
    versions: [VersionSchema],
    auditLogs: [AuditLogSchema],
    reviewComment: { type: String, default: '' },

    // ── Review actors ─────────────────────────────────────────────────────────
    reviewStartedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Timestamps (workflow) ─────────────────────────────────────────────────
    submittedAt: { type: Date, default: null },
    reviewStartedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },

    // ── Usage tracking ────────────────────────────────────────────────────────
    lastOpenedAt: { type: Date, default: null },
    lastOpenedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    openCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ owner: 1, name: 1 }, { unique: true });
ProjectSchema.index({
  owner: 1,
  forecastDate: -1
});
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({
  owner: 1,
  version: -1
});

export default mongoose.model('Project', ProjectSchema);