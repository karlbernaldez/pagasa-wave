import mongoose from 'mongoose';

import { PROJECT_STATUS } from '../../constants/projectWorkflowConstants.js';
import { AUDIT_ACTIONS } from '../../constants/projectAuditConstants.js';

const { Schema } = mongoose;

export const AuditLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    previousStatus: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: null,
    },

    newStatus: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      required: true,
    },

    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);