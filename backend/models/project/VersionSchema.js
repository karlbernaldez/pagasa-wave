import mongoose from 'mongoose';

import { VERSION_REASONS }
  from '../../constants/projectVersionConstants.js';

const { Schema } = mongoose;

export const VersionSchema = new Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      enum: VERSION_REASONS,
      default: 'submit',
    },

    featureCollection: Schema.Types.Mixed,

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);