import mongoose from 'mongoose';

const { Schema } = mongoose;

const PublishedChartViewSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    viewerHash: {
      type: String,
      required: true,
      select: false,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { versionKey: false }
);

PublishedChartViewSchema.index(
  { project: 1, dateKey: 1, viewerHash: 1 },
  { unique: true, name: 'published_chart_view_dedupe' }
);
PublishedChartViewSchema.index({ dateKey: 1, viewedAt: 1 });
PublishedChartViewSchema.index({ project: 1, viewedAt: -1 });

export default mongoose.models.PublishedChartView ||
  mongoose.model('PublishedChartView', PublishedChartViewSchema);
