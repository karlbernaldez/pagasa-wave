import mongoose from 'mongoose';

const { Schema } = mongoose;

const CHART_TYPES = [
  'analysis',
  'forecast_24h',
  'forecast_36h',
  'forecast_48h',
];

const ChartSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    chartType: {
      type: String,
      required: true,
      enum: CHART_TYPES,
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
    }
  },
  {
    timestamps: true,
  }
);

ChartSchema.index({
  owner: 1
});

ChartSchema.index({
  owner: 1,
  project: 1
});

ChartSchema.index(
  {
    project: 1,
    name: 1
  },
  {
    unique: true
  }
);

ChartSchema.index({
  project: 1,
  chartType: 1
});

export default mongoose.model('Chart', ChartSchema);