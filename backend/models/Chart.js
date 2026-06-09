import mongoose from 'mongoose';
import { CHART_TYPES } from '../constants/chartConstants.js';

const { Schema } = mongoose;

const ChartSchema = new Schema(
  {
    chartType: {
      type: String,
      required: true,
      enum: CHART_TYPES.map(type => type.chartType),
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

ChartSchema.index(
  {
    project: 1,
    chartType: 1,
  },
  {
    unique: true,
  }
);

ChartSchema.index({
  owner: 1,
  project: 1,
});

export default mongoose.model('Chart', ChartSchema);