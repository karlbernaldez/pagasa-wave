import mongoose from 'mongoose';
import { CollaboratorSchema } from './project/CollaboratorSchema.js';
import { AuditLogSchema } from './project/AuditLogSchema.js';
import { VersionSchema } from './project/VersionSchema.js';

import { PROJECT_STATUS } from '../constants/projectWorkflowConstants.js';

const { Schema } = mongoose;

// ─── ProjectSchema ────────────────────────────────────────────────────────────

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

    // ── Collaborators ─────────────────────────────────────────────────────────
    collaborators: {
      type: [CollaboratorSchema],
      default: [],
    },

    // ── Workflow ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: 'draft',
      required: true,
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

    // ── Workflow timestamps ───────────────────────────────────────────────────
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

// ─── Indexes ──────────────────────────────────────────────────────────────────

ProjectSchema.index({ owner: 1, name: 1 }, { unique: true });
ProjectSchema.index({ owner: 1, forecastDate: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({ owner: 1, version: -1 });

// Collaborator indexes
ProjectSchema.index({ 'collaborators.user': 1 });

export default mongoose.model('Project', ProjectSchema);