import mongoose from 'mongoose';

import {
  VERSION_REASONS,
} from '../constants/projectVersionConstants.js';

const { Schema } = mongoose;

const ProjectVersionSchema =
  new Schema(
    {
      project: {
        type:
          Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
      },

      versionNumber: {
        type: Number,
        required: true,
      },

      reason: {
        type: String,
        enum: VERSION_REASONS,
        default: 'submit',
      },

      featureCollection: {
        type: Schema.Types.Mixed,
        required: true,
      },

      createdBy: {
        type:
          Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },
    }
  );

ProjectVersionSchema.index(
  {
    project: 1,
    versionNumber: 1,
  },
  {
    unique: true,
  }
);

ProjectVersionSchema.index({
  project: 1,
  createdAt: -1,
});

ProjectVersionSchema.index({
  project: 1,
  versionNumber: -1,
});

export default mongoose.model(
  'ProjectVersion',
  ProjectVersionSchema
);