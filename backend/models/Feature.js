import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'LineString', 'Point'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  properties: {
    labelValue: { type: String },
    closedMode: { type: Boolean, default: false },
    isFront: { type: Boolean, default: false },
    frontType: { type: String, enum: ['cold', 'warm', 'stationary', 'occluded'] },
    frontSymbolSide: { type: String, enum: ['normal', 'opposite'] },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Creator attribution only. This field is not an authorization boundary for
    // annotations inside shared Forecast Package charts.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sourceId: { type: String },
    stableId: { type: String },
    annotationId: { type: String },
    title: { type: String },
    name: { type: String },
    type: {
      type: String,
      enum: ['high_pressure', 'low_pressure', 'typhoon', 'less_1', 'text_note'],
    },
    markerType: { type: String },
    mapLayerId: { type: String },
  },
  name: { type: String, required: true },
  sourceId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

FeatureSchema.index({ sourceId: 1, 'properties.project': 1 }, { unique: true });
FeatureSchema.index({ 'properties.stableId': 1, 'properties.project': 1 });
FeatureSchema.index({ 'properties.owner': 1, 'properties.project': 1, createdAt: -1 });

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
